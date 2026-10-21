import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ToastProvider } from './components/Toast.js';
import { Navbar } from './components/Navbar.js';
import { AuthView } from './views/AuthView.js';
import { DashboardView } from './views/DashboardView.js';
import { FormEditorView } from './views/FormEditorView.js';
import { ResponsesView } from './views/ResponsesView.js';
import { PublicFormView } from './views/PublicFormView.js';
import { QuickGuideModal } from './components/QuickGuideModal.js';

type AppView = 'dashboard' | 'editor' | 'responses';

function MainApp() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [activeFormId, setActiveFormId] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [publicSlug, setPublicSlug] = useState<string | null>(null);

  // Check URL pathname or search params for public form /f/:slug
  useEffect(() => {
    const checkRoute = () => {
      const pathname = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);

      if (pathname.startsWith('/f/')) {
        const slug = pathname.substring(3).replace(/\/$/, '');
        if (slug) {
          setPublicSlug(slug);
          return;
        }
      }

      if (searchParams.get('f')) {
        setPublicSlug(searchParams.get('f'));
        return;
      }

      setPublicSlug(null);
    };

    checkRoute();
    window.addEventListener('popstate', checkRoute);
    return () => window.removeEventListener('popstate', checkRoute);
  }, []);

  // If a public form URL is accessed, render the respondent view
  if (publicSlug) {
    return <PublicFormView slug={publicSlug} />;
  }

  // Loading authentication state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-slate-900 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-medium text-slate-500">Cargando plataforma corporativa...</p>
      </div>
    );
  }

  // Not logged in -> Show Authentication (Login / Register / Quick Demo)
  if (!user) {
    return <AuthView />;
  }

  // Authenticated Admin Dashboard
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'editor') {
            setActiveFormId(null);
          }
          setCurrentView(view);
        }}
        onOpenQuickGuide={() => setIsGuideOpen(true)}
      />

      <main className="flex-1">
        {currentView === 'dashboard' && (
          <DashboardView
            onNewForm={() => {
              setActiveFormId(null);
              setCurrentView('editor');
            }}
            onEditForm={(id) => {
              setActiveFormId(id);
              setCurrentView('editor');
            }}
            onViewResponses={(id) => {
              setActiveFormId(id);
              setCurrentView('responses');
            }}
          />
        )}

        {currentView === 'editor' && (
          <FormEditorView
            formId={activeFormId}
            onBack={() => {
              setActiveFormId(null);
              setCurrentView('dashboard');
            }}
            onSaved={(newFormId) => {
              if (newFormId) {
                setActiveFormId(null);
              }
              setCurrentView('dashboard');
            }}
          />
        )}

        {currentView === 'responses' && activeFormId && (
          <ResponsesView
            formId={activeFormId}
            onBack={() => {
              setActiveFormId(null);
              setCurrentView('dashboard');
            }}
          />
        )}
      </main>

      <QuickGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </AuthProvider>
  );
}
