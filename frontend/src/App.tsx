import React, { useState, useEffect } from 'react';
import { User } from './types';
import { api } from './services/apiService';
import { Navbar } from './components/Navbar';
import { TriageChat } from './components/TriageChat';
import { BookingSystem } from './components/BookingSystem';
import { AdminDashboard } from './components/AdminDashboard';
import { MyAppointments } from './components/MyAppointments';
import { PublicCancelModal } from './components/PublicCancelModal';
import { X, LogIn, UserPlus, AlertCircle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'triage' | 'booking' | 'my-appointments' | 'admin' | 'public'>('triage');
  const [preselectedSpecialty, setPreselectedSpecialty] = useState<string | undefined>();
  const [publicTokenParam, setPublicTokenParam] = useState<string | undefined>();

  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Cargar sesión inicial de localStorage si existe
    const saved = api.getCurrentUser();
    if (saved) setCurrentUser(saved);

    // Detectar ruta o parámetros en la URL (soporta /cancelar/:token, /cancelar, ?token=, ?cancelToken=, etc.)
    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const queryToken = searchParams.get('token') || searchParams.get('cancelToken');

    if (queryToken) {
      setPublicTokenParam(queryToken);
      setCurrentView('public');
    } else if (path.startsWith('/cancelar/')) {
      const token = path.replace('/cancelar/', '').trim();
      if (token) {
        setPublicTokenParam(token);
        setCurrentView('public');
      }
    } else if (path === '/cancelar' || path === '/public' || path === '/token') {
      setCurrentView('public');
    }
  }, []);

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setCurrentView('triage');
  };

  const handleTriageBookSpecialty = (specialtyName: string) => {
    setPreselectedSpecialty(specialtyName);
    setCurrentView('booking');
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (isRegisterMode) {
        const res = await api.register({
          name: authName,
          email: authEmail,
          password: authPassword,
        });
        setCurrentUser(res.user);
      } else {
        const res = await api.login({
          email: authEmail,
          password: authPassword,
        });
        setCurrentUser(res.user);
      }
      setAuthModalOpen(false);
      setAuthEmail('');
      setAuthPassword('');
      setAuthName('');
    } catch (err: any) {
      setAuthError(err.message || 'Error en la autenticación');
    } finally {
      setAuthLoading(false);
    }
  };

  // Atajos para pruebas rápidas de laboratorio
  const fillQuickCredentials = (role: 'ADMIN' | 'PATIENT') => {
    setIsRegisterMode(false);
    if (role === 'ADMIN') {
      setAuthEmail('admin@saludpublica.gov.co');
      setAuthPassword('Admin123!');
    } else {
      setAuthEmail('paciente@saludpublica.gov.co');
      setAuthPassword('Paciente123!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar
        currentUser={currentUser}
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'booking') setPreselectedSpecialty(undefined);
          setCurrentView(view);
        }}
        onOpenAuth={() => {
          setAuthError(null);
          setAuthModalOpen(true);
        }}
        onLogout={handleLogout}
      />

      <main className="flex-1 pb-16">
        {currentView === 'triage' && (
          <TriageChat onSelectSpecialtyForBooking={handleTriageBookSpecialty} />
        )}

        {currentView === 'booking' && (
          <BookingSystem
            currentUser={currentUser}
            onOpenAuth={() => setAuthModalOpen(true)}
            preselectedSpecialtyName={preselectedSpecialty}
            onBookingSuccess={() => setCurrentView('my-appointments')}
          />
        )}

        {currentView === 'my-appointments' && <MyAppointments />}

        {currentView === 'admin' && (
          currentUser?.role === 'ADMIN' ? (
            <AdminDashboard />
          ) : (
            <div className="mx-auto max-w-md mt-16 p-8 text-center bg-white rounded-2xl border border-slate-200">
              <p className="text-sm font-bold text-rose-600">Acceso Restringido</p>
              <p className="text-xs text-slate-500 mt-1">Debes iniciar sesión con rol de Administrador.</p>
              <button
                onClick={() => {
                  fillQuickCredentials('ADMIN');
                  setAuthModalOpen(true);
                }}
                className="mt-4 px-4 py-2 bg-clinical-600 text-white rounded-xl text-xs font-semibold"
              >
                Ingresar como Admin
              </button>
            </div>
          )
        )}

        {currentView === 'public' && (
          <PublicCancelModal initialToken={publicTokenParam} />
        )}
      </main>

      {/* Footer SENA Impeccable */}
      <footer className="border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SaludPública Connect &copy; 2026 - SENA ADSO Ficha 3139687</span>
          <span className="text-slate-400">Laboratorio Final de Aprendizaje | Instructor: Carlos Chaparro</span>
        </div>
      </footer>

      {/* Modal de Autenticación */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-slate-200 relative animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 mb-1">
              {isRegisterMode ? 'Crear Cuenta de Paciente' : 'Iniciar Sesión'}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              {isRegisterMode
                ? 'Ingresa tus datos para registrar turnos en la red pública.'
                : 'Accede a tus citas médicas y gestión del sistema.'}
            </p>

            {authError && (
              <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3 text-xs">
              {isRegisterMode && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nombre Completo:</label>
                  <input
                    type="text"
                    placeholder="Ej: Carlos Gómez"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-clinical-600 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Correo Electrónico:</label>
                <input
                  type="email"
                  placeholder="ejemplo@saludpublica.gov.co"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-clinical-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contraseña:</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-clinical-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full mt-2 bg-clinical-600 hover:bg-clinical-700 disabled:bg-slate-300 text-white font-bold py-2.5 rounded-xl text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                {authLoading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Validando...</span>
                  </>
                ) : isRegisterMode ? (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>Registrarse</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    <span>Entrar</span>
                  </>
                )}
              </button>
            </form>

            {/* Credenciales de Prueba Rápidas (SENA Lab) */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block text-center mb-2">
                Accesos de Prueba Rápidos (Seed)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillQuickCredentials('ADMIN')}
                  className="px-2 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-700 transition-colors"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickCredentials('PATIENT')}
                  className="px-2 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-700 transition-colors"
                >
                  Paciente
                </button>
              </div>
            </div>

            {/* Toggle Login / Register */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setAuthError(null);
                  setIsRegisterMode(!isRegisterMode);
                }}
                className="text-xs text-clinical-600 hover:text-clinical-700 font-semibold"
              >
                {isRegisterMode
                  ? '¿Ya tienes una cuenta? Inicia sesión aquí'
                  : '¿No tienes cuenta aún? Regístrate como paciente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
