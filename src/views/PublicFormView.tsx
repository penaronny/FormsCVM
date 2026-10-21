import React, { useState, useEffect } from 'react';
import { FormField, FormItem } from '../types.js';
import { api } from '../api.js';
import { 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  RotateCcw, 
  Building2, 
  HelpCircle,
  Clock,
  ShieldCheck
} from 'lucide-react';

interface PublicFormViewProps {
  slug: string;
}

export const PublicFormView: React.FC<PublicFormViewProps> = ({ slug }) => {
  const [form, setForm] = useState<(FormItem & { fields: FormField[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form values map: field_id -> string
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadPublicForm();
  }, [slug]);

  const loadPublicForm = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.public.getBySlug(slug);
      setForm(data.form);

      // Initialize empty answers
      const initial: Record<string, string> = {};
      data.form.fields?.forEach((f) => {
        initial[f.id] = '';
      });
      setAnswers(initial);
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo cargar el formulario.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (fieldId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    // Clear validation error if user types
    if (validationErrors[fieldId]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    // Validate fields
    const errors: Record<string, string> = {};

    form.fields.forEach((f) => {
      const val = answers[f.id];
      const isPresent = val !== undefined && val !== null && String(val).trim() !== '';

      if (f.is_required && !isPresent) {
        errors[f.id] = 'Este campo es obligatorio.';
      } else if (isPresent) {
        if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          errors[f.id] = 'Ingresa un correo electrónico válido.';
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      const el = document.getElementById(`field-${firstErrorField}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSubmitting(true);
    try {
      await api.public.submit(slug, answers);
      setSubmittedSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al enviar tus respuestas. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForAnother = () => {
    if (!form) return;
    const initial: Record<string, string> = {};
    form.fields.forEach((f) => {
      initial[f.id] = '';
    });
    setAnswers(initial);
    setValidationErrors({});
    setSubmittedSuccess(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100/70 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-slate-900 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-600">Cargando formulario corporativo...</p>
      </div>
    );
  }

  // Not found or error loading
  if (errorMsg && !form) {
    return (
      <div className="min-h-screen bg-slate-100/70 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Formulario no disponible</h2>
          <p className="text-xs text-slate-600 mb-6 leading-relaxed">{errorMsg}</p>
          <a
            href="/"
            className="inline-flex px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Ir a la página principal
          </a>
        </div>
      </div>
    );
  }

  // Inactive Form State
  if (form && !form.is_active) {
    return (
      <div className="min-h-screen bg-slate-100/70 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">
            Este formulario no está disponible
          </h2>
          <p className="text-xs text-slate-600 mb-2 leading-relaxed">
            "{form.title}"
          </p>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            El administrador ha pausado o cerrado temporalmente la recolección de respuestas para este formulario.
          </p>
          <div className="text-[11px] text-slate-400">
            Si crees que esto es un error, contacta al área emisora de tu empresa.
          </div>
        </div>
      </div>
    );
  }

  // Success Screen
  if (submittedSuccess && form) {
    return (
      <div className="min-h-screen bg-slate-100/70 flex flex-col items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            ¡Gracias por tu respuesta!
          </h2>
          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            Tu información ha sido enviada y registrada correctamente en la base de datos de <strong className="text-slate-800 font-semibold">{form.title}</strong>.
          </p>

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleResetForAnother}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Enviar otra respuesta</span>
            </button>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Transmisión segura interna · FormaPulse</span>
          </div>
        </div>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="min-h-screen bg-slate-100/70 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Corporate Header Ribbon */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="h-2.5 bg-slate-900 w-full" />
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <Building2 className="w-4 h-4 text-slate-600" />
              <span>Formulario Interno</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
              {form.title}
            </h1>
            {form.description && (
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                {form.description}
              </p>
            )}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-400">
              <span>Los campos marcados con <span className="text-rose-500 font-bold">*</span> son obligatorios.</span>
            </div>
          </div>
        </div>

        {/* Global Error Banner if submit failed */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <p className="leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {/* Form Fields Card */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {form.fields.map((field) => {
            const hasError = Boolean(validationErrors[field.id]);
            const val = answers[field.id] || '';

            return (
              <div
                key={field.id}
                id={`field-${field.id}`}
                className={`bg-white border rounded-xl p-5 transition-all shadow-xs ${
                  hasError ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-200 focus-within:border-slate-400'
                }`}
              >
                <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                  {field.label}
                  {field.is_required && (
                    <span className="text-rose-500 ml-1 font-bold" title="Campo obligatorio">*</span>
                  )}
                </label>

                {/* Input according to field type */}
                {field.type === 'text' && (
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    placeholder="Escribe tu respuesta aquí..."
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-slate-900 placeholder:text-slate-400"
                  />
                )}

                {field.type === 'textarea' && (
                  <textarea
                    rows={4}
                    value={val}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    placeholder="Escribe tu respuesta con el detalle necesario..."
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-slate-900 placeholder:text-slate-400 resize-y"
                  />
                )}

                {field.type === 'email' && (
                  <input
                    type="email"
                    value={val}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    placeholder="ejemplo@empresa.com"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-slate-900 placeholder:text-slate-400"
                  />
                )}

                {field.type === 'number' && (
                  <input
                    type="number"
                    value={val}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-slate-900 placeholder:text-slate-400"
                  />
                )}

                {field.type === 'date' && (
                  <input
                    type="date"
                    value={val}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-slate-900"
                  />
                )}

                {field.type === 'select' && (
                  <div className="space-y-2 mt-2">
                    {field.options.map((opt, optIdx) => (
                      <label
                        key={optIdx}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          val === opt
                            ? 'bg-slate-50 border-slate-900 text-slate-900 font-medium shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`radio-${field.id}`}
                          value={opt}
                          checked={val === opt}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                          className="h-4 w-4 text-slate-900 focus:ring-slate-900 border-slate-300"
                        />
                        <span className="text-xs leading-normal">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Validation message */}
                {hasError && (
                  <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{validationErrors[field.id]}</span>
                  </p>
                )}
              </div>
            );
          })}

          {/* Submit Action Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-500 text-center sm:text-left">
              Revisa tus respuestas antes de enviar.
            </span>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Enviando respuesta...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Enviar respuesta</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-400">
          FormaPulse · Plataforma de formularios internos corporativos
        </div>
      </div>
    </div>
  );
};
