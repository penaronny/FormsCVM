export type FieldType = 'text' | 'textarea' | 'email' | 'number' | 'date' | 'select';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface FormField {
  id: string;
  form_id?: string;
  label: string;
  type: FieldType;
  is_required: boolean;
  options: string[];
  position: number;
}

export interface FormItem {
  id: string;
  user_id: string;
  title: string;
  description: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  field_count?: number;
  response_count?: number;
  fields?: FormField[];
}

export interface ResponseItem {
  id: string;
  submitted_at: string;
  answers: Record<string, string>; // field_id -> value
}

export interface FormResponsesData {
  form: {
    id: string;
    title: string;
    description: string;
    slug: string;
    is_active: boolean;
  };
  fields: FormField[];
  total: number;
  responses: ResponseItem[];
}
