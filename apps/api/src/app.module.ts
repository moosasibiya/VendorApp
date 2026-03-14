import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';
import { ArtistsModule } from './artists/artists.module';
import { BookingsModule } from './bookings/bookings.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { RateLimitModule } from './rate-limit/rate-limit.module';
import { UsersModule } from './users/users.module';
import { AgenciesModule } from './agencies/agencies.module';
import { PayfastModule } from './payfast/payfast.module';

@Module({
  imports: [
    PrismaModule,
    RateLimitModule,
    ArtistsModule,
    BookingsModule,
    AuthModule,
    UsersModule,
    AgenciesModule,
    PayfastModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
