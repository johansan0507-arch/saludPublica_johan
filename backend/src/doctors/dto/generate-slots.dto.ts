import { IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GenerateSlotsDto {
  @ApiProperty({ example: '2026-09-20', description: 'Fecha de inicio (YYYY-MM-DD)' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-09-24', description: 'Fecha fin (YYYY-MM-DD)' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ example: 8, default: 8, description: 'Hora de inicio de jornada (0 - 23)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(23)
  startHour?: number = 8;

  @ApiPropertyOptional({ example: 12, default: 12, description: 'Hora fin de jornada (0 - 23)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  endHour?: number = 12;

  @ApiPropertyOptional({ example: 20, default: 20, description: 'Duración de cada slot en minutos (ej: 20)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(10)
  @Max(60)
  slotDurationMinutes?: number = 20;
}
