/**
 * @fileoverview Question service for CTA-based survey system
 * 
 * Service for managing CTA questions, generating button variants,
 * and handling question flow logic.
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import type { 
  NextQuestionRequest, 
  NextQuestionResponse, 
  Question,
  CTAButtonVariant,
  ResponseSession,
  QuestionType,
  Offer 
} from '@survai/shared';
import type { QuestionGenerateRequest, QuestionUpdateRequest } from '../validators/questionValidator';
import { trackingService } from './trackingService';

const prisma = new PrismaClient();

/**
 * Question service class
 */
export class QuestionService {
  /**
   * Get the next CTA question for a survey session
   * 
   * @param request - The next question request parameters
   * @returns Promise<NextQuestionResponse> - The next question with offer buttons
   */
  async getNextQuestion(request: NextQuestionRequest): Promise<NextQuestionResponse> {
    try {
      // Get or create survey response session
      const surveyResponse = await this.getOrCreateSession(request);
      
      // Get next question based on progression logic
      const question = await this.getNextQuestionForSession(
        request.surveyId, 
        request.previousQuestionId
      );
      
      if (!question) {
        throw new Error('No more questions available');
      }

      // Get eligible offers for this question
      const offers = await this.getEligibleOffers(question.id);
      
      // Generate CTA button variants
      const offerButtons = await this.generateCTAVariants(question, offers);

      return {
        question,
        offerButtons,
        sessionData: surveyResponse.sessionData as ResponseSession
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get next question: ${message}`);
    }
  }

  /**
   * Generate CTA button variants for a question with offers
   * 
   * @param question - The question to generate variants for
   * @param offers - Available offers to create buttons from
   * @returns Promise<CTAButtonVariant[]> - Generated button variants
   */
  async generateCTAVariants(question: Question, offers: Offer[]): Promise<CTAButtonVariant[]> {
    const config = question.config as any;
    const maxButtons = config?.maxButtons || 3;
    const selectedOffers = offers.slice(0, maxButtons);

    return selectedOffers.map((offer, index) => ({
      id: uuidv4(),
      text: this.generateButtonText(offer),
      offerId: offer.id,
      style: index === 0 ? 'primary' : 'secondary' as 'primary' | 'secondary',
      order: index + 1
    }));
  }

  /**
   * Get or create a survey response session
   * 
   * @param request - The request containing session info
   * @returns Promise<SurveyResponse> - The session data
   */
  private async getOrCreateSession(request: NextQuestionRequest) {
    let surveyResponse = await prisma.surveyResponse.findFirst({
      where: {
        surveyId: request.surveyId,
        sessionData: {
          path: ['sessionId'],
          equals: request.sessionId
        }
      }
    });

    if (!surveyResponse) {
      const sessionData: ResponseSession = {
        sessionId: request.sessionId,
        clickId: uuidv4(),
        ...(request.ipAddress && { ipAddress: request.ipAddress }),
        ...(request.userAgent && { userAgent: request.userAgent }),
        utmParams: {}
      };

      surveyResponse = await prisma.surveyResponse.create({
        data: {
          surveyId: request.surveyId,
          sessionData: sessionData as any,
          status: 'IN_PROGRESS'
        }
      });
    }

    return surveyResponse;
  }

  /**
   * Get the next question in sequence
   * 
   * @param surveyId - Survey identifier
   * @param previousQuestionId - Previous question ID for progression
   * @returns Promise<Question | null> - The next question or null if none
   */
  private async getNextQuestionForSession(
    surveyId: string, 
    previousQuestionId?: string
  ): Promise<Question | null> {
    const question = await prisma.question.findFirst({
      where: {
        surveyId,
        type: 'CTA_OFFER'
      },
      orderBy: {
        order: 'asc'
      }
    });

    if (!question) return null;

    return {
      id: question.id,
      surveyId: question.surveyId,
      type: question.type as QuestionType,
      text: question.text,
      description: question.description || undefined,
      config: question.config as any,
      options: question.options as any,
      order: question.order,
      logic: question.logic as any,
      aiVersions: question.aiVersions as any,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt
    };
  }

  /**
   * Get eligible offers for a question, ordered by EPC performance
   * 
   * @param questionId - Question identifier
   * @returns Promise<Offer[]> - Available offers ordered by EPC (highest first)
   */
  private async getEligibleOffers(questionId: string): Promise<Offer[]> {
    try {
      // Get offers ranked by EPC performance
      const offersRankedByEPC = await trackingService.getOffersRankedByEPC();
      
      // Get all active offers
      const allOffers = await prisma.offer.findMany({
        where: {
          status: 'ACTIVE'
        }
      });

      // Create a map of offer rankings for quick lookup
      const epcRankingMap = new Map(
        offersRankedByEPC.map(ranking => [ranking.offerId, ranking])
      );

      // Sort offers by EPC ranking (lower rank number = higher EPC)
      const sortedOffers = allOffers
        .map((offer: any) => ({
          offer,
          ranking: epcRankingMap.get(offer.id)
        }))
        .sort((a: { offer: any; ranking?: any }, b: { offer: any; ranking?: any }) => {
          // If both have rankings, sort by rank (lower = better)
          if (a.ranking && b.ranking) {
            return a.ranking.rank - b.ranking.rank;
          }
          // If only one has ranking, it goes first
          if (a.ranking) return -1;
          if (b.ranking) return 1;
          // If neither has ranking, maintain original order
          return 0;
        })
        .slice(0, 5) // Take top 5 offers
        .map(({ offer }: { offer: any }) => offer);

      return sortedOffers.map((offer: any) => ({
        id: offer.id,
        title: offer.title,
        description: offer.description || undefined,
        category: offer.category as any,
        status: offer.status as any,
        destinationUrl: offer.destinationUrl,
        pixelUrl: offer.pixelUrl || undefined,
        config: offer.config as any,
        targeting: offer.targeting as any,
        metrics: offer.metrics as any,
        createdAt: offer.createdAt,
        updatedAt: offer.updatedAt,
        metadata: offer.metadata as any
      }));
    } catch (error) {
      // Fallback to default ordering if EPC ranking fails
      console.error('Failed to get EPC-ranked offers, falling back to default:', error);
      return this.getDefaultOffers();
    }
  }

  /**
   * Get default offers (fallback when EPC ranking fails)
   * 
   * @returns Promise<Offer[]> - Default offers ordered by creation date
   */
  private async getDefaultOffers(): Promise<Offer[]> {
    const offers = await prisma.offer.findMany({
      where: {
        status: 'ACTIVE'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    return offers.map((offer: any) => ({
      id: offer.id,
      title: offer.title,
      description: offer.description || undefined,
      category: offer.category as any,
      status: offer.status as any,
      destinationUrl: offer.destinationUrl,
      pixelUrl: offer.pixelUrl || undefined,
      config: offer.config as any,
      targeting: offer.targeting as any,
      metrics: offer.metrics as any,
      createdAt: offer.createdAt,
      updatedAt: offer.updatedAt,
      metadata: offer.metadata as any
    }));
  }

  /**
   * Generate persuasive button text based on offer
   * 
   * @param offer - The offer to generate text for
   * @returns string - Generated button text
   */
  private generateButtonText(offer: Offer): string {
    const templates = [
      `Get Your ${offer.title}`,
      `Claim ${offer.title} Now`,
      `Start ${offer.title}`,
      `Get Free ${offer.title}`,
      `Try ${offer.title}`
    ];
    
    const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];
    return selectedTemplate || `Get ${offer.title}`;
  }

  /**
   * Create a new question with AI or static content
   * 
   * @param data - Question creation data
   * @returns Promise<Question> - Created question
   */
  async createQuestion(data: QuestionGenerateRequest & { aiVersions?: any }): Promise<Question> {
    try {
      const questionData = {
        surveyId: data.surveyId,
        type: data.type || 'CTA_OFFER',
        text: data.text!,
        description: data.description || null,
        config: data.config || {},
        options: data.options || [],
        order: data.order || await this.getNextQuestionOrder(data.surveyId),
        required: data.required || false,
        logic: data.logic || null,
        aiVersions: data.aiVersions || null
      };

      const question = await prisma.question.create({
        data: questionData
      });

      return {
        id: question.id,
        surveyId: question.surveyId,
        type: question.type as QuestionType,
        text: question.text,
        description: question.description || undefined,
        config: question.config as any,
        options: question.options as any,
        order: question.order,
        logic: question.logic as any,
        aiVersions: question.aiVersions as any,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create question: ${message}`);
    }
  }

