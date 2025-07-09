/**
 * @fileoverview Tracking controller for click and conversion tracking
 * 
 * Controller for handling CTA click tracking endpoints and analytics.
 */

import type { Request, Response, NextFunction } from 'express';
import type { ApiResponse, TrackClickRequest, ClickTrack } from '@survai/shared';
import { trackingService } from '../services/trackingService';
import { 
  createBadRequestError 
} from '../middleware/errorHandler';

/**
 * Tracking controller class
 */
export class TrackingController {
  /**
   * Track CTA button click
   * 
   * @param req - Request object with click data (validated by middleware)
   * @param res - Response object
   * @param next - Next function for error handling
   */
  async trackClick(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Note: Request validation is handled by validateTrackClick middleware
      const { 
        sessionId, 
        questionId, 
        offerId, 
        buttonVariantId, 
        timestamp,
        userAgent,
        ipAddress
      } = req.body;

      // Build tracking request with validated data
      const trackRequest: TrackClickRequest = {
        sessionId,
        questionId,
        offerId,
        buttonVariantId,
        timestamp: timestamp || Date.now(),
        // Use validated data or fallback to request headers
        userAgent: userAgent || req.get('User-Agent'),
        ipAddress: ipAddress || req.ip
      };

      // Track the click (service now handles session/offer validation)
      const clickTrack = await trackingService.trackClick(trackRequest);

      // Generate offer URL for redirect
      const offer = await this.getOffer(offerId);
      const offerUrl = trackingService.generateOfferUrl(offer, {
        clickId: clickTrack.session.clickId,
        sessionId: sessionId
      });

      // Return success response with redirect URL
      const apiResponse: ApiResponse<{ clickTrack: ClickTrack; redirectUrl: string }> = {
        success: true,
        data: {
          clickTrack,
          redirectUrl: offerUrl
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(apiResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle conversion pixel/postback
   * 
   * @param req - Request object with conversion data (validated by middleware)
   * @param res - Response object
   * @param next - Next function for error handling
   */
  async recordConversion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Note: Request validation is handled by middleware
      // For GET requests, data is in query params
      // For POST requests, data is in body
      const clickId = req.query.click_id || req.body.click_id;
      const revenue = req.query.revenue || req.body.revenue;

      // Mark conversion (service now handles idempotent checking)
      const updatedClick = await trackingService.markConversion(
        clickId as string, 
        revenue ? parseFloat(revenue as string) : undefined
      );

      // Return simple success response (for pixel tracking)
      const apiResponse: ApiResponse<{ converted: boolean; clickId: string }> = {
        success: true,
        data: { 
          converted: true,
          clickId: updatedClick.session.clickId
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(apiResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get tracking analytics
   * 
   * @param req - Request object with optional offer ID filter
   * @param res - Response object
   * @param next - Next function for error handling
   */
  async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { offerId } = req.query;

      const analytics = await trackingService.getAnalytics(
        offerId ? offerId as string : undefined
      );

      const apiResponse: ApiResponse<typeof analytics> = {
        success: true,
        data: analytics,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(apiResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate tracking pixel URL
   * 
   * @param req - Request object with pixel parameters (validated by middleware)
   * @param res - Response object
   * @param next - Next function for error handling
   */
  async generatePixel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Note: Request validation is handled by validateGeneratePixel middleware
      const { clickId, surveyId } = req.body;

      const pixelUrl = trackingService.generatePixelUrl(clickId, surveyId);

      const apiResponse: ApiResponse<{ pixelUrl: string }> = {
        success: true,
        data: { pixelUrl },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(apiResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle pixel tracking conversion
   * 
   * @param req - Request object with click_id parameter (validated by middleware)
   * @param res - Response object
   * @param next - Next function for error handling
   */
  async handlePixel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Note: Request validation is handled by validateHandlePixel middleware
      const { click_id } = req.params;
      const { revenue } = req.query;

      // Mark conversion and update EPC in transaction (service handles idempotent checking)
      const updatedClick = await trackingService.markConversionWithEPCUpdate(
        click_id!,
        revenue ? parseFloat(revenue as string) : undefined
      );

      // Return simple response for pixel tracking
      const apiResponse: ApiResponse<{ converted: boolean; clickId: string }> = {
        success: true,
        data: { 
          converted: true,
          clickId: updatedClick.session.clickId
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(apiResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get offer data (helper method)
   * 
   * @param offerId - Offer identifier
   * @returns Offer data
   */
  private async getOffer(offerId: string) {
    // Import prisma here to avoid circular dependencies
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const offer = await prisma.offer.findUnique({
      where: { id: offerId }
    });

    if (!offer) {
      throw new Error('Offer not found');
    }

    return {
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
    };
  }
}

// Export singleton instance
export const trackingController = new TrackingController();