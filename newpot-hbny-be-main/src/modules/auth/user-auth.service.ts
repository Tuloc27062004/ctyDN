import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import {
  RequestPasswordResetDto,
  ResendVerificationDto,
  ResetPasswordDto,
  SignInDto,
  SignUpDto,
  VerifyEmailDto,
} from './dto/request.dto';
import { UserResponseDto } from './dto/response.dto';

@Injectable()
export class UserAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async signUp(dto: SignUpDto): Promise<UserResponseDto> {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      if (existingUser.status === UserStatus.REJECTED) {
        throw new BadRequestException(
          'This email has been blocked from registration.',
        );
      }
      throw new ConflictException('Email already registered.');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        country: dto.country,
        companyName: dto.companyName,
        companyAddress: dto.companyAddress,
        password: hashedPassword,
        status: UserStatus.PENDING,
        role: 'USER',
      },
    });

    // Send pending verification email
    this.mailService.sendPendingVerificationEmail(user.email, user.fullName);

    return user;
  }

  async signIn(
    dto: SignInDto,
  ): Promise<{ user: UserResponseDto; token: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Wrong password or email.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Wrong password or email.');
    }

    if (user.status === UserStatus.PENDING) {
      throw new UnauthorizedException(
        'Your account is pending admin approval.',
      );
    }

    // if (user.status === UserStatus.ACCEPTED) {
    //   throw new UnauthorizedException(
    //     'Please verify your email before signing in.',
    //   );
    // }

    if (user.status === UserStatus.REJECTED) {
      throw new UnauthorizedException('Your account has been rejected.');
    }

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: user,
      token,
    };
  }

  async requestPasswordReset(dto: RequestPasswordResetDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new BadRequestException('Check your email again!');
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExp = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with reset token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verifyToken: resetToken,
        verifyTokenExp: resetTokenExp,
      },
    });

    // Send reset password email
    this.mailService.sendResetPasswordEmail(user.email, user.fullName, resetToken);

    return ;
  }

  async resetPassword(dto: ResetPasswordDto, token: string): Promise<UserResponseDto> {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      if (existingUser.status === UserStatus.REJECTED) {
        throw new BadRequestException(
          'This email has been blocked from registration.',
        );
      }
    } else {
      throw new BadRequestException('Email not found.');
    }

    if (existingUser.verifyTokenExp) {
      if(existingUser.verifyToken !== token) {
        throw new BadRequestException('Invalid reset password token.');
      }
      const tokenCreatedAt = new Date(
        existingUser.verifyTokenExp.getTime() - 10 * 60 * 1000,
      );
      const cooldownEnd = new Date(tokenCreatedAt.getTime() + 10 * 60 * 1000);

      if (new Date() > cooldownEnd) {
        throw new BadRequestException(
          'Reset password token has expired. Please request a new one.',
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Update user password and clear reset token
    await this.prisma.user.update({
      where: { id: existingUser.id },
      data: {
        password: hashedPassword,
        verifyToken: null,
        verifyTokenExp: null,
      },
    });

    return existingUser;
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: {
        verifyToken: dto.token,
        status: UserStatus.ACCEPTED,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token.');
    }

    if (user.verifyTokenExp && new Date() > user.verifyTokenExp) {
      throw new BadRequestException('Verification token has expired.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        status: UserStatus.VERIFIED,
        verifyToken: null,
        verifyTokenExp: null,
      },
    });
  }

  async resendVerification(dto: ResendVerificationDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || user.status !== UserStatus.ACCEPTED) {
      throw new BadRequestException(
        'No pending verification found for this email.',
      );
    }

    // Check if we can resend (10 minutes cooldown)
    if (user.verifyTokenExp) {
      const tokenCreatedAt = new Date(
        user.verifyTokenExp.getTime() - 10 * 60 * 1000,
      );
      const cooldownEnd = new Date(tokenCreatedAt.getTime() + 10 * 60 * 1000);

      if (new Date() < cooldownEnd) {
        const remainingMs = cooldownEnd.getTime() - new Date().getTime();
        const remainingMin = Math.ceil(remainingMs / 60000);
        throw new BadRequestException(
          `Please wait ${remainingMin} minute(s) before requesting a new verification link.`,
        );
      }
    }

    // Generate new token
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyTokenExp = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verifyToken,
        verifyTokenExp,
      },
    });

    this.mailService.sendVerificationEmail(
      user.email,
      user.fullName,
      verifyToken,
    );
  }

  private generateToken(userId: string, email: string, role: string): string {
    const expiresIn = this.configService.get<string>('jwt.expiresIn') || '7d';
    return this.jwtService.sign(
      { sub: userId, email, role },
      {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn,
      } as any,
    );
  }
}
