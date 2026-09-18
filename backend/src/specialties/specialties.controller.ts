import { Controller, Get, Param } from '@nestjs/common';
import { SpecialtiesService } from './specialties.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Especialidades')
@Controller('specialties')
export class SpecialtiesController {
  constructor(private readonly specialtiesService: SpecialtiesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar especialidades médicas' })
  @ApiResponse({ status: 200, description: 'Listado de especialidades disponibles' })
  findAll() {
    return this.specialtiesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una especialidad con sus médicos' })
  @ApiResponse({ status: 200, description: 'Detalle de la especialidad' })
  findOne(@Param('id') id: string) {
    return this.specialtiesService.findOne(id);
  }
}
