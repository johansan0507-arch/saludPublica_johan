import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SpecialtiesModule } from './specialties/specialties.module';
import { DoctorsModule } from './doctors/doctors.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      useFactory: () => ({
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: Number(process.env.REDIS_PORT) || 6379,
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          retryStrategy: (times) => {
            // Reintento exponencial limitado para no bloquear en ambientes sin redis
            return Math.min(times * 1000, 10000);
          },
        },
      }),
    }),
    PrismaModule,
    AuthModule,
    SpecialtiesModule,
    DoctorsModule,
    AppointmentsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
