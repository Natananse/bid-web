import { Module } from '@nestjs/common';
import { AuctionsService } from './auctions.service.js';
import { AuctionsController } from './auctions.controller.js';
import { MinioModule } from '../minio/minio.module.js';

@Module({
  imports: [MinioModule],
  controllers: [AuctionsController],
  providers: [AuctionsService],
  exports: [AuctionsService]
})
export class AuctionsModule {}
