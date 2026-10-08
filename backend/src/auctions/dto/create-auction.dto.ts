import { IsString, IsNumber, IsDateString, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAuctionDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  categorySlug: string;

  @IsString()
  condition: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  entryFee: number;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  maxBidsPerUser?: number;
}
