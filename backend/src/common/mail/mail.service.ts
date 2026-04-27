import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    @InjectPinoLogger(MailService.name)
    private readonly logger: PinoLogger,
  ) {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user, pass },
      });
      this.logger.info('mail:transporter configured');
    } else {
      this.logger.warn('mail:SMTP not configured — password reset emails will not be sent');
    }
  }

  async sendInvite(toEmail: string, toName: string, inviteUrl: string): Promise<void> {
    if (!this.transporter) {
      this.logger.error('mail:SMTP not configured — could not send invite email');
      throw new ServiceUnavailableException(
        'Email service is not configured. Contact the administrator.',
      );
    }

    const from = process.env.FROM_EMAIL || process.env.SMTP_USER;

    try {
      await this.transporter.sendMail({
        from: `"${process.env.APP_NAME || 'HomeCraft'}" <${from}>`,
        to: toEmail,
        subject: `You've been invited to ${process.env.APP_NAME || 'HomeCraft'}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="color:#c026d3;margin-bottom:8px">You're invited!</h2>
            <p style="color:#374151;margin-bottom:8px">Hi ${toName},</p>
            <p style="color:#374151;margin-bottom:24px">
              You've been added to <strong>${process.env.APP_NAME || 'HomeCraft'}</strong>. Click the button below to set your
              password and get started. This link expires in <strong>24 hours</strong>.
            </p>
            <a href="${inviteUrl}"
              style="display:inline-block;background:#c026d3;color:#fff;padding:12px 24px;
                     border-radius:8px;text-decoration:none;font-weight:600">
              Set Up My Account
            </a>
            <p style="color:#9ca3af;font-size:12px;margin-top:24px">
              If you weren't expecting this, you can safely ignore it.
            </p>
          </div>
        `,
      });
      this.logger.info('mail:invite email sent');
    } catch (err: any) {
      this.logger.error({ err: err.message }, 'mail:failed to send invite email');
      throw new ServiceUnavailableException('Failed to send invite email. Please try again.');
    }
  }

  async sendPasswordReset(toEmail: string, resetUrl: string): Promise<void> {
    if (!this.transporter) {
      this.logger.error(
        'mail:SMTP not configured — set SMTP_HOST, SMTP_USER, SMTP_PASS in .env',
      );
      throw new ServiceUnavailableException(
        'Email service is not configured. Contact the administrator.',
      );
    }

    const from = process.env.FROM_EMAIL || process.env.SMTP_USER;

    try {
      await this.transporter.sendMail({
        from: `"${process.env.APP_NAME || 'HomeCraft'}" <${from}>`,
        to: toEmail,
        subject: `Reset your ${process.env.APP_NAME || 'HomeCraft'} password`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="color:#c026d3;margin-bottom:8px">Password Reset</h2>
            <p style="color:#374151;margin-bottom:24px">
              Click the button below to reset your ${process.env.APP_NAME || 'HomeCraft'} password.
              This link expires in <strong>1 hour</strong>.
            </p>
            <a href="${resetUrl}"
              style="display:inline-block;background:#c026d3;color:#fff;padding:12px 24px;
                     border-radius:8px;text-decoration:none;font-weight:600">
              Reset Password
            </a>
            <p style="color:#9ca3af;font-size:12px;margin-top:24px">
              If you didn't request this, ignore this email — your password won't change.
            </p>
          </div>
        `,
      });
      this.logger.info('mail:password reset email sent');
    } catch (err: any) {
      this.logger.error({ err: err.message }, 'mail:failed to send password reset email');
      throw new ServiceUnavailableException(
        'Failed to send reset email. Please try again later.',
      );
    }
  }
}
