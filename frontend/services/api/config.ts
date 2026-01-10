/**
 * API configuration and utilities
 */

import { v4 as uuidv4 } from 'uuid';

// Base URL for API calls
export const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// Cek dan tambahkan suffix /api jika belum ada
export const getApiUrl = (path: string): string => {
  let baseUrl = API_BASE_URL;
  
  // Jika tidak diakhiri dengan /api, tambahkan
  if (!baseUrl.endsWith('/api')) {
    baseUrl = baseUrl + '/api';
  }
  
  // Jika path sudah dimulai dengan /, hilangkan slash di depan
  if (path.startsWith('/')) {
    path = path.substring(1);
  }
  
  return `${baseUrl}/${path}`;
};

// Helper for API errors
export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Generate or retrieve a stable pseudo-user ID stored in localStorage
const USER_ID_KEY = 'statify_user_id';
export const getUserId = (): string => {
  // During SSR localStorage is undefined – fallback to empty string
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
};

// Helper function to handle API responses
export async function handleApiResponse(response: Response) {
  if (response.status === 429) {
    throw new ApiError('Terlalu banyak permintaan, silakan coba lagi nanti', 429);
  }
  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(
      errorText || `Error: ${response.status} ${response.statusText}`, 
      response.status
    );
  }
  
  // Only try to parse JSON if content exists and is JSON
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json') && response.status !== 204) {
    return response.json();
  }
  
  return response;
} 