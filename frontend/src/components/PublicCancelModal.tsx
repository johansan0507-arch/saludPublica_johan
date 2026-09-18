import React, { useState, useEffect } from 'react';
import { api } from '../services/apiService';
import { Appointment } from '../types';
import { ShieldAlert, Search, CheckCircle2, AlertCircle, Clock, Stethoscope, RefreshCw } from 'lucide-react';

interface PublicCancelModalProps {
  initialToken?: string;
}

export const PublicCancelModal: React.FC<PublicCancelModalProps> = ({ initialToken }) => {
  const [tokenInput, setTokenInput] = useState(initialToken || '');
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (initialToken) {
      handleSearch(initialToken);
    }
  }, [initialToken]);

  const handleSearch = async (tokenToSearch?: string) => {
    const token = tokenToSearch || tokenInput.trim();
    if (!token) return;

    setLoading(true);
    setMessage(null);
    setAppointment(null);

    try {
      const data = await api.getPublicAppointment(token);
      setAppointment(data);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'No se encontró ninguna cita con ese token.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!appointment) return;
    if (!window.confirm('¿Confirmas que deseas cancelar definitivamente este turno? El cupo será liberado.')) {
      return;
    }

    setCancelling(true);
    setMessage(null);

    try {
      const res = await api.cancelPublicAppointment(appointment.cancelToken);
      setMessage({ type: 'success', text: res.message });
      // Actualizar estado local
      setAppointment({ ...appointment, status: 'CANCELLED' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al cancelar la cita.' });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-clinical-50 text-clinical-600">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Consulta y Cancelación por Token</h1>
            <p className="text-xs text-slate-500">Acceso público directo desde el enlace de tu correo sin iniciar sesión.</p>
          </div>
        </div>

        {/* Input de Token */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex gap-2 mb-6"
        >
          <input
            type="text"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Pega aquí el token UUID recibido en tu correo..."
            className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-clinical-600 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !tokenInput.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-clinical-600 hover:bg-clinical-700 disabled:bg-slate-300 text-white font-semibold rounded-xl text-xs transition-colors"
          >
            {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
            <span>Consultar</span>
          </button>
        </form>

        {/* Mensaje de feedback */}
        {message && (
          <div
            className={`mb-4 rounded-xl p-3 text-xs font-semibold flex items-center gap-2 border ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Detalles del turno consultado */}
        {appointment && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-semibold text-slate-500">Estado de la Cita:</span>
              <span
                className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                  appointment.status === 'SCHEDULED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {appointment.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-700">
              <div>
                <span className="text-slate-400 block text-[10px]">Paciente:</span>
                <strong className="text-slate-900">{appointment.patient?.name}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Especialidad:</span>
                <strong className="text-slate-900">{appointment.specialty?.name}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Médico:</span>
                <strong className="text-slate-900">{appointment.slot?.doctor?.user?.name}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Fecha y Hora:</span>
                <strong className="text-slate-900">
                  {new Date(appointment.slot?.startTime).toLocaleString('es-CO', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </strong>
              </div>
            </div>

            {appointment.status === 'SCHEDULED' && (
              <div className="pt-3 border-t border-slate-200">
                <button
                  onClick={handleCancelAppointment}
                  disabled={cancelling}
                  className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-xs"
                >
                  {cancelling ? 'Cancelando cita...' : 'Cancelar Cita Definitivamente'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
