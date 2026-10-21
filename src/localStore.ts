import { User, FormItem, FormField, FormResponsesData, ResponseItem } from './types.js';

const STORAGE_KEY_USER = 'formapulse_local_user';
const STORAGE_KEY_FORMS = 'formapulse_local_forms';
const STORAGE_KEY_RESPONSES = 'formapulse_local_responses';

interface StoredResponse {
  id: string;
  form_id: string;
  submitted_at: string;
  answers: Record<string, string>;
}

// Initial demo forms seed
const INITIAL_DEMO_FORMS: (FormItem & { fields: FormField[] })[] = [
  {
    id: 'demo-form-1',
    user_id: 'user-demo-1',
    title: 'Solicitud de Equipamiento y Accesos IT',
    description: 'Formulario interno para solicitar computadoras, periféricos y permisos a los sistemas corporativos.',
    slug: 'req-ade441ae82a0',
    is_active: true,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    field_count: 5,
    response_count: 2,
    fields: [
      {
        id: 'f-1',
        label: 'Nombre completo del colaborador',
        type: 'text',
        is_required: true,
        options: [],
        position: 0,
      },
      {
        id: 'f-2',
        label: 'Correo corporativo',
        type: 'email',
        is_required: true,
        options: [],
        position: 1,
      },
      {
        id: 'f-3',
        label: 'Departamento',
        type: 'select',
        is_required: true,
        options: ['Operaciones', 'Recursos Humanos', 'Finanzas', 'Tecnología', 'Logística', 'Comercial'],
        position: 2,
      },
      {
        id: 'f-4',
        label: 'Fecha de requerimiento',
        type: 'date',
        is_required: true,
        options: [],
        position: 3,
      },
      {
        id: 'f-5',
        label: 'Detalle de equipos o accesos necesarios',
        type: 'textarea',
        is_required: true,
        options: [],
        position: 4,
      },
    ],
  },
  {
    id: 'demo-form-2',
    user_id: 'user-demo-1',
    title: 'Encuesta Trimestral de Clima y Bienestar',
    description: 'Espacio confidencial para recolectar opiniones sobre el ambiente de trabajo y sugerencias.',
    slug: 'enc-b9c104e76a12',
    is_active: true,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    field_count: 3,
    response_count: 1,
    fields: [
      {
        id: 'f-6',
        label: 'Nivel de satisfacción general con tu equipo',
        type: 'select',
        is_required: true,
        options: ['1 - Muy insatisfecho', '2 - Insatisfecho', '3 - Neutral', '4 - Satisfecho', '5 - Muy satisfecho'],
        position: 0,
      },
      {
        id: 'f-7',
        label: 'Horas promedio semanales dedicadas a reuniones',
        type: 'number',
        is_required: false,
        options: [],
        position: 1,
      },
      {
        id: 'f-8',
        label: '¿Qué iniciativa o cambio mejoraría tu día a día laboral?',
        type: 'textarea',
        is_required: false,
        options: [],
        position: 2,
      },
    ],
  },
];

const INITIAL_RESPONSES: StoredResponse[] = [
  {
    id: 'resp-1',
    form_id: 'demo-form-1',
    submitted_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    answers: {
      'f-1': 'Carlos Mendoza',
      'f-2': 'cmendoza@empresa.com',
      'f-3': 'Tecnología',
      'f-4': '2026-11-01',
      'f-5': 'Laptop Dell Latitude 16GB RAM + Monitor 27" y acceso a repositorio Git.',
    },
  },
  {
    id: 'resp-2',
    form_id: 'demo-form-1',
    submitted_at: new Date(Date.now() - 86400000).toISOString(),
    answers: {
      'f-1': 'Lucía Valenzuela',
      'f-2': 'lvalenzuela@empresa.com',
      'f-3': 'Recursos Humanos',
      'f-4': '2026-10-25',
      'f-5': 'Ratón ergonómico, teclado inalámbrico y licencia ERP RRHH.',
    },
  },
  {
    id: 'resp-3',
    form_id: 'demo-form-2',
    submitted_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    answers: {
      'f-6': '4 - Satisfecho',
      'f-7': '8',
      'f-8': 'Reducir las reuniones sin agenda previa para aumentar foco en desarrollo.',
    },
  },
];

