import { Controller, Get, Post, Param } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Turnos Públicos (Acceso por Token)')
@Controller('appointments-public')
export class AppointmentsPublicController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get('token/:token')
  @ApiOperation({ summary: 'Consultar información de un turno mediante token seguro (Sin Login)' })
  @ApiResponse({ status: 200, description: 'Datos del turno consultado' })
  @ApiResponse({ status: 404, description: 'Token de turno no encontrado' })
  findByToken(@Param('token') token: string) {
    return this.appointmentsService.findByToken(token);
  }

  @Post('cancel/:token')
  @ApiOperation({ summary: 'Cancelar turno médico directamente desde enlace de correo (Sin Login)' })
  @ApiResponse({ status: 200, description: 'Turno cancelado y horario liberado' })
  @ApiResponse({ status: 409, description: 'El turno ya estaba cancelado' })
  cancelByToken(@Param('token') token: string) {
    return this.appointmentsService.cancelByToken(token);
  }
}
