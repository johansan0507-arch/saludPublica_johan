import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDoctorDto {
  @ApiProperty({ example: 'Dr. Alejandro Peña', description: 'Nombre completo del médico' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'dr.pena@saludpublica.gov.co', description: 'Correo del médico' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Doctor123!', description: 'Contraseña de acceso' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'MP-9921-MG', description: 'Número de registro / licencia médica' })
  @IsString()
  @IsNotEmpty()
  licenseNumber: string;

  @ApiProperty({ description: 'ID de la especialidad médica' })
  @IsString()
  @IsNotEmpty()
  specialtyId: string;
}
