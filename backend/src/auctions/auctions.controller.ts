import { Controller, Get, Post, Body, Param, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { AuctionsService } from './auctions.service.js';
import { CreateAuctionDto } from './dto/create-auction.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Role } from '@prisma/client';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';

@ApiTags('auctions')
@Controller('auctions')
export class AuctionsController {
  constructor(private readonly auctionsService: AuctionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiConsumes('multipart/form-data')
  create(
    @CurrentUser() user: any,
    @Body() createAuctionDto: CreateAuctionDto,
    @UploadedFiles() images: Express.Multer.File[]
  ) {
    return this.auctionsService.create(user.id, createAuctionDto, images);
  }

  @Get()
  findAll() {
    return this.auctionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.auctionsService.findOne(id);
  }
}
