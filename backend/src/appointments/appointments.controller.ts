import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Turnos Médicos')
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar turnos del usuario autenticado (Paciente/Doctor/Admin)' })
  @ApiResponse({ status: 200, description: 'Listado de turnos' })
  findUserAppointments(@Request() req) {
    return this.appointmentsService.findUserAppointments(req.user.id, req.user.role);
  }

  @Post()
  @Roles(Role.PATIENT, Role.ADMIN)
  @ApiOperation({ summary: 'Reservar un turno médico (Prevención atómica de Race Conditions)' })
  @ApiResponse({ status: 201, description: 'Turno reservado exitosamente' })
  @ApiResponse({ status: 409, description: 'Conflicto: El slot ya fue reservado concurrentemente' })
  create(@Request() req, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(req.user.id, dto);
  }

  @Get('stats')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Obtener métricas y estadísticas del sistema (Solo Admin)' })
  @ApiResponse({ status: 200, description: 'Métricas de ocupación y turnos por especialidad' })
  getStats() {
    return this.appointmentsService.getStats();
  }
}
