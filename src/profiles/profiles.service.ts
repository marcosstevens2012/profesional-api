import { Injectable, NotFoundException } from '@nestjs/common';
import { Profile } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { AnalyticsQueryDto } from './dto/analytics.dto';
import {
  AvailabilityQueryDto,
  CreateAvailabilitySlotDto,
  UpdateAvailabilitySlotDto,
} from './dto/availability.dto';
import {
  ConfigureMercadoPagoDto,
  MercadoPagoConfigResponse,
} from './dto/configure-mercadopago.dto';
import { ReviewQueryDto, ReviewResponseDto } from './dto/reviews.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(private readonly _prisma: PrismaService) {}

  async create(createProfileDto: any): Promise<any> {
    // This would be for creating professional profiles
    // For now, return a mock implementation
    return {
      message: 'Profile creation not implemented yet',
      data: createProfileDto,
    };
  }

  async getMyProfile(userId: string): Promise<any> {
    // Obtener el usuario con sus perfiles
    const user = await this._prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        professionalProfile: {
          include: {
            serviceCategory: true,
            location: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Si es profesional y tiene perfil profesional, devolver ese
    if (user.role === 'PROFESSIONAL' && user.professionalProfile) {
      return {
        ...user.professionalProfile,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
        },
      };
    }

    // Si no es profesional, devolver el perfil básico
    if (!user.profile) {
      throw new NotFoundException('Profile not found for this user');
    }

    return user.profile;
  }

  async updateMyProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<Profile> {
    const user = await this._prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        professionalProfile: true,
      },
    });

    if (!user || !user.profile) {
      throw new NotFoundException('Profile not found for this user');
    }

    // Separar campos entre Profile, ProfessionalProfile y User
    const {
      firstName,
      lastName,
      bio,
      description,
      pricePerSession,
      standardDuration,
      serviceCategoryId,
      tags,
      locationId,
      phone,
      isActive,
      email,
      name,
      avatar,
      // website y location no existen en el schema actual, los ignoramos por ahora
      website: _website,
      location: _location,
      ...profileFields
    } = updateProfileDto;

    // Actualizar en una transacción
    return this._prisma.$transaction(async (tx) => {
      // 1. Actualizar Profile (tabla básica)
      const updatedProfile = await tx.profile.update({
        where: { userId },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(phone && { phone }),
          ...(avatar && { avatar }),
          ...profileFields,
        },
      });

      // 2. Si el usuario es profesional, actualizar ProfessionalProfile
      if (user.role === 'PROFESSIONAL' && user.professionalProfile) {
        await tx.professionalProfile.update({
          where: { userId },
          data: {
            ...(email && { email }),
            ...(name && { name }),
            ...(bio && { bio }),
            ...(description && { description }),
            ...(pricePerSession && { pricePerSession }),
            ...(standardDuration && { standardDuration }),
            ...(serviceCategoryId && { serviceCategoryId }),
            ...(tags && { tags }),
            ...(locationId && { locationId }),
            ...(isActive !== undefined && { isActive }),
          },
        });
      }

      return updatedProfile;
    });
  }

  async findAll(query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 12;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy || 'createdAt';

    // Construir ordenamiento
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'rating') {
      orderBy = { rating: 'desc' };
    } else if (sortBy === 'name') {
      orderBy = { name: 'asc' };
    } else if (sortBy === 'price') {
      orderBy = { pricePerSession: 'asc' };
    }

    const [allProfiles, _total] = await Promise.all([
      this._prisma.professionalProfile.findMany({
        where: {
          deletedAt: null,
          isActive: true,
          user: {
            status: 'ACTIVE',
            deletedAt: null,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
          serviceCategory: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          location: {
            select: {
              id: true,
              province: true,
              city: true,
            },
          },
          reviews: {
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
              client: {
                select: {
                  profile: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          // Incluir bookings activos para verificar disponibilidad
          bookings: {
            select: {
              id: true,
              meetingStatus: true,
            },
            where: {
              OR: [{ meetingStatus: 'ACTIVE' }, { meetingStatus: 'WAITING' }],
            },
          },
        },
        orderBy,
      }),
      this._prisma.professionalProfile.count({
        where: {
          deletedAt: null,
          isActive: true,
          user: {
            status: 'ACTIVE',
            deletedAt: null,
          },
        },
      }),
    ]);

    // Filtrar profesionales disponibles (máximo 1 activa + 1 en espera)
    const availableProfiles = allProfiles.filter((profile) => {
      const activeMeetings =
        profile.bookings?.filter((b) => b.meetingStatus === 'ACTIVE').length || 0;
      const waitingMeetings =
        profile.bookings?.filter((b) => b.meetingStatus === 'WAITING').length || 0;

      // Profesional disponible si no tiene 1 activa Y 1 en espera simultáneamente
      return !(activeMeetings >= 1 && waitingMeetings >= 1);
    });

    // Aplicar paginación después del filtrado
    const paginatedProfiles = availableProfiles.slice(skip, skip + limit);

    // Transform the data to format location as string
    const transformedProfiles = paginatedProfiles.map((profile) => ({
      ...profile,
      location: profile.location ? `${profile.location.city}, ${profile.location.province}` : null,
      // No exponer los bookings internos al frontend
      bookings: undefined,
    }));

    return {
      data: transformedProfiles,
      meta: {
        total: availableProfiles.length, // Total de profesionales disponibles
        page,
        limit,
        totalPages: Math.ceil(availableProfiles.length / limit),
      },
    };
  }

  async findBySlug(slug: string): Promise<any> {
    // Buscar por ID ya que ProfessionalProfile no tiene slug por ahora
    // TODO: Implementar slug generation para profesionales
    const profile = await this._prisma.professionalProfile.findFirst({
      where: {
        id: slug,
        isActive: true,
        deletedAt: null,
        user: {
          status: 'ACTIVE',
          deletedAt: null,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        serviceCategory: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        location: {
          select: {
            id: true,
            province: true,
            city: true,
          },
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            client: {
              select: {
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!profile) {
      return null;
    }

    // Transform location to string format
    return {
      ...profile,
      location: profile.location ? `${profile.location.city}, ${profile.location.province}` : null,
    };
  }

  async findOne(id: string): Promise<any> {
    const profile = await this._prisma.professionalProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        serviceCategory: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        location: {
          select: {
            id: true,
            province: true,
            city: true,
          },
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            client: {
              select: {
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Professional profile not found');
    }

    // Transform location to string format
    return {
      ...profile,
      location: profile.location ? `${profile.location.city}, ${profile.location.province}` : null,
    };
  }

  async update(id: string, updateProfileDto: any): Promise<Profile> {
    const profile = await this._prisma.profile.findUnique({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return this._prisma.profile.update({
      where: { id },
      data: updateProfileDto,
    });
  }

  async remove(id: string): Promise<void> {
    const profile = await this._prisma.profile.findUnique({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    await this._prisma.profile.delete({
      where: { id },
    });
  }

  async toggleProfessionalActiveStatus(userId: string): Promise<any> {
    // Buscar el perfil profesional del usuario
    const professionalProfile = await this._prisma.professionalProfile.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
    });

    if (!professionalProfile) {
      throw new NotFoundException('Professional profile not found for this user');
    }

    // Cambiar el estado activo
    const updatedProfile = await this._prisma.professionalProfile.update({
      where: { id: professionalProfile.id },
      data: { isActive: !professionalProfile.isActive },
    });

    return {
      message: `Professional profile ${
        updatedProfile.isActive ? 'activated' : 'deactivated'
      } successfully`,
      isActive: updatedProfile.isActive,
    };
  }

  async getProfessionalActiveStatus(userId: string): Promise<{ isActive: boolean }> {
    const professionalProfile = await this._prisma.professionalProfile.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
      select: { isActive: true },
    });

    if (!professionalProfile) {
      throw new NotFoundException('Professional profile not found for this user');
    }

    return { isActive: professionalProfile.isActive };
  }

  /**
   * Configure MercadoPago credentials for professional
   */
  async configureMercadoPago(
    userId: string,
    dto: ConfigureMercadoPagoDto,
  ): Promise<MercadoPagoConfigResponse> {
    const professionalProfile = await this._prisma.professionalProfile.findFirst({
      where: { userId, deletedAt: null },
    });

    if (!professionalProfile) {
      throw new NotFoundException('Professional profile not found for this user');
    }

    const updated = await this._prisma.professionalProfile.update({
      where: { id: professionalProfile.id },
      data: {
        mercadoPagoEmail: dto.mercadoPagoEmail,
        mercadoPagoUserId: dto.mercadoPagoUserId,
        mpConfiguredAt: new Date(),
      },
    });

    return {
      success: true,
      mercadoPagoEmail: updated.mercadoPagoEmail!,
      mercadoPagoUserId: updated.mercadoPagoUserId || undefined,
      configuredAt: updated.mpConfiguredAt!,
      message: 'MercadoPago credentials configured successfully',
    };
  }

  /**
   * Get MercadoPago configuration status
   */
  async getMercadoPagoConfig(userId: string): Promise<{
    isConfigured: boolean;
    mercadoPagoEmail?: string;
    mercadoPagoUserId?: string;
    configuredAt?: Date;
  }> {
    const professionalProfile = await this._prisma.professionalProfile.findFirst({
      where: { userId, deletedAt: null },
      select: {
        mercadoPagoEmail: true,
        mercadoPagoUserId: true,
        mpConfiguredAt: true,
      },
    });

    if (!professionalProfile) {
      throw new NotFoundException('Professional profile not found for this user');
    }

    const isConfigured = !!professionalProfile.mercadoPagoEmail;

    return {
      isConfigured,
      mercadoPagoEmail: professionalProfile.mercadoPagoEmail || undefined,
      mercadoPagoUserId: professionalProfile.mercadoPagoUserId || undefined,
      configuredAt: professionalProfile.mpConfiguredAt || undefined,
    };
  }

  // ========== AVAILABILITY METHODS ==========

  async createAvailabilitySlot(userId: string, createSlotDto: CreateAvailabilitySlotDto) {
    const professionalProfile = await this._prisma.professionalProfile.findFirst({
      where: { userId, deletedAt: null },
    });

    if (!professionalProfile) {
      throw new NotFoundException('Professional profile not found for this user');
    }

    return this._prisma.availabilitySlot.create({
      data: {
        professionalId: professionalProfile.id,
        type: createSlotDto.type,
        dayOfWeek: createSlotDto.dayOfWeek,
        startTime: createSlotDto.startTime,
        endTime: createSlotDto.endTime,
        specificDate: createSlotDto.specificDate ? new Date(createSlotDto.specificDate) : null,
        specificStart: createSlotDto.specificStart ? new Date(createSlotDto.specificStart) : null,
        specificEnd: createSlotDto.specificEnd ? new Date(createSlotDto.specificEnd) : null,
        isActive: createSlotDto.isActive ?? true,
      },
    });
  }

  async getMyAvailability(userId: string, query: AvailabilityQueryDto) {
    const professionalProfile = await this._prisma.professionalProfile.findFirst({
      where: { userId, deletedAt: null },
    });

    if (!professionalProfile) {
      throw new NotFoundException('Professional profile not found for this user');
    }

    const where: any = { professionalId: professionalProfile.id };

    if (query.type) where.type = query.type;
    if (query.dayOfWeek) where.dayOfWeek = query.dayOfWeek;
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.fromDate) {
      where.OR = [{ specificDate: { gte: new Date(query.fromDate) } }, { type: 'RECURRING' }];
    }

    return this._prisma.availabilitySlot.findMany({
      where,
      orderBy: [
        { type: 'asc' },
        { dayOfWeek: 'asc' },
        { specificDate: 'asc' },
        { startTime: 'asc' },
      ],
    });
  }

  async getProfessionalAvailability(professionalId: string, query: AvailabilityQueryDto) {
    const where: any = { professionalId, isActive: true };

    if (query.type) where.type = query.type;
    if (query.dayOfWeek) where.dayOfWeek = query.dayOfWeek;
    if (query.fromDate) {
      where.OR = [{ specificDate: { gte: new Date(query.fromDate) } }, { type: 'RECURRING' }];
    }

    return this._prisma.availabilitySlot.findMany({
      where,
      orderBy: [
        { type: 'asc' },
        { dayOfWeek: 'asc' },
        { specificDate: 'asc' },
        { startTime: 'asc' },
      ],
    });
  }

  async updateAvailabilitySlot(
    userId: string,
    slotId: string,
    updateSlotDto: UpdateAvailabilitySlotDto,
  ) {
    const professionalProfile = await this._prisma.professionalProfile.findFirst({
      where: { userId, deletedAt: null },
    });

    if (!professionalProfile) {
      throw new NotFoundException('Professional profile not found for this user');
    }

    const slot = await this._prisma.availabilitySlot.findFirst({
      where: { id: slotId, professionalId: professionalProfile.id },
    });

    if (!slot) {
      throw new NotFoundException('Availability slot not found');
    }

    const updateData: any = {};
    if (updateSlotDto.dayOfWeek) updateData.dayOfWeek = updateSlotDto.dayOfWeek;
    if (updateSlotDto.startTime) updateData.startTime = updateSlotDto.startTime;
    if (updateSlotDto.endTime) updateData.endTime = updateSlotDto.endTime;
    if (updateSlotDto.specificDate) updateData.specificDate = new Date(updateSlotDto.specificDate);
    if (updateSlotDto.specificStart)
      updateData.specificStart = new Date(updateSlotDto.specificStart);
    if (updateSlotDto.specificEnd) updateData.specificEnd = new Date(updateSlotDto.specificEnd);
    if (updateSlotDto.isActive !== undefined) updateData.isActive = updateSlotDto.isActive;

    return this._prisma.availabilitySlot.update({
      where: { id: slotId },
      data: updateData,
    });
  }

  async deleteAvailabilitySlot(userId: string, slotId: string) {
    const professionalProfile = await this._prisma.professionalProfile.findFirst({
      where: { userId, deletedAt: null },
    });

    if (!professionalProfile) {
      throw new NotFoundException('Professional profile not found for this user');
    }

    const slot = await this._prisma.availabilitySlot.findFirst({
      where: { id: slotId, professionalId: professionalProfile.id },
    });

    if (!slot) {
      throw new NotFoundException('Availability slot not found');
    }

    await this._prisma.availabilitySlot.delete({
      where: { id: slotId },
    });

    return { message: 'Availability slot deleted successfully' };
  }

  // ========== REVIEWS METHODS ==========

  async getMyReviews(userId: string, query: ReviewQueryDto) {
    const professionalProfile = await this._prisma.professionalProfile.findFirst({
      where: { userId, deletedAt: null },
    });

    if (!professionalProfile) {
      throw new NotFoundException('Professional profile not found for this user');
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { professionalId: professionalProfile.id };
    if (query.rating) where.rating = query.rating;
    if (query.hasResponse !== undefined) {
      where.professionalResponse = query.hasResponse ? { not: null } : null;
    }

    const orderBy: any = {};
    if (query.orderBy === 'rating') {
      orderBy.rating = query.orderDirection === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.createdAt = query.orderDirection === 'asc' ? 'asc' : 'desc';
    }

    const [reviews, total] = await Promise.all([
      this._prisma.review.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this._prisma.review.count({ where }),
    ]);

    return {
      data: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        professionalResponse: review.professionalResponse,
        respondedAt: review.respondedAt,
        createdAt: review.createdAt,
        user: {
          id: review.client.id,
          firstName: review.client.profile?.firstName || '',
          lastName: review.client.profile?.lastName || '',
          avatar: review.client.profile?.avatar,
        },
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMyReviewStats(userId: string) {
    const professionalProfile = await this._prisma.professionalProfile.findFirst({
      where: { userId, deletedAt: null },
    });

    if (!professionalProfile) {
      throw new NotFoundException('Professional profile not found for this user');
    }

    const reviews = await this._prisma.review.findMany({
      where: { professionalId: professionalProfile.id },
      include: {
        client: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews : 0;

    const ratingDistribution = {
      5: reviews.filter((r) => r.rating === 5).length,
      4: reviews.filter((r) => r.rating === 4).length,
      3: reviews.filter((r) => r.rating === 3).length,
      2: reviews.filter((r) => r.rating === 2).length,
      1: reviews.filter((r) => r.rating === 1).length,
    };

    return {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
      recentReviews: reviews.slice(0, 5).map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        professionalResponse: review.professionalResponse,
        respondedAt: review.respondedAt,
        createdAt: review.createdAt,
        user: {
          id: review.client.id,
          firstName: review.client.profile?.firstName || '',
          lastName: review.client.profile?.lastName || '',
          avatar: review.client.profile?.avatar,
        },
      })),
    };
  }

  async respondToReview(userId: string, reviewId: string, responseDto: ReviewResponseDto) {
    const professionalProfile = await this._prisma.professionalProfile.findFirst({
      where: { userId, deletedAt: null },
    });

    if (!professionalProfile) {
      throw new NotFoundException('Professional profile not found for this user');
    }

    const review = await this._prisma.review.findFirst({
      where: { id: reviewId, professionalId: professionalProfile.id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return this._prisma.review.update({
      where: { id: reviewId },
      data: {
        professionalResponse: responseDto.response,
        respondedAt: new Date(),
      },
      include: {
        client: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });
  }

  async getProfessionalReviews(professionalId: string, query: ReviewQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { professionalId };
    if (query.rating) where.rating = query.rating;

    const orderBy: any = {};
    if (query.orderBy === 'rating') {
      orderBy.rating = query.orderDirection === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.createdAt = query.orderDirection === 'asc' ? 'asc' : 'desc';
    }

    const [reviews, total] = await Promise.all([
      this._prisma.review.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this._prisma.review.count({ where }),
    ]);

    return {
      data: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        professionalResponse: review.professionalResponse,
        respondedAt: review.respondedAt,
        createdAt: review.createdAt,
        user: {
          id: review.client.id,
          firstName: review.client.profile?.firstName || '',
          lastName: review.client.profile?.lastName || '',
          avatar: review.client.profile?.avatar,
        },
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ========== ANALYTICS METHODS ==========

  async getMyAnalytics(userId: string, query: AnalyticsQueryDto) {
    const bookingStats = await this.getBookingStats(userId, query);
    const revenueStats = await this.getRevenueStats(userId, query);
    const profileStats = await this.getProfileStats(userId, query);

    const period = {
      from: query.fromDate
        ? new Date(query.fromDate)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      to: query.toDate ? new Date(query.toDate) : new Date(),
    };

    return {
      bookingStats,
      revenueStats,
      profileStats,
      period,
      lastUpdated: new Date(),
    };
  }

  async getBookingStats(userId: string, query: AnalyticsQueryDto) {
    const professionalProfile = await this._prisma.professionalProfile.findFirst({
      where: { userId, deletedAt: null },
    });

    if (!professionalProfile) {
      throw new NotFoundException('Professional profile not found for this user');
    }

    const fromDate = query.fromDate
      ? new Date(query.fromDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = query.toDate ? new Date(query.toDate) : new Date();

    const bookings = await this._prisma.booking.findMany({
      where: {
        professionalId: professionalProfile.id,
        createdAt: { gte: fromDate, lte: toDate },
      },
    });

    const totalBookings = bookings.length;
    const completedBookings = bookings.filter((b) => b.meetingStatus === 'COMPLETED').length;
    const cancelledBookings = bookings.filter((b) => b.meetingStatus === 'CANCELLED').length;
    const pendingBookings = bookings.filter(
      (b) => b.meetingStatus === 'PENDING' || b.meetingStatus === 'WAITING',
    ).length;
    const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

    return {
      totalBookings,
      completedBookings,
      cancelledBookings,
      pendingBookings,
      completionRate: Math.round(completionRate * 10) / 10,
      averageSessionDuration: professionalProfile.standardDuration,
      bookingsByPeriod: [], // TODO: Implement period grouping
    };
  }

  async getRevenueStats(userId: string, query: AnalyticsQueryDto) {
    const professionalProfile = await this._prisma.professionalProfile.findFirst({
      where: { userId, deletedAt: null },
    });

    if (!professionalProfile) {
      throw new NotFoundException('Professional profile not found for this user');
    }

    const fromDate = query.fromDate
      ? new Date(query.fromDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = query.toDate ? new Date(query.toDate) : new Date();

    const completedBookings = await this._prisma.booking.findMany({
      where: {
        professionalId: professionalProfile.id,
        meetingStatus: 'COMPLETED',
        createdAt: { gte: fromDate, lte: toDate },
      },
    });

    const totalRevenue = completedBookings.reduce((sum, booking) => sum + Number(booking.price), 0);
    const averageSessionValue =
      completedBookings.length > 0 ? totalRevenue / completedBookings.length : 0;

    return {
      totalRevenue,
      revenueThisMonth: totalRevenue, // Simplified for now
      revenueLastMonth: 0, // TODO: Calculate last month
      averageSessionValue: Math.round(averageSessionValue * 100) / 100,
      revenueByPeriod: [], // TODO: Implement period grouping
      paymentMethodStats: {
        mercadopago: totalRevenue,
        other: 0,
      },
    };
  }

  async getProfileStats(userId: string, _query: AnalyticsQueryDto) {
    const professionalProfile = await this._prisma.professionalProfile.findFirst({
      where: { userId, deletedAt: null },
    });

    if (!professionalProfile) {
      throw new NotFoundException('Professional profile not found for this user');
    }

    return {
      profileViews: 0, // TODO: Implement view tracking
      profileViewsThisMonth: 0,
      conversionRate: 0, // TODO: Calculate views to bookings
      averageRating: professionalProfile.rating,
      totalReviews: professionalProfile.reviewCount,
      responseRate: 100, // TODO: Calculate actual response rate
      averageResponseTime: 30, // TODO: Calculate actual response time in minutes
    };
  }

  async getPopularTimes(userId: string, _query: AnalyticsQueryDto) {
    const professionalProfile = await this._prisma.professionalProfile.findFirst({
      where: { userId, deletedAt: null },
    });

    if (!professionalProfile) {
      throw new NotFoundException('Professional profile not found for this user');
    }

    // TODO: Implement actual analytics based on booking data
    return {
      dayOfWeek: [
        { day: 'Monday', bookings: 5, percentage: 14.3 },
        { day: 'Tuesday', bookings: 7, percentage: 20.0 },
        { day: 'Wednesday', bookings: 6, percentage: 17.1 },
        { day: 'Thursday', bookings: 8, percentage: 22.9 },
        { day: 'Friday', bookings: 9, percentage: 25.7 },
        { day: 'Saturday', bookings: 0, percentage: 0 },
        { day: 'Sunday', bookings: 0, percentage: 0 },
      ],
      hourOfDay: [
        { hour: 9, bookings: 3, percentage: 8.6 },
        { hour: 10, bookings: 5, percentage: 14.3 },
        { hour: 11, bookings: 6, percentage: 17.1 },
        { hour: 14, bookings: 8, percentage: 22.9 },
        { hour: 15, bookings: 7, percentage: 20.0 },
        { hour: 16, bookings: 6, percentage: 17.1 },
      ],
      monthOfYear: [
        { month: 'January', bookings: 10, percentage: 16.7 },
        { month: 'February', bookings: 8, percentage: 13.3 },
        { month: 'March', bookings: 12, percentage: 20.0 },
        { month: 'April', bookings: 15, percentage: 25.0 },
        { month: 'May', bookings: 9, percentage: 15.0 },
        { month: 'June', bookings: 6, percentage: 10.0 },
      ],
    };
  }
}
