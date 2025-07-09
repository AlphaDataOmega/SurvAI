/**
 * @fileoverview Tracking service for click and conversion tracking
 * 
 * Service for tracking CTA button clicks, generating tracking URLs,
 * and managing click attribution for EPC calculation.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import type { 
  TrackClickRequest, 
  ClickTrack,
  ClickSession,
  Offer,
  UrlVariables,
  EPCMetrics 
} from '@survai/shared';
import { calculateEPC } from '../utils/epcCalculator';

const prisma = new PrismaClient();

/**
 * Tracking service class
 */
export class TrackingService {
  /**
   * Track a CTA button click
   * 
   * @param request - The click tracking request
   * @returns Promise<ClickTrack> - The created click track record
   */
  async trackClick(request: TrackClickRequest): Promise<ClickTrack> {
    try {
      // VALIDATION: Validate request parameters
      if (!request.sessionId || !request.questionId || !request.offerId || !request.buttonVariantId) {
        throw new Error('Missing required parameters: sessionId, questionId, offerId, and buttonVariantId are required');
      }

      // VALIDATION: Check if session exists and is valid
      const surveyResponse = await prisma.surveyResponse.findFirst({
        where: {
          sessionData: {
            path: ['sessionId'],
            equals: request.sessionId
          }
        }
      });

      if (!surveyResponse) {
        throw new Error(`Invalid session: Session ID ${request.sessionId} not found`);
      }

      // VALIDATION: Check if offer exists and is active
      const offer = await prisma.offer.findUnique({
        where: { id: request.offerId }
      });

      if (!offer) {
        throw new Error(`Invalid offer: Offer ID ${request.offerId} not found`);
      }

      if (offer.status !== 'ACTIVE') {
        throw new Error(`Invalid offer: Offer ID ${request.offerId} is not active (status: ${offer.status})`);
      }

      // Generate unique click ID
      const clickId = uuidv4();

      // Create click session data
      const sessionData: ClickSession = {
        sessionId: request.sessionId,
        clickId: clickId,
        ...(request.ipAddress && { ipAddress: request.ipAddress }),
        ...(request.userAgent && { userAgent: request.userAgent }),
        deviceInfo: {
          type: this.detectDeviceType(request.userAgent || '') as any,
          isMobile: this.isMobileDevice(request.userAgent || '')
        }
      };

      // Store click record in database using transaction for atomic operation
      const clickRecord = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        return await tx.clickTrack.create({
          data: {
            offerId: request.offerId,
            responseId: surveyResponse.id,
            clickId: clickId,
            sessionData: sessionData as any,
            status: 'VALID',
            converted: false,
            metadata: {
              questionId: request.questionId,
              buttonVariantId: request.buttonVariantId,
              timestamp: request.timestamp || Date.now()
            }
          }
        });
      });

