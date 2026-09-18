import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(@InjectQueue('notifications') private notificationsQueue: Queue) {}

  async queueConfirmationEmail(data: {
    patientName: string;
    patientEmail: string;
    doctorName: string;
    specialtyName: string;
    startTime: Date;
    endTime: Date;
    cancelToken: string;
  }) {
    try {
      await this.notificationsQueue.add('send-confirmation', data, {
        attempts: 3,
        backoff: 5000,
        removeOnComplete: true,
      });
      this.logger.log(`📩 Tarea de email de confirmación encolada para: ${data.patientEmail}`);
    } catch (error) {
      this.logger.warn(`No se pudo encolar email en Redis (modo degradado/sin Redis): ${error.message}`);
    }
  }

  async queueCancellationEmail(data: {
    patientName: string;
    patientEmail: string;
    doctorName: string;
    specialtyName: string;
    startTime: Date;
  }) {
    try {
      await this.notificationsQueue.add('send-cancellation', data, {
        attempts: 3,
        backoff: 5000,
        removeOnComplete: true,
      });
      this.logger.log(`📩 Tarea de email de cancelación encolada para: ${data.patientEmail}`);
    } catch (error) {
      this.logger.warn(`No se pudo encolar email en Redis: ${error.message}`);
    }
  }
}
