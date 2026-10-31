/**
 * Temel HTTP İstemcisi Sarmalayıcısı
 * İlerleyen aşamalarda gerçek REST API veya WebSocket bağlantılarını yönetecek şekilde tasarlanmıştır.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    if (!response.ok) {
      throw new Error(`API Hatası: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.warn(`[API Client Warning] Mock fallback devrede: ${endpoint}`);
    throw error;
  }
}

