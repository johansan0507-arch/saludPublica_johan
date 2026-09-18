import { User, Specialty, Doctor, Slot, Appointment, SystemStats } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiService {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.message || `Error en la solicitud (${response.status})`;
      throw new Error(Array.isArray(message) ? message.join(', ') : message);
    }
    return response.json();
  }

  // --- AUTENTICACIÓN ---

  async register(data: { name: string; email: string; password: string; role?: string }) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await this.handleResponse<{ user: User; token: string; message: string }>(res);
    if (result.token) {
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
    }
    return result;
  }

  async login(data: { email: string; password: string }) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await this.handleResponse<{ user: User; token: string; message: string }>(res);
    if (result.token) {
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
    }
    return result;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  // --- ESPECIALIDADES Y MÉDICOS ---

  async getSpecialties(): Promise<Specialty[]> {
    const res = await fetch(`${API_URL}/specialties`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<Specialty[]>(res);
  }

  async getDoctors(specialtyId?: string): Promise<Doctor[]> {
    const url = specialtyId ? `${API_URL}/doctors?specialtyId=${specialtyId}` : `${API_URL}/doctors`;
    const res = await fetch(url, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<Doctor[]>(res);
  }

  async getDoctorSlots(doctorId: string, status: string = 'AVAILABLE'): Promise<Slot[]> {
    const res = await fetch(`${API_URL}/doctors/${doctorId}/slots?status=${status}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<Slot[]>(res);
  }

  // --- TURNOS (APPOINTMENTS) ---

  async getMyAppointments(): Promise<Appointment[]> {
    const res = await fetch(`${API_URL}/appointments`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<Appointment[]>(res);
  }

  async bookAppointment(slotId: string, notes?: string): Promise<Appointment> {
    const res = await fetch(`${API_URL}/appointments`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ slotId, notes }),
    });
    return this.handleResponse<Appointment>(res);
  }

  async getStats(): Promise<SystemStats> {
    const res = await fetch(`${API_URL}/appointments/stats`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<SystemStats>(res);
  }

  // --- ADMINISTRACIÓN ---

  async generateDoctorSlots(
    doctorId: string,
    data: { startDate: string; endDate: string; startHour?: number; endHour?: number; slotDurationMinutes?: number },
  ) {
    const res = await fetch(`${API_URL}/doctors/${doctorId}/slots/generate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<{ message: string; count: number }>(res);
  }

  async createDoctor(data: { name: string; email: string; password: string; licenseNumber: string; specialtyId: string }) {
    const res = await fetch(`${API_URL}/doctors`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<Doctor>(res);
  }

  // --- ACCESO PÚBLICO POR TOKEN ---

  async getPublicAppointment(token: string): Promise<Appointment> {
    const res = await fetch(`${API_URL}/appointments-public/token/${token}`);
    return this.handleResponse<Appointment>(res);
  }

  async cancelPublicAppointment(token: string) {
    const res = await fetch(`${API_URL}/appointments-public/cancel/${token}`, {
      method: 'POST',
    });
    return this.handleResponse<{ message: string; appointmentId: string }>(res);
  }
}

export const api = new ApiService();
