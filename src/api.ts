import { FormItem, FormField, FormResponsesData, User } from './types.js';

class ApiError extends Error {
  constructor(public message: string, public status: number = 500) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Also include token from localStorage if present as backup to cookie
  const storedToken = localStorage.getItem('formapulse_token');
  if (storedToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${storedToken}`);
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include', // send httpOnly cookies
  });

  const contentType = res.headers.get('content-type');
  let data: any = null;

  if (contentType && contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const errorMsg = data?.error || data?.message || (typeof data === 'string' ? data : 'Error en la petición');
    throw new ApiError(errorMsg, res.status);
  }

  return data as T;
}

export const api = {
  // Auth
  auth: {
    me: async () => request<{ user: User }>('/api/auth/me'),
    login: async (credentials: { email: string; password: string }) => {
      const data = await request<{ user: User; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      if (data.token) {
        localStorage.setItem('formapulse_token', data.token);
      }
      return data;
    },
    register: async (payload: { name: string; email: string; password: string }) => {
      const data = await request<{ user: User; token: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (data.token) {
        localStorage.setItem('formapulse_token', data.token);
      }
      return data;
    },
    logout: async () => {
      localStorage.removeItem('formapulse_token');
      return request<{ message: string }>('/api/auth/logout', { method: 'POST' });
    },
  },

  // Forms
  forms: {
    list: async () => request<{ forms: FormItem[] }>('/api/forms'),
    get: async (id: string) => request<{ form: FormItem & { fields: FormField[] } }>(`/api/forms/${id}`),
    create: async (data: { title: string; description?: string; fields: Partial<FormField>[] }) =>
      request<{ message: string; formId: string; slug: string }>('/api/forms', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: async (id: string, data: { title: string; description?: string; is_active?: boolean; fields: Partial<FormField>[] }) =>
      request<{ message: string }>(`/api/forms/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    toggleStatus: async (id: string, is_active?: boolean) =>
      request<{ message: string; is_active: boolean }>(`/api/forms/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active }),
      }),
    delete: async (id: string) =>
      request<{ message: string }>(`/api/forms/${id}`, { method: 'DELETE' }),
  },

  // Responses
  responses: {
    list: async (formId: string, filters?: { search?: string; from?: string; to?: string }) => {
      const params = new URLSearchParams();
      if (filters?.search) params.set('search', filters.search);
      if (filters?.from) params.set('from', filters.from);
      if (filters?.to) params.set('to', filters.to);

      const qs = params.toString();
      return request<FormResponsesData>(`/api/forms/${formId}/responses${qs ? `?${qs}` : ''}`);
    },
    delete: async (formId: string, responseId: string) =>
      request<{ message: string }>(`/api/forms/${formId}/responses/${responseId}`, {
        method: 'DELETE',
      }),
    getExportUrl: (formId: string) => `/api/forms/${formId}/responses/export`,
  },

  // Public form
  public: {
    getBySlug: async (slug: string) =>
      request<{ form: FormItem & { fields: FormField[] } }>(`/api/public/forms/${slug}`),
    submit: async (slug: string, answers: Record<string, any>) =>
      request<{ success: boolean; message: string }>(`/api/public/forms/${slug}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers }),
      }),
  },
};
