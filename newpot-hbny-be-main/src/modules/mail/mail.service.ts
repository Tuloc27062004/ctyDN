import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('mail.apiKey');
    this.resend = new Resend(apiKey);
  }

  async sendPendingVerificationEmail(email: string, fullName: string): Promise<void> {
    const html = `
      <h1>Welcome to EcoCrete, ${fullName}!</h1>
      <p>Thank you for registering. Your account is currently under review.</p>
      <p>Our admin team will verify your information and you will receive another email once your account is approved.</p>
      <p>Please wait for our verification process to complete.</p>
      <br>
      <p>Best regards,</p>
      <p>EcoCrete Develop Team</p>
    `;

    try {
      const res = await this.resend.emails.send({
        from: this.configService.get<string>('mail.from'),
        to: email,
        subject: 'Account Registration - Pending Verification',
        html,
      });

      console.log('Email sent:', res);
    } catch (error) {
      console.error('Email error:', error);
    }
  }

  async sendResetPasswordEmail(email: string, fullName: string, resetToken: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('app.frontendUrl');
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const html = `
      <h1>Reset Your Password</h1>
      <p>Hello ${fullName},</p>
      <p>You have requested to reset your password. Please click the link below to proceed:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a>
      <p>Or copy and paste this link in your browser:</p>
      <p>${resetUrl}</p>
      <p><strong>This link will expire in 10 minutes.</strong></p>
      <br>
      <p>Best regards,</p>
      <p>EcoCrete Develop Team</p>
    `;

    try {
      const res = await this.resend.emails.send({
        from: this.configService.get<string>('mail.from'),
        to: email,
        subject: 'Reset Your Password - EcoCrete',
        html,
      });

      console.log('Email sent:', res);
    } catch (error) {
      console.error('Email error:', error);
    }

  }

  async sendVerificationEmail(
    email: string,
    fullName: string,
    verifyToken: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('app.frontendUrl');
    const verifyUrl = `${frontendUrl}/verify?token=${verifyToken}`;

    const html = `
      <h1>Your Account Has Been Approved!</h1>
      <p>Hello ${fullName},</p>
      <p>Great news! Your account has been approved by our admin team.</p>
      <p>Please click the link below to verify your email address and activate your account:</p>
      <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">Verify Email</a>
      <p>Or copy and paste this link in your browser:</p>
      <p>${verifyUrl}</p>
      <p><strong>This link will expire in 10 minutes.</strong></p>
      <br>
      <p>Best regards,</p>
      <p>EcoCrete Develop Team</p>
    `;

    try {
      const res = await this.resend.emails.send({
        from: this.configService.get<string>('mail.from'),
        to: email,
        subject: 'Verify Your Email - EcoCrete',
        html,
      });

      console.log('Email sent:', res);
    } catch (error) {
      console.error('Email error:', error);
    }
  }

  async sendRejectionEmail(email: string, fullName: string): Promise<void> {
    const html = `
      <h1>Account Registration Update</h1>
      <p>Hello ${fullName},</p>
      <p>We regret to inform you that your account registration has been declined.</p>
      <p>If you believe this was a mistake, please contact our support team.</p>
      <br>
      <p>Best regards,</p>
      <p>EcoCrete Develop Team</p>
    `;

    try {
      const res = await this.resend.emails.send({
        from: this.configService.get<string>('mail.from'),
        to: email,
        subject: 'Account Registration - Declined',
        html,
      });

      console.log('Email sent:', res);
    } catch (error) {
      console.error('Email error:', error);
    }
  }
}