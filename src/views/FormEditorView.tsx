import React, { useState, useEffect } from 'react';
import { FormField, FieldType, FormItem } from '../types.js';
import { api } from '../api.js';
import { useToast } from '../components/Toast.js';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Type, 
  AlignLeft, 
  Mail, 
  Hash, 
  Calendar, 
  ListChecks, 
  Check, 
  Copy, 
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface FormEditorViewProps {
  formId?: string | null;
  onBack: () => void;
  onSaved: (newFormId?: string) => void;
}

interface PaletteItem {
  type: FieldType;
  label: string;
  desc: string;
  icon: React.ElementType;
  defaultLabel: string;
  defaultOptions?: string[];
}

const PALETTE_ITEMS: PaletteItem[] = [
  {
    type: 'text',
    label: 'Texto corto',
    desc: 'Nombres, cargos, códigos breves',
    icon: Type,
    defaultLabel: 'Nombre o dato breve',
  },
  {
    type: 'textarea',
    label: 'Texto largo',
    desc: 'Comentarios, descripciones, motivos',
    icon: AlignLeft,
    defaultLabel: 'Descripción detallada',
  },
  {
    type: 'email',
    label: 'Correo electrónico',
    desc: 'Validación automática de email',
    icon: Mail,
    defaultLabel: 'Correo corporativo',
  },
  {
    type: 'number',
    label: 'Número',
    desc: 'Cantidades, edades, montos',
    icon: Hash,
    defaultLabel: 'Cantidad o valor numérico',
  },
  {
    type: 'date',
    label: 'Fecha',
    desc: 'Plazos, fechas de inicio o entrega',
    icon: Calendar,
    defaultLabel: 'Fecha estimada',
  },
  {
    type: 'select',
    label: 'Selección única',
    desc: 'Menú desplegable de opciones',
    icon: ListChecks,
    defaultLabel: 'Selecciona una opción',
    defaultOptions: ['Opción 1', 'Opción 2', 'Opción 3'],
  },
];

