import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';

export enum SlotType {
  RECURRING = 'RECURRING',
  ONE_TIME = 'ONE_TIME',
}

export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export class CreateAvailabilitySlotDto {
  @ApiProperty({ enum: SlotType, description: 'Type of availability slot' })
  @IsEnum(SlotType)
  type!: SlotType;

  // Para slots recurrentes
  @ApiProperty({ enum: DayOfWeek, required: false, description: 'Day of week for recurring slots' })
  @ValidateIf((o) => o.type === SlotType.RECURRING)
  @IsEnum(DayOfWeek)
  dayOfWeek?: DayOfWeek;

  @ApiProperty({ required: false, description: 'Start time in HH:mm format', example: '09:00' })
  @ValidateIf((o) => o.type === SlotType.RECURRING)
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'startTime must be in HH:mm format' })
  startTime?: string;

  @ApiProperty({ required: false, description: 'End time in HH:mm format', example: '17:00' })
  @ValidateIf((o) => o.type === SlotType.RECURRING)
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'endTime must be in HH:mm format' })
  endTime?: string;

  // Para slots específicos
  @ApiProperty({ required: false, description: 'Specific date for one-time slots' })
  @ValidateIf((o) => o.type === SlotType.ONE_TIME)
  @IsDateString()
  specificDate?: string;

  @ApiProperty({ required: false, description: 'Specific start datetime for one-time slots' })
  @ValidateIf((o) => o.type === SlotType.ONE_TIME)
  @IsDateString()
  specificStart?: string;

  @ApiProperty({ required: false, description: 'Specific end datetime for one-time slots' })
  @ValidateIf((o) => o.type === SlotType.ONE_TIME)
  @IsDateString()
  specificEnd?: string;

  @ApiProperty({ required: false, default: true, description: 'Whether the slot is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class UpdateAvailabilitySlotDto {
  @ApiProperty({ required: false, description: 'Day of week for recurring slots' })
  @IsOptional()
  @IsEnum(DayOfWeek)
  dayOfWeek?: DayOfWeek;

  @ApiProperty({ required: false, description: 'Start time in HH:mm format' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'startTime must be in HH:mm format' })
  startTime?: string;

  @ApiProperty({ required: false, description: 'End time in HH:mm format' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'endTime must be in HH:mm format' })
  endTime?: string;

  @ApiProperty({ required: false, description: 'Specific date for one-time slots' })
  @IsOptional()
  @IsDateString()
  specificDate?: string;

  @ApiProperty({ required: false, description: 'Specific start datetime for one-time slots' })
  @IsOptional()
  @IsDateString()
  specificStart?: string;

  @ApiProperty({ required: false, description: 'Specific end datetime for one-time slots' })
  @IsOptional()
  @IsDateString()
  specificEnd?: string;

  @ApiProperty({ required: false, description: 'Whether the slot is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AvailabilitySlotResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: SlotType })
  type!: SlotType;

  @ApiProperty({ enum: DayOfWeek, required: false })
  dayOfWeek?: DayOfWeek;

  @ApiProperty({ required: false })
  startTime?: string;

  @ApiProperty({ required: false })
  endTime?: string;

  @ApiProperty({ required: false })
  specificDate?: Date;

  @ApiProperty({ required: false })
  specificStart?: Date;

  @ApiProperty({ required: false })
  specificEnd?: Date;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class AvailabilityQueryDto {
  @ApiProperty({ required: false, description: 'Filter by slot type' })
  @IsOptional()
  @IsEnum(SlotType)
  type?: SlotType;

  @ApiProperty({ required: false, description: 'Filter by day of week' })
  @IsOptional()
  @IsEnum(DayOfWeek)
  dayOfWeek?: DayOfWeek;

  @ApiProperty({ required: false, description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false, description: 'Filter from specific date' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiProperty({ required: false, description: 'Filter to specific date' })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
