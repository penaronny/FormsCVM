import React, { useState, useEffect } from 'react';
import { FormItem } from '../types.js';
import { api } from '../api.js';
import { useToast } from '../components/Toast.js';
import { 
  Plus, 
  Search, 
  Copy, 
  Check, 
  ExternalLink, 
  Edit3, 
  Inbox, 
  Trash2, 
  Power, 
  Calendar, 
  Layers, 
  MessageSquare,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

interface DashboardViewProps {
  onNewForm: () => void;
  onEditForm: (formId: string) => void;
  onViewResponses: (formId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNewForm,
  onEditForm,
  onViewResponses,
}) => {
  const [forms, setForms] = useState<FormItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [deletingForm, setDeletingForm] = useState<FormItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { success, error: toastError } = useToast();

  const fetchForms = async () => {
    setLoading(true);
    try {
      const data = await api.forms.list();
      setForms(data.forms);
    } catch (err: any) {
      toastError(err.message || 'Error al cargar formularios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const handleCopyLink = async (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/f/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedSlug(slug);
      success('Enlace público copiado al portapapeles');
      setTimeout(() => setCopiedSlug(null), 2500);
    } catch {
      toastError('No se pudo copiar el enlace.');
    }
  };

  const handleToggleActive = async (form: FormItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const nextState = !form.is_active;
      await api.forms.toggleStatus(form.id, nextState);
      setForms((prev) =>
        prev.map((f) => (f.id === form.id ? { ...f, is_active: nextState } : f))
      );
      success(`Formulario ${nextState ? 'activado' : 'desactivado'} correctamente.`);
    } catch (err: any) {
      toastError(err.message || 'Error al cambiar estado del formulario.');
    }
  };

  const confirmDelete = async () => {
    if (!deletingForm) return;
    setIsDeleting(true);
    try {
      await api.forms.delete(deletingForm.id);
      setForms((prev) => prev.filter((f) => f.id !== deletingForm.id));
      success('Formulario y respuestas eliminados exitosamente.');
      setDeletingForm(null);
    } catch (err: any) {
      toastError(err.message || 'Error al eliminar el formulario.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredForms = forms.filter((f) =>
    f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.description && f.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalForms = forms.length;
  const activeForms = forms.filter((f) => f.is_active).length;
  const totalResponses = forms.reduce((acc, f) => acc + (f.response_count || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Executive Header & KPI strip */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Mis formularios
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Administra formularios internos, distribuye enlaces y consulta respuestas centralizadas.
          </p>
        </div>

        <button
          onClick={onNewForm}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors whitespace-nowrap self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo formulario</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Total Formularios
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
              {totalForms}
            </span>
            <Layers className="w-5 h-5 text-slate-400" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Formularios Activos
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 tabular-nums">
              {activeForms}
            </span>
            <Power className="w-5 h-5 text-emerald-500" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Respuestas Recolectadas
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
              {totalResponses}
            </span>
            <MessageSquare className="w-5 h-5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título o descripción..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
          />
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-1.5 self-center">
          <span>Mostrando</span>
          <span className="font-semibold text-slate-800 tabular-nums">{filteredForms.length}</span>
          <span>de</span>
          <span className="font-semibold text-slate-800 tabular-nums">{totalForms}</span>
          <span>formularios</span>
        </div>
      </div>

      {/* Forms Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse">
              <div className="h-5 bg-slate-200 rounded w-3/4 mb-3" />
              <div className="h-4 bg-slate-100 rounded w-full mb-2" />
              <div className="h-4 bg-slate-100 rounded w-1/2 mb-6" />
              <div className="h-8 bg-slate-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : filteredForms.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">
            {searchTerm ? 'No se encontraron formularios' : 'Aún no tienes formularios creados'}
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            {searchTerm
              ? 'Prueba con otro término de búsqueda o limpia el filtro.'
              : 'Empieza diseñando tu primer formulario para recopilar información de colaboradores o equipos internos.'}
          </p>
          {searchTerm ? (
            <button
              onClick={() => setSearchTerm('')}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Limpiar búsqueda
            </button>
          ) : (
            <button
              onClick={onNewForm}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Crear mi primer formulario</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredForms.map((form) => (
            <div
              key={form.id}
              className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                {/* Status and Actions Top */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${
                      form.is_active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        form.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                    {form.is_active ? 'Activo' : 'Inactivo'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleToggleActive(form, e)}
                      title={form.is_active ? 'Desactivar formulario' : 'Activar formulario'}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-50 transition-colors"
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingForm(form);
                      }}
                      title="Eliminar formulario"
                      className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Form Title & Description */}
                <h3 className="font-semibold text-slate-900 text-base leading-snug line-clamp-1 mb-1">
                  {form.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed min-h-[32px] mb-4">
                  {form.description || 'Sin descripción adicional.'}
                </p>

                {/* Metadata */}
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-5 pt-3 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(form.created_at).toLocaleDateString('es-ES')}</span>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums font-medium text-slate-700">
                    {form.field_count ?? 0} {form.field_count === 1 ? 'campo' : 'campos'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums font-semibold text-slate-900">
                    {form.response_count ?? 0} {form.response_count === 1 ? 'respuesta' : 'respuestas'}
                  </span>
                </div>
              </div>

              {/* Bottom Card Actions */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onViewResponses(form.id)}
                    className="w-full py-1.5 px-2.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                    <span>Ver respuestas</span>
                  </button>

                  <button
                    onClick={() => onEditForm(form.id)}
                    className="w-full py-1.5 px-2.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Editar</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleCopyLink(form.slug, e)}
                    className="flex-1 py-1.5 px-2.5 text-xs font-medium text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    {copiedSlug === form.slug ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-semibold">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copiar enlace</span>
                      </>
                    )}
                  </button>

                  <a
                    href={`/f/${form.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    title="Abrir formulario público en nueva pestaña"
                    className="p-1.5 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                Eliminar formulario
              </h3>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              ¿Estás seguro de que deseas eliminar permanentemente{' '}
              <strong className="text-slate-900 font-semibold">"{deletingForm.title}"</strong>?
              Esta acción borrará todos sus campos y sus {deletingForm.response_count || 0} respuestas almacenadas.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingForm(null)}
                disabled={isDeleting}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center gap-1.5"
              >
                {isDeleting ? 'Eliminando...' : 'Sí, eliminar permanentemente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
