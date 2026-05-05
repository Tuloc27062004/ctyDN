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
    const checks: Record<string, unknown> = {};

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.connection = { ok: true };
    } catch (error) {
      const err = error as { code?: string; message?: string; name?: string };
      checks.connection = {
        ok: false,
        errorName: err.name,
        errorCode: err.code,
        errorMessage: err.message,
      };
    }

    try {
      checks.users = { ok: true, count: await this.prisma.user.count() };
    } catch (error) {
      const err = error as { code?: string; message?: string; name?: string };
      checks.users = {
        ok: false,
        errorName: err.name,
        errorCode: err.code,
        errorMessage: err.message,
      };
    }

    try {
      checks.products = { ok: true, count: await this.prisma.product.count() };
    } catch (error) {
      const err = error as { code?: string; message?: string; name?: string };
      checks.products = {
        ok: false,
        errorName: err.name,
        errorCode: err.code,
        errorMessage: err.message,
      };
    }

    try {
      checks.blogPosts = { ok: true, count: await this.prisma.blogPost.count() };
    } catch (error) {
      const err = error as { code?: string; message?: string; name?: string };
      checks.blogPosts = {
        ok: false,
        errorName: err.name,
        errorCode: err.code,
        errorMessage: err.message,
      };
    }

    const ok = Object.values(checks).every(
      (check) =>
        typeof check === 'object' &&
        check !== null &&
        'ok' in check &&
        check.ok === true,
    );

    return {
      ok,
      databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
      checks,
    };
  }
}
