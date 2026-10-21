import React, { useState, useEffect } from 'react';
import { FormResponsesData, FormField, ResponseItem } from '../types.js';
import { api } from '../api.js';
import { useToast } from '../components/Toast.js';
import { getPublicFormUrl } from '../utils.js';
import { 
  ArrowLeft, 
  Search, 
  Calendar, 
  Download, 
  Trash2, 
  ExternalLink, 
  Copy, 
  Check, 
  Inbox, 
  Clock, 
  Eye, 
  X,
  FilterX
} from 'lucide-react';

interface ResponsesViewProps {
  formId: string;
  onBack: () => void;
}

export const ResponsesView: React.FC<ResponsesViewProps> = ({ formId, onBack }) => {
  const { success, error: toastError } = useToast();

  const [data, setData] = useState<FormResponsesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedResponse, setSelectedResponse] = useState<ResponseItem | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchResponses = async () => {
    setLoading(true);
    try {
      const res = await api.responses.list(formId, {
        search: search.trim() || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
      });
      setData(res);
    } catch (err: any) {
      toastError(err.message || 'Error al obtener respuestas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResponses();
  }, [formId, fromDate, toDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResponses();
  };

  const handleClearFilters = () => {
    setSearch('');
    setFromDate('');
    setToDate('');
  };

  const handleDeleteResponse = async (responseId: string) => {
    if (!window.confirm('¿Deseas eliminar este registro de respuesta?')) return;
    setDeletingId(responseId);
    try {
      await api.responses.delete(formId, responseId);
      success('Respuesta eliminada correctamente.');
      if (data) {
        setData({
          ...data,
          total: data.total - 1,
          responses: data.responses.filter((r) => r.id !== responseId),
        });
      }
      if (selectedResponse?.id === responseId) {
        setSelectedResponse(null);
      }
    } catch (err: any) {
      toastError(err.message || 'Error al eliminar la respuesta.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyPublicUrl = async () => {
    if (!data?.form.slug) return;
    const url = getPublicFormUrl(data.form.slug);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      success('Enlace copiado al portapapeles');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      toastError('No se pudo copiar el enlace.');
    }
  };

  const handleDownloadCsv = () => {
    const exportUrl = api.responses.getExportUrl(formId);
    window.open(exportUrl, '_blank');
    success('Descargando archivo CSV...');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Navigation & Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a mis formularios</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {data?.form.title || 'Panel de Respuestas'}
              </h1>
              {data && (
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    data.form.is_active
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {data.form.is_active ? 'Recibiendo respuestas' : 'Pausado'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Registro centralizado de información recopilada a través del formulario público.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {data?.form.slug && (
              <>
                <button
                  type="button"
                  onClick={handleCopyPublicUrl}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedLink ? 'Copiado' : 'Copiar enlace'}</span>
                </button>

                <a
                  href={getPublicFormUrl(data.form.slug)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Abrir formulario</span>
                </a>
              </>
            )}

            <button
              type="button"
              onClick={handleDownloadCsv}
              disabled={!data || data.total === 0}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar texto en cualquier respuesta..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="md:col-span-3 flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-500 shrink-0">Desde:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-700"
            />
          </div>

          <div className="md:col-span-3 flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-500 shrink-0">Hasta:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-700"
            />
          </div>

          <div className="md:col-span-1 flex items-center justify-end gap-1">
            <button
              type="submit"
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
              title="Aplicar búsqueda"
            >
              Filtrar
            </button>
            {(search || fromDate || toDate) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded"
                title="Limpiar filtros"
              >
                <FilterX className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Total Counter Status Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 mb-3 px-1">
        <div className="flex items-center gap-2">
          <span>Total de respuestas registradas:</span>
          <span className="font-bold text-slate-900 tabular-nums">
            {data ? data.total : '...'}
          </span>
        </div>
        {(search || fromDate || toDate) && (
          <span className="text-[11px] text-amber-700 font-medium">
            Filtros activos aplicados
          </span>
        )}
      </div>

      {/* Main Responses Table */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Cargando respuestas...</p>
        </div>
      ) : !data || data.responses.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 mb-1">
            {search || fromDate || toDate
              ? 'No hay respuestas que coincidan con los filtros'
              : 'Aún no se han recibido respuestas'}
          </h3>
          <p className="text-xs text-slate-500 mb-5">
            {search || fromDate || toDate
              ? 'Modifica los parámetros de búsqueda o borra los filtros de fecha.'
              : 'Comparte el enlace del formulario con tus colaboradores para empezar a recopilar datos.'}
          </p>
          {(search || fromDate || toDate) ? (
            <button
              onClick={handleClearFilters}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Borrar filtros
            </button>
          ) : (
            <button
              onClick={handleCopyPublicUrl}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar enlace público</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4 min-w-[150px] whitespace-nowrap">Fecha de envío</th>
                  {data.fields.map((f) => (
                    <th key={f.id} className="py-3 px-4 min-w-[180px] max-w-[280px] truncate">
                      {f.label}
                    </th>
                  ))}
                  <th className="py-3 px-4 w-24 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {data.responses.map((resp, idx) => (
                  <tr
                    key={resp.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => setSelectedResponse(resp)}
                  >
                    <td className="py-3 px-4 text-center text-slate-400 font-mono text-[11px] tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 tabular-nums">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(resp.submitted_at).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}</span>
                      </div>
                    </td>
                    {data.fields.map((f) => {
                      const val = resp.answers[f.id] || '—';
                      return (
                        <td key={f.id} className="py-3 px-4 max-w-[280px] truncate">
                          <span className={val === '—' ? 'text-slate-300' : 'text-slate-800'}>
                            {val}
                          </span>
                        </td>
                      );
                    })}
                    <td
                      className="py-3 px-4 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedResponse(resp)}
                          className="p-1 text-slate-400 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
                          title="Ver detalle completo"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteResponse(resp.id)}
                          disabled={deletingId === resp.id}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                          title="Eliminar respuesta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Response Detail Modal */}
      {selectedResponse && data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Detalle de Envío
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Respuesta registrada el {new Date(selectedResponse.submitted_at).toLocaleString('es-ES')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedResponse(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1 flex-1">
              {data.fields.map((f, i) => {
                const val = selectedResponse.answers[f.id];
                return (
                  <div key={f.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <div className="text-[11px] font-medium text-slate-500 mb-1">
                      {i + 1}. {f.label}
                    </div>
                    <div className="text-xs font-semibold text-slate-900 whitespace-pre-wrap leading-relaxed">
                      {val && String(val).trim() !== '' ? val : <span className="text-slate-400 font-normal">Sin respuesta</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                ID: {selectedResponse.id}
              </span>
              <button
                type="button"
                onClick={() => setSelectedResponse(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
