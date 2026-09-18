import React, { useState, useEffect } from 'react';
import { api } from '../services/apiService';
import { Appointment } from '../types';
import { Calendar, Clock, User as UserIcon, CheckCircle2, XCircle, AlertCircle, RefreshCw, KeyRound } from 'lucide-react';

export const MyAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getMyAppointments();
      setAppointments(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar turnos');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (cancelToken: string) => {
    if (!window.confirm('¿Estás seguro de cancelar este turno médico? El horario será liberado para otros ciudadanos.')) {
      return;
    }

    try {
      await api.cancelPublicAppointment(cancelToken);
      loadAppointments();
    } catch (err: any) {
      alert(err.message || 'No se pudo cancelar el turno');
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Mis Turnos Médicos
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Historial y citas programadas asociadas a tu cuenta de usuario.
          </p>
        </div>
        <button
          onClick={loadAppointments}
          disabled={loading}
          className="p-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
          title="Actualizar lista"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-clinical-600' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-900 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16 text-xs text-slate-500 gap-2 items-center">
          <RefreshCw className="h-4 w-4 animate-spin text-clinical-600" />
          <span>Cargando turnos agendados...</span>
        </div>
      ) : appointments.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Calendar className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-900">No tienes citas médicas activas</p>
          <p className="text-xs text-slate-500 mt-1">Usa la opción "Reservar Turno" o "Triaje IA" para solicitar una.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((app) => {
            const formattedDate = new Date(app.slot.startTime).toLocaleString('es-CO', {
              dateStyle: 'full',
              timeStyle: 'short',
            });

            return (
              <div
                key={app.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-slate-300"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {app.specialty?.name || 'Consulta Médica'}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        app.status === 'SCHEDULED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.status === 'CANCELLED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {app.status === 'SCHEDULED' && <CheckCircle2 className="h-3 w-3" />}
                      {app.status === 'CANCELLED' && <XCircle className="h-3 w-3" />}
                      {app.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 flex items-center gap-1.5">
                    <UserIcon className="h-3.5 w-3.5 text-clinical-600" />
                    Médico: <strong>{app.slot.doctor.user.name}</strong>
                  </p>

                  <p className="text-xs text-slate-600 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-clinical-600" />
                    {formattedDate} (20 min)
                  </p>

                  {app.notes && (
                    <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg mt-2 italic">
                      "{app.notes}"
                    </p>
                  )}

                  <div className="pt-2 text-[10px] text-slate-400 flex items-center gap-1">
                    <KeyRound className="h-3 w-3" />
                    <span>Token: {app.cancelToken}</span>
                  </div>
                </div>

                {app.status === 'SCHEDULED' && (
                  <button
                    onClick={() => handleCancel(app.cancelToken)}
                    className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold self-start sm:self-center transition-colors"
                  >
                    Cancelar Cita
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
