import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { GenerateSlotsDto } from './dto/generate-slots.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, SlotStatus } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Médicos')
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar médicos (con filtro opcional por especialidad)' })
  @ApiQuery({ name: 'specialtyId', required: false, description: 'Filtrar por ID de especialidad' })
  @ApiResponse({ status: 200, description: 'Listado de médicos' })
  findAll(@Query('specialtyId') specialtyId?: string) {
    return this.doctorsService.findAll(specialtyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un médico' })
  findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear nuevo médico (Solo Administrador)' })
  @ApiResponse({ status: 201, description: 'Médico registrado exitosamente' })
  @ApiResponse({ status: 403, description: 'Acceso denegado (Requiere rol ADMIN)' })
  create(@Body() dto: CreateDoctorDto) {
    return this.doctorsService.create(dto);
  }

  @Post(':id/slots/generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generar slots automáticos de 20 minutos (Solo Administrador)' })
  @ApiResponse({ status: 201, description: 'Slots generados exitosamente' })
  generateSlots(@Param('id') id: string, @Body() dto: GenerateSlotsDto) {
    return this.doctorsService.generateSlots(id, dto);
  }

  @Get(':id/slots')
  @ApiOperation({ summary: 'Listar slots de un médico (filtrables por estado)' })
  @ApiQuery({ name: 'status', required: false, enum: SlotStatus })
  getSlots(@Param('id') id: string, @Query('status') status?: SlotStatus) {
    return this.doctorsService.getSlots(id, status);
  }
}
