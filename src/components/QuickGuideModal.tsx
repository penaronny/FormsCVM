import React from 'react';
import { X, CheckCircle2, Shield, Share2, Layers, Database } from 'lucide-react';

interface QuickGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickGuideModal: React.FC<QuickGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Manual Operativo
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              Guía de uso interno - FormaPulse
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto space-y-5 pr-1 text-xs text-slate-600 leading-relaxed">
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center shrink-0 font-bold text-sm">
              1
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-slate-700" />
                Creación del Formulario
              </h3>
              <p>
                Pulsa en <strong>"Nuevo formulario"</strong>. Asigna un título descriptivo y agrega los campos requeridos desde la paleta izquierda (texto corto, texto largo, email, número, fecha o selección única). Puedes marcar campos como obligatorios y ordenar las preguntas.
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center shrink-0 font-bold text-sm">
              2
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-slate-700" />
                Distribución con Enlace Único
              </h3>
              <p>
                Al guardar, el sistema genera automáticamente un enlace con identificador aleatorio de alta seguridad. Cópialo con un solo clic y compártelo por correo corporativo, Slack o Teams. Los destinatarios no requieren registrarse ni ingresar contraseñas.
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center shrink-0 font-bold text-sm">
              3
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-slate-700" />
                Consulta y Análisis de Respuestas
              </h3>
              <p>
                Ingresa en <strong>"Ver respuestas"</strong> de cualquier formulario. La tabla generará automáticamente columnas dinámicas para cada pregunta formulada, permitiendo filtrar por fechas, buscar textos específicos, inspeccionar respuestas individuales y exportar a formato CSV para Excel.
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center shrink-0 font-bold text-sm">
              4
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-slate-700" />
                Control de Estado (Activar / Pausar)
              </h3>
              <p>
                Puedes desactivar cualquier formulario cuando finalice el periodo de recolección de datos. Los colaboradores verán un aviso indicando que el formulario está pausado y no se aceptarán más envíos.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