export const FormEditorView: React.FC<FormEditorViewProps> = ({ formId, onBack, onSaved }) => {
  const { success, error: toastError } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [slug, setSlug] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [createdModalData, setCreatedModalData] = useState<{ slug: string; id: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Load existing form if formId provided
  useEffect(() => {
    if (formId) {
      loadForm(formId);
    } else {
      // Initialize with 2 default friendly fields
      setTitle('Nuevo Formulario Interno');
      setDescription('Completa la siguiente información requerida por el equipo.');
      setFields([
        {
          id: 'temp-' + Math.random().toString(36).substring(2, 8),
          label: 'Nombre completo',
          type: 'text',
          is_required: true,
          options: [],
          position: 0,
        },
        {
          id: 'temp-' + Math.random().toString(36).substring(2, 8),
          label: 'Correo electrónico',
          type: 'email',
          is_required: true,
          options: [],
          position: 1,
        },
      ]);
    }
  }, [formId]);

  const loadForm = async (id: string) => {
    setLoading(true);
    try {
      const data = await api.forms.get(id);
      setTitle(data.form.title);
      setDescription(data.form.description || '');
      setFields(data.form.fields || []);
      setSlug(data.form.slug);
      setIsActive(data.form.is_active);
    } catch (err: any) {
      toastError(err.message || 'Error al cargar formulario.');
      onBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAddField = (palette: PaletteItem) => {
    const newField: FormField = {
      id: 'field-' + Math.random().toString(36).substring(2, 9),
      label: palette.defaultLabel,
      type: palette.type,
      is_required: false,
      options: palette.defaultOptions ? [...palette.defaultOptions] : [],
      position: fields.length,
    };
    setFields([...fields, newField]);
    success(`Campo "${palette.label}" agregado`);
  };

  const handleUpdateField = (id: string, updates: Partial<FormField>) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const handleDeleteField = (id: string) => {
    if (fields.length <= 1) {
      toastError('El formulario debe tener al menos un campo.');
      return;
    }
    setFields((prev) => prev.filter((f) => f.id !== id).map((f, idx) => ({ ...f, position: idx })));
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === fields.length - 1) return;

    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newFields[index];
    newFields[index] = newFields[targetIndex];
    newFields[targetIndex] = temp;

    // Update positions
    setFields(newFields.map((f, i) => ({ ...f, position: i })));
  };

  const handleAddOption = (fieldId: string) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f.id === fieldId) {
          const currentOpts = Array.isArray(f.options) ? f.options : [];
          return {
            ...f,
            options: [...currentOpts, `Opción ${currentOpts.length + 1}`],
          };
        }
        return f;
      })
    );
  };

  const handleUpdateOption = (fieldId: string, optIndex: number, val: string) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f.id === fieldId) {
          const nextOpts = [...f.options];
          nextOpts[optIndex] = val;
          return { ...f, options: nextOpts };
        }
        return f;
      })
    );
  };

  const handleDeleteOption = (fieldId: string, optIndex: number) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f.id === fieldId) {
          if (f.options.length <= 1) {
            toastError('Debe haber al menos una opción disponible.');
            return f;
          }
          const nextOpts = f.options.filter((_, idx) => idx !== optIndex);
          return { ...f, options: nextOpts };
        }
        return f;
      })
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toastError('Ingresa un título para el formulario.');
      return;
    }

    if (fields.length === 0) {
      toastError('El formulario debe tener al menos un campo.');
      return;
    }

    for (let i = 0; i < fields.length; i++) {
      if (!fields[i].label.trim()) {
        toastError(`La etiqueta del campo #${i + 1} no puede estar vacía.`);
        return;
      }
      if (fields[i].type === 'select' && fields[i].options.length === 0) {
        toastError(`El campo "${fields[i].label}" debe tener al menos una opción.`);
        return;
      }
    }

    setSaving(true);
    try {
      if (formId) {
        // Update existing form
        await api.forms.update(formId, {
          title: title.trim(),
          description: description.trim(),
          is_active: isActive,
          fields,
        });
        success('Formulario actualizado correctamente.');
        onSaved();
      } else {
        // Create new form
        const res = await api.forms.create({
          title: title.trim(),
          description: description.trim(),
          fields,
        });
        setCreatedModalData({ slug: res.slug, id: res.formId });
        success('¡Formulario creado exitosamente!');
      }
    } catch (err: any) {
      toastError(err.message || 'Error al guardar el formulario.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopySlugLink = async (targetSlug: string) => {
    const url = `${window.location.origin}/f/${targetSlug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      success('Enlace copiado al portapapeles');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      toastError('No se pudo copiar el enlace.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500">Cargando formulario...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex flex-col">
      {/* Top Action Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Volver a mis formularios</span>
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <span className="text-xs font-semibold text-slate-700">
              {formId ? 'Editando formulario' : 'Nuevo formulario'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {slug && (
              <button
                type="button"
                onClick={() => handleCopySlugLink(slug)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copiado' : 'Copiar enlace público'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                previewMode
                  ? 'bg-slate-200 text-slate-900 font-semibold'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {previewMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{previewMode ? 'Modo Editor' : 'Vista Previa'}</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              {saving ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{formId ? 'Guardar cambios' : 'Publicar formulario'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {previewMode ? (
          /* Live Interactive Preview Screen */
          <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6 sm:p-8">
            <div className="border-b border-slate-100 pb-5 mb-6">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Vista previa del formulario
              </span>
              <h2 className="text-2xl font-bold text-slate-900">{title || 'Sin título'}</h2>
              {description && (
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{description}</p>
              )}
            </div>

            <div className="space-y-5">
              {fields.map((field) => (
                <div key={field.id} className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    {field.label}
                    {field.is_required && <span className="text-rose-500 ml-1">*</span>}
                  </label>

                  {field.type === 'text' && (
                    <input
                      type="text"
                      disabled
                      placeholder="Respuesta de texto corto..."
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                    />
                  )}

                  {field.type === 'textarea' && (
                    <textarea
                      disabled
                      rows={3}
                      placeholder="Escribe tu respuesta detallada..."
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed resize-none"
                    />
                  )}

                  {field.type === 'email' && (
                    <input
                      type="email"
                      disabled
                      placeholder="nombre@empresa.com"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                    />
                  )}

                  {field.type === 'number' && (
                    <input
                      type="number"
                      disabled
                      placeholder="0"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                    />
                  )}

                  {field.type === 'date' && (
                    <input
                      type="date"
                      disabled
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                    />
                  )}

                  {field.type === 'select' && (
                    <select
                      disabled
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                    >
                      <option value="">Selecciona una opción...</option>
                      {field.options.map((opt, idx) => (
                        <option key={idx} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Campos marcados con * son requeridos</span>
              <button
                type="button"
                disabled
                className="px-5 py-2 text-xs font-medium text-white bg-slate-400 rounded-lg cursor-not-allowed"
              >
                Enviar respuesta (Simulación)
              </button>
            </div>
          </div>
        ) : (
          /* Editor Layout: Left Palette + Center Fields */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Palette: Field Types */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 sticky top-32">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-900">Agregar campos</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Haz clic en un tipo de campo para añadirlo al formulario.
                </p>
              </div>

              <div className="space-y-2">
                {PALETTE_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => handleAddField(item)}
                      className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all flex items-start gap-3 group"
                    >
                      <div className="p-2 rounded bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-slate-900 flex items-center justify-between">
                          <span>{item.label}</span>
                          <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900" />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
                <div className="flex items-center justify-between mb-1">
                  <span>Total campos añadidos:</span>
                  <span className="font-bold text-slate-900 tabular-nums">{fields.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Estado al publicar:</span>
                  <span className="text-emerald-700 font-medium">Activo</span>
                </div>
              </div>
            </div>

            {/* Center Canvas: Form Title & Fields List */}
            <div className="lg:col-span-8 space-y-6">
              {/* Form Metadata Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Título del formulario *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ej. Solicitud de Vacaciones y Permisos"
                      className="w-full px-3.5 py-2 text-base font-semibold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Descripción o instrucciones
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      placeholder="Indica las instrucciones necesarias para quienes completarán este formulario..."
                      className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-slate-700 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Fields List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-bold text-slate-900">
                    Estructura de campos ({fields.length})
                  </h3>
                  <span className="text-xs text-slate-500">
                    Reordena con las flechas o edita cada etiqueta
                  </span>
                </div>

                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs transition-all hover:border-slate-300"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      {/* Field Index & Type Tag */}
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center tabular-nums">
                          {index + 1}
                        </span>
                        <span className="text-xs font-medium text-slate-500">
                          {PALETTE_ITEMS.find((p) => p.type === field.type)?.label || field.type}
                        </span>
                      </div>

                      {/* Controls: Reorder & Delete */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveField(index, 'up')}
                          disabled={index === 0}
                          title="Mover arriba"
                          className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 disabled:hover:text-slate-400 rounded hover:bg-slate-100 transition-colors"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveField(index, 'down')}
                          disabled={index === fields.length - 1}
                          title="Mover abajo"
                          className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 disabled:hover:text-slate-400 rounded hover:bg-slate-100 transition-colors"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <div className="h-3.5 w-px bg-slate-200 mx-1" />
                        <button
                          type="button"
                          onClick={() => handleDeleteField(field.id)}
                          title="Eliminar campo"
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Field Label Input & Required Toggle */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      <div className="sm:col-span-9">
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                          placeholder="Etiqueta de la pregunta o campo..."
                          className="w-full px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                        />
                      </div>

                      <div className="sm:col-span-3 flex items-center justify-end">
                        <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700">
                          <input
                            type="checkbox"
                            checked={field.is_required}
                            onChange={(e) =>
                              handleUpdateField(field.id, { is_required: e.target.checked })
                            }
                            className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 h-4 w-4"
                          />
                          <span className="font-medium">Obligatorio</span>
                        </label>
                      </div>
                    </div>

                    {/* Select Options Configurator */}
                    {field.type === 'select' && (
                      <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50/50 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-700">
                            Opciones del desplegable ({field.options.length})
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddOption(field.id)}
                            className="text-xs text-slate-900 font-medium hover:underline flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Agregar opción</span>
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          {field.options.map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 font-mono w-4">
                                {optIdx + 1}.
                              </span>
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) =>
                                  handleUpdateOption(field.id, optIdx, e.target.value)
                                }
                                placeholder={`Opción ${optIdx + 1}`}
                                className="flex-1 px-2.5 py-1 text-xs border border-slate-200 bg-white rounded focus:outline-none focus:ring-1 focus:ring-slate-900"
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteOption(field.id, optIdx)}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded"
                                title="Eliminar opción"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Form Created Success Modal */}
      {createdModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-2">
              ¡Formulario publicado con éxito!
            </h3>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Tu enlace único y seguro ya está activo. Cualquier colaborador puede responder sin necesidad de iniciar sesión.
            </p>

            {/* Link Box */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl mb-6">
              <div className="text-[11px] font-medium text-slate-500 mb-1 text-left">
                Enlace público para compartir:
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/f/${createdModalData.slug}`}
                  className="flex-1 text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 select-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleCopySlugLink(createdModalData.slug)}
                  className="px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <a
                href={`/f/${createdModalData.slug}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span>Abrir página pública</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => {
                  setCreatedModalData(null);
                  onSaved(createdModalData.id);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Ir a Mis formularios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
