import React from 'react';
import { User } from '../types';
import { Stethoscope, CalendarCheck, BarChart3, Bot, LogIn, LogOut, User as UserIcon, ShieldAlert } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  currentView: 'triage' | 'booking' | 'my-appointments' | 'admin' | 'public';
  onNavigate: (view: 'triage' | 'booking' | 'my-appointments' | 'admin' | 'public') => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentView,
  onNavigate,
  onOpenAuth,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        
        {/* Brand */}
        <div 
          onClick={() => onNavigate('triage')}
          className="flex cursor-pointer items-center gap-3 group transition-transform active:scale-98"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-clinical-600 text-white shadow-sm shadow-clinical-600/20 group-hover:bg-clinical-700 transition-colors">
            <Stethoscope className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900 block leading-tight">
              SaludPública <span className="text-clinical-600">Connect</span>
            </span>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Red de Centros de Salud
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
          <button
            onClick={() => onNavigate('triage')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentView === 'triage'
                ? 'bg-white text-clinical-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Bot className="h-4 w-4 text-clinical-600" />
            Triaje Inteligente con IA
          </button>

          <button
            onClick={() => onNavigate('booking')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentView === 'booking'
                ? 'bg-white text-clinical-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <CalendarCheck className="h-4 w-4 text-clinical-600" />
            Reservar Turno
          </button>

          {currentUser && (
            <button
              onClick={() => onNavigate('my-appointments')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'my-appointments'
                  ? 'bg-white text-clinical-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <UserIcon className="h-4 w-4 text-clinical-600" />
              Mis Turnos
            </button>
          )}

          {currentUser?.role === 'ADMIN' && (
            <button
              onClick={() => onNavigate('admin')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'admin'
                  ? 'bg-white text-clinical-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <BarChart3 className="h-4 w-4 text-clinical-600" />
              Panel Admin
            </button>
          )}

          <button
            onClick={() => onNavigate('public')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentView === 'public'
                ? 'bg-white text-clinical-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Cancelar o consultar con token sin login"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-slate-500" />
            Acceso por Token
          </button>
        </nav>

        {/* User Session / Auth Controls */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <span className="text-xs font-bold text-slate-900 block leading-tight">
                  {currentUser.name}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-clinical-100 text-clinical-800">
                  {currentUser.role}
                </span>
              </div>

              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 bg-clinical-600 hover:bg-clinical-700 active:scale-98 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <LogIn className="h-4 w-4" />
              Iniciar Sesión / Registro
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="flex md:hidden border-t border-slate-200/60 px-2 py-1.5 gap-1 overflow-x-auto justify-around bg-slate-50 text-xs">
        <button
          onClick={() => onNavigate('triage')}
          className={`px-2.5 py-1 rounded-md font-medium ${currentView === 'triage' ? 'bg-white shadow-xs text-clinical-700 font-bold' : 'text-slate-600'}`}
        >
          Triaje IA
        </button>
        <button
          onClick={() => onNavigate('booking')}
          className={`px-2.5 py-1 rounded-md font-medium ${currentView === 'booking' ? 'bg-white shadow-xs text-clinical-700 font-bold' : 'text-slate-600'}`}
        >
          Turnos (20m)
        </button>
        {currentUser && (
          <button
            onClick={() => onNavigate('my-appointments')}
            className={`px-2.5 py-1 rounded-md font-medium ${currentView === 'my-appointments' ? 'bg-white shadow-xs text-clinical-700 font-bold' : 'text-slate-600'}`}
          >
            Mis Citas
          </button>
        )}
        {currentUser?.role === 'ADMIN' && (
          <button
            onClick={() => onNavigate('admin')}
            className={`px-2.5 py-1 rounded-md font-medium ${currentView === 'admin' ? 'bg-white shadow-xs text-clinical-700 font-bold' : 'text-slate-600'}`}
          >
            Admin
          </button>
        )}
        <button
          onClick={() => onNavigate('public')}
          className={`px-2.5 py-1 rounded-md font-medium ${currentView === 'public' ? 'bg-white shadow-xs text-clinical-700 font-bold' : 'text-slate-600'}`}
        >
          Token
        </button>
      </div>
    </header>
  );
};
