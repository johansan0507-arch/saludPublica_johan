import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', description: 'ID del slot de atención seleccionado' })
  @IsUUID('all', { message: 'El slotId debe ser un identificador UUID válido' })
  @IsNotEmpty({ message: 'El ID del turno es obligatorio' })
  slotId: string;

  @ApiPropertyOptional({ example: 'Presento dolor abdominal recurrente desde hace 3 días.', description: 'Motivo de consulta o notas médicas previas' })
  @IsOptional()
  @IsString()
  notes?: string;
}
