/**
 * @fileoverview API client configuration
 * 
 * Centralized API client setup with axios for making
 * HTTP requests to the SurvAI MVP backend.
 */

import axios, { type AxiosInstance, type AxiosResponse, type AxiosError } from 'axios'
import type { ApiResponse } from '@survai/shared'

/**
 * API configuration
 */
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 10000, // 10 seconds
  withCredentials: true, // Required for HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
}

/**
 * Create axios instance with default configuration
 */
export const apiClient: AxiosInstance = axios.create(API_CONFIG)

/**
 * Request interceptor for logging and metadata
 */
apiClient.interceptors.request.use(
  (config) => {
    // Add request timestamp
    config.metadata = { startTime: new Date() }
    return config
  },
  (error) => {
    console.error('[API] Request error:', error)
    return Promise.reject(error)
  }
)

/**
 * Response interceptor for handling common responses
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Calculate response time for potential monitoring
    const duration = new Date().getTime() - (response.config.metadata?.startTime?.getTime() || 0)
    return response
  },
  (error: AxiosError) => {
    // Log error
    const duration = new Date().getTime() - (error.config?.metadata?.startTime?.getTime() || 0)
    console.error(`[API] ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status || 'ERROR'} (${duration}ms)`, error.message)

    // Handle common error responses
    if (error.response && error.response.status === 401) {
      // Unauthorized - redirect to login (cookie will be cleared by server)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    } else if (error.response && error.response.status === 403) {
      // Forbidden - show access denied message
      console.warn('Access denied - insufficient permissions')
    } else if (error.response && error.response.status >= 500) {
      // Server error - show generic error message
      console.error('Server error - please try again later')
    }

    return Promise.reject(error)
  }
)

/**
 * API helper functions
 */
export const api = {
  /**
   * GET request
   */
  get: <T = unknown>(url: string, params?: Record<string, any>): Promise<AxiosResponse<T>> => apiClient.get(url, { params }),

  /**
   * POST request
   */
  post: <T = unknown>(url: string, data?: any): Promise<AxiosResponse<T>> => apiClient.post(url, data),

  /**
   * PUT request
   */
  put: <T = unknown>(url: string, data?: any): Promise<AxiosResponse<T>> => apiClient.put(url, data),

  /**
   * PATCH request
   */
  patch: <T = unknown>(url: string, data?: any): Promise<AxiosResponse<T>> => apiClient.patch(url, data),

  /**
   * DELETE request
   */
  delete: <T = unknown>(url: string): Promise<AxiosResponse<T>> => apiClient.delete(url),

  /**
   * Upload file
   */
  upload: <T = unknown>(url: string, file: File, onProgress?: (progress: number) => void): Promise<AxiosResponse<T>> => {
    const formData = new FormData()
    formData.append('file', file)

    return apiClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    })
  },
}

/**
 * Health check function
 */
export const checkHealth = async (): Promise<ApiResponse<any>> => {
  try {
    const response = await api.get<ApiResponse<any>>('/health')
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data
    }
    throw error
  }
}

/**
 * Type-safe API wrapper for common operations
 */
export const typedApi = {
  /**
   * Health check with typed response
   */
  health: () => api.get<ApiResponse<any>>('/health'),

  /**
   * Authentication endpoints
   */
  auth: {
    login: (credentials: { email: string; password: string }) => 
      api.post<ApiResponse<any>>('/api/auth/login', credentials),
    register: (userData: { email: string; password: string; name?: string; role?: string }) => 
      api.post<ApiResponse<any>>('/api/auth/register', userData),
    logout: () => api.post<ApiResponse<any>>('/api/auth/logout'),
    me: () => api.get<ApiResponse<any>>('/api/auth/me'),
  },

  // TODO: Add more typed API endpoints as they're implemented
  // users: {
  //   list: () => api.get<ApiResponse<User[]>>('/api/users'),
  //   get: (id: string) => api.get<ApiResponse<User>>(`/api/users/${id}`),
  //   create: (data: CreateUserRequest) => api.post<ApiResponse<User>>('/api/users', data),
  //   update: (id: string, data: UpdateUserRequest) => api.patch<ApiResponse<User>>(`/api/users/${id}`, data),
  //   delete: (id: string) => api.delete<ApiResponse<void>>(`/api/users/${id}`),
  // },
}

export default api

// Extend axios config type to include metadata
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      startTime: Date
    }
  }
}