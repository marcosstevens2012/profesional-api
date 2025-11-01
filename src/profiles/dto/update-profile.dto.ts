import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsDecimal,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateProfileDto {
  // ========== CAMPOS COMUNES (Profile) ==========
  @ApiProperty({ required: false, description: 'First name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiProperty({ required: false, description: 'Last name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiProperty({ required: false, description: 'Avatar URL' })
  @IsOptional()
  @IsUrl()
  avatar?: string;

  @ApiProperty({ required: false, description: 'Phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiProperty({ required: false, description: 'Personal bio' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @ApiProperty({ required: false, description: 'Date of birth (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({ required: false, description: 'Gender' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  gender?: string;

  @ApiProperty({ required: false, description: 'Address' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiProperty({ required: false, description: 'City' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiProperty({ required: false, description: 'Province/State' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  province?: string;

  @ApiProperty({ required: false, description: 'Postal code' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiProperty({ required: false, description: 'Country', default: 'Argentina' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiProperty({ required: false, description: 'Emergency contact name' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  emergencyContactName?: string;

  @ApiProperty({ required: false, description: 'Emergency contact phone' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  emergencyContactPhone?: string;

  // ========== CAMPOS PROFESIONALES (ProfessionalProfile) ==========
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

  @ApiProperty({ required: false, description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false, description: 'Professional website URL' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiProperty({ required: false, description: 'LinkedIn profile URL' })
  @IsOptional()
  @IsUrl()
  linkedIn?: string;

  @ApiProperty({ required: false, description: 'Instagram profile URL' })
  @IsOptional()
  @IsUrl()
  instagram?: string;

  @ApiProperty({ required: false, description: 'Facebook profile URL' })
  @IsOptional()
  @IsUrl()
  facebook?: string;

  @ApiProperty({ required: false, description: 'Twitter profile URL' })
  @IsOptional()
  @IsUrl()
  twitter?: string;

  @ApiProperty({ required: false, description: 'Education/Training' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  education?: string;

  @ApiProperty({ required: false, description: 'Professional experience' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  experience?: string;

  @ApiProperty({ required: false, description: 'Specialties', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @ApiProperty({ required: false, description: 'Languages spoken', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiProperty({ required: false, description: 'Years of experience' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  yearsOfExperience?: number;

  // Documentación y validación profesional
  @ApiProperty({ required: false, description: 'DNI number' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  dni?: string;

  @ApiProperty({ required: false, description: 'CUIT/CUIL number' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  cuitCuil?: string;

  @ApiProperty({
    required: false,
    description: 'Professional license/registration number (optional)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  matricula?: string;

  @ApiProperty({ required: false, description: 'Title document URL (photo/PDF) (optional)' })
  @IsOptional()
  @IsUrl()
  titleDocumentUrl?: string;
}
