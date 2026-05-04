import { Module } from '@nestjs/common';
import { MailerModule } from '../mailer/mailer.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PrelaunchController } from './prelaunch.controller';
import { PrelaunchService } from './prelaunch.service';

@Module({
  imports: [PrismaModule, MailerModule],
  controllers: [PrelaunchController],
  providers: [PrelaunchService],
})
export class PrelaunchModule {}
