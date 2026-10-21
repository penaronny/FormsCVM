import { FormItem, FormField, FormResponsesData, User } from './types.js';
import { localStore } from './localStore.js';

class ApiError extends Error {
  constructor(public message: string, public status: number = 500) {
    super(message);
    this.name = 'ApiError';
  }
}

let serverAvailable: boolean | null = null;

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const storedToken = localStorage.getItem('formapulse_token');
  if (storedToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${storedToken}`);
  }

  // Adjust endpoint for subpath hosting (e.g. /forms/api/...)
  let cleanBase = '';
  if (typeof window !== 'undefined') {
    let pathname = window.location.pathname.replace(/\/f\/.*$/, '').replace(/\/$/, '');
    cleanBase = pathname;
  }
  const fullEndpoint = `${cleanBase}${endpoint}`;

  const res = await fetch(fullEndpoint, {
    ...options,
    headers,
    credentials: 'include',
  });

  const contentType = res.headers.get('content-type') || '';

  // If server returns HTML (like a 404 page from WordPress / LiteSpeed), it's not a JSON API
  if (!contentType.includes('application/json')) {
    throw new ApiError(`Servidor no disponible o ruta no encontrada (${res.status})`, res.status);
  }

  const data = await res.json();

  if (!res.ok) {
    const errorMsg = data?.error || data?.message || 'Error en la petición';
    throw new ApiError(errorMsg, res.status);
  }

  return data as T;
}

export const api = {
  // Auth
  auth: {
    me: async () => {
      try {
        return await request<{ user: User }>('/api/auth/me');
      } catch (err: any) {
        return await localStore.auth.me();
      }
    },
    login: async (credentials: { email: string; password: string }) => {
      try {
        const data = await request<{ user: User; token: string }>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify(credentials),
        });
        if (data.token) localStorage.setItem('formapulse_token', data.token);
        return data;
      } catch (err: any) {
        return await localStore.auth.login(credentials);
      }
    },
    register: async (payload: { name: string; email: string; password: string }) => {
      try {
        const data = await request<{ user: User; token: string }>('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (data.token) localStorage.setItem('formapulse_token', data.token);
        return data;
      } catch (err: any) {
        return await localStore.auth.register(payload);
      }
    },
    logout: async () => {
      try {
        localStorage.removeItem('formapulse_token');
        return await request<{ message: string }>('/api/auth/logout', { method: 'POST' });
      } catch {
        return await localStore.auth.logout();
      }
    },
  },

  // Forms
  forms: {
    list: async () => {
      try {
        return await request<{ forms: FormItem[] }>('/api/forms');
      } catch {
        return await localStore.forms.list();
      }
    },
    get: async (id: string) => {
      try {
        return await request<{ form: FormItem & { fields: FormField[] } }>(`/api/forms/${id}`);
      } catch {
        return await localStore.forms.get(id);
      }
    },
    create: async (data: { title: string; description?: string; fields: Partial<FormField>[] }) => {
      try {
        return await request<{ message: string; formId: string; slug: string }>('/api/forms', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      } catch {
        return await localStore.forms.create(data);
      }
    },
    update: async (id: string, data: { title: string; description?: string; is_active?: boolean; fields: Partial<FormField>[] }) => {
      try {
        return await request<{ message: string }>(`/api/forms/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      } catch {
        return await localStore.forms.update(id, data);
      }
    },
    toggleStatus: async (id: string, is_active?: boolean) => {
      try {
        return await request<{ message: string; is_active: boolean }>(`/api/forms/${id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ is_active }),
        });
      } catch {
        return await localStore.forms.toggleStatus(id, is_active);
      }
    },
    delete: async (id: string) => {
      try {
        return await request<{ message: string }>(`/api/forms/${id}`, { method: 'DELETE' });
      } catch {
        return await localStore.forms.delete(id);
      }
    },
  },

  // Responses
  responses: {
    list: async (formId: string, filters?: { search?: string; from?: string; to?: string }) => {
      try {
        const params = new URLSearchParams();
        if (filters?.search) params.set('search', filters.search);
        if (filters?.from) params.set('from', filters.from);
        if (filters?.to) params.set('to', filters.to);

        const qs = params.toString();
        return await request<FormResponsesData>(`/api/forms/${formId}/responses${qs ? `?${qs}` : ''}`);
      } catch {
        return await localStore.responses.list(formId, filters);
      }
    },
    delete: async (formId: string, responseId: string) => {
      try {
        return await request<{ message: string }>(`/api/forms/${formId}/responses/${responseId}`, {
          method: 'DELETE',
        });
      } catch {
        return await localStore.responses.delete(formId, responseId);
      }
    },
    getExportUrl: (formId: string) => {
      let cleanBase = '';
      if (typeof window !== 'undefined') {
        cleanBase = window.location.pathname.replace(/\/f\/.*$/, '').replace(/\/$/, '');
      }
      return `${cleanBase}/api/forms/${formId}/responses/export`;
    },
  },

  // Public form
  public: {
    getBySlug: async (slug: string) => {
      try {
        return await request<{ form: FormItem & { fields: FormField[] } }>(`/api/public/forms/${slug}`);
      } catch {
        return await localStore.public.getBySlug(slug);
      }
    },
    submit: async (slug: string, answers: Record<string, any>) => {
      try {
        return await request<{ success: boolean; message: string }>(`/api/public/forms/${slug}/submit`, {
          method: 'POST',
          body: JSON.stringify({ answers }),
        });
      } catch {
        return await localStore.public.submit(slug, answers);
      }
    },
  },
};
