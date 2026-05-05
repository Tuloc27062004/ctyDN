import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../guards';
import {
  RequestPasswordResetDto,
  ResendVerificationDto,
  ResetPasswordDto,
  SignInDto,
  SignUpDto,
  VerifyEmailDto,
} from './dto/request.dto';
import {
  MessageResponseDto,
  SignInResponseDto,
  UserResponseDto,
} from './dto/response.dto';
import { UserAuthService } from './user-auth.service';

@ApiTags('Auth - User')
@Controller('auth')
export class UserAuthController {
  constructor(private readonly userAuthService: UserAuthService) {}

  @Post('sign-up')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, type: MessageResponseDto })
  @ApiResponse({ status: 400, description: 'Email blocked from registration' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async signUp(@Body() dto: SignUpDto): Promise<MessageResponseDto> {
    await this.userAuthService.signUp(dto);

    return {
      message:
        'Registration successful. Please wait for admin approval. Check your email for details.',
    };
  }

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiResponse({ status: 200, type: SignInResponseDto })
  @ApiResponse({ status: 401, description: 'Wrong password or email' })
  async signIn(@Body() dto: SignInDto): Promise<SignInResponseDto> {
    const { token } = await this.userAuthService.signIn(dto);

    return {
      message: 'Login successful',
      accessToken: token,
    };
  }

  @Post('request-password-reset')
  @ApiOperation({ summary: 'Request a password reset' })
  @ApiResponse({ status: 201, type: MessageResponseDto })
  @ApiResponse({ status: 400, description: 'Email blocked from registration' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async requestResetPassword(
    @Body() dto: RequestPasswordResetDto,
  ): Promise<MessageResponseDto> {
    await this.userAuthService.requestPasswordReset(dto);

    return {
      message:
        'If the email is registered, a password reset link has been sent. Please check your inbox.',
    };
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 201, type: MessageResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  @ApiResponse({ status: 409, description: 'Email is not registered' })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Query('token') token: string,
  ): Promise<MessageResponseDto> {
    await this.userAuthService.resetPassword(dto, token);

    return {
      message:
        'Reset password successful. You can now sign in with your new password.',
    };
  }

  @Post('sign-out')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign out (client discards bearer token)' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async signOut(): Promise<MessageResponseDto> {
    return { message: 'Logged out successfully' };
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with token' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<MessageResponseDto> {
    await this.userAuthService.verifyEmail(dto);
    return { message: 'Email verified successfully. You can now sign in.' };
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend verification email (10 min cooldown)' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Cooldown active or no pending verification',
  })
  async resendVerification(
    @Body() dto: ResendVerificationDto,
  ): Promise<MessageResponseDto> {
    await this.userAuthService.resendVerification(dto);
    return { message: 'Verification email sent. Please check your inbox.' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user info' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMe(@Req() req: Request): UserResponseDto {
    return req.user as UserResponseDto;
  }
}
