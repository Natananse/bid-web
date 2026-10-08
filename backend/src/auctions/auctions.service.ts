import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../minio/minio.service';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { generateSeed } from './draw-engine';

@Injectable()
export class AuctionsService {
  constructor(
    private prisma: PrismaService,
    private minioService: MinioService,
  ) {}

  async create(sellerId: string, dto: CreateAuctionDto, images: Express.Multer.File[]) {
    if (!images || images.length === 0) {
      throw new BadRequestException('At least one image is required');
    }

    const { seed, seedHash } = generateSeed();

    return this.prisma.$transaction(async (prisma) => {
      // Create category if it doesn't exist (basic implementation for MVP)
      let category = await prisma.category.findUnique({ where: { slug: dto.categorySlug } });
      if (!category) {
        category = await prisma.category.create({
          data: {
            name: dto.categorySlug,
            slug: dto.categorySlug,
          }
        });
      }

      const auction = await prisma.auction.create({
        data: {
          title: dto.title,
          description: dto.description,
          condition: dto.condition,
          entryFee: dto.entryFee,
          startTime: new Date(dto.startTime),
          endTime: new Date(dto.endTime),
          maxBidsPerUser: dto.maxBidsPerUser || 0,
          status: 'SCHEDULED', // Or DRAFT depending on start time
          categoryId: category.id,
          sellerId,
          seedHash,
          seed, // Store seed, but do not expose in API until ENDED
        },
      });

      // Upload images
      const imageUrls = await Promise.all(
        images.map(async (file, index) => {
          const ext = file.originalname.split('.').pop();
          const fileName = `${auction.id}-${Date.now()}-${index}.${ext}`;
          const url = await this.minioService.uploadFile(file, fileName);
          return { url, isPrimary: index === 0 };
        })
      );

      await prisma.auctionImage.createMany({
        data: imageUrls.map(img => ({
          auctionId: auction.id,
          url: img.url,
          isPrimary: img.isPrimary,
        }))
      });

      // TODO: Schedule BullMQ job for auction end

      return auction;
    });
  }

  async findAll() {
    return this.prisma.auction.findMany({
      include: {
        images: true,
        category: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string) {
    const auction = await this.prisma.auction.findUnique({
      where: { id },
      include: {
        images: true,
        category: true,
        seller: {
          select: { id: true, name: true }
        }
      }
    });

    if (!auction) {
      throw new NotFoundException('Auction not found');
    }

    // Hide seed if auction is not ENDED
    if (auction.status !== 'ENDED') {
      auction.seed = null;
    }

    return auction;
  }
}