  /**
   * Update an existing question
   * 
   * @param questionId - Question ID to update
   * @param data - Update data
   * @returns Promise<Question> - Updated question
   */
  async updateQuestion(questionId: string, data: QuestionUpdateRequest): Promise<Question> {
    try {
      // Check if question exists
      const existingQuestion = await prisma.question.findUnique({
        where: { id: questionId }
      });

      if (!existingQuestion) {
        throw new Error('Question not found');
      }

      const updateData: any = {};
      if (data.text !== undefined) updateData.text = data.text;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.config !== undefined) updateData.config = data.config;
      if (data.options !== undefined) updateData.options = data.options;
      if (data.order !== undefined) updateData.order = data.order;
      if (data.required !== undefined) updateData.required = data.required;
      if (data.logic !== undefined) updateData.logic = data.logic;

      const question = await prisma.question.update({
        where: { id: questionId },
        data: updateData
      });

      return {
        id: question.id,
        surveyId: question.surveyId,
        type: question.type as QuestionType,
        text: question.text,
        description: question.description || undefined,
        config: question.config as any,
        options: question.options as any,
        order: question.order,
        logic: question.logic as any,
        aiVersions: question.aiVersions as any,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to update question: ${message}`);
    }
  }

  /**
   * Get questions for a survey
   * 
   * @param surveyId - Survey ID to get questions for
   * @returns Promise<Question[]> - Questions for the survey
   */
  async getQuestionsBySurvey(surveyId: string): Promise<Question[]> {
    try {
      const questions = await prisma.question.findMany({
        where: {
          surveyId
        },
        orderBy: {
          order: 'asc'
        },
        include: {
          survey: {
            select: {
              title: true,
              status: true
            }
          }
        }
      });

      return questions.map(question => ({
        id: question.id,
        surveyId: question.surveyId,
        type: question.type as QuestionType,
        text: question.text,
        description: question.description || undefined,
        config: question.config as any,
        options: question.options as any,
        order: question.order,
        logic: question.logic as any,
        aiVersions: question.aiVersions as any,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get questions for survey: ${message}`);
    }
  }

  /**
   * Get the next order number for a new question in a survey
   * 
   * @param surveyId - Survey ID
   * @returns Promise<number> - Next order number
   */
  private async getNextQuestionOrder(surveyId: string): Promise<number> {
    const lastQuestion = await prisma.question.findFirst({
      where: { surveyId },
      orderBy: { order: 'desc' },
      select: { order: true }
    });

    return (lastQuestion?.order || 0) + 1;
  }
}

// Export singleton instance
export const questionService = new QuestionService();