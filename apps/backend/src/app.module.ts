import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { StockModule } from './stock/stock.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { MenuModule } from './menu/menu.module';
import { TablesModule } from './tables/tables.module';
import { ZonesModule } from './zones/zones.module';
import { ReservationsModule } from './reservations/reservations.module';
import { OrdersModule } from './orders/orders.module';
import { InvoicesModule } from './invoices/invoices.module';
import { CashRegisterModule } from './cash-register/cash-register.module';
import { ReportsModule } from './reports/reports.module';
import { AuditModule } from './audit/audit.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

@Module({
  imports: [
    // ── Config ──────────────────────────────────────────────
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    // ── Rate limiting ────────────────────────────────────────
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // ── Event system ────────────────────────────────────────
    EventEmitterModule.forRoot(),

    // ── Database ─────────────────────────────────────────────
    PrismaModule,

    // ── Feature modules ──────────────────────────────────────
    AuthModule,
    UsersModule,
    RolesModule,
    StockModule,
    SuppliersModule,
    MenuModule,
    TablesModule,
    ZonesModule,
    ReservationsModule,
    OrdersModule,
    InvoicesModule,
    CashRegisterModule,
    ReportsModule,
    AuditModule,
  ],
  providers: [
    // JWT guard global (toutes les routes protégées par défaut)
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // RBAC guard global
    { provide: APP_GUARD, useClass: PermissionsGuard },
    // Throttle guard global
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Audit interceptor global
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
