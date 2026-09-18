import React, { useState, useEffect } from 'react';
import { api } from '../services/apiService';
import { SystemStats, Doctor, Specialty } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  BarChart3,
  Users,
  Calendar,
  Clock,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Activity,
  Layers,
  Percent,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Formulario Generador de Slots
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(12);
  const [slotDuration, setSlotDuration] = useState(20);
  const [generatingSlots, setGeneratingSlots] = useState(false);

  // Formulario Nuevo Médico
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newDoctorEmail, setNewDoctorEmail] = useState('');
  const [newDoctorPass, setNewDoctorPass] = useState('Doctor123!');
  const [newDoctorLicense, setNewDoctorLicense] = useState('');
  const [newDoctorSpecialtyId, setNewDoctorSpecialtyId] = useState('');
  const [creatingDoctor, setCreatingDoctor] = useState(false);

  useEffect(() => {
    loadData();
    // Default dates for slot generator (today + 1 to today + 5)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const inFiveDays = new Date();
    inFiveDays.setDate(inFiveDays.getDate() + 5);

    setStartDate(tomorrow.toISOString().split('T')[0]);
    setEndDate(inFiveDays.toISOString().split('T')[0]);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, docsData, specsData] = await Promise.all([
        api.getStats(),
        api.getDoctors(),
        api.getSpecialties(),
      ]);
      setStats(statsData);
      setDoctors(docsData);
      setSpecialties(specsData);
      if (docsData.length > 0 && !selectedDoctorId) {
        setSelectedDoctorId(docsData[0].id);
      }
      if (specsData.length > 0 && !newDoctorSpecialtyId) {
        setNewDoctorSpecialtyId(specsData[0].id);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error al cargar métricas de administración' });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSlots = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId) return;

    setGeneratingSlots(true);
    setFeedback(null);

    try {
      const res = await api.generateDoctorSlots(selectedDoctorId, {
        startDate,
        endDate,
        startHour: Number(startHour),
        endHour: Number(endHour),
        slotDurationMinutes: Number(slotDuration),
      });

      setFeedback({ type: 'success', message: res.message });
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error al generar slots' });
    } finally {
      setGeneratingSlots(false);
    }
  };

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingDoctor(true);
    setFeedback(null);

    try {
      await api.createDoctor({
        name: newDoctorName,
        email: newDoctorEmail,
        password: newDoctorPass,
        licenseNumber: newDoctorLicense,
        specialtyId: newDoctorSpecialtyId,
      });

      setFeedback({ type: 'success', message: `Médico ${newDoctorName} registrado exitosamente.` });
      setShowDoctorModal(false);
      setNewDoctorName('');
      setNewDoctorEmail('');
      setNewDoctorLicense('');
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error al crear médico' });
    } finally {
      setCreatingDoctor(false);
    }
  };

  const COLORS = ['#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd'];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1 text-clinical-600 font-semibold text-xs uppercase tracking-wider">
            <BarChart3 className="h-4 w-4" />
            Panel de Control Central
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Administración y Métricas
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Monitoreo en tiempo real de ocupación de slots, demanda por especialidad y control médico.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDoctorModal(true)}
            className="flex items-center gap-2 bg-clinical-600 hover:bg-clinical-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-98"
          >
            <PlusCircle className="h-4 w-4" />
            Nuevo Médico
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
            title="Actualizar datos"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-clinical-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`mb-6 flex items-start gap-3 rounded-xl p-4 text-xs font-medium border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Metric Cards - Impeccable Operate Mode */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Citas</span>
              <Calendar className="h-4 w-4 text-clinical-600" />
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block">
              {stats.totals.totalAppointments}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {stats.totals.scheduled} agendadas actualmente
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Tasa Ocupación</span>
              <Percent className="h-4 w-4 text-clinical-600" />
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-clinical-700 block">
              {stats.totals.occupancyRate}%
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {stats.totals.bookedSlots} de {stats.totals.totalSlots} slots tomados
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Slots Disponibles</span>
              <Clock className="h-4 w-4 text-emerald-600" />
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 block">
              {stats.totals.availableSlots}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Horarios libres de 20 minutos
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Cancelaciones</span>
              <Activity className="h-4 w-4 text-rose-500" />
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 block">
              {stats.totals.cancelled}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Liberadas por pacientes
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recharts: Turnos por Especialidad */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Demanda por Especialidad Médica</h2>
              <p className="text-xs text-slate-500 mt-0.5">Distribución total de turnos agendados</p>
            </div>
            <Layers className="h-4 w-4 text-clinical-600" />
          </div>

          <div className="h-64 w-full">
            {stats && stats.appointmentsBySpecialty.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.appointmentsBySpecialty} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="specialty" tick={{ fontSize: 11, fill: '#64748b' }} angle={-15} textAnchor="end" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="total" name="Turnos" radius={[6, 6, 0, 0]}>
                    {stats.appointmentsBySpecialty.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                Aún no hay datos de turnos por especialidad
              </div>
            )}
          </div>
        </div>

        {/* Generador Automático de Slots de 20 minutos */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Generar Slots Automáticos</h2>
              <p className="text-xs text-slate-500 mt-0.5">Creación masiva de turnos de 20 min</p>
            </div>
            <Clock className="h-4 w-4 text-clinical-600" />
          </div>

          <form onSubmit={handleGenerateSlots} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Médico:</label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-clinical-600 focus:outline-none"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.user.name} ({d.specialty.name})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fecha Inicio:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-clinical-600 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fecha Fin:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-clinical-600 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hora Inicio:</label>
                <input
                  type="number"
                  min="6"
                  max="20"
                  value={startHour}
                  onChange={(e) => setStartHour(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-clinical-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hora Fin:</label>
                <input
                  type="number"
                  min="7"
                  max="22"
                  value={endHour}
                  onChange={(e) => setEndHour(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-clinical-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Duración:</label>
                <input
                  type="number"
                  value={slotDuration}
                  readOnly
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-600 font-bold"
                  title="20 minutos por estándar de laboratorio SENA"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={generatingSlots}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-clinical-600 hover:bg-clinical-700 disabled:bg-slate-300 text-white font-bold py-2.5 rounded-xl transition-all shadow-xs"
            >
              {generatingSlots ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Generando turnos...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Generar Bloques de 20 min</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Lista de Médicos y Capacidad */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Equipo Médico Registrado</h2>
            <p className="text-xs text-slate-500 mt-0.5">Control de profesionales y disponibilidad actual</p>
          </div>
          <Users className="h-4 w-4 text-clinical-600" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {doctors.map((doc) => (
            <div key={doc.id} className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
              <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-md bg-clinical-100 text-clinical-800 mb-2">
                {doc.specialty.name}
              </span>
              <h3 className="font-bold text-slate-900 text-sm">{doc.user.name}</h3>
              <p className="text-xs text-slate-500">{doc.user.email}</p>
              <p className="text-[11px] text-slate-400 mt-1">Lic: {doc.licenseNumber}</p>
              <div className="mt-3 pt-2 border-t border-slate-200 text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{doc._count?.slots || 0} turnos disponibles</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Nuevo Médico */}
      {showDoctorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-1">Registrar Nuevo Médico</h3>
            <p className="text-xs text-slate-500 mb-4">Crea una cuenta de profesional con su respectiva especialidad.</p>

            <form onSubmit={handleCreateDoctor} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre Completo:</label>
                <input
                  type="text"
                  placeholder="Dr. Juan Martínez"
                  value={newDoctorName}
                  onChange={(e) => setNewDoctorName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-clinical-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Correo Electrónico:</label>
                <input
                  type="email"
                  placeholder="juan.martinez@saludpublica.gov.co"
                  value={newDoctorEmail}
                  onChange={(e) => setNewDoctorEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-clinical-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contraseña:</label>
                <input
                  type="password"
                  value={newDoctorPass}
                  onChange={(e) => setNewDoctorPass(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-clinical-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Registro / Licencia Médica:</label>
                <input
                  type="text"
                  placeholder="MP-5542-COL"
                  value={newDoctorLicense}
                  onChange={(e) => setNewDoctorLicense(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-clinical-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Especialidad Asignada:</label>
                <select
                  value={newDoctorSpecialtyId}
                  onChange={(e) => setNewDoctorSpecialtyId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-clinical-600 focus:outline-none"
                >
                  {specialties.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDoctorModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingDoctor}
                  className="flex-1 py-2 rounded-xl bg-clinical-600 hover:bg-clinical-700 text-white font-bold disabled:bg-slate-300"
                >
                  {creatingDoctor ? 'Guardando...' : 'Crear Médico'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
