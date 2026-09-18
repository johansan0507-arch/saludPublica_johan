import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Estado de la API')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Estado del Servidor Backend API' })
  @ApiResponse({ status: 200, description: 'Servidor en línea y operativo' })
  getHealth() {
    return {
      status: 'online',
      name: 'SaludPública Connect API',
      version: '1.0.0',
      documentation: '/api',
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
      message: 'Servidor NestJS activo. Consulta la documentación interactiva en /api o ingresa a la aplicación web en el puerto 3000.',
    };
  }
}
