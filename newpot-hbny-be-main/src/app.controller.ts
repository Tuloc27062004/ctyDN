import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health/db')
  async getDatabaseHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        ok: true,
        databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
      };
    } catch (error) {
      const err = error as { code?: string; message?: string; name?: string };

      return {
        ok: false,
        databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
        errorName: err.name,
        errorCode: err.code,
        errorMessage: err.message,
      };
    }
  }
}
