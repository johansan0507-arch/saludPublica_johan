import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AppointmentStatus, Role, SlotStatus } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Reserva atómica de turno con prevención estricta de RACE CONDITIONS.
   * Utiliza una transacción interactiva de base de datos para garantizar
   * que solo un usuario logre reservar un slot específico concurrentemente.
   */
  async create(patientId: string, dto: CreateAppointmentDto) {
    // Transacción interactiva atómica
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Obtener y verificar el estado actual del slot con bloqueo/validación
      const slot = await tx.slot.findUnique({
        where: { id: dto.slotId },
        include: {
          doctor: {
            include: {
              user: { select: { name: true, email: true } },
              specialty: true,
            },
          },
        },
      });

      if (!slot) {
        throw new NotFoundException('El turno solicitado no existe.');
      }

      if (slot.status !== SlotStatus.AVAILABLE) {
        throw new ConflictException(
          'El turno seleccionado ya no está disponible (fue reservado por otro paciente o bloqueado). Por favor elija otro horario.',
        );
      }

      // 2. Actualización atómica condicionada al estado AVAILABLE
      const updateResult = await tx.slot.updateMany({
        where: {
          id: dto.slotId,
          status: SlotStatus.AVAILABLE, // Condición de carrera protegida
        },
        data: {
          status: SlotStatus.BOOKED,
          version: { increment: 1 },
        },
      });

      if (updateResult.count === 0) {
        // Otro proceso tomó el slot en el mismo instante
        throw new ConflictException(
          'Conflicto de concurrencia: El turno acaba de ser tomado por otro paciente.',
        );
      }

      // 3. Crear el turno
      const appointment = await tx.appointment.create({
        data: {
          patientId,
          slotId: dto.slotId,
          specialtyId: slot.doctor.specialtyId,
          status: AppointmentStatus.SCHEDULED,
          notes: dto.notes,
        },
        include: {
          patient: { select: { id: true, name: true, email: true } },
          slot: {
            include: {
              doctor: {
                include: {
                  user: { select: { name: true } },
                  specialty: true,
                },
              },
            },
          },
          specialty: true,
        },
      });

      return appointment;
    });

    // 4. Encolar notificación asíncrona de confirmación (fuera de la transacción)
    this.notificationsService.queueConfirmationEmail({
      patientName: result.patient.name,
      patientEmail: result.patient.email,
      doctorName: result.slot.doctor.user.name,
      specialtyName: result.specialty.name,
      startTime: result.slot.startTime,
      endTime: result.slot.endTime,
      cancelToken: result.cancelToken,
    });

    return result;
  }

  async findUserAppointments(userId: string, role: Role) {
    if (role === Role.ADMIN) {
      return this.prisma.appointment.findMany({
        include: {
          patient: { select: { id: true, name: true, email: true } },
          specialty: true,
          slot: {
            include: {
              doctor: {
                include: {
                  user: { select: { name: true } },
                },
              },
            },
          },
        },
        orderBy: { slot: { startTime: 'desc' } },
      });
    }

    if (role === Role.DOCTOR) {
      const doctor = await this.prisma.doctor.findUnique({
        where: { userId },
      });

      if (!doctor) {
        return [];
      }

      return this.prisma.appointment.findMany({
        where: {
          slot: { doctorId: doctor.id },
        },
        include: {
          patient: { select: { id: true, name: true, email: true } },
          specialty: true,
          slot: true,
        },
        orderBy: { slot: { startTime: 'asc' } },
      });
    }

    // Por defecto: PATIENT
    return this.prisma.appointment.findMany({
      where: { patientId: userId },
      include: {
        specialty: true,
        slot: {
          include: {
            doctor: {
              include: {
                user: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { slot: { startTime: 'desc' } },
    });
  }

  async getStats() {
    const totalAppointments = await this.prisma.appointment.count();
    const scheduled = await this.prisma.appointment.count({
      where: { status: AppointmentStatus.SCHEDULED },
    });
    const completed = await this.prisma.appointment.count({
      where: { status: AppointmentStatus.COMPLETED },
    });
    const cancelled = await this.prisma.appointment.count({
      where: { status: AppointmentStatus.CANCELLED },
    });

    const totalSlots = await this.prisma.slot.count();
    const availableSlots = await this.prisma.slot.count({
      where: { status: SlotStatus.AVAILABLE },
    });
    const bookedSlots = await this.prisma.slot.count({
      where: { status: SlotStatus.BOOKED },
    });

    const occupancyRate = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;

    // Conteo por especialidad para gráficos Recharts
    const specialties = await this.prisma.specialty.findMany({
      include: {
        _count: {
          select: { appointments: true },
        },
      },
    });

    const appointmentsBySpecialty = specialties.map((s) => ({
      specialty: s.name,
      total: s._count.appointments,
    }));

    return {
      totals: {
        totalAppointments,
        scheduled,
        completed,
        cancelled,
        totalSlots,
        availableSlots,
        bookedSlots,
        occupancyRate,
      },
      appointmentsBySpecialty,
    };
  }

  // --- MÉTODOS PÚBLICOS POR TOKEN (SIN LOGIN) ---

  async findByToken(token: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { cancelToken: token },
      include: {
        patient: { select: { name: true, email: true } },
        specialty: true,
        slot: {
          include: {
            doctor: {
              include: {
                user: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('No se encontró ningún turno asociado a este enlace.');
    }

    return appointment;
  }

  async cancelByToken(token: string) {
    const appointment = await this.findByToken(token);

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new ConflictException('Este turno ya había sido cancelado previamente.');
    }

    // Cancelar atómicamente y liberar el slot
    await this.prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id: appointment.id },
        data: { status: AppointmentStatus.CANCELLED },
      });

      await tx.slot.update({
        where: { id: appointment.slotId },
        data: { status: SlotStatus.AVAILABLE },
      });
    });

    // Encolar email de confirmación de cancelación
    this.notificationsService.queueCancellationEmail({
      patientName: appointment.patient.name,
      patientEmail: appointment.patient.email,
      doctorName: appointment.slot.doctor.user.name,
      specialtyName: appointment.specialty.name,
      startTime: appointment.slot.startTime,
    });

    return {
      message: 'Turno cancelado exitosamente. El horario ha sido liberado para otros pacientes.',
      appointmentId: appointment.id,
      status: AppointmentStatus.CANCELLED,
    };
  }
}
