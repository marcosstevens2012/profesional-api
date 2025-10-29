import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ReviewResponseDto {
  @ApiProperty({ description: 'Response to the review from the professional' })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  response!: string;
}

export class ReviewStatsDto {
  @ApiProperty()
  totalReviews!: number;

  @ApiProperty()
  averageRating!: number;

  @ApiProperty()
  ratingDistribution!: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };

  @ApiProperty()
  recentReviews!: ReviewWithUserDto[];
}

export class ReviewWithUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  rating!: number;

  @ApiProperty()
  comment!: string;

  @ApiProperty()
  professionalResponse?: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  user!: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

export class ReviewQueryDto {
  @ApiProperty({ required: false, description: 'Page number for pagination' })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ required: false, description: 'Number of items per page' })
  @IsOptional()
  limit?: number = 10;

  @ApiProperty({ required: false, description: 'Filter by rating' })
  @IsOptional()
  rating?: number;

  @ApiProperty({ required: false, description: 'Filter by responded status' })
  @IsOptional()
  hasResponse?: boolean;

  @ApiProperty({ required: false, description: 'Order by: createdAt, rating' })
  @IsOptional()
  @IsString()
  orderBy?: string = 'createdAt';

  @ApiProperty({ required: false, description: 'Order direction: asc, desc' })
  @IsOptional()
  @IsString()
  orderDirection?: string = 'desc';
}
