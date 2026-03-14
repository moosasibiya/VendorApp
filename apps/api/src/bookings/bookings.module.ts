import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PayfastModule } from '../payfast/payfast.module';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [AuthModule, PayfastModule],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
