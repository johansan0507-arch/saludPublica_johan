import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import * as nodemailer from 'nodemailer';

@Processor('notifications')
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || 'tu_email@gmail.com',
        pass: process.env.EMAIL_PASS || 'tu_app_password',
      },
    });
  }

  @Process('send-confirmation')
  async handleConfirmation(job: Job<any>) {
    this.logger.log(`Procesando tarea de confirmación para: ${job.data.patientEmail}`);
    const { patientName, patientEmail, doctorName, specialtyName, startTime, cancelToken } = job.data;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const cancelUrl = `${frontendUrl}/cancelar/${cancelToken}`;

    const formattedDate = new Date(startTime).toLocaleString('es-CO', {
      timeZone: 'America/Bogota',
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="background-color: #0284c7; color: white; padding: 15px; text-align: center; border-radius: 6px;">
          <h2 style="margin: 0;">SaludPública Connect</h2>
          <p style="margin: 5px 0 0 0;">Confirmación de Turno Médico</p>
        </div>
        <div style="padding: 20px 0;">
          <p>Estimado(a) <strong>${patientName}</strong>,</p>
          <p>Su turno ha sido reservado exitosamente con los siguientes detalles:</p>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr><td style="padding: 8px 0; color: #64748b;">Especialidad:</td><td><strong>${specialtyName}</strong></td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">Profesional:</td><td><strong>${doctorName}</strong></td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">Fecha y Hora:</td><td><strong>${formattedDate}</strong> (20 min)</td></tr>
          </table>
          <p style="color: #475569; font-size: 14px;">Si por alguna razón no puede asistir a su consulta, por favor cancele con anticipación para liberar el espacio a otro ciudadano:</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${cancelUrl}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Cancelar Mi Turno
            </a>
          </div>
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">Token de cancelación: ${cancelToken}</p>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || '"SaludPública Connect" <noreply@saludpublica.com>',
        to: patientEmail,
        subject: `Confirmación de Turno: ${specialtyName} - SaludPública Connect`,
        html,
      });
      this.logger.log(`✅ Correo de confirmación enviado exitosamente a ${patientEmail}`);
    } catch (error) {
      this.logger.warn(`No se pudo enviar correo SMTP a ${patientEmail}: ${error.message} (Verifique credenciales SMTP en .env)`);
    }
  }

  @Process('send-cancellation')
  async handleCancellation(job: Job<any>) {
    this.logger.log(`Procesando tarea de cancelación para: ${job.data.patientEmail}`);
    const { patientName, patientEmail, doctorName, specialtyName, startTime } = job.data;

    const formattedDate = new Date(startTime).toLocaleString('es-CO', {
      timeZone: 'America/Bogota',
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="background-color: #ef4444; color: white; padding: 15px; text-align: center; border-radius: 6px;">
          <h2 style="margin: 0;">SaludPública Connect</h2>
          <p style="margin: 5px 0 0 0;">Cancelación de Turno Médico</p>
        </div>
        <div style="padding: 20px 0;">
          <p>Estimado(a) <strong>${patientName}</strong>,</p>
          <p>Le confirmamos que su turno para <strong>${specialtyName}</strong> con el médico <strong>${doctorName}</strong> el día <strong>${formattedDate}</strong> ha sido <strong>CANCELADO</strong> satisfactoriamente.</p>
          <p style="color: #475569; font-size: 14px;">El turno ha sido liberado en el sistema para otros usuarios. Puede agendar un nuevo turno cuando lo requiera ingresando a la plataforma.</p>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || '"SaludPública Connect" <noreply@saludpublica.com>',
        to: patientEmail,
        subject: `Turno Cancelado: ${specialtyName} - SaludPública Connect`,
        html,
      });
      this.logger.log(`✅ Correo de cancelación enviado a ${patientEmail}`);
    } catch (error) {
      this.logger.warn(`No se pudo despachar correo SMTP a ${patientEmail}: ${error.message}`);
    }
  }
}
