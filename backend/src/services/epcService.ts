/**
 * @fileoverview EPC (Earnings Per Click) service implementation
 * 
 * Service for calculating and updating offer performance metrics based on
 * recent click and conversion data. Provides real-time EPC calculations
 * with proper database transactions.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import type { Question, EPCMetrics } from '@survai/shared';
import { calculateEPC } from '../utils/epcCalculator';
import { getDateDaysAgo } from '../utils/time';

const prisma = new PrismaClient();

export interface QuestionEPCScore {
  questionId: string;
  epcScore: number;
  totalClicks: number;
  totalRevenue: number;
  lastUpdated: Date;
}

/**
 * EPC service class for offer performance tracking and calculation
 */
export class EPCService {
  /**
   * Calculate EPC for an offer based on 7-day performance data
   * 
   * @param offerId - The offer ID to calculate EPC for
   * @returns Promise<number> - EPC value based on 7-day window
   * @throws Error if offer not found or invalid
   */
  async calculateEPC(offerId: string): Promise<number> {
    try {
      // VALIDATION: Check offerId parameter
      if (!offerId || typeof offerId !== 'string') {
        throw new Error('Offer ID is required and must be a string');
      }

      // VALIDATION: Check if offer exists
      const offer = await prisma.offer.findUnique({ 
        where: { id: offerId },
        select: { id: true, status: true }
      });
      
      if (!offer) {
        throw new Error(`Offer ${offerId} not found`);
      }

      // QUERY: Get clicks from past 7 days
      const sevenDaysAgo = getDateDaysAgo(7);
      const clicks = await prisma.clickTrack.findMany({
        where: {
          offerId,
          clickedAt: { gte: sevenDaysAgo }
        },
        select: {
          converted: true,
          revenue: true
        }
      });

      // CALCULATION: Use existing utility
      const totalClicks = clicks.length;
      const conversions = clicks.filter((c: any) => c.converted).length;
      const revenue = clicks.reduce((sum: number, c: any) => {
        return sum + (c.converted && c.revenue ? Number(c.revenue) : 0);
      }, 0);

      // PATTERN: Use existing calculateEPC function from utils
      const metrics = calculateEPC(totalClicks, conversions, revenue);
      return metrics.epc;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to calculate EPC: ${message}`);
    }
  }

  /**
   * Update offer EPC value in database using atomic transaction
   * 
   * @param offerId - The offer ID to update
   * @returns Promise<void>
   * @throws Error if offer not found or update fails
   */
  async updateEPC(offerId: string): Promise<void> {
    try {
      // VALIDATION: Check offerId parameter
      if (!offerId || typeof offerId !== 'string') {
        throw new Error('Offer ID is required and must be a string');
      }

      // PATTERN: Use transaction for atomic operation (following trackingService patterns)
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Get current offer to merge with existing metrics
        const currentOffer = await tx.offer.findUnique({
          where: { id: offerId },
          select: { metrics: true }
        });

        if (!currentOffer) {
          throw new Error(`Offer ${offerId} not found`);
        }

        // Calculate new EPC metrics
        const sevenDaysAgo = getDateDaysAgo(7);
        const clicks = await tx.clickTrack.findMany({
          where: {
            offerId,
            clickedAt: { gte: sevenDaysAgo }
          },
          select: {
            converted: true,
            revenue: true
          }
        });

        const totalClicks = clicks.length;
        const conversions = clicks.filter((c: any) => c.converted).length;
        const revenue = clicks.reduce((sum: number, c: any) => {
          return sum + (c.converted && c.revenue ? Number(c.revenue) : 0);
        }, 0);

        const epcMetrics: EPCMetrics = calculateEPC(totalClicks, conversions, revenue);

        // Merge with existing metrics
        const existingMetrics = (typeof currentOffer.metrics === 'object' && currentOffer.metrics !== null) 
          ? currentOffer.metrics as Record<string, unknown>
          : {};

        // Update the offer's metrics
        await tx.offer.update({
          where: { id: offerId },
          data: {
            metrics: {
              ...existingMetrics,
              ...epcMetrics,
              lastUpdated: new Date()
            }
          }
        });
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to update EPC: ${message}`);
    }
  }

  /**
   * Calculate EPC score for a question based on its linked offers
   * 
   * @param questionId - Question ID to calculate EPC for
   * @returns Promise<number> - Average EPC from linked offers
   */
  async getQuestionEPC(questionId: string): Promise<number> {
    try {
      // VALIDATION: Check questionId parameter
      if (!questionId || typeof questionId !== 'string') {
        throw new Error('Question ID is required and must be a string');
      }

      // Import questionService dynamically to avoid circular dependency
      const { questionService } = await import('./questionService');
      
      // Get offers linked to this question via questionService
      const offers = await questionService.getEligibleOffers(questionId);
      
      if (offers.length === 0) {
        console.debug(`No offers found for question ${questionId}, returning EPC 0`);
        return 0;
      }
      
      // Calculate average EPC from all linked offers
      const epcValues = await Promise.all(
        offers.map(offer => this.calculateEPC(offer.id))
      );
      
      // Filter out zero EPCs and calculate average
      const validEPCs = epcValues.filter(epc => epc > 0);
      if (validEPCs.length === 0) {
        console.debug(`All offers for question ${questionId} have zero EPC, returning 0`);
        return 0;
      }
      
      const averageEPC = validEPCs.reduce((sum, epc) => sum + epc, 0) / validEPCs.length;
      console.debug(`Question ${questionId} average EPC: ${averageEPC} from ${validEPCs.length} offers`);
      
      return averageEPC;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Failed to calculate question EPC for ${questionId}:`, message);
      return 0; // Graceful fallback
    }
  }

  /**
   * Order questions by EPC score with fallback to static order
   * 
   * @param questions - Array of questions to order
   * @returns Promise<Question[]> - Questions ordered by EPC score descending
   */
  async orderQuestionsByEPCScore(questions: Question[]): Promise<Question[]> {
    try {
      // Calculate EPC for each question using the new method
      const questionsWithEPC = await Promise.all(
        questions.map(async (question) => ({
          question,
          epc: await this.getQuestionEPC(question.id)
        }))
      );

      // Sort by EPC (descending), fall back to static order for ties
      return questionsWithEPC
        .sort((a, b) => {
          // Primary sort: EPC descending (higher EPC first)
          if (a.epc !== b.epc) {
            return b.epc - a.epc;
          }
          // Secondary sort: static order ascending (lower order first)  
          return a.question.order - b.question.order;
        })
        .map(({ question }) => question);
    } catch (error) {
      // Fallback to original order if EPC ordering fails
      console.warn('EPC ordering failed, falling back to static order:', error);
      return [...questions].sort((a, b) => a.order - b.order);
    }
  }

  /**
   * Get EPC scores for questions (LEGACY - keeping for compatibility)
   * 
   * @param questionIds - Array of question IDs to get scores for
   * @returns Promise<QuestionEPCScore[]> - Mock EPC scores
   */
  async getQuestionEPCScores(questionIds: string[]): Promise<QuestionEPCScore[]> {
    // LEGACY: Return mock EPC scores for testing
    // In real implementation, this would query actual performance data
    return questionIds.map((questionId, _index) => ({
      questionId,
      epcScore: Math.random() * 10, // Random EPC between 0-10
      totalClicks: Math.floor(Math.random() * 1000),
      totalRevenue: Math.random() * 5000,
      lastUpdated: new Date()
    }));
  }

  /**
   * Order questions by EPC score (LEGACY - keeping for compatibility)
   * 
   * @param questions - Array of questions to order
   * @returns Promise<Question[]> - Questions ordered by EPC score descending
   */
  async orderQuestionsByEPC(questions: Question[]): Promise<Question[]> {
    try {
      const questionIds = questions.map(q => q.id);
      const epcScores = await this.getQuestionEPCScores(questionIds);
      
      // Create mapping for quick lookup
      const epcMap = new Map(epcScores.map(score => [score.questionId, score.epcScore]));
      
      // Sort questions by EPC score (descending)
      return [...questions].sort((a, b) => {
        const aEPC = epcMap.get(a.id) || 0;
        const bEPC = epcMap.get(b.id) || 0;
        return bEPC - aEPC;
      });
    } catch (error) {
      // Fallback to original order if EPC ordering fails
      console.warn('EPC ordering failed, falling back to original order:', error);
      return questions;
    }
  }

  /**
   * Calculate EPC score for a question (LEGACY - keeping for compatibility)
   * 
   * @param questionId - Question ID to calculate EPC for
   * @returns Promise<number> - EPC score (mock value)
   */
  async calculateQuestionEPC(_questionId: string): Promise<number> {
    // LEGACY: Return mock EPC calculation
    // Real implementation would calculate: totalRevenue / totalClicks
    return Math.random() * 10;
  }
}

// Export singleton instance
export const epcService = new EPCService();