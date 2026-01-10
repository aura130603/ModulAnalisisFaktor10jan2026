import { handleApiResponse, getApiUrl, getUserId as _getUserId } from './config';
import type { SavUploadResponse } from '@/types/SavUploadResponse';

interface SaveVariableDTO {
  name: string;
  label?: string;
  type: string;
  width?: number;
  decimal?: number;
  alignment?: string;
  measure?: string;
  columns?: number;
  valueLabels?: {
    value: string | number;
    label: string;
  }[];
}

interface SaveSavFileDTO {
  data: Record<string, any>[];
  variables: SaveVariableDTO[];
}

// getUserId may be undefined in test mocks – provide a safe accessor
const safeGetUserId = (): string | undefined => {
  // If the imported symbol is a function, call it; otherwise return undefined
  return typeof _getUserId === 'function' ? _getUserId() : undefined;
};

/**
 * Upload an SAV file to the backend
 * Accepts either a File object or FormData with a file field
 */
export async function uploadSavFile(fileOrFormData: File | FormData): Promise<SavUploadResponse> {
  let formData: FormData;
  
  if (fileOrFormData instanceof FormData) {
    formData = fileOrFormData;
  } else {
    formData = new FormData();
    formData.append('file', fileOrFormData);
  }

  // Client-side validation: file must be .sav and <= 10 MB
  if (fileOrFormData instanceof File) {
    if (!fileOrFormData.name.toLowerCase().endsWith('.sav') || fileOrFormData.size > 10 * 1024 * 1024) {
      throw new Error('Berkas harus berformat .sav dan maksimal 10 MB');
    }
  }

  const headers: Record<string, string> = {};
  const userId = safeGetUserId();
  if (userId) headers['X-User-Id'] = userId;

  const response = await fetch(getApiUrl('sav/upload'), {
    method: 'POST',
    headers,
    body: formData,
  });

  const parsed = await handleApiResponse(response);
  return parsed as SavUploadResponse;
}

/**
 * Create and download an SAV file from data
 */
export async function createSavFile(data: SaveSavFileDTO): Promise<Blob> {
  const userId2 = safeGetUserId();
  const headersCreate: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (userId2) headersCreate['X-User-Id'] = userId2;

  const response = await fetch(getApiUrl('sav/create'), {
    method: 'POST',
    headers: headersCreate,
    body: JSON.stringify(data),
  });

  // For blob responses, we need to handle differently
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Error: ${response.status} ${response.statusText}`);
  }
  
  return response.blob();
}

/**
 * Helper to download a file from a blob
 */
export function downloadBlobAsFile(blob: Blob, filename: string = 'data.sav') {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
} 