import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { appConfig, jwtConfig, mailConfig } from './config';
import { JwtStrategy } from './guards';
import { PrismaModule } from './prisma/prisma.module';
import { UserAuthModule } from './modules/auth/user-auth.module';
import { MailModule } from './modules/mail/mail.module';
import { CategoryModule } from './modules/category/category.module';
import { ProductModule } from './modules/product/product.module';
import { LandingModule } from './modules/landing/landing.module';
import { BlogModule } from './modules/blog/blog.module';
import { CartModule } from './modules/cart/cart.module';
import { OrderModule } from './modules/order/order.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, mailConfig],
    }),
    PrismaModule,
    MailModule,
    UserAuthModule,
    CategoryModule,
    ProductModule,
    BlogModule,
    LandingModule,
    CartModule,
    OrderModule,
  ],
  controllers: [AppController],
  providers: [AppService, JwtStrategy],
})
export class AppModule {}
