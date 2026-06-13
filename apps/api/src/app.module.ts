import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { QuestionsModule } from './questions/questions.module';
import { TestsModule } from './tests/tests.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv, // fail fast on missing/invalid env (AGENTS.md §10)
    }),
    PrismaModule,
    AuditModule,
    AuthModule,
    TestsModule,
    QuestionsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // JWT auth is on by default everywhere; opt out per-route with @Public().
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Role gating runs after auth; routes without @Roles() allow any authenticated user.
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
