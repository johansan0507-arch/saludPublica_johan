import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { GenerateSlotsDto } from './dto/generate-slots.dto';
import * as bcrypt from 'bcryptjs';
import { Role, SlotStatus } from '@prisma/client';

@Injectable()
export class DoctorsService {
  constructor(private prisma: PrismaService) {}

  async findAll(specialtyId?: string) {
    const where: any = {};
    if (specialtyId) {
      where.specialtyId = specialtyId;
    }

    return this.prisma.doctor.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        specialty: true,
        _count: {
          select: {
            slots: {
              where: { status: SlotStatus.AVAILABLE },
            },
          },
        },
      },
      orderBy: { user: { name: 'asc' } },
    });
  }

  async findOne(id: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        specialty: true,
      },
    });

    if (!doctor) {
      throw new NotFoundException('Médico no encontrado');
    }

    return doctor;
  }

  async create(dto: CreateDoctorDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Ya existe un usuario con este correo electrónico');
    }

    const specialty = await this.prisma.specialty.findUnique({
      where: { id: dto.specialtyId },
    });

    if (!specialty) {
      throw new NotFoundException('Especialidad médica no encontrada');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email.toLowerCase(),
          password: hashedPassword,
          role: Role.DOCTOR,
        },
      });

      const doctor = await tx.doctor.create({
        data: {
          userId: user.id,
          specialtyId: dto.specialtyId,
          licenseNumber: dto.licenseNumber,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          specialty: true,
        },
      });

      return doctor;
    });
  }

  async generateSlots(doctorId: string, dto: GenerateSlotsDto) {
    await this.findOne(doctorId);

    const duration = dto.slotDurationMinutes || 20;
    const startHour = dto.startHour ?? 8;
    const endHour = dto.endHour ?? 12;

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    const slotsToCreate = [];
    const current = new Date(start);

    while (current <= end) {
      // Omitir fines de semana
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        for (let hour = startHour; hour < endHour; hour++) {
          for (let min = 0; min < 60; min += duration) {
            const slotStart = new Date(current);
            slotStart.setHours(hour, min, 0, 0);

            const slotEnd = new Date(slotStart);
            slotEnd.setMinutes(slotStart.getMinutes() + duration);

            if (slotEnd.getHours() > endHour || (slotEnd.getHours() === endHour && slotEnd.getMinutes() > 0)) {
              continue;
            }

            slotsToCreate.push({
              doctorId,
              startTime: slotStart,
              endTime: slotEnd,
              status: SlotStatus.AVAILABLE,
              version: 0,
            });
          }
        }
      }
      current.setDate(current.getDate() + 1);
    }

    if (slotsToCreate.length === 0) {
      return { message: 'No se generaron slots para el rango especificado', count: 0 };
    }

    // Insertar en base de datos
    await this.prisma.slot.createMany({
      data: slotsToCreate,
    });

    return {
      message: `Se generaron exitosamente ${slotsToCreate.length} slots de ${duration} minutos`,
      count: slotsToCreate.length,
    };
  }

  async getSlots(doctorId: string, status?: SlotStatus) {
    const where: any = { doctorId };
    if (status) {
      where.status = status;
    }

    return this.prisma.slot.findMany({
      where,
      orderBy: { startTime: 'asc' },
    });
  }
}
