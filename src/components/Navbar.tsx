import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Layers, Plus, LogOut, FileText, Sparkles } from 'lucide-react';

interface NavbarProps {
  currentView: 'dashboard' | 'editor' | 'responses';
  onNavigate: (view: 'dashboard' | 'editor') => void;
  onOpenQuickGuide: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onOpenQuickGuide }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-sm group-hover:bg-slate-800 transition-colors">
              FP
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
              FormaPulse
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              currentView === 'dashboard'
                ? 'text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Mis formularios</span>
          </button>

          <button
            onClick={() => onNavigate('editor')}
            className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              currentView === 'editor'
                ? 'text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo formulario</span>
          </button>

          <button
            onClick={onOpenQuickGuide}
            className="text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            <span>Guía de uso interno</span>
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action / User Profile */}
        <div className="flex items-center gap-4 shrink-0">
          {user && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
              <span className="font-medium text-slate-800">{user.name}</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-500">{user.email}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('editor')}
              className="md:hidden px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors whitespace-nowrap flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo</span>
            </button>

            <button
              onClick={() => logout()}
              title="Cerrar sesión"
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors whitespace-nowrap flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
