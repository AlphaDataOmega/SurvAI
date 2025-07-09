/**
 * @fileoverview Offer service for affiliate offer management
 * 
 * Service for managing affiliate offers, including CRUD operations,
 * pixel URL generation, and EPC integration for performance tracking.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import type { 
  Offer, 
  OfferCategory, 
  OfferStatus, 
  EPCMetrics,
  CreateOfferRequest,
  UpdateOfferRequest,
  ListOffersRequest,
  OfferWithMetrics,
  PaginatedOffersResponse
} from '@survai/shared';
import { epcService } from './epcService';

const prisma = new PrismaClient();

/**
 * Offer service class
 */
export class OfferService {
  /**
   * Generate tracking pixel URL with embedded parameters
   * 
   * @param clickId - The click ID for tracking conversion attribution
   * @param surveyId - The survey ID for campaign segmentation
   * @returns string - The tracking pixel URL with proper parameters
   */
  generatePixelUrl(clickId: string = '{click_id}', surveyId: string = '{survey_id}'): string {
    const baseUrl = process.env.TRACKING_PIXEL_URL || 'https://tracking.survai.app/pixel';
    const params = new URLSearchParams({
      click_id: clickId,
      survey_id: surveyId
    });
    
    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Create a new offer with automatic pixel URL generation
   * 
   * @param data - The offer creation data
   * @returns Promise<Offer> - The created offer
   */
  async createOffer(data: CreateOfferRequest): Promise<Offer> {
    try {
      // VALIDATION: Check required fields
      if (!data.title || !data.category || !data.destinationUrl) {
        throw new Error('Missing required fields: title, category, and destinationUrl are required');
      }

      // VALIDATION: Check if destination URL is valid
      try {
        new URL(data.destinationUrl);
      } catch (error) {
        throw new Error('Invalid destination URL provided');
      }

      return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Generate pixel URL with template variables
        const pixelUrl = this.generatePixelUrl();
        
        // Set default config values
        const defaultConfig = {
          payout: 0,
          currency: 'USD',
          ...data.config
        };

        // Create the offer
        const offer = await tx.offer.create({
          data: {
            title: data.title,
            description: data.description || null,
            category: data.category,
            status: 'PENDING',
            destinationUrl: data.destinationUrl,
            pixelUrl: pixelUrl,
            config: defaultConfig,
            targeting: data.targeting || null,
            metrics: {
              totalClicks: 0,
              totalConversions: 0,
              totalRevenue: 0,
              conversionRate: 0,
              epc: 0,
              lastUpdated: new Date()
            },
            createdBy: data.createdBy || null,
            updatedBy: data.createdBy || null
          }
        });

        // Initialize EPC metrics
        try {
          await epcService.updateEPC(offer.id);
        } catch (error) {
          // Log error but don't fail the transaction
          console.warn(`Failed to initialize EPC for offer ${offer.id}:`, error);
        }

        return this.mapOfferFromPrisma(offer);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create offer: ${message}`);
    }
  }

  /**
   * Get an offer by ID
   * 
   * @param id - The offer ID
   * @returns Promise<Offer | null> - The offer or null if not found
   */
  async getOfferById(id: string): Promise<Offer | null> {
    try {
      // VALIDATION: Check offer ID parameter
      if (!id || typeof id !== 'string') {
        throw new Error('Offer ID is required and must be a string');
      }

      const offer = await prisma.offer.findUnique({
        where: { id }
      });

      if (!offer) {
        return null;
      }

      return this.mapOfferFromPrisma(offer);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get offer: ${message}`);
    }
  }