function getStoredForms(): (FormItem & { fields: FormField[] })[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FORMS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_FORMS, JSON.stringify(INITIAL_DEMO_FORMS));
      return INITIAL_DEMO_FORMS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_FORMS;
  }
}

function saveStoredForms(forms: (FormItem & { fields: FormField[] })[]) {
  localStorage.setItem(STORAGE_KEY_FORMS, JSON.stringify(forms));
}

function getStoredResponses(): StoredResponse[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RESPONSES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_RESPONSES, JSON.stringify(INITIAL_RESPONSES));
      return INITIAL_RESPONSES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_RESPONSES;
  }
}

function saveStoredResponses(responses: StoredResponse[]) {
  localStorage.setItem(STORAGE_KEY_RESPONSES, JSON.stringify(responses));
}

export const localStore = {
  auth: {
    me: async (): Promise<{ user: User }> => {
      const raw = localStorage.getItem(STORAGE_KEY_USER);
      if (!raw) {
        throw new Error('No hay sesión iniciada');
      }
      return { user: JSON.parse(raw) };
    },
    login: async ({ email, password }: { email: string; password: string }): Promise<{ user: User; token: string }> => {
      if (!email || !password) throw new Error('Correo y contraseña requeridos');
      const user: User = {
        id: 'user-' + Math.random().toString(36).substring(2, 8),
        name: email.split('@')[0].replace(/\./g, ' ').toUpperCase(),
        email: email.trim().toLowerCase(),
      };
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      return { user, token: 'local-token-' + Date.now() };
    },
    register: async ({ name, email }: { name: string; email: string; password: string }): Promise<{ user: User; token: string }> => {
      const user: User = {
        id: 'user-' + Math.random().toString(36).substring(2, 8),
        name: name.trim(),
        email: email.trim().toLowerCase(),
      };
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      return { user, token: 'local-token-' + Date.now() };
    },
    logout: async () => {
      localStorage.removeItem(STORAGE_KEY_USER);
      return { message: 'Sesión cerrada' };
    },
  },

  forms: {
    list: async (): Promise<{ forms: FormItem[] }> => {
      const forms = getStoredForms();
      const responses = getStoredResponses();

      const list: FormItem[] = forms.map((f) => ({
        id: f.id,
        user_id: f.user_id,
        title: f.title,
        description: f.description,
        slug: f.slug,
        is_active: f.is_active,
        created_at: f.created_at,
        updated_at: f.updated_at,
        field_count: f.fields.length,
        response_count: responses.filter((r) => r.form_id === f.id).length,
      }));

      return { forms: list };
    },

    get: async (id: string): Promise<{ form: FormItem & { fields: FormField[] } }> => {
      const forms = getStoredForms();
      const form = forms.find((f) => f.id === id);
      if (!form) throw new Error('Formulario no encontrado');
      return { form };
    },

    create: async (data: { title: string; description?: string; fields: Partial<FormField>[] }): Promise<{ message: string; formId: string; slug: string }> => {
      const forms = getStoredForms();
      const formId = 'form-' + Math.random().toString(36).substring(2, 9);
      const slug = 'f-' + Math.random().toString(36).substring(2, 10);
      const now = new Date().toISOString();

      const newFields: FormField[] = (data.fields || []).map((f, i) => ({
        id: f.id || 'fld-' + Math.random().toString(36).substring(2, 9),
        form_id: formId,
        label: f.label || `Campo ${i + 1}`,
        type: f.type || 'text',
        is_required: Boolean(f.is_required),
        options: Array.isArray(f.options) ? f.options : [],
        position: i,
      }));

      const newForm: FormItem & { fields: FormField[] } = {
        id: formId,
        user_id: 'user-current',
        title: data.title,
        description: data.description || '',
        slug,
        is_active: true,
        created_at: now,
        updated_at: now,
        field_count: newFields.length,
        response_count: 0,
        fields: newFields,
      };

      forms.unshift(newForm);
      saveStoredForms(forms);

      return { message: 'Formulario creado', formId, slug };
    },

    update: async (id: string, data: { title: string; description?: string; is_active?: boolean; fields: Partial<FormField>[] }): Promise<{ message: string }> => {
      const forms = getStoredForms();
      const index = forms.findIndex((f) => f.id === id);
      if (index === -1) throw new Error('Formulario no encontrado');

      const existing = forms[index];
      const updatedFields: FormField[] = (data.fields || []).map((f, i) => ({
        id: f.id || 'fld-' + Math.random().toString(36).substring(2, 9),
        form_id: id,
        label: f.label || `Campo ${i + 1}`,
        type: f.type || 'text',
        is_required: Boolean(f.is_required),
        options: Array.isArray(f.options) ? f.options : [],
        position: i,
      }));

      forms[index] = {
        ...existing,
        title: data.title,
        description: data.description !== undefined ? data.description : existing.description,
        is_active: data.is_active !== undefined ? data.is_active : existing.is_active,
        updated_at: new Date().toISOString(),
        field_count: updatedFields.length,
        fields: updatedFields,
      };

      saveStoredForms(forms);
      return { message: 'Formulario actualizado' };
    },

    toggleStatus: async (id: string, is_active?: boolean): Promise<{ message: string; is_active: boolean }> => {
      const forms = getStoredForms();
      const index = forms.findIndex((f) => f.id === id);
      if (index === -1) throw new Error('Formulario no encontrado');

      const nextActive = is_active !== undefined ? is_active : !forms[index].is_active;
      forms[index].is_active = nextActive;
      saveStoredForms(forms);
      return { message: 'Estado actualizado', is_active: nextActive };
    },

    delete: async (id: string): Promise<{ message: string }> => {
      const forms = getStoredForms().filter((f) => f.id !== id);
      saveStoredForms(forms);
      const responses = getStoredResponses().filter((r) => r.form_id !== id);
      saveStoredResponses(responses);
      return { message: 'Formulario eliminado' };
    },
  },

  responses: {
    list: async (formId: string, filters?: { search?: string; from?: string; to?: string }): Promise<FormResponsesData> => {
      const forms = getStoredForms();
      const form = forms.find((f) => f.id === formId);
      if (!form) throw new Error('Formulario no encontrado');

      let list = getStoredResponses().filter((r) => r.form_id === formId);

      if (filters?.from) {
        list = list.filter((r) => r.submitted_at >= filters.from!);
      }
      if (filters?.to) {
        list = list.filter((r) => r.submitted_at <= filters.to! + 'T23:59:59');
      }
      if (filters?.search) {
        const term = filters.search.toLowerCase();
        list = list.filter((r) => {
          for (const key in r.answers) {
            if (String(r.answers[key] || '').toLowerCase().includes(term)) return true;
          }
          return false;
        });
      }

      const responseItems: ResponseItem[] = list.map((r) => ({
        id: r.id,
        submitted_at: r.submitted_at,
        answers: r.answers,
      }));

      return {
        form: {
          id: form.id,
          title: form.title,
          description: form.description,
          slug: form.slug,
          is_active: form.is_active,
        },
        fields: form.fields,
        total: responseItems.length,
        responses: responseItems,
      };
    },

    delete: async (formId: string, responseId: string): Promise<{ message: string }> => {
      const responses = getStoredResponses().filter((r) => !(r.form_id === formId && r.id === responseId));
      saveStoredResponses(responses);
      return { message: 'Respuesta eliminada' };
    },
  },

  public: {
    getBySlug: async (slug: string): Promise<{ form: FormItem & { fields: FormField[] } }> => {
      const forms = getStoredForms();
      const form = forms.find((f) => f.slug === slug);
      if (!form) throw new Error('El formulario no existe o el enlace es incorrecto.');
      return { form };
    },

    submit: async (slug: string, answers: Record<string, string>): Promise<{ success: boolean; message: string }> => {
      const forms = getStoredForms();
      const form = forms.find((f) => f.slug === slug);
      if (!form) throw new Error('Formulario no encontrado');
      if (!form.is_active) throw new Error('Este formulario no está aceptando respuestas.');

      const responses = getStoredResponses();
      const newResponse: StoredResponse = {
        id: 'resp-' + Math.random().toString(36).substring(2, 9),
        form_id: form.id,
        submitted_at: new Date().toISOString(),
        answers,
      };

      responses.unshift(newResponse);
      saveStoredResponses(responses);

      return { success: true, message: '¡Gracias por tu respuesta! Ha sido registrada exitosamente.' };
    },
  },
};
