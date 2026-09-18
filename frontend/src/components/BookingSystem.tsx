import React, { useState, useEffect } from 'react';
import { api } from '../services/apiService';
import { Specialty, Doctor, Slot, User } from '../types';
import { 
  Calendar, 
  Clock, 
  User as UserIcon, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  ArrowLeft,
  CalendarCheck,
  Stethoscope,
  Building2,
  Lock,
  RefreshCw
} from 'lucide-react';

interface BookingSystemProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  preselectedSpecialtyName?: string;
  onBookingSuccess: () => void;
}

export const BookingSystem: React.FC<BookingSystemProps> = ({
  currentUser,
  onOpenAuth,
  preselectedSpecialtyName,
  onBookingSuccess,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(null);

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState<any | null>(null);

  // Cargar especialidades al montar
  useEffect(() => {
    loadSpecialties();
  }, []);

  const loadSpecialties = async () => {
    try {
      setLoading(true);
      const data = await api.getSpecialties();
      setSpecialties(data);

      if (preselectedSpecialtyName) {
        const found = data.find(
          (s) => s.name.toLowerCase() === preselectedSpecialtyName.toLowerCase()
        );
        if (found) {
          handleSelectSpecialty(found);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al cargar especialidades');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSpecialty = async (specialty: Specialty) => {
    setSelectedSpecialty(specialty);
    setSelectedDoctor(null);
    setSelectedSlot(null);
    setErrorMessage(null);
    setStep(2);

    try {
      setLoading(true);
      const docs = await api.getDoctors(specialty.id);
      setDoctors(docs);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al cargar médicos');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDoctor = async (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setSelectedSlot(null);
    setErrorMessage(null);
    setStep(3);

    try {
      setLoading(true);
      const docSlots = await api.getDoctorSlots(doctor.id, 'AVAILABLE');
      setSlots(docSlots);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al cargar horarios disponibles');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (!selectedSlot) return;

    setBookingLoading(true);
    setErrorMessage(null);

    try {
      const appointment = await api.bookAppointment(selectedSlot.id, notes);
      setSuccessModal(appointment);
      // Recargar slots para reflejar que ya no está disponible
      if (selectedDoctor) {
        const docSlots = await api.getDoctorSlots(selectedDoctor.id, 'AVAILABLE');
        setSlots(docSlots);
      }
    } catch (err: any) {
      // Manejo específico de race conditions o conflicto de concurrencia
      setErrorMessage(err.message || 'No se pudo reservar el turno. Por favor intente nuevamente.');
      // Refrescar slots para verificar cuáles siguen disponibles
      if (selectedDoctor) {
        const docSlots = await api.getDoctorSlots(selectedDoctor.id, 'AVAILABLE');
        setSlots(docSlots);
      }
      setSelectedSlot(null);
    } finally {
      setBookingLoading(false);
    }
  };

  // Agrupar slots por fecha (YYYY-MM-DD)
  const groupedSlots = slots.reduce<Record<string, Slot[]>>((acc, slot) => {
    const dateKey = new Date(slot.startTime).toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(slot);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header Impeccable */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Reserva de Turno Médico
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Atención pública en slots estrictos de 20 minutos. Asignación inmediata y confirmación a tu correo.
        </p>
      </div>

      {/* Breadcrumb Steps Navigation */}
      <div className="flex items-center gap-2 mb-8 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs text-xs font-semibold text-slate-500 overflow-x-auto">
        <button
          onClick={() => setStep(1)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            step === 1 ? 'bg-clinical-600 text-white shadow-xs' : 'hover:text-slate-800'
          }`}
        >
          <span>1. Especialidad</span>
          {selectedSpecialty && <span className="font-normal opacity-90">({selectedSpecialty.name})</span>}
        </button>

        <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />

        <button
          onClick={() => selectedSpecialty && setStep(2)}
          disabled={!selectedSpecialty}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all disabled:opacity-40 ${
            step === 2 ? 'bg-clinical-600 text-white shadow-xs' : 'hover:text-slate-800'
          }`}
        >
          <span>2. Médico</span>
          {selectedDoctor && <span className="font-normal opacity-90">({selectedDoctor.user.name})</span>}
        </button>

        <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />

        <button
          disabled={!selectedDoctor}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all disabled:opacity-40 ${
            step === 3 ? 'bg-clinical-600 text-white shadow-xs' : 'text-slate-500'
          }`}
        >
          <span>3. Horario (20 min)</span>
        </button>
      </div>

      {/* Error Alert with high clinical contrast */}
      {errorMessage && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-900 text-sm">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Aviso del Sistema</p>
            <p className="mt-0.5 text-xs text-rose-800">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="flex items-center justify-center py-16 gap-3 text-slate-500 text-sm">
          <RefreshCw className="h-5 w-5 animate-spin text-clinical-600" />
          <span>Consultando disponibilidad en tiempo real...</span>
        </div>
      )}

      {/* STEP 1: Selección de Especialidad */}
      {!loading && step === 1 && (
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
            Selecciona la Especialidad Médica
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {specialties.map((spec) => (
              <button
                key={spec.id}
                onClick={() => handleSelectSpecialty(spec)}
                className="text-left rounded-2xl border border-slate-200 bg-white p-5 hover:border-clinical-600 hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-clinical-50 text-clinical-600 group-hover:bg-clinical-600 group-hover:text-white transition-colors">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {spec._count?.doctors || 0} médicos
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-clinical-700 transition-colors">
                    {spec.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {spec.description || 'Atención especializada en centro de salud público.'}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-end text-xs font-semibold text-clinical-600 gap-1">
                  <span>Elegir</span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: Selección de Médico */}
      {!loading && step === 2 && selectedSpecialty && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Médicos disponibles en {selectedSpecialty.name}
            </h2>
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Volver a especialidades
            </button>
          </div>

          {doctors.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <UserIcon className="h-10 w-10 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-900">No hay médicos registrados aún</p>
              <p className="text-xs text-slate-500 mt-1">El administrador debe asignar personal a esta especialidad.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {doctors.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => handleSelectDoctor(doc)}
                  className="text-left rounded-2xl border border-slate-200 bg-white p-5 hover:border-clinical-600 hover:shadow-md transition-all group flex items-start gap-4"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-clinical-50 text-clinical-700 font-bold text-base border border-clinical-100 group-hover:bg-clinical-600 group-hover:text-white transition-colors">
                    {doc.user.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-clinical-700 transition-colors">
                      {doc.user.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Licencia: {doc.licenseNumber}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <Clock className="h-3 w-3" />
                        {doc._count?.slots || 0} turnos disponibles
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-clinical-600 self-center" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STEP 3: Selección de Slots de 20 minutos */}
      {!loading && step === 3 && selectedDoctor && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Selecciona un turno de 20 minutos
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Profesional: <strong>{selectedDoctor.user.name}</strong> ({selectedSpecialty?.name})
              </p>
            </div>
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Cambiar médico
            </button>
          </div>

          {Object.keys(groupedSlots).length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <Calendar className="h-10 w-10 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-900">No hay slots disponibles en este momento</p>
              <p className="text-xs text-slate-500 mt-1">El administrador puede generar nuevos turnos desde el panel de control.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedSlots).map(([dateLabel, dateSlots]) => (
                <div key={dateLabel} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                  <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                    <CalendarCheck className="h-4 w-4 text-clinical-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800 capitalize">
                      {dateLabel}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                    {dateSlots.map((slot) => {
                      const startTime = new Date(slot.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      const endTime = new Date(slot.endTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      const isSelected = selectedSlot?.id === slot.id;

                      return (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot)}
                          className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                            isSelected
                              ? 'border-clinical-600 bg-clinical-50 text-clinical-900 ring-2 ring-clinical-600 shadow-xs'
                              : 'border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300 text-slate-800'
                          }`}
                        >
                          <span className="text-xs font-bold block">{startTime}</span>
                          <span className="text-[10px] text-slate-500">hasta {endTime}</span>
                          <span className="mt-1 text-[9px] font-semibold text-emerald-600 uppercase">
                            20 min
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Booking Confirmation Box */}
              {selectedSlot && (
                <div className="mt-6 rounded-2xl border border-clinical-200 bg-clinical-50/50 p-6 shadow-xs">
                  <h3 className="font-bold text-slate-900 text-base mb-2">
                    Resumen de la Cita Seleccionada
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700 mb-4">
                    <div>
                      <span className="text-slate-500 block">Especialidad:</span>
                      <strong className="text-slate-900">{selectedSpecialty?.name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Médico Tratante:</span>
                      <strong className="text-slate-900">{selectedDoctor.user.name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Fecha y Horario:</span>
                      <strong className="text-slate-900">
                        {new Date(selectedSlot.startTime).toLocaleString('es-CO', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })} (20 min)
                      </strong>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Motivo de consulta o síntomas breves (opcional):
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ej: Dolor lumbar persistente, control de tensión..."
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs focus:border-clinical-600 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-clinical-200/60">
                    <div className="text-xs text-slate-600">
                      {currentUser ? (
                        <span>Reservando como: <strong>{currentUser.name}</strong> ({currentUser.email})</span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-800">
                          <Lock className="h-3.5 w-3.5" /> Se requiere iniciar sesión para confirmar
                        </span>
                      )}
                    </div>

                    <button
                      onClick={handleConfirmBooking}
                      disabled={bookingLoading}
                      className="flex items-center gap-2 bg-clinical-600 hover:bg-clinical-700 disabled:bg-slate-300 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all active:scale-98"
                    >
                      {bookingLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Verificando disponibilidad atómica...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Confirmar Reserva de Turno</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal de Éxito de Reserva */}
      {successModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 text-center animate-in fade-in zoom-in duration-150">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 mb-4">
              <CheckCircle2 className="h-8 w-8 stroke-[2.2]" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">¡Turno Reservado con Éxito!</h3>
            <p className="mt-1 text-xs text-slate-600">
              Se ha asegurado tu lugar y enviado una notificación con el enlace de cancelación a tu correo.
            </p>

            <div className="my-4 rounded-xl bg-slate-50 p-4 text-left text-xs space-y-2 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Especialidad:</span>
                <strong className="text-slate-900">{successModal.specialty?.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Profesional:</span>
                <strong className="text-slate-900">{successModal.slot?.doctor?.user?.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fecha:</span>
                <strong className="text-slate-900">
                  {new Date(successModal.slot?.startTime).toLocaleString('es-CO', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </strong>
              </div>
              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 break-all">
                <span>Token único: {successModal.cancelToken}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setSuccessModal(null);
                onBookingSuccess();
              }}
              className="w-full bg-clinical-600 hover:bg-clinical-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors"
            >
              Entendido / Ver Mis Turnos
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