      return {
        id: clickRecord.id,
        offerId: clickRecord.offerId,
        responseId: clickRecord.responseId || undefined,
        session: sessionData,
        status: clickRecord.status as any,
        converted: clickRecord.converted,
        convertedAt: clickRecord.convertedAt || undefined,
        revenue: clickRecord.revenue ? Number(clickRecord.revenue) : 0,
        clickedAt: clickRecord.clickedAt,
        metadata: clickRecord.metadata as any
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to track click: ${message}`);
    }
  }

  /**
   * Generate tracking pixel URL with embedded parameters
   * 
   * @param clickId - The click ID for tracking
   * @param surveyId - The survey ID
   * @returns string - The tracking pixel URL
   */
  generatePixelUrl(clickId: string, surveyId: string): string {
    const baseUrl = process.env.TRACKING_PIXEL_URL || 'https://tracking.survai.app/pixel';
    const params = new URLSearchParams({
      click_id: clickId,
      survey_id: surveyId,
      t: Date.now().toString()
    });
    
    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Generate offer destination URL with tracking parameters
   * 
   * @param offer - The offer to generate URL for
   * @param variables - URL template variables
   * @returns string - The parameterized offer URL
   */
  generateOfferUrl(offer: Offer, variables: UrlVariables): string {
    let url = offer.destinationUrl;
    
    // Replace template variables
    Object.entries(variables).forEach(([key, value]) => {
      if (value) {
        url = url.replace(`{${key}}`, encodeURIComponent(value));
      }
    });

    // Add additional tracking parameters
    const urlObj = new URL(url);
    urlObj.searchParams.set('click_id', variables.clickId);
    if (variables.surveyId) {
      urlObj.searchParams.set('survey_id', variables.surveyId);
    }
    if (variables.sessionId) {
      urlObj.searchParams.set('session_id', variables.sessionId);
    }

    return urlObj.toString();
  }

  /**
   * Update click conversion status (IDEMPOTENT)
   * 
   * @param clickId - The click ID to update
   * @param revenue - The conversion revenue
   * @returns Promise<ClickTrack> - Updated click record
   */
  async markConversion(clickId: string, revenue?: number): Promise<ClickTrack> {
    try {
      // VALIDATION: Validate click ID parameter
      if (!clickId || typeof clickId !== 'string') {
        throw new Error('Click ID is required and must be a string');
      }

      return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // IDEMPOTENT: Check if already converted
        const existingClick = await tx.clickTrack.findUnique({
          where: { clickId },
          select: { 
            id: true, 
            converted: true, 
            convertedAt: true, 
            revenue: true,
            offerId: true,
            responseId: true,
            sessionData: true,
            status: true,
            clickedAt: true,
            metadata: true
          }
        });

        if (!existingClick) {
          throw new Error(`Click ID ${clickId} not found`);
        }

        if (existingClick.converted) {
          // IDEMPOTENT: Return existing converted record without updating
          return {
            id: existingClick.id,
            offerId: existingClick.offerId,
            responseId: existingClick.responseId || undefined,
            session: existingClick.sessionData as any,
            status: existingClick.status as any,
            converted: true,
            convertedAt: existingClick.convertedAt || undefined,
            revenue: existingClick.revenue ? Number(existingClick.revenue) : 0,
            clickedAt: existingClick.clickedAt,
            metadata: existingClick.metadata as any
          };
        }

        // Only update if not already converted
        const updatedClick = await tx.clickTrack.update({
          where: { clickId },
          data: {
            converted: true,
            convertedAt: new Date(),
            revenue: revenue || undefined
          }
        });

        return {
          id: updatedClick.id,
          offerId: updatedClick.offerId,
          responseId: updatedClick.responseId || undefined,
          session: updatedClick.sessionData as any,
          status: updatedClick.status as any,
          converted: updatedClick.converted,
          convertedAt: updatedClick.convertedAt || undefined,
          revenue: updatedClick.revenue ? Number(updatedClick.revenue) : 0,
          clickedAt: updatedClick.clickedAt,
          metadata: updatedClick.metadata as any
        };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to mark conversion: ${message}`);
    }
  }

  /**
   * Get click tracking analytics
   * 
   * @param offerId - Optional offer ID to filter by
   * @returns Promise<any> - Analytics data
   */
  async getAnalytics(offerId?: string) {
    const whereClause = offerId ? { offerId } : {};
    
    const [totalClicks, conversions, totalRevenue] = await Promise.all([
      prisma.clickTrack.count({ where: whereClause }),
      prisma.clickTrack.count({ where: { ...whereClause, converted: true } }),
      prisma.clickTrack.aggregate({
        where: { ...whereClause, converted: true },
        _sum: { revenue: true }
      })
    ]);

    const conversionRate = totalClicks > 0 ? (conversions / totalClicks) * 100 : 0;
    const epc = totalClicks > 0 ? (Number(totalRevenue._sum.revenue) || 0) / totalClicks : 0;

    return {
      totalClicks,
      conversions,
      conversionRate,
      totalRevenue: Number(totalRevenue._sum.revenue) || 0,
      epc
    };
  }

  /**
   * Detect device type from user agent
   * 
   * @param userAgent - User agent string
   * @returns Device type
   */
  private detectDeviceType(userAgent: string): 'DESKTOP' | 'MOBILE' | 'TABLET' {
    if (/iPad|Android(?!.*Mobile)/i.test(userAgent)) return 'TABLET';
    if (/Mobile|iPhone|Android/i.test(userAgent)) return 'MOBILE';
    return 'DESKTOP';
  }

  /**
   * Check if device is mobile
   * 
   * @param userAgent - User agent string
   * @returns boolean - Whether device is mobile
   */
  private isMobileDevice(userAgent: string): boolean {
    return /Mobile|iPhone|Android/i.test(userAgent);
  }

  /**
   * Mark conversion and update offer EPC in a single transaction (IDEMPOTENT)
   * 
   * @param clickId - The click ID to update
   * @param revenue - Optional conversion revenue
   * @returns Promise<ClickTrack> - Updated click record
   */
  async markConversionWithEPCUpdate(clickId: string, revenue?: number): Promise<ClickTrack> {
    try {
      // VALIDATION: Validate click ID parameter
      if (!clickId || typeof clickId !== 'string') {
        throw new Error('Click ID is required and must be a string');
      }

      return await prisma.$transaction(async (tx: any) => {
        // IDEMPOTENT: Check if already converted
        const existingClick = await tx.clickTrack.findUnique({
          where: { clickId },
          select: { 
            id: true, 
            converted: true, 
            convertedAt: true, 
            revenue: true,
            offerId: true,
            responseId: true,
            sessionData: true,
            status: true,
            clickedAt: true,
            metadata: true
          }
        });

        if (!existingClick) {
          throw new Error(`Click ID ${clickId} not found`);
        }

        if (existingClick.converted) {
          // IDEMPOTENT: Return existing converted record without updating
          return {
            id: existingClick.id,
            offerId: existingClick.offerId,
            responseId: existingClick.responseId || undefined,
            session: existingClick.sessionData as any,
            status: existingClick.status as any,
            converted: true,
            convertedAt: existingClick.convertedAt || undefined,
            revenue: existingClick.revenue ? Number(existingClick.revenue) : 0,
            clickedAt: existingClick.clickedAt,
            metadata: existingClick.metadata as any
          };
        }

        // Only update if not already converted
        const updatedClick = await tx.clickTrack.update({
          where: { clickId },
          data: {
            converted: true,
            convertedAt: new Date(),
            revenue: revenue || undefined
          }
        });

        // Update the offer's EPC metrics
        await this.updateOfferEPC(updatedClick.offerId, tx);

        // Return the updated click record
        return {
          id: updatedClick.id,
          offerId: updatedClick.offerId,
          responseId: updatedClick.responseId || undefined,
          session: updatedClick.sessionData as any,
          status: updatedClick.status as any,
          converted: updatedClick.converted,
          convertedAt: updatedClick.convertedAt || undefined,
          revenue: updatedClick.revenue ? Number(updatedClick.revenue) : 0,
          clickedAt: updatedClick.clickedAt,
          metadata: updatedClick.metadata as any
        };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to mark conversion with EPC update: ${message}`);
    }
  }

  /**
   * Update offer EPC metrics
   * 
   * @param offerId - Offer ID to update
   * @param tx - Optional Prisma transaction client
   * @returns Promise<void>
   */
  async updateOfferEPC(offerId: string, tx?: any): Promise<void> {
    try {
      const client = tx || prisma;
      
      // Get current analytics for this offer
      const analytics = await this.getAnalytics(offerId);
      
      // Calculate new EPC metrics
      const epcMetrics: EPCMetrics = calculateEPC(
        analytics.totalClicks,
        analytics.conversions,
        analytics.totalRevenue
      );

      // Update the offer's metrics
      await client.offer.update({
        where: { id: offerId },
        data: {
          metrics: {
            ...(typeof analytics === 'object' ? analytics : {}),
            ...epcMetrics,
            lastUpdated: new Date()
          }
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to update offer EPC: ${message}`);
    }
  }

  /**
   * Get EPC metrics for a specific offer
   * 
   * @param offerId - Offer ID to get metrics for
   * @returns Promise<EPCMetrics> - EPC metrics
   */
  async getOfferEPCMetrics(offerId: string): Promise<EPCMetrics> {
    try {
      const analytics = await this.getAnalytics(offerId);
      
      return calculateEPC(
        analytics.totalClicks,
        analytics.conversions,
        analytics.totalRevenue
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get offer EPC metrics: ${message}`);
    }
  }

  /**
   * Get all offers ranked by EPC performance
   * 
   * @returns Promise<Array> - Offers ranked by EPC (highest first)
   */
  async getOffersRankedByEPC(): Promise<Array<{
    offerId: string;
    title: string;
    epc: number;
    totalClicks: number;
    conversions: number;
    rank: number;
  }>> {
    try {
      // Get all active offers
      const offers = await prisma.offer.findMany({
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          title: true,
          metrics: true
        }
      });

      // Calculate EPC for each offer and rank them
      const offersWithEPC = await Promise.all(
        offers.map(async (offer: any) => {
          const analytics = await this.getAnalytics(offer.id);
          const epcMetrics = calculateEPC(
            analytics.totalClicks,
            analytics.conversions,
            analytics.totalRevenue
          );
          
          return {
            offerId: offer.id,
            title: offer.title,
            epc: epcMetrics.epc,
            totalClicks: epcMetrics.totalClicks,
            conversions: epcMetrics.totalConversions,
            rank: 0 // Will be set below
          };
        })
      );

      // Sort by EPC (highest first) and assign ranks
      return offersWithEPC
        .sort((a, b) => b.epc - a.epc)
        .map((offer, index) => ({
          ...offer,
          rank: index + 1
        }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get offers ranked by EPC: ${message}`);
    }
  }
}

// Export singleton instance
export const trackingService = new TrackingService();