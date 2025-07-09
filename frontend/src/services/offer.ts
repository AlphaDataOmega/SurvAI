/**
 * @fileoverview Offer API service
 * 
 * Service for making API calls to the backend offer management endpoints.
 * Provides typed methods for all CRUD operations on offers.
 */

import type { 
  ApiResponse, 
  Offer, 
  CreateOfferRequest, 
  UpdateOfferRequest, 
  ListOffersRequest,
  OfferWithMetrics,
  PaginatedOffersResponse,
  ToggleOfferStatusRequest,
  BulkUpdateOfferStatusRequest,
  EPCMetrics
} from '@survai/shared';
import { api } from './api';

/**
 * Offer API service class
 */
export class OfferApiService {
  private baseUrl = '/api/offers';

  /**
   * Create a new offer
   * 
   * @param data - Offer creation data
   * @returns Promise with created offer
   */
  async createOffer(data: CreateOfferRequest): Promise<ApiResponse<Offer>> {
    const response = await api.post<ApiResponse<Offer>>(this.baseUrl, data);
    return response.data;
  }

  /**
   * List offers with pagination and filtering
   * 
   * @param params - List parameters
   * @returns Promise with paginated offers
   */
  async listOffers(params: ListOffersRequest = {}): Promise<ApiResponse<PaginatedOffersResponse>> {
    const response = await api.get<ApiResponse<PaginatedOffersResponse>>(this.baseUrl, params);
    return response.data;
  }

  /**
   * Get a single offer by ID
   * 
   * @param id - Offer ID
   * @returns Promise with offer data
   */
  async getOffer(id: string): Promise<ApiResponse<OfferWithMetrics>> {
    const response = await api.get<ApiResponse<OfferWithMetrics>>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Update an existing offer
   * 
   * @param id - Offer ID
   * @param data - Update data
   * @returns Promise with updated offer
   */
  async updateOffer(id: string, data: UpdateOfferRequest): Promise<ApiResponse<Offer>> {
    const response = await api.patch<ApiResponse<Offer>>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  /**
   * Delete an offer (soft delete)
   * 
   * @param id - Offer ID
   * @returns Promise with deleted offer
   */
  async deleteOffer(id: string): Promise<ApiResponse<Offer>> {
    const response = await api.delete<ApiResponse<Offer>>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Toggle offer status between ACTIVE and PAUSED
   * 
   * @param id - Offer ID
   * @param status - New status
   * @returns Promise with updated offer
   */
  async toggleOfferStatus(id: string, status: 'ACTIVE' | 'PAUSED'): Promise<ApiResponse<Offer>> {
    const data: ToggleOfferStatusRequest = { status };
    const response = await api.patch<ApiResponse<Offer>>(`${this.baseUrl}/${id}/toggle`, data);
    return response.data;
  }

  /**
   * Get active offers ranked by EPC performance
   * 
   * @returns Promise with ranked offers
   */
  async getActiveOffersByEPC(): Promise<ApiResponse<OfferWithMetrics[]>> {
    const response = await api.get<ApiResponse<OfferWithMetrics[]>>(`${this.baseUrl}/active-by-epc`);
    return response.data;
  }

  /**
   * Generate a new pixel URL for an offer
   * 
   * @param id - Offer ID
   * @returns Promise with pixel URL
   */
  async generatePixelUrl(id: string): Promise<ApiResponse<{ pixelUrl: string }>> {
    const response = await api.get<ApiResponse<{ pixelUrl: string }>>(`${this.baseUrl}/${id}/pixel`);
    return response.data;
  }

  /**
   * Get offer metrics and analytics
   * 
   * @param id - Offer ID
   * @returns Promise with offer metrics
   */
  async getOfferMetrics(id: string): Promise<ApiResponse<{ offerId: string; metrics: EPCMetrics }>> {
    const response = await api.get<ApiResponse<{ offerId: string; metrics: EPCMetrics }>>(`${this.baseUrl}/${id}/metrics`);
    return response.data;
  }

  /**
   * Bulk update offer statuses
   * 
   * @param data - Bulk update data
   * @returns Promise with update results
   */
  async bulkUpdateOfferStatus(data: BulkUpdateOfferStatusRequest): Promise<ApiResponse<{ 
    updated: number; 
    failed: number; 
    offers: Offer[];
  }>> {
    const response = await api.patch<ApiResponse<{ 
      updated: number; 
      failed: number; 
      offers: Offer[];
    }>>(`${this.baseUrl}/bulk/status`, data);
    return response.data;
  }
}

/**
 * Offer API service instance
 */
export const offerApiService = new OfferApiService();

/**
 * Offer API helpers for common operations
 */
export const offerApi = {
  /**
   * Create a new offer
   */
  create: (data: CreateOfferRequest) => offerApiService.createOffer(data),

  /**
   * List offers with filtering and pagination
   */
  list: (params?: ListOffersRequest) => offerApiService.listOffers(params),

  /**
   * Get offer by ID
   */
  get: (id: string) => offerApiService.getOffer(id),

  /**
   * Update offer
   */
  update: (id: string, data: UpdateOfferRequest) => offerApiService.updateOffer(id, data),

  /**
   * Delete offer
   */
  delete: (id: string) => offerApiService.deleteOffer(id),

  /**
   * Toggle offer status
   */
  toggle: (id: string, status: 'ACTIVE' | 'PAUSED') => offerApiService.toggleOfferStatus(id, status),

  /**
   * Get active offers by EPC
   */
  getActiveByEPC: () => offerApiService.getActiveOffersByEPC(),

  /**
   * Generate pixel URL
   */
  generatePixel: (id: string) => offerApiService.generatePixelUrl(id),

  /**
   * Get offer metrics
   */
  getMetrics: (id: string) => offerApiService.getOfferMetrics(id),

  /**
   * Bulk update statuses
   */
  bulkUpdate: (data: BulkUpdateOfferStatusRequest) => offerApiService.bulkUpdateOfferStatus(data)
};

/**
 * React Query keys for offers
 */
export const offerQueryKeys = {
  all: ['offers'] as const,
  lists: () => [...offerQueryKeys.all, 'list'] as const,
  list: (params: ListOffersRequest) => [...offerQueryKeys.lists(), params] as const,
  details: () => [...offerQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...offerQueryKeys.details(), id] as const,
  metrics: () => [...offerQueryKeys.all, 'metrics'] as const,
  metric: (id: string) => [...offerQueryKeys.metrics(), id] as const,
  activeByEpc: () => [...offerQueryKeys.all, 'activeByEpc'] as const
};

export default offerApiService;