  /**
   * Get an offer by ID with EPC metrics
   * 
   * @param id - The offer ID
   * @returns Promise<OfferWithMetrics | null> - The offer with metrics or null if not found
   */
  async getOfferWithMetrics(id: string): Promise<OfferWithMetrics | null> {
    try {
      const offer = await this.getOfferById(id);
      
      if (!offer) {
        return null;
      }

      // Get EPC metrics
      let epcMetrics: EPCMetrics | undefined;
      try {
        const epcValue = await epcService.calculateEPC(id);
        epcMetrics = {
          totalClicks: 0,
          totalConversions: 0,
          totalRevenue: 0,
          conversionRate: 0,
          epc: epcValue,
          lastUpdated: new Date()
        };
      } catch (error) {
        console.warn(`Failed to get EPC metrics for offer ${id}:`, error);
      }

      return {
        ...offer,
        epcMetrics
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get offer with metrics: ${message}`);
    }
  }

  /**
   * List offers with pagination and filtering
   * 
   * @param params - The list parameters
   * @returns Promise<PaginatedOffersResponse> - The paginated offers
   */
  async listOffers(params: ListOffersRequest = {}): Promise<PaginatedOffersResponse> {
    try {
      const {
        page = 1,
        limit = 10,
        category,
        status,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        minEPC
      } = params;

      // Build where clause
      const where: Prisma.OfferWhereInput = {};

      if (category) {
        where.category = category;
      }

      if (status) {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Build order by clause
      const orderBy: Prisma.OfferOrderByWithRelationInput = {};
      
      if (sortBy === 'epc') {
        // For EPC sorting, we'll need to handle this after fetching
        orderBy.createdAt = sortOrder;
      } else {
        orderBy[sortBy] = sortOrder;
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get total count
      const total = await prisma.offer.count({ where });

      // Get offers
      const offers = await prisma.offer.findMany({
        where,
        orderBy,
        skip,
        take: limit
      });

      // Map to domain objects and get EPC metrics
      const offersWithMetrics = await Promise.all(
        offers.map(async (offer) => {
          const mappedOffer = this.mapOfferFromPrisma(offer);
          
          // Get EPC metrics
          let epcMetrics: EPCMetrics | undefined;
          try {
            const epcValue = await epcService.calculateEPC(offer.id);
            epcMetrics = {
              totalClicks: 0,
              totalConversions: 0,
              totalRevenue: 0,
              conversionRate: 0,
              epc: epcValue,
              lastUpdated: new Date()
            };
          } catch (error) {
            console.warn(`Failed to get EPC metrics for offer ${offer.id}:`, error);
          }

          return {
            ...mappedOffer,
            epcMetrics
          };
        })
      );

      // Filter by minEPC if specified
      let filteredOffers = offersWithMetrics;
      if (minEPC !== undefined) {
        filteredOffers = offersWithMetrics.filter(offer => 
          offer.epcMetrics && offer.epcMetrics.epc >= minEPC
        );
      }

      // Sort by EPC if requested
      if (sortBy === 'epc') {
        filteredOffers.sort((a, b) => {
          const aEPC = a.epcMetrics?.epc || 0;
          const bEPC = b.epcMetrics?.epc || 0;
          return sortOrder === 'asc' ? aEPC - bEPC : bEPC - aEPC;
        });
      }

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasMore = page < totalPages;

      return {
        offers: filteredOffers,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore
        }
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to list offers: ${message}`);
    }
  }

