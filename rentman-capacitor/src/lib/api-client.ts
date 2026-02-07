/**
 * API Client Helper for Capacitor
 * Handles fetch requests with proper URL resolution for both web and native apps
 */

import { Capacitor } from '@capacitor/core';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://rentman-api-mqadwgncoa-uc.a.run.app';

/**
 * Resolves API URL - uses absolute URL for Capacitor native apps
 */
function getApiUrl(path: string): string {
  // In native Capacitor apps, use absolute URL
  if (Capacitor.isNativePlatform()) {
    return `${API_BASE_URL}${path}`;
  }
  // In web/browser, use relative URL (Next.js will proxy)
  return path;
}

/**
 * Enhanced fetch with error handling and retry logic
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = getApiUrl(path);
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    // If fetch fails on native, log for debugging
    if (!response.ok && Capacitor.isNativePlatform()) {
      console.error('[API_ERROR]', {
        url,
        status: response.status,
        statusText: response.statusText,
      });
    }
    
    return response;
  } catch (error) {
    console.error('[FETCH_ERROR]', { url, error });
    throw error;
  }
}

/**
 * GET request helper
 */
export async function apiGet(path: string, headers: Record<string, string> = {}) {
  return apiFetch(path, { method: 'GET', headers });
}

/**
 * POST request helper
 */
export async function apiPost(path: string, body: any, headers: Record<string, string> = {}) {
  return apiFetch(path, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

/**
 * DELETE request helper
 */
export async function apiDelete(path: string, headers: Record<string, string> = {}) {
  return apiFetch(path, { method: 'DELETE', headers });
}
