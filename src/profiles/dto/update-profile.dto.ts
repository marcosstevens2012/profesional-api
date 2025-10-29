import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDecimal,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ required: false, description: 'Professional email' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @ApiProperty({ required: false, description: 'Professional name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiProperty({ required: false, description: 'Short bio' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiProperty({ required: false, description: 'Long description' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ required: false, description: 'Price per session' })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' })
  @Type(() => Number)
  pricePerSession?: number;

  @ApiProperty({ required: false, description: 'Standard session duration in minutes' })
  @IsOptional()
  @IsInt()
  @Min(15)
  @Type(() => Number)
  standardDuration?: number;

  @ApiProperty({ required: false, description: 'Service category ID' })
  @IsOptional()
  @IsString()
  serviceCategoryId?: string;

  @ApiProperty({ required: false, description: 'Array of tags', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ required: false, description: 'Location ID' })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiProperty({ required: false, description: 'Professional avatar URL' })
  @IsOptional()
  @IsUrl()
  avatar?: string;

  @ApiProperty({ required: false, description: 'Professional phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiProperty({ required: false, description: 'Professional website URL' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiProperty({ required: false, description: 'Professional location/address' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiProperty({ required: false, description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // User-related fields (for backward compatibility)
  @ApiProperty({ required: false, description: 'First name (user field)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiProperty({ required: false, description: 'Last name (user field)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;
}