  /**
   * Update an existing offer
   * 
   * @param id - The offer ID
   * @param data - The update data
   * @returns Promise<Offer> - The updated offer
   */
  async updateOffer(id: string, data: UpdateOfferRequest): Promise<Offer> {
    try {
      // VALIDATION: Check offer ID parameter
      if (!id || typeof id !== 'string') {
        throw new Error('Offer ID is required and must be a string');
      }

      // VALIDATION: Check if offer exists
      const existingOffer = await prisma.offer.findUnique({
        where: { id }
      });

      if (!existingOffer) {
        throw new Error(`Offer ${id} not found`);
      }

      // VALIDATION: Check destination URL if provided
      if (data.destinationUrl) {
        try {
          new URL(data.destinationUrl);
        } catch (error) {
          throw new Error('Invalid destination URL provided');
        }
      }

      return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Prepare update data
        const updateData: Prisma.OfferUpdateInput = {
          ...data,
          updatedAt: new Date()
        };

        // Regenerate pixel URL if destination URL changed
        if (data.destinationUrl) {
          updateData.pixelUrl = this.generatePixelUrl();
        }

        // Update the offer
        const updatedOffer = await tx.offer.update({
          where: { id },
          data: updateData
        });

        // Update EPC metrics if offer was modified
        try {
          await epcService.updateEPC(id);
        } catch (error) {
          console.warn(`Failed to update EPC for offer ${id}:`, error);
        }

        return this.mapOfferFromPrisma(updatedOffer);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to update offer: ${message}`);
    }
  }

  /**
   * Toggle offer status between ACTIVE and PAUSED
   * 
   * @param id - The offer ID
   * @param status - The new status
   * @returns Promise<Offer> - The updated offer
   */
  async toggleOfferStatus(id: string, status: 'ACTIVE' | 'PAUSED'): Promise<Offer> {
    try {
      // VALIDATION: Check offer ID parameter
      if (!id || typeof id !== 'string') {
        throw new Error('Offer ID is required and must be a string');
      }

      // VALIDATION: Check status parameter
      if (!status || !['ACTIVE', 'PAUSED'].includes(status)) {
        throw new Error('Status must be either ACTIVE or PAUSED');
      }

      return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Check if offer exists
        const existingOffer = await tx.offer.findUnique({
          where: { id }
        });

        if (!existingOffer) {
          throw new Error(`Offer ${id} not found`);
        }

        // Update the status
        const updatedOffer = await tx.offer.update({
          where: { id },
          data: {
            status,
            updatedAt: new Date()
          }
        });

        return this.mapOfferFromPrisma(updatedOffer);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to toggle offer status: ${message}`);
    }
  }

  /**
   * Soft delete an offer (set status to ARCHIVED)
   * 
   * @param id - The offer ID
   * @returns Promise<Offer> - The archived offer
   */
  async deleteOffer(id: string): Promise<Offer> {
    try {
      // VALIDATION: Check offer ID parameter
      if (!id || typeof id !== 'string') {
        throw new Error('Offer ID is required and must be a string');
      }

      return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Check if offer exists
        const existingOffer = await tx.offer.findUnique({
          where: { id }
        });

        if (!existingOffer) {
          throw new Error(`Offer ${id} not found`);
        }

        // Soft delete by setting status to ARCHIVED
        const deletedOffer = await tx.offer.update({
          where: { id },
          data: {
            status: 'ARCHIVED',
            updatedAt: new Date()
          }
        });

        return this.mapOfferFromPrisma(deletedOffer);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete offer: ${message}`);
    }
  }

  /**
   * Get all active offers sorted by EPC performance
   * 
   * @returns Promise<OfferWithMetrics[]> - Active offers sorted by EPC
   */
  async getActiveOffersByEPC(): Promise<OfferWithMetrics[]> {
    try {
      const offers = await prisma.offer.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' }
      });

      // Map to domain objects and get EPC metrics
      const offersWithMetrics = await Promise.all(
        offers.map(async (offer) => {
          const mappedOffer = this.mapOfferFromPrisma(offer);
          
          // Get EPC metrics
          let epcMetrics: EPCMetrics | undefined;
          try {
            const epcValue = await epcService.calculateEPC(offer.id);
            epcMetrics = {
              totalClicks: 0,
              totalConversions: 0,
              totalRevenue: 0,
              conversionRate: 0,
              epc: epcValue,
              lastUpdated: new Date()
            };
          } catch (error) {
            console.warn(`Failed to get EPC metrics for offer ${offer.id}:`, error);
            epcMetrics = {
              totalClicks: 0,
              totalConversions: 0,
              totalRevenue: 0,
              conversionRate: 0,
              epc: 0,
              lastUpdated: new Date()
            };
          }

          return {
            ...mappedOffer,
            epcMetrics
          };
        })
      );

      // Sort by EPC (highest first)
      return offersWithMetrics.sort((a, b) => {
        const aEPC = a.epcMetrics?.epc || 0;
        const bEPC = b.epcMetrics?.epc || 0;
        return bEPC - aEPC;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get active offers by EPC: ${message}`);
    }
  }

  /**
   * Map Prisma offer to domain Offer object
   * 
   * @param offer - The Prisma offer object
   * @returns Offer - The mapped domain object
   */
  private mapOfferFromPrisma(offer: any): Offer {
    return {
      id: offer.id,
      title: offer.title,
      description: offer.description || undefined,
      category: offer.category as OfferCategory,
      status: offer.status as OfferStatus,
      destinationUrl: offer.destinationUrl,
      pixelUrl: offer.pixelUrl || undefined,
      config: offer.config ? {
        payout: offer.config.payout || 0,
        currency: offer.config.currency || 'USD',
        dailyClickCap: offer.config.dailyClickCap,
        totalClickCap: offer.config.totalClickCap,
        cooldownPeriod: offer.config.cooldownPeriod,
        urlParams: offer.config.urlParams
      } : {
        payout: 0,
        currency: 'USD'
      },
      targeting: offer.targeting ? {
        geoTargeting: offer.targeting.geoTargeting,
        deviceTargeting: offer.targeting.deviceTargeting,
        timeTargeting: offer.targeting.timeTargeting
      } : undefined,
      metrics: offer.metrics ? {
        totalClicks: offer.metrics.totalClicks || 0,
        totalConversions: offer.metrics.totalConversions || 0,
        totalRevenue: offer.metrics.totalRevenue || 0,
        conversionRate: offer.metrics.conversionRate || 0,
        epc: offer.metrics.epc || 0,
        lastUpdated: new Date(offer.metrics.lastUpdated || Date.now())
      } : {
        totalClicks: 0,
        totalConversions: 0,
        totalRevenue: 0,
        conversionRate: 0,
        epc: 0,
        lastUpdated: new Date()
      },
      createdAt: offer.createdAt,
      updatedAt: offer.updatedAt,
      metadata: offer.metadata as any
    };
  }
}

// Export singleton instance
export const offerService = new OfferService();