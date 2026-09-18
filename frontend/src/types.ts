export type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export type SlotStatus = 'AVAILABLE' | 'BOOKED' | 'BLOCKED';

export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  doctorId?: string;
}

export interface Specialty {
  id: string;
  name: string;
  description?: string;
  _count?: {
    doctors?: number;
    appointments?: number;
  };
}

export interface Doctor {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  specialtyId: string;
  specialty: Specialty;
  licenseNumber: string;
  _count?: {
    slots?: number;
  };
}

export interface Slot {
  id: string;
  doctorId: string;
  doctor?: Doctor;
  startTime: string;
  endTime: string;
  status: SlotStatus;
}

export interface Appointment {
  id: string;
  patientId: string;
  patient?: {
    id?: string;
    name: string;
    email: string;
  };
  slotId: string;
  slot: {
    id: string;
    startTime: string;
    endTime: string;
    doctor: {
      user: {
        name: string;
      };
      specialty?: Specialty;
    };
  };
  specialtyId: string;
  specialty: Specialty;
  cancelToken: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
}

export interface SystemStats {
  totals: {
    totalAppointments: number;
    scheduled: number;
    completed: number;
    cancelled: number;
    totalSlots: number;
    availableSlots: number;
    bookedSlots: number;
    occupancyRate: number;
  };
  appointmentsBySpecialty: {
    specialty: string;
    total: number;
  }[];
}

export interface TriageAnalysis {
  recommendedSpecialty: string;
  urgency: 'Baja' | 'Media' | 'Alta';
  reasoning: string;
  recommendations: string[];
}
