import { Injectable, NotFoundException } from "@nestjs/common";
import { Profile } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import {
  ConfigureMercadoPagoDto,
  MercadoPagoConfigResponse,
} from "./dto/configure-mercadopago.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@Injectable()
export class ProfilesService {
  constructor(private readonly _prisma: PrismaService) {}

  async create(createProfileDto: any): Promise<any> {
    // This would be for creating professional profiles
    // For now, return a mock implementation
    return {
      message: "Profile creation not implemented yet",
      data: createProfileDto,
    };
  }

  async getMyProfile(userId: string): Promise<Profile> {
    const profile = await this._prisma.profile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException("Profile not found for this user");
    }

    return profile;
  }

  async updateMyProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto
  ): Promise<Profile> {
    const profile = await this._prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException("Profile not found for this user");
    }

    return this._prisma.profile.update({
      where: { userId },
      data: updateProfileDto,
    });
  }

  async findAll(query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 12;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy || "createdAt";

    // Construir ordenamiento
    let orderBy: any = { createdAt: "desc" };
    if (sortBy === "rating") {
      orderBy = { rating: "desc" };
    } else if (sortBy === "name") {
      orderBy = { name: "asc" };
    } else if (sortBy === "price") {
      orderBy = { pricePerSession: "asc" };
    }

    const [allProfiles, _total] = await Promise.all([
      this._prisma.professionalProfile.findMany({
        where: {
          deletedAt: null,
          isActive: true,
          user: {
            status: "ACTIVE",
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
            orderBy: { createdAt: "desc" },
            take: 5,
          },
          // Incluir bookings activos para verificar disponibilidad
          bookings: {
            select: {
              id: true,
              meetingStatus: true,
            },
            where: {
              OR: [{ meetingStatus: "ACTIVE" }, { meetingStatus: "WAITING" }],
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
            status: "ACTIVE",
            deletedAt: null,
          },
        },
      }),
    ]);

    // Filtrar profesionales disponibles (máximo 1 activa + 1 en espera)
    const availableProfiles = allProfiles.filter(profile => {
      const activeMeetings =
        profile.bookings?.filter(b => b.meetingStatus === "ACTIVE").length || 0;
      const waitingMeetings =
        profile.bookings?.filter(b => b.meetingStatus === "WAITING").length ||
        0;

      // Profesional disponible si no tiene 1 activa Y 1 en espera simultáneamente
      return !(activeMeetings >= 1 && waitingMeetings >= 1);
    });

    // Aplicar paginación después del filtrado
    const paginatedProfiles = availableProfiles.slice(skip, skip + limit);

    // Transform the data to format location as string
    const transformedProfiles = paginatedProfiles.map(profile => ({
      ...profile,
      location: profile.location
        ? `${profile.location.city}, ${profile.location.province}`
        : null,
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
          status: "ACTIVE",
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
          orderBy: { createdAt: "desc" },
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
      location: profile.location
        ? `${profile.location.city}, ${profile.location.province}`
        : null,
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
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException("Professional profile not found");
    }

    // Transform location to string format
    return {
      ...profile,
      location: profile.location
        ? `${profile.location.city}, ${profile.location.province}`
        : null,
    };
  }

  async update(id: string, updateProfileDto: any): Promise<Profile> {
    const profile = await this._prisma.profile.findUnique({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundException("Profile not found");
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
      throw new NotFoundException("Profile not found");
    }

    await this._prisma.profile.delete({
      where: { id },
    });
  }

  async toggleProfessionalActiveStatus(userId: string): Promise<any> {
    // Buscar el perfil profesional del usuario
    const professionalProfile =
      await this._prisma.professionalProfile.findFirst({
        where: {
          userId,
          deletedAt: null,
        },
      });

    if (!professionalProfile) {
      throw new NotFoundException(
        "Professional profile not found for this user"
      );
    }

    // Cambiar el estado activo
    const updatedProfile = await this._prisma.professionalProfile.update({
      where: { id: professionalProfile.id },
      data: { isActive: !professionalProfile.isActive },
    });

    return {
      message: `Professional profile ${
        updatedProfile.isActive ? "activated" : "deactivated"
      } successfully`,
      isActive: updatedProfile.isActive,
    };
  }

  async getProfessionalActiveStatus(
    userId: string
  ): Promise<{ isActive: boolean }> {
    const professionalProfile =
      await this._prisma.professionalProfile.findFirst({
        where: {
          userId,
          deletedAt: null,
        },
        select: { isActive: true },
      });

    if (!professionalProfile) {
      throw new NotFoundException(
        "Professional profile not found for this user"
      );
    }

    return { isActive: professionalProfile.isActive };
  }

  /**
   * Configure MercadoPago credentials for professional
   */
  async configureMercadoPago(
    userId: string,
    dto: ConfigureMercadoPagoDto
  ): Promise<MercadoPagoConfigResponse> {
    const professionalProfile =
      await this._prisma.professionalProfile.findFirst({
        where: { userId, deletedAt: null },
      });

    if (!professionalProfile) {
      throw new NotFoundException(
        "Professional profile not found for this user"
      );
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
      message: "MercadoPago credentials configured successfully",
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
    const professionalProfile =
      await this._prisma.professionalProfile.findFirst({
        where: { userId, deletedAt: null },
        select: {
          mercadoPagoEmail: true,
          mercadoPagoUserId: true,
          mpConfiguredAt: true,
        },
      });

    if (!professionalProfile) {
      throw new NotFoundException(
        "Professional profile not found for this user"
      );
    }

    const isConfigured = !!professionalProfile.mercadoPagoEmail;

    return {
      isConfigured,
      mercadoPagoEmail: professionalProfile.mercadoPagoEmail || undefined,
      mercadoPagoUserId: professionalProfile.mercadoPagoUserId || undefined,
      configuredAt: professionalProfile.mpConfiguredAt || undefined,
    };
  }
}
