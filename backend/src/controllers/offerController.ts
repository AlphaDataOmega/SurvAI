/**
 * @fileoverview Offer controller for affiliate offer management
 * 
 * Controller for handling offer CRUD operations, pixel URL generation,
 * and offer management endpoints.
 */

import type { Request, Response, NextFunction } from 'express';
import type { 
  ApiResponse, 
  Offer, 
  CreateOfferRequest, 
  UpdateOfferRequest, 
  ListOffersRequest,
  OfferWithMetrics,
  PaginatedOffersResponse 
} from '@survai/shared';
import { offerService } from '../services/offerService';
import { createBadRequestError } from '../middleware/errorHandler';

/**
 * Offer controller class
 */
export class OfferController {
  /**
   * Create a new offer
   * 
   * @param req - Request object with offer data (validated by middleware)
   * @param res - Response object
   * @param next - Next function for error handling
   */
  async createOffer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Note: Request validation is handled by validateCreateOffer middleware
      const offerData: CreateOfferRequest = {
        ...req.body,
        createdBy: req.user?.id // Add user ID from auth middleware
      };

      // Create the offer (service handles pixel URL generation and EPC initialization)
      const offer = await offerService.createOffer(offerData);

      // Return success response
      const apiResponse: ApiResponse<Offer> = {
        success: true,
        data: offer,
        timestamp: new Date().toISOString()
      };

      res.status(201).json(apiResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single offer by ID
   * 
   * @param req - Request object with offer ID in params (validated by middleware)
   * @param res - Response object
   * @param next - Next function for error handling
   */
  async getOffer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Note: Request validation is handled by validateOfferId middleware
      const { id } = req.params;

      // Get the offer with metrics
      const offer = await offerService.getOfferWithMetrics(id);

      if (!offer) {
        return next(createBadRequestError(`Offer with ID ${id} not found`));
      }

      // Return success response
      const apiResponse: ApiResponse<OfferWithMetrics> = {
        success: true,
        data: offer,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(apiResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * List offers with pagination and filtering
   * 
   * @param req - Request object with query parameters (validated by middleware)
   * @param res - Response object
   * @param next - Next function for error handling
   */
  async listOffers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Note: Request validation is handled by validateListOffers middleware
      const listParams: ListOffersRequest = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        category: req.query.category as any,
        status: req.query.status as any,
        search: req.query.search as string,
        sortBy: req.query.sortBy as any || 'createdAt',
        sortOrder: req.query.sortOrder as any || 'desc',
        minEPC: req.query.minEPC ? parseFloat(req.query.minEPC as string) : undefined
      };

      // Get the offers (service handles pagination and EPC metrics)
      const result = await offerService.listOffers(listParams);

      // Return success response
      const apiResponse: ApiResponse<PaginatedOffersResponse> = {
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(apiResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an existing offer
   * 
   * @param req - Request object with offer ID and update data (validated by middleware)
   * @param res - Response object
   * @param next - Next function for error handling
   */
  async updateOffer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Note: Request validation is handled by validateOfferId and validateUpdateOffer middleware
      const { id } = req.params;
      const updateData: UpdateOfferRequest = {
        ...req.body,
        updatedBy: req.user?.id // Add user ID from auth middleware
      };

      // Update the offer (service handles pixel URL regeneration and EPC update)
      const offer = await offerService.updateOffer(id, updateData);

      // Return success response
      const apiResponse: ApiResponse<Offer> = {
        success: true,
        data: offer,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(apiResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle offer status between ACTIVE and PAUSED
   * 
   * @param req - Request object with offer ID and status (validated by middleware)
   * @param res - Response object
   * @param next - Next function for error handling
   */
  async toggleOfferStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Note: Request validation is handled by validateOfferId and validateToggleOffer middleware
      const { id } = req.params;
      const { status } = req.body;

      // Toggle the offer status
      const offer = await offerService.toggleOfferStatus(id, status);

      // Return success response
      const apiResponse: ApiResponse<Offer> = {
        success: true,
        data: offer,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(apiResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete an offer (soft delete - sets status to ARCHIVED)
   * 
   * @param req - Request object with offer ID (validated by middleware)
   * @param res - Response object
   * @param next - Next function for error handling
   */
  async deleteOffer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Note: Request validation is handled by validateOfferId middleware
      const { id } = req.params;

      // Delete the offer (service handles soft delete)
      const offer = await offerService.deleteOffer(id);

      // Return success response
      const apiResponse: ApiResponse<Offer> = {
        success: true,
        data: offer,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(apiResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get active offers ranked by EPC performance
   * 
   * @param req - Request object
   * @param res - Response object
   * @param next - Next function for error handling
   */
  async getActiveOffersByEPC(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get active offers sorted by EPC
      const offers = await offerService.getActiveOffersByEPC();

      // Return success response
      const apiResponse: ApiResponse<OfferWithMetrics[]> = {
        success: true,
        data: offers,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(apiResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate a new pixel URL for an offer
   * 
   * @param req - Request object with offer ID (validated by middleware)
   * @param res - Response object
   * @param next - Next function for error handling
   */
  async generatePixelUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Note: Request validation is handled by validateOfferId middleware
      const { id } = req.params;

      // Check if offer exists
      const offer = await offerService.getOfferById(id);
      if (!offer) {
        return next(createBadRequestError(`Offer with ID ${id} not found`));
      }

      // Generate new pixel URL
      const pixelUrl = offerService.generatePixelUrl();

      // Return success response
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
   * Get offer analytics and metrics
   * 
   * @param req - Request object with offer ID (validated by middleware)
   * @param res - Response object
   * @param next - Next function for error handling
   */
  async getOfferMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Note: Request validation is handled by validateOfferId middleware
      const { id } = req.params;

      // Get the offer with metrics
      const offer = await offerService.getOfferWithMetrics(id);

      if (!offer) {
        return next(createBadRequestError(`Offer with ID ${id} not found`));
      }

      // Return success response with metrics
      const apiResponse: ApiResponse<{ 
        offerId: string; 
        metrics: OfferWithMetrics['epcMetrics'];
      }> = {
        success: true,
        data: {
          offerId: id,
          metrics: offer.epcMetrics
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(apiResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk update offer statuses
   * 
   * @param req - Request object with offer IDs and status
   * @param res - Response object
   * @param next - Next function for error handling
   */
  async bulkUpdateOfferStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { offerIds, status } = req.body;

      // Validate input
      if (!offerIds || !Array.isArray(offerIds) || offerIds.length === 0) {
        return next(createBadRequestError('Offer IDs array is required'));
      }

      if (!status || !['ACTIVE', 'PAUSED', 'ARCHIVED'].includes(status)) {
        return next(createBadRequestError('Valid status is required (ACTIVE, PAUSED, ARCHIVED)'));
      }

      // Update all offers
      const updatedOffers = await Promise.all(
        offerIds.map(async (id: string) => {
          try {
            if (status === 'ARCHIVED') {
              return await offerService.deleteOffer(id);
            } else {
              return await offerService.toggleOfferStatus(id, status);
            }
          } catch (error) {
            console.warn(`Failed to update offer ${id}:`, error);
            return null;
          }
        })
      );

      // Filter out failed updates
      const successfulUpdates = updatedOffers.filter(offer => offer !== null);

      // Return success response
      const apiResponse: ApiResponse<{ 
        updated: number; 
        failed: number; 
        offers: Offer[];
      }> = {
        success: true,
        data: {
          updated: successfulUpdates.length,
          failed: offerIds.length - successfulUpdates.length,
          offers: successfulUpdates
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(apiResponse);
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const offerController = new OfferController();