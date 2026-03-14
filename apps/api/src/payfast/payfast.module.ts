import { Module } from '@nestjs/common';
import { MailerModule } from '../mailer/mailer.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { PayfastController } from './payfast.controller';
import { PayfastService } from './payfast.service';

@Module({
  imports: [PrismaModule, RateLimitModule, MailerModule],
  controllers: [PayfastController],
  providers: [PayfastService],
  exports: [PayfastService],
})
export class PayfastModule {}
