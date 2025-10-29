import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class AnalyticsQueryDto {
  @ApiProperty({ required: false, description: 'Start date for analytics period' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiProperty({ required: false, description: 'End date for analytics period' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiProperty({ required: false, description: 'Period grouping: day, week, month, year' })
  @IsOptional()
  @IsString()
  period?: string = 'month';
}

export class BookingStatsDto {
  @ApiProperty()
  totalBookings!: number;

  @ApiProperty()
  completedBookings!: number;

  @ApiProperty()
  cancelledBookings!: number;

  @ApiProperty()
  pendingBookings!: number;

  @ApiProperty()
  completionRate!: number;

  @ApiProperty()
  averageSessionDuration!: number;

  @ApiProperty()
  bookingsByPeriod!: Array<{
    period: string;
    count: number;
  }>;
}

export class RevenueStatsDto {
  @ApiProperty()
  totalRevenue!: number;

  @ApiProperty()
  revenueThisMonth!: number;

  @ApiProperty()
  revenueLastMonth!: number;

  @ApiProperty()
  averageSessionValue!: number;

  @ApiProperty()
  revenueByPeriod!: Array<{
    period: string;
    amount: number;
  }>;

  @ApiProperty()
  paymentMethodStats!: {
    mercadopago: number;
    other: number;
  };
}

export class ProfileStatsDto {
  @ApiProperty()
  profileViews!: number;

  @ApiProperty()
  profileViewsThisMonth!: number;

  @ApiProperty()
  conversionRate!: number; // Views to bookings

  @ApiProperty()
  averageRating!: number;

  @ApiProperty()
  totalReviews!: number;

  @ApiProperty()
  responseRate!: number; // Response to booking requests

  @ApiProperty()
  averageResponseTime!: number; // In minutes
}

export class ComprehensiveAnalyticsDto {
  @ApiProperty()
  bookingStats!: BookingStatsDto;

  @ApiProperty()
  revenueStats!: RevenueStatsDto;

  @ApiProperty()
  profileStats!: ProfileStatsDto;

  @ApiProperty()
  period!: {
    from: Date;
    to: Date;
  };

  @ApiProperty()
  lastUpdated!: Date;
}

export class PopularTimesDto {
  @ApiProperty()
  dayOfWeek!: Array<{
    day: string;
    bookings: number;
    percentage: number;
  }>;

  @ApiProperty()
  hourOfDay!: Array<{
    hour: number;
    bookings: number;
    percentage: number;
  }>;

  @ApiProperty()
  monthOfYear!: Array<{
    month: string;
    bookings: number;
    percentage: number;
  }>;
}
