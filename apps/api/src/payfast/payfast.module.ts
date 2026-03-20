import { Module } from '@nestjs/common';
import { BookingsModule } from '../bookings/bookings.module';
import { AuthModule } from '../auth/auth.module';
import { MailerModule } from '../mailer/mailer.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { PayfastController } from './payfast.controller';
import { PayfastService } from './payfast.service';

@Module({
  imports: [
    PrismaModule,
    RateLimitModule,
    AuthModule,
    MailerModule,
    NotificationsModule,
    BookingsModule,
  ],
  controllers: [PayfastController],
  providers: [PayfastService],
  exports: [PayfastService],
})
export class PayfastModule {}
