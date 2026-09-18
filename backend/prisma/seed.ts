import { PrismaClient, Role, SlotStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de datos para SaludPública Connect...');

  // 1. Limpiar base de datos en orden relacional
  await prisma.appointment.deleteMany();
  await prisma.slot.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.specialty.deleteMany();
  await prisma.user.deleteMany();

  const saltRounds = 10;
  const adminPassword = await bcrypt.hash('Admin123!', saltRounds);
  const doctorPassword = await bcrypt.hash('Doctor123!', saltRounds);
  const patientPassword = await bcrypt.hash('Paciente123!', saltRounds);

  // 2. Crear Administrador
  const admin = await prisma.user.create({
    data: {
      name: 'Administrador General',
      email: 'admin@saludpublica.gov.co',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });
  console.log(`✅ Admin creado: ${admin.email}`);

  // 3. Crear Paciente de prueba
  const patient = await prisma.user.create({
    data: {
      name: 'Juan Pérez (Paciente)',
      email: 'paciente@saludpublica.gov.co',
      password: patientPassword,
      role: Role.PATIENT,
    },
  });
  console.log(`✅ Paciente de prueba creado: ${patient.email}`);

  // 4. Crear 5 Especialidades
  const specialtiesData = [
    {
      name: 'Medicina General',
      description: 'Atención primaria integral, diagnóstico y prevención clínica.',
    },
    {
      name: 'Pediatría',
      description: 'Atención médica y preventiva para infantes, niños y adolescentes.',
    },
    {
      name: 'Odontología',
      description: 'Cuidado de salud bucodental, limpieza, profilaxis y operatoria.',
    },
    {
      name: 'Ginecología',
      description: 'Salud sexual y reproductiva integral de la mujer.',
    },
    {
      name: 'Cardiología',
      description: 'Diagnóstico, seguimiento y tratamiento cardiovascular.',
    },
  ];

  const specialties = [];
  for (const s of specialtiesData) {
    const created = await prisma.specialty.create({ data: s });
    specialties.push(created);
  }
  console.log(`✅ 5 Especialidades creadas.`);

  // 5. Crear 4 Médicos
  const doctorsData = [
    {
      name: 'Dr. Roberto Gómez',
      email: 'dr.gomez@saludpublica.gov.co',
      licenseNumber: 'MP-8921-MG',
      specialtyId: specialties[0].id, // Medicina General
    },
    {
      name: 'Dra. Elena Ramos',
      email: 'dra.ramos@saludpublica.gov.co',
      licenseNumber: 'MP-4412-PED',
      specialtyId: specialties[1].id, // Pediatría
    },
    {
      name: 'Dr. Camilo Torres',
      email: 'dr.torres@saludpublica.gov.co',
      licenseNumber: 'MP-1934-ODO',
      specialtyId: specialties[2].id, // Odontología
    },
    {
      name: 'Dra. Sofía Morales',
      email: 'dra.morales@saludpublica.gov.co',
      licenseNumber: 'MP-7731-CARD',
      specialtyId: specialties[4].id, // Cardiología
    },
  ];

  const doctors = [];
  for (const d of doctorsData) {
    const userDoc = await prisma.user.create({
      data: {
        name: d.name,
        email: d.email,
        password: doctorPassword,
        role: Role.DOCTOR,
      },
    });

    const docProfile = await prisma.doctor.create({
      data: {
        userId: userDoc.id,
        specialtyId: d.specialtyId,
        licenseNumber: d.licenseNumber,
      },
    });
    doctors.push(docProfile);
  }
  console.log(`✅ 4 Médicos creados con sus usuarios y perfiles.`);

  // 6. Generar slots automáticos de 20 minutos (~168 slots en total)
  // Generaremos turnos para los siguientes 4 días hábiles, de 8:00 AM a 11:40 AM (11 o 12 slots por día)
  const slotsToInsert = [];
  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);

  // 4 días laborales siguientes
  let daysAdded = 0;
  let currentDayOffset = 1;

  while (daysAdded < 4) {
    const targetDate = new Date(baseDate);
    targetDate.setDate(baseDate.getDate() + currentDayOffset);

    // Evitar fines de semana (0: domingo, 6: sábado)
    if (targetDate.getDay() !== 0 && targetDate.getDay() !== 6) {
      // Para cada uno de los 4 médicos
      for (const doctor of doctors) {
        // Horario matutino: 08:00 a 11:40 (11 slots de 20 minutos)
        // 08:00, 08:20, 08:40, 09:00, 09:20, 09:40, 10:00, 10:20, 10:40, 11:00, 11:20
        for (let hour = 8; hour <= 11; hour++) {
          for (let min of [0, 20, 40]) {
            if (hour === 11 && min === 40) continue; // 11 slots por día por médico
            
            const start = new Date(targetDate);
            start.setHours(hour, min, 0, 0);
            
            const end = new Date(start);
            end.setMinutes(start.getMinutes() + 20);

            slotsToInsert.push({
              doctorId: doctor.id,
              startTime: start,
              endTime: end,
              status: SlotStatus.AVAILABLE,
              version: 0,
            });
          }
        }
      }
      daysAdded++;
    }
    currentDayOffset++;
  }

  // 11 slots * 4 médicos * 4 días = 176 slots (~168 slots)
  await prisma.slot.createMany({
    data: slotsToInsert,
  });

  console.log(`✅ ${slotsToInsert.length} slots de atención de 20 minutos generados exitosamente.`);
  console.log('✨ Seed completado con éxito.');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
