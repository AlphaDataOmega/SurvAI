# Offer Management API Reference

## Overview

The Offer Management API provides comprehensive CRUD operations for managing affiliate offers within the SurvAI platform. This API enables administrators to create, read, update, and delete affiliate offers with automatic pixel URL generation, EPC integration, and real-time performance tracking.

**Key Features:**
- Complete CRUD operations for affiliate offers
- Automatic pixel URL generation with template variables (`{click_id}`, `{survey_id}`)
- Real-time EPC integration for performance optimization
- Comprehensive validation using Joi schemas
- Atomic database transactions for data consistency
- Admin-only access control with JWT authentication
- Pagination and filtering for large offer datasets

## Table of Contents

- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [API Endpoints](#api-endpoints)
- [Create Offer](#create-offer)
- [List Offers](#list-offers)
- [Get Offer](#get-offer)
- [Update Offer](#update-offer)
- [Delete Offer](#delete-offer)
- [Toggle Offer Status](#toggle-offer-status)
- [Data Types](#data-types)
- [Frontend Integration](#frontend-integration)
- [Testing](#testing)
- [Performance](#performance)

## Authentication

All offer management endpoints require admin authentication using JWT tokens. Only users with `ADMIN` role can access offer management functionality.

### Authentication Flow

```typescript
// Admin authentication required for all offer endpoints
app.use('/api/offers', [authenticateUser, requireAdmin]);

// Authentication headers
headers: {
  'Cookie': 'accessToken=your_jwt_token_here'
}
```

### Access Control

- **Role Required**: `ADMIN`
- **Authentication Method**: JWT token in HTTP-only cookie
- **Session Management**: Automatic token refresh on API calls
- **Error Response**: `401 Unauthorized` for unauthenticated requests

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Common Error Codes

```typescript
const OFFER_ERRORS = {
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  ADMIN_ACCESS_REQUIRED: 'ADMIN_ACCESS_REQUIRED',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  OFFER_NOT_FOUND: 'OFFER_NOT_FOUND',
  DUPLICATE_OFFER: 'DUPLICATE_OFFER',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
} as const;
```

## API Endpoints

### Create Offer

Creates a new affiliate offer with automatic pixel URL generation and EPC integration.

#### Endpoint
```
POST /api/offers
```

#### Request Body

```json
{
  "title": "Financial Planning Consultation",
  "description": "Professional financial planning services for individuals",
  "category": "FINANCE",
  "destinationUrl": "https://example.com/financial-planning",
  "config": {
    "payout": 25.00,
    "currency": "USD",
    "dailyClickCap": 1000,
    "totalClickCap": 10000,
    "cooldownPeriod": 3600,
    "urlParams": {
      "source": "survai",
      "campaign": "financial-q1"
    }
  },
  "targeting": {
    "geoTargeting": ["US", "CA", "UK"],
    "deviceTargeting": ["DESKTOP", "MOBILE"],
    "timeTargeting": {
      "daysOfWeek": [1, 2, 3, 4, 5],
      "hourRange": {
        "start": 8,
        "end": 18
      },
      "timezone": "America/New_York"
    }
  }
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "id": "offer_clr5k2jx80001abcd1234567",
    "title": "Financial Planning Consultation",
    "description": "Professional financial planning services for individuals",
    "category": "FINANCE",
    "status": "ACTIVE",
    "destinationUrl": "https://example.com/financial-planning",
    "pixelUrl": "https://tracking.survai.app/pixel?click_id={click_id}&survey_id={survey_id}",
    "config": {
      "payout": 25.00,
      "currency": "USD",
      "dailyClickCap": 1000,
      "totalClickCap": 10000,
      "cooldownPeriod": 3600,
      "urlParams": {
        "source": "survai",
        "campaign": "financial-q1"
      }
    },
    "targeting": {
      "geoTargeting": ["US", "CA", "UK"],
      "deviceTargeting": ["DESKTOP", "MOBILE"],
      "timeTargeting": {
        "daysOfWeek": [1, 2, 3, 4, 5],
        "hourRange": {
          "start": 8,
          "end": 18
        },
        "timezone": "America/New_York"
      }
    },
    "metrics": {
      "totalClicks": 0,
      "totalConversions": 0,
      "totalRevenue": 0,
      "conversionRate": 0,
      "epc": 0,
      "lastUpdated": "2024-01-01T00:00:00.000Z"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Validation Rules

- **title**: Required, 1-255 characters
- **category**: Required, must be valid `OfferCategory` enum value
- **destinationUrl**: Required, must be valid URL
- **config.payout**: Optional, minimum 0.01 if provided
- **config.currency**: Optional, default "USD", must be valid ISO currency code
- **targeting.geoTargeting**: Optional, array of valid country codes
- **targeting.deviceTargeting**: Optional, array of valid `DeviceTarget` enum values

#### Example Usage

```typescript
import { offerService } from '../services/offer';

// Create new offer
const newOffer = await offerService.createOffer({
  title: 'Financial Planning Consultation',
  category: 'FINANCE',
  destinationUrl: 'https://example.com/financial-planning',
  config: {
    payout: 25.00,
    currency: 'USD'
  }
});

console.log('Created offer:', newOffer.id);
console.log('Pixel URL:', newOffer.pixelUrl);
```

---

### List Offers

Retrieves a paginated list of offers with filtering and sorting capabilities.

#### Endpoint
```
GET /api/offers
```

#### Query Parameters

| Parameter | Type | Required | Description | Valid Values |
|-----------|------|----------|-------------|--------------|
| `page` | number | No | Page number (default: 1) | Positive integer |
| `limit` | number | No | Items per page (default: 20) | 1-100 |
| `category` | string | No | Filter by category | Valid `OfferCategory` enum |
| `status` | string | No | Filter by status | Valid `OfferStatus` enum |
| `search` | string | No | Search in title/description | Any string |
| `sortBy` | string | No | Sort field (default: createdAt) | `title`, `category`, `status`, `createdAt`, `updatedAt`, `epc` |
| `sortOrder` | string | No | Sort direction (default: desc) | `asc`, `desc` |
| `minEPC` | number | No | Minimum EPC filter | Positive number ≥ 0 |

#### Example Request

```bash
GET /api/offers?page=1&limit=10&category=FINANCE&status=ACTIVE&sortBy=epc&sortOrder=desc&minEPC=2.0
Cookie: accessToken=your_jwt_token
```

#### Response

```json
{
  "success": true,
  "data": {
    "offers": [
      {
        "id": "offer_clr5k2jx80001abcd1234567",
        "title": "Financial Planning Consultation",
        "description": "Professional financial planning services",
        "category": "FINANCE",
        "status": "ACTIVE",
        "destinationUrl": "https://example.com/financial-planning",
        "pixelUrl": "https://tracking.survai.app/pixel?click_id={click_id}&survey_id={survey_id}",
        "config": {
          "payout": 25.00,
          "currency": "USD",
          "dailyClickCap": 1000,
          "totalClickCap": 10000
        },
        "targeting": {
          "geoTargeting": ["US", "CA", "UK"],
          "deviceTargeting": ["DESKTOP", "MOBILE"]
        },
        "metrics": {
          "totalClicks": 1250,
          "totalConversions": 87,
          "totalRevenue": 2175.50,
          "conversionRate": 6.96,
          "epc": 1.74,
          "lastUpdated": "2024-01-01T00:00:00.000Z"
        },
        "epcMetrics": {
          "totalClicks": 1250,
          "totalConversions": 87,
          "totalRevenue": 2175.50,
          "conversionRate": 6.96,
          "epc": 1.74,
          "lastUpdated": "2024-01-01T00:00:00.000Z"
        },
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3,
      "hasMore": true
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Example Usage

```typescript
import { offerService } from '../services/offer';

// Get active finance offers sorted by EPC
const result = await offerService.listOffers({
  category: 'FINANCE',
  status: 'ACTIVE',
  sortBy: 'epc',
  sortOrder: 'desc',
  minEPC: 2.0,
  page: 1,
  limit: 10
});

console.log(`Found ${result.pagination.total} offers`);
result.offers.forEach(offer => {
  console.log(`${offer.title}: EPC $${offer.epcMetrics?.epc || 0}`);
});
```

---

### Get Offer

Retrieves a specific offer by ID with full details and metrics.

#### Endpoint
```
GET /api/offers/:id
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Unique offer identifier |

#### Response

```json
{
  "success": true,
  "data": {
    "id": "offer_clr5k2jx80001abcd1234567",
    "title": "Financial Planning Consultation",
    "description": "Professional financial planning services for individuals",
    "category": "FINANCE",
    "status": "ACTIVE",
    "destinationUrl": "https://example.com/financial-planning",
    "pixelUrl": "https://tracking.survai.app/pixel?click_id={click_id}&survey_id={survey_id}",
    "config": {
      "payout": 25.00,
      "currency": "USD",
      "dailyClickCap": 1000,
      "totalClickCap": 10000,
      "cooldownPeriod": 3600,
      "urlParams": {
        "source": "survai",
        "campaign": "financial-q1"
      }
    },
    "targeting": {
      "geoTargeting": ["US", "CA", "UK"],
      "deviceTargeting": ["DESKTOP", "MOBILE"],
      "timeTargeting": {
        "daysOfWeek": [1, 2, 3, 4, 5],
        "hourRange": {
          "start": 8,
          "end": 18
        },
        "timezone": "America/New_York"
      }
    },
    "metrics": {
      "totalClicks": 1250,
      "totalConversions": 87,
      "totalRevenue": 2175.50,
      "conversionRate": 6.96,
      "epc": 1.74,
      "lastUpdated": "2024-01-01T00:00:00.000Z"
    },
    "epcMetrics": {
      "totalClicks": 1250,
      "totalConversions": 87,
      "totalRevenue": 2175.50,
      "conversionRate": 6.96,
      "epc": 1.74,
      "lastUpdated": "2024-01-01T00:00:00.000Z"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Example Usage

```typescript
import { offerService } from '../services/offer';

// Get offer details
try {
  const offer = await offerService.getOffer('offer_clr5k2jx80001abcd1234567');
  console.log('Offer title:', offer.title);
  console.log('EPC:', offer.epcMetrics?.epc || 0);
  console.log('Pixel URL:', offer.pixelUrl);
} catch (error) {
  console.error('Offer not found:', error.message);
}
```

---

### Update Offer

Updates an existing offer with partial data and automatic EPC recalculation.

#### Endpoint
```
PATCH /api/offers/:id
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Unique offer identifier |

#### Request Body

```json
{
  "title": "Updated Financial Planning Consultation",
  "description": "Enhanced professional financial planning services",
  "status": "ACTIVE",
  "destinationUrl": "https://example.com/updated-financial-planning",
  "config": {
    "payout": 30.00,
    "dailyClickCap": 1500
  },
  "targeting": {
    "geoTargeting": ["US", "CA", "UK", "AU"],
    "deviceTargeting": ["DESKTOP", "MOBILE", "TABLET"]
  }
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "id": "offer_clr5k2jx80001abcd1234567",
    "title": "Updated Financial Planning Consultation",
    "description": "Enhanced professional financial planning services",
    "category": "FINANCE",
    "status": "ACTIVE",
    "destinationUrl": "https://example.com/updated-financial-planning",
    "pixelUrl": "https://tracking.survai.app/pixel?click_id={click_id}&survey_id={survey_id}",
    "config": {
      "payout": 30.00,
      "currency": "USD",
      "dailyClickCap": 1500,
      "totalClickCap": 10000,
      "cooldownPeriod": 3600,
      "urlParams": {
        "source": "survai",
        "campaign": "financial-q1"
      }
    },
    "targeting": {
      "geoTargeting": ["US", "CA", "UK", "AU"],
      "deviceTargeting": ["DESKTOP", "MOBILE", "TABLET"],
      "timeTargeting": {
        "daysOfWeek": [1, 2, 3, 4, 5],
        "hourRange": {
          "start": 8,
          "end": 18
        },
        "timezone": "America/New_York"
      }
    },
    "metrics": {
      "totalClicks": 1250,
      "totalConversions": 87,
      "totalRevenue": 2175.50,
      "conversionRate": 6.96,
      "epc": 1.74,
      "lastUpdated": "2024-01-01T00:00:00.000Z"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:01.000Z"
  },
  "timestamp": "2024-01-01T00:00:01.000Z"
}
```

#### Validation Rules

- All fields are optional (partial update)
- **title**: 1-255 characters if provided
- **category**: Must be valid `OfferCategory` enum value if provided
- **status**: Must be valid `OfferStatus` enum value if provided
- **destinationUrl**: Must be valid URL if provided
- **config**: Deep merge with existing configuration
- **targeting**: Deep merge with existing targeting rules

#### Example Usage

```typescript
import { offerService } from '../services/offer';

// Update offer payout and targeting
const updatedOffer = await offerService.updateOffer('offer_clr5k2jx80001abcd1234567', {
  config: {
    payout: 30.00,
    dailyClickCap: 1500
  },
  targeting: {
    geoTargeting: ['US', 'CA', 'UK', 'AU']
  }
});

console.log('Updated offer:', updatedOffer.title);
console.log('New payout:', updatedOffer.config.payout);
```

---

### Delete Offer

Permanently deletes an offer from the system.

#### Endpoint
```
DELETE /api/offers/:id
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Unique offer identifier |

#### Response

```json
{
  "success": true,
  "data": {
    "deleted": true,
    "id": "offer_clr5k2jx80001abcd1234567"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Error Responses

```json
{
  "success": false,
  "error": "Offer not found",
  "code": "OFFER_NOT_FOUND",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Example Usage

```typescript
import { offerService } from '../services/offer';

// Delete offer
try {
  await offerService.deleteOffer('offer_clr5k2jx80001abcd1234567');
  console.log('Offer deleted successfully');
} catch (error) {
  console.error('Delete failed:', error.message);
}
```

---

### Toggle Offer Status

Toggles offer status between ACTIVE and PAUSED.

#### Endpoint
```
PATCH /api/offers/:id/toggle
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Unique offer identifier |

#### Request Body

```json
{
  "status": "PAUSED"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "id": "offer_clr5k2jx80001abcd1234567",
    "status": "PAUSED",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Validation Rules

- **status**: Must be either "ACTIVE" or "PAUSED"
- Only allows toggling between active and paused states
- Other statuses (EXPIRED, PENDING, ARCHIVED) require full update

#### Example Usage

```typescript
import { offerService } from '../services/offer';

// Toggle offer status
const result = await offerService.toggleOfferStatus('offer_clr5k2jx80001abcd1234567', {
  status: 'PAUSED'
});

console.log('Offer status:', result.status);
```

---

## Data Types

### Core Types

```typescript
// Offer categories
enum OfferCategory {
  FINANCE = 'FINANCE',
  INSURANCE = 'INSURANCE',
  HEALTH = 'HEALTH',
  EDUCATION = 'EDUCATION',
  TECHNOLOGY = 'TECHNOLOGY',
  TRAVEL = 'TRAVEL',
  SHOPPING = 'SHOPPING',
  OTHER = 'OTHER'
}

// Offer status
enum OfferStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  EXPIRED = 'EXPIRED',
  PENDING = 'PENDING',
  ARCHIVED = 'ARCHIVED'
}

// Device targeting
enum DeviceTarget {
  DESKTOP = 'DESKTOP',
  MOBILE = 'MOBILE',
  TABLET = 'TABLET'
}
```

### Request/Response Types

```typescript
// Create offer request
interface CreateOfferRequest {
  title: string;
  description?: string;
  category: OfferCategory;
  destinationUrl: string;
  config?: {
    payout?: number;
    currency?: string;
    dailyClickCap?: number;
    totalClickCap?: number;
    cooldownPeriod?: number;
    urlParams?: Record<string, string>;
  };
  targeting?: {
    geoTargeting?: string[];
    deviceTargeting?: string[];
    timeTargeting?: {
      daysOfWeek?: number[];
      hourRange?: {
        start: number;
        end: number;
      };
      timezone?: string;
    };
  };
}

// Update offer request
interface UpdateOfferRequest {
  title?: string;
  description?: string;
  category?: OfferCategory;
  status?: OfferStatus;
  destinationUrl?: string;
  config?: {
    payout?: number;
    currency?: string;
    dailyClickCap?: number;
    totalClickCap?: number;
    cooldownPeriod?: number;
    urlParams?: Record<string, string>;
  };
  targeting?: {
    geoTargeting?: string[];
    deviceTargeting?: string[];
    timeTargeting?: {
      daysOfWeek?: number[];
      hourRange?: {
        start: number;
        end: number;
      };
      timezone?: string;
    };
  };
}

// List offers request
interface ListOffersRequest {
  page?: number;
  limit?: number;
  category?: OfferCategory;
  status?: OfferStatus;
  search?: string;
  sortBy?: 'title' | 'category' | 'status' | 'createdAt' | 'updatedAt' | 'epc';
  sortOrder?: 'asc' | 'desc';
  minEPC?: number;
}

// Toggle offer status request
interface ToggleOfferStatusRequest {
  status: 'ACTIVE' | 'PAUSED';
}
```

### Metrics Types

```typescript
// Offer metrics
interface OfferMetrics {
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  conversionRate: number;
  epc: number;
  lastUpdated: Date;
}

// EPC metrics (from analytics)
interface EPCMetrics {
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  conversionRate: number;
  epc: number;
  lastUpdated: Date;
}
```

---

## Frontend Integration

### React Service Integration

```typescript
// Frontend offer service
import { api } from './api';

class OfferService {
  async createOffer(data: CreateOfferRequest): Promise<OfferWithMetrics> {
    const response = await api.post('/offers', data);
    return response.data;
  }

  async listOffers(params: ListOffersRequest): Promise<PaginatedOffersResponse> {
    const response = await api.get('/offers', { params });
    return response.data;
  }

  async getOffer(id: string): Promise<OfferWithMetrics> {
    const response = await api.get(`/offers/${id}`);
    return response.data;
  }

  async updateOffer(id: string, data: UpdateOfferRequest): Promise<OfferWithMetrics> {
    const response = await api.patch(`/offers/${id}`, data);
    return response.data;
  }

  async deleteOffer(id: string): Promise<{ deleted: boolean; id: string }> {
    const response = await api.delete(`/offers/${id}`);
    return response.data;
  }

  async toggleOfferStatus(id: string, data: ToggleOfferStatusRequest): Promise<{
    id: string;
    status: string;
    updatedAt: string;
  }> {
    const response = await api.patch(`/offers/${id}/toggle`, data);
    return response.data;
  }
}

export const offerService = new OfferService();
```

### React Query Integration

```typescript
// React Query hooks for offer management
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { offerService } from '../services/offer';

// Query keys
export const offerQueryKeys = {
  all: ['offers'] as const,
  lists: () => [...offerQueryKeys.all, 'list'] as const,
  list: (params: ListOffersRequest) => [...offerQueryKeys.lists(), params] as const,
  details: () => [...offerQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...offerQueryKeys.details(), id] as const,
};

// List offers hook
export function useOffers(params: ListOffersRequest) {
  return useQuery({
    queryKey: offerQueryKeys.list(params),
    queryFn: () => offerService.listOffers(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Get offer hook
export function useOffer(id: string) {
  return useQuery({
    queryKey: offerQueryKeys.detail(id),
    queryFn: () => offerService.getOffer(id),
    enabled: !!id,
  });
}

// Create offer mutation
export function useCreateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: offerService.createOffer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offerQueryKeys.lists() });
    },
  });
}

// Update offer mutation
export function useUpdateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOfferRequest }) =>
      offerService.updateOffer(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: offerQueryKeys.lists() });
      queryClient.setQueryData(offerQueryKeys.detail(data.id), data);
    },
  });
}

// Delete offer mutation
export function useDeleteOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: offerService.deleteOffer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offerQueryKeys.lists() });
    },
  });
}

// Toggle offer status mutation
export function useToggleOfferStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ToggleOfferStatusRequest }) =>
      offerService.toggleOfferStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offerQueryKeys.lists() });
    },
  });
}
```

### Component Usage Example

```typescript
// Offer management component
import React, { useState } from 'react';
import { useOffers, useCreateOffer, useUpdateOffer, useDeleteOffer, useToggleOfferStatus } from '../hooks/useOffers';

export function OfferManagement() {
  const [filters, setFilters] = useState<ListOffersRequest>({
    page: 1,
    limit: 20,
    sortBy: 'epc',
    sortOrder: 'desc'
  });

  const { data: offersData, isLoading, error } = useOffers(filters);
  const createOfferMutation = useCreateOffer();
  const updateOfferMutation = useUpdateOffer();
  const deleteOfferMutation = useDeleteOffer();
  const toggleStatusMutation = useToggleOfferStatus();

  const handleCreateOffer = async (data: CreateOfferRequest) => {
    try {
      await createOfferMutation.mutateAsync(data);
      // Handle success
    } catch (error) {
      // Handle error
    }
  };

  const handleToggleStatus = async (id: string, status: 'ACTIVE' | 'PAUSED') => {
    try {
      await toggleStatusMutation.mutateAsync({ id, data: { status } });
      // Handle success
    } catch (error) {
      // Handle error
    }
  };

  if (isLoading) return <div>Loading offers...</div>;
  if (error) return <div>Error loading offers: {error.message}</div>;

  return (
    <div>
      <h2>Offer Management</h2>
      
      {/* Filter controls */}
      <div className="filters">
        <select 
          value={filters.category || ''} 
          onChange={(e) => setFilters({...filters, category: e.target.value as OfferCategory})}
        >
          <option value="">All Categories</option>
          <option value="FINANCE">Finance</option>
          <option value="INSURANCE">Insurance</option>
          <option value="HEALTH">Health</option>
        </select>
        
        <select 
          value={filters.status || ''} 
          onChange={(e) => setFilters({...filters, status: e.target.value as OfferStatus})}
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
        </select>
      </div>

      {/* Offers table */}
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>Status</th>
            <th>EPC</th>
            <th>Clicks</th>
            <th>Conversions</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {offersData?.offers.map((offer) => (
            <tr key={offer.id}>
              <td>{offer.title}</td>
              <td>{offer.category}</td>
              <td>{offer.status}</td>
              <td>${offer.epcMetrics?.epc.toFixed(2) || '0.00'}</td>
              <td>{offer.metrics.totalClicks}</td>
              <td>{offer.metrics.totalConversions}</td>
              <td>
                <button 
                  onClick={() => handleToggleStatus(
                    offer.id, 
                    offer.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
                  )}
                >
                  {offer.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="pagination">
        <button 
          disabled={filters.page === 1}
          onClick={() => setFilters({...filters, page: filters.page! - 1})}
        >
          Previous
        </button>
        <span>Page {filters.page} of {offersData?.pagination.totalPages}</span>
        <button 
          disabled={!offersData?.pagination.hasMore}
          onClick={() => setFilters({...filters, page: filters.page! + 1})}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

---

## Testing

### Unit Tests

```typescript
// Offer service unit tests
import { OfferService } from '../../../backend/src/services/offerService';
import { prismaMock } from '../../__mocks__/prisma';

describe('OfferService', () => {
  let offerService: OfferService;

  beforeEach(() => {
    offerService = new OfferService();
    jest.clearAllMocks();
  });

  describe('createOffer', () => {
    it('should create offer with generated pixel URL', async () => {
      const mockOffer = {
        id: 'offer-123',
        title: 'Test Offer',
        category: 'FINANCE',
        destinationUrl: 'https://example.com'
      };

      prismaMock.offer.create.mockResolvedValue(mockOffer);

      const result = await offerService.createOffer({
        title: 'Test Offer',
        category: 'FINANCE',
        destinationUrl: 'https://example.com'
      });

      expect(result.pixelUrl).toBe('https://tracking.survai.app/pixel?click_id={click_id}&survey_id={survey_id}');
      expect(prismaMock.offer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Test Offer',
          category: 'FINANCE',
          destinationUrl: 'https://example.com'
        })
      });
    });

    it('should validate required fields', async () => {
      await expect(offerService.createOffer({
        title: '',
        category: 'FINANCE',
        destinationUrl: 'https://example.com'
      })).rejects.toThrow('Title is required');

      await expect(offerService.createOffer({
        title: 'Test',
        category: 'INVALID' as any,
        destinationUrl: 'https://example.com'
      })).rejects.toThrow('Invalid category');
    });
  });

  describe('listOffers', () => {
    it('should return paginated offers with EPC metrics', async () => {
      const mockOffers = [
        { id: 'offer-1', title: 'Offer 1', epc: 2.5 },
        { id: 'offer-2', title: 'Offer 2', epc: 3.1 }
      ];

      prismaMock.offer.findMany.mockResolvedValue(mockOffers);
      prismaMock.offer.count.mockResolvedValue(2);

      const result = await offerService.listOffers({
        page: 1,
        limit: 10
      });

      expect(result.offers).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
        hasMore: false
      });
    });

    it('should apply filters correctly', async () => {
      prismaMock.offer.findMany.mockResolvedValue([]);
      prismaMock.offer.count.mockResolvedValue(0);

      await offerService.listOffers({
        category: 'FINANCE',
        status: 'ACTIVE',
        search: 'test',
        minEPC: 2.0
      });

      expect(prismaMock.offer.findMany).toHaveBeenCalledWith({
        where: {
          category: 'FINANCE',
          status: 'ACTIVE',
          OR: [
            { title: { contains: 'test', mode: 'insensitive' } },
            { description: { contains: 'test', mode: 'insensitive' } }
          ]
        },
        include: expect.any(Object),
        orderBy: expect.any(Object),
        skip: 0,
        take: 20
      });
    });
  });

  describe('updateOffer', () => {
    it('should update offer and recalculate EPC', async () => {
      const mockOffer = { id: 'offer-123', title: 'Updated Offer' };
      
      prismaMock.offer.update.mockResolvedValue(mockOffer);

      const result = await offerService.updateOffer('offer-123', {
        title: 'Updated Offer'
      });

      expect(result.title).toBe('Updated Offer');
      expect(prismaMock.offer.update).toHaveBeenCalledWith({
        where: { id: 'offer-123' },
        data: { title: 'Updated Offer' }
      });
    });

    it('should handle non-existent offer', async () => {
      prismaMock.offer.update.mockRejectedValue(new Error('Not found'));

      await expect(offerService.updateOffer('non-existent', {
        title: 'Test'
      })).rejects.toThrow('Not found');
    });
  });

  describe('deleteOffer', () => {
    it('should delete offer successfully', async () => {
      prismaMock.offer.delete.mockResolvedValue({ id: 'offer-123' });

      const result = await offerService.deleteOffer('offer-123');

      expect(result).toEqual({ deleted: true, id: 'offer-123' });
      expect(prismaMock.offer.delete).toHaveBeenCalledWith({
        where: { id: 'offer-123' }
      });
    });

    it('should handle non-existent offer', async () => {
      prismaMock.offer.delete.mockRejectedValue(new Error('Not found'));

      await expect(offerService.deleteOffer('non-existent')).rejects.toThrow('Not found');
    });
  });

  describe('toggleOfferStatus', () => {
    it('should toggle offer status', async () => {
      const mockOffer = { id: 'offer-123', status: 'PAUSED' };
      
      prismaMock.offer.update.mockResolvedValue(mockOffer);

      const result = await offerService.toggleOfferStatus('offer-123', {
        status: 'PAUSED'
      });

      expect(result.status).toBe('PAUSED');
      expect(prismaMock.offer.update).toHaveBeenCalledWith({
        where: { id: 'offer-123' },
        data: { status: 'PAUSED' }
      });
    });

    it('should validate status values', async () => {
      await expect(offerService.toggleOfferStatus('offer-123', {
        status: 'INVALID' as any
      })).rejects.toThrow('Invalid status');
    });
  });
});
```

### Integration Tests

```typescript
// Offer API integration tests
import request from 'supertest';
import { app } from '../../../backend/src/app';
import { prisma } from '../../../backend/src/lib/prisma';

describe('Offer API Integration', () => {
  let authToken: string;
  let testOffer: any;

  beforeAll(async () => {
    // Setup admin user and get auth token
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: 'hashedpassword',
        role: 'ADMIN'
      }
    });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password'
      });

    authToken = loginResponse.headers['set-cookie'][0];
  });

  afterAll(async () => {
    await prisma.offer.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('POST /api/offers', () => {
    it('should create new offer', async () => {
      const offerData = {
        title: 'Test Financial Offer',
        category: 'FINANCE',
        destinationUrl: 'https://example.com/finance',
        config: {
          payout: 25.00,
          currency: 'USD'
        }
      };

      const response = await request(app)
        .post('/api/offers')
        .set('Cookie', authToken)
        .send(offerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Financial Offer');
      expect(response.body.data.pixelUrl).toContain('click_id={click_id}');
      expect(response.body.data.config.payout).toBe(25.00);

      testOffer = response.body.data;
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/offers')
        .set('Cookie', authToken)
        .send({
          title: '',
          category: 'FINANCE'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Title is required');
    });

    it('should require admin authentication', async () => {
      await request(app)
        .post('/api/offers')
        .send({
          title: 'Test',
          category: 'FINANCE',
          destinationUrl: 'https://example.com'
        })
        .expect(401);
    });
  });

  describe('GET /api/offers', () => {
    it('should list offers with pagination', async () => {
      const response = await request(app)
        .get('/api/offers?page=1&limit=10')
        .set('Cookie', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.offers).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: expect.any(Number),
        totalPages: expect.any(Number),
        hasMore: expect.any(Boolean)
      });
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/offers?category=FINANCE')
        .set('Cookie', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.offers.forEach((offer: any) => {
        expect(offer.category).toBe('FINANCE');
      });
    });

    it('should sort by EPC', async () => {
      const response = await request(app)
        .get('/api/offers?sortBy=epc&sortOrder=desc')
        .set('Cookie', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      const offers = response.body.data.offers;
      for (let i = 0; i < offers.length - 1; i++) {
        expect(offers[i].epcMetrics.epc).toBeGreaterThanOrEqual(offers[i + 1].epcMetrics.epc);
      }
    });
  });

  describe('GET /api/offers/:id', () => {
    it('should get offer by ID', async () => {
      const response = await request(app)
        .get(`/api/offers/${testOffer.id}`)
        .set('Cookie', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testOffer.id);
      expect(response.body.data.title).toBe(testOffer.title);
    });

    it('should return 404 for non-existent offer', async () => {
      const response = await request(app)
        .get('/api/offers/non-existent')
        .set('Cookie', authToken)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('PATCH /api/offers/:id', () => {
    it('should update offer', async () => {
      const updateData = {
        title: 'Updated Financial Offer',
        config: {
          payout: 30.00
        }
      };

      const response = await request(app)
        .patch(`/api/offers/${testOffer.id}`)
        .set('Cookie', authToken)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Financial Offer');
      expect(response.body.data.config.payout).toBe(30.00);
    });

    it('should validate update data', async () => {
      const response = await request(app)
        .patch(`/api/offers/${testOffer.id}`)
        .set('Cookie', authToken)
        .send({
          category: 'INVALID_CATEGORY'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid category');
    });
  });

  describe('PATCH /api/offers/:id/toggle', () => {
    it('should toggle offer status', async () => {
      const response = await request(app)
        .patch(`/api/offers/${testOffer.id}/toggle`)
        .set('Cookie', authToken)
        .send({ status: 'PAUSED' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('PAUSED');
    });

    it('should validate status values', async () => {
      const response = await request(app)
        .patch(`/api/offers/${testOffer.id}/toggle`)
        .set('Cookie', authToken)
        .send({ status: 'INVALID' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid status');
    });
  });

  describe('DELETE /api/offers/:id', () => {
    it('should delete offer', async () => {
      const response = await request(app)
        .delete(`/api/offers/${testOffer.id}`)
        .set('Cookie', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deleted).toBe(true);
      expect(response.body.data.id).toBe(testOffer.id);

      // Verify offer was deleted
      await request(app)
        .get(`/api/offers/${testOffer.id}`)
        .set('Cookie', authToken)
        .expect(404);
    });

    it('should return 404 for non-existent offer', async () => {
      const response = await request(app)
        .delete('/api/offers/non-existent')
        .set('Cookie', authToken)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });
});
```

---

## Performance

### Database Optimization

```typescript
// Optimized Prisma queries
class OptimizedOfferService {
  async listOffers(params: ListOffersRequest): Promise<PaginatedOffersResponse> {
    const where = this.buildWhereClause(params);
    const orderBy = this.buildOrderByClause(params);
    
    // Use parallel queries for better performance
    const [offers, total] = await Promise.all([
      prisma.offer.findMany({
        where,
        include: {
          // Only include necessary relations
          _count: {
            select: {
              clickTracks: true,
              conversions: true
            }
          }
        },
        orderBy,
        skip: ((params.page || 1) - 1) * (params.limit || 20),
        take: params.limit || 20
      }),
      prisma.offer.count({ where })
    ]);

    return {
      offers: offers.map(offer => ({
        ...offer,
        epcMetrics: this.calculateEPCMetrics(offer)
      })),
      pagination: {
        page: params.page || 1,
        limit: params.limit || 20,
        total,
        totalPages: Math.ceil(total / (params.limit || 20)),
        hasMore: total > (params.page || 1) * (params.limit || 20)
      }
    };
  }

  private buildWhereClause(params: ListOffersRequest): any {
    const where: any = {};

    if (params.category) {
      where.category = params.category;
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } }
      ];
    }

    return where;
  }

  private buildOrderByClause(params: ListOffersRequest): any {
    const sortBy = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder || 'desc';

    if (sortBy === 'epc') {
      // Sort by EPC requires complex query
      return [
        { metrics: { path: ['epc'], sort: sortOrder } },
        { createdAt: 'desc' } // Fallback sort
      ];
    }

    return { [sortBy]: sortOrder };
  }
}
```

### Caching Strategy

```typescript
// Redis caching for offer data
import Redis from 'ioredis';

class CachedOfferService extends OfferService {
  private redis = new Redis(process.env.REDIS_URL);
  private cachePrefix = 'offer:';
  private cacheTTL = 300; // 5 minutes

  async getOffer(id: string): Promise<OfferWithMetrics> {
    const cacheKey = `${this.cachePrefix}${id}`;
    
    // Try cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch from database
    const offer = await super.getOffer(id);
    
    // Cache result
    await this.redis.setex(cacheKey, this.cacheTTL, JSON.stringify(offer));
    
    return offer;
  }

  async updateOffer(id: string, data: UpdateOfferRequest): Promise<OfferWithMetrics> {
    const updatedOffer = await super.updateOffer(id, data);
    
    // Invalidate cache
    await this.redis.del(`${this.cachePrefix}${id}`);
    
    return updatedOffer;
  }

  async deleteOffer(id: string): Promise<{ deleted: boolean; id: string }> {
    const result = await super.deleteOffer(id);
    
    // Invalidate cache
    await this.redis.del(`${this.cachePrefix}${id}`);
    
    return result;
  }
}
```

### Rate Limiting

```typescript
// Rate limiting for offer endpoints
import rateLimit from 'express-rate-limit';

const offerRateLimits = {
  list: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: 'Too many requests, please try again later'
  }),
  
  create: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 creates per minute
    message: 'Too many offer creation attempts'
  }),
  
  update: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 50, // 50 updates per minute
    message: 'Too many update attempts'
  }),
  
  delete: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 deletes per minute
    message: 'Too many delete attempts'
  })
};

// Apply rate limits to routes
app.get('/api/offers', offerRateLimits.list, offerController.listOffers);
app.post('/api/offers', offerRateLimits.create, offerController.createOffer);
app.patch('/api/offers/:id', offerRateLimits.update, offerController.updateOffer);
app.delete('/api/offers/:id', offerRateLimits.delete, offerController.deleteOffer);
```

### Monitoring

```typescript
// Performance monitoring for offer operations
import { performance } from 'perf_hooks';

class MonitoredOfferService extends OfferService {
  private logPerformance(operation: string, startTime: number, success: boolean, error?: string) {
    const duration = performance.now() - startTime;
    
    console.log(`Offer ${operation}:`, {
      duration: `${duration.toFixed(2)}ms`,
      success,
      error,
      timestamp: new Date().toISOString()
    });

    // Send to monitoring service
    if (duration > 1000) {
      console.warn(`Slow offer ${operation}: ${duration.toFixed(2)}ms`);
    }
  }

  async createOffer(data: CreateOfferRequest): Promise<OfferWithMetrics> {
    const startTime = performance.now();
    
    try {
      const result = await super.createOffer(data);
      this.logPerformance('create', startTime, true);
      return result;
    } catch (error) {
      this.logPerformance('create', startTime, false, error.message);
      throw error;
    }
  }

  async listOffers(params: ListOffersRequest): Promise<PaginatedOffersResponse> {
    const startTime = performance.now();
    
    try {
      const result = await super.listOffers(params);
      this.logPerformance('list', startTime, true);
      return result;
    } catch (error) {
      this.logPerformance('list', startTime, false, error.message);
      throw error;
    }
  }
}
```

---

## Best Practices

### Error Handling

- Always wrap database operations in try-catch blocks
- Provide meaningful error messages for debugging
- Use appropriate HTTP status codes
- Log errors for monitoring and debugging

### Validation

- Validate all input data using Joi schemas
- Use TypeScript interfaces for type safety
- Implement server-side validation for security
- Provide clear validation error messages

### Performance

- Use database indexes for frequently queried fields
- Implement caching for frequently accessed data
- Use pagination for large datasets
- Monitor query performance and optimize as needed

### Security

- Require admin authentication for all operations
- Validate and sanitize all input data
- Use parameterized queries to prevent SQL injection
- Implement rate limiting to prevent abuse

### Testing

- Write comprehensive unit tests for all service methods
- Create integration tests for API endpoints
- Test error scenarios and edge cases
- Use realistic test data and scenarios

---

This comprehensive API reference provides developers with all the information needed to effectively use the Offer Management API within the SurvAI platform, including complete examples, error handling, and performance optimization strategies.