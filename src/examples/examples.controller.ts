import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import {
  BookingView,
  ApiResponse as ContractResponse,
  CONTRACTS_VERSION,
  CreateBookingDTO,
  CreateBookingSchema,
  PaginatedResponse,
  ProfessionalProfileView,
  SearchFilters,
  SearchFiltersSchema,
} from "@profesional/contracts";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

@ApiTags("examples")
@Controller("examples")
export class ExamplesController {
  @Get("contracts-version")
  @ApiOperation({ summary: "Get contracts version" })
  @ApiResponse({ status: 200, description: "Contracts version info" })
  getContractsVersion(): ContractResponse<{ version: string }> {
    return {
      success: true,
      data: {
        version: CONTRACTS_VERSION,
      },
    };
  }

  @Post("bookings")
  @ApiOperation({ summary: "Create booking with Zod validation" })
  @ApiResponse({ status: 201, description: "Booking created successfully" })
  async createBooking(
    @Body(new ZodValidationPipe(CreateBookingSchema))
    createBookingDto: CreateBookingDTO
  ): Promise<ContractResponse<BookingView>> {
    // Simulate booking creation
    const booking: BookingView = {
      id: "booking-123",
      clientId: "client-456",
      professionalId: createBookingDto.professionalId,
      serviceDescription: createBookingDto.serviceDescription,
      scheduledAt: createBookingDto.scheduledAt,
      duration: createBookingDto.duration,
      hourlyRate: 5000,
      totalAmount: 5000 * (createBookingDto.duration / 60),
      currency: "ARS",
      status: "draft",
      notes: createBookingDto.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
      client: {
        id: "client-456",
        name: "Juan Pérez",
        email: "juan@example.com",
        isActive: true,
        role: "client",
        createdAt: new Date(),
      },
      professional: {
        id: createBookingDto.professionalId,
        userId: "user-789",
        title: "Desarrollador Full Stack",
        description: "Experto en React y Node.js",
        hourlyRate: 5000,
        currency: "ARS",
        experience: 5,
        isVerified: true,
        isAvailable: true,
        rating: 4.8,
        reviewCount: 25,
        completedBookings: 100,
        portfolio: ["https://example.com/portfolio1.jpg"],
        certifications: ["React Developer Certified"],
        languages: ["es", "en"],
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: "user-789",
          name: "María García",
          email: "maria@example.com",
          isActive: true,
          role: "professional",
          createdAt: new Date(),
        },
      },
    };

    return {
      success: true,
      data: booking,
    };
  }

  @Get("search")
  @ApiOperation({ summary: "Search professionals with typed filters" })
  @ApiQuery({ name: "query", required: false })
  @ApiQuery({ name: "minRate", required: false, type: Number })
  @ApiQuery({ name: "maxRate", required: false, type: Number })
  @ApiQuery({ name: "rating", required: false, type: Number })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({ status: 200, description: "Search results" })
  async searchProfessionals(
    @Query(new ZodValidationPipe(SearchFiltersSchema))
    filters: SearchFilters
  ): Promise<PaginatedResponse<ProfessionalProfileView>> {
    // Simulate search results
    const professionals: ProfessionalProfileView[] = [
      {
        id: "prof-1",
        userId: "user-1",
        title: "Desarrollador React Senior",
        description: "Especialista en aplicaciones modernas con React",
        hourlyRate: 6000,
        currency: "ARS",
        experience: 8,
        isVerified: true,
        isAvailable: true,
        rating: 4.9,
        reviewCount: 45,
        completedBookings: 200,
        portfolio: [
          "https://example.com/portfolio1.jpg",
          "https://example.com/portfolio2.jpg",
        ],
        certifications: ["React Expert", "JavaScript Professional"],
        languages: ["es", "en"],
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: "user-1",
          name: "Ana Rodriguez",
          email: "ana@example.com",
          isActive: true,
          role: "professional",
          createdAt: new Date(),
        },
      },
    ];

    return {
      success: true,
      data: professionals,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    };
  }
}
