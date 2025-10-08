import { Injectable } from "@nestjs/common";
import { PaginatedResponse, ProfessionalProfile } from "@profesional/contracts";

@Injectable()
export class SearchService {
  // Mock data for testing - usando los mismos datos que ProfilesService
  private mockProfiles: Array<
    ProfessionalProfile & {
      user?: { name: string; avatarUrl?: string };
      slug?: string;
      location?: string;
      skills?: string[];
      responseTime?: string;
      services?: Array<{ id: string; title: string; price: number }>;
      reviews?: Array<{
        id: string;
        rating: number;
        comment: string;
        client: string;
      }>;
    }
  > = [
    {
      id: "1",
      userId: "user1",
      title: "Desarrollador Full-Stack",
      description:
        "Especialista en React, Node.js y bases de datos. Más de 5 años creando aplicaciones web modernas.",
      hourlyRate: 15000,
      currency: "ARS" as const,
      experience: 5,
      isVerified: true,
      rating: 4.8,
      reviewCount: 42,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      // Propiedades requeridas
      isAvailable: true,
      completedBookings: 42,
      portfolio: [],
      certifications: [],
      languages: ["es", "en"],
      // Campos adicionales
      user: {
        name: "Juan Pérez",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=juan",
      },
      slug: "juan-perez-fullstack",
      location: "Buenos Aires, Argentina",
      skills: ["React", "Node.js", "TypeScript", "PostgreSQL"],
      responseTime: "2 horas",
      services: [
        { id: "1", title: "Desarrollo Frontend", price: 12000 },
        { id: "2", title: "Desarrollo Backend", price: 15000 },
        { id: "3", title: "Consultoría técnica", price: 18000 },
      ],
      reviews: [
        {
          id: "1",
          rating: 5,
          comment: "Excelente trabajo, muy profesional",
          client: "María González",
        },
        {
          id: "2",
          rating: 4,
          comment: "Entregó en tiempo y forma",
          client: "Carlos López",
        },
      ],
    },
    {
      id: "2",
      userId: "user2",
      title: "Diseñadora UX/UI",
      description:
        "Diseñadora especializada en experiencia de usuario y interfaces modernas. Portfolio con más de 50 proyectos.",
      hourlyRate: 12000,
      currency: "ARS" as const,
      experience: 3,
      isVerified: false,
      rating: 4.6,
      reviewCount: 28,
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15"),
      // Propiedades requeridas
      isAvailable: true,
      completedBookings: 28,
      portfolio: [],
      certifications: [],
      languages: ["es"],
      // Campos adicionales
      user: {
        name: "Ana Rodríguez",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ana",
      },
      slug: "ana-rodriguez-uxui",
      location: "Córdoba, Argentina",
      skills: ["Figma", "Adobe XD", "Sketch", "Prototyping"],
      responseTime: "4 horas",
      services: [
        { id: "4", title: "Diseño de interfaces", price: 10000 },
        { id: "5", title: "Prototipado", price: 8000 },
        { id: "6", title: "Research UX", price: 15000 },
      ],
      reviews: [
        {
          id: "3",
          rating: 5,
          comment: "Diseños increíbles, muy creativa",
          client: "Pedro Martín",
        },
      ],
    },
    {
      id: "3",
      userId: "user3",
      title: "Especialista en Marketing Digital",
      description:
        "Experto en campañas de Google Ads, Facebook Ads y SEO. Ayudo a empresas a aumentar sus ventas online.",
      hourlyRate: 8000,
      currency: "ARS" as const,
      experience: 4,
      isVerified: true,
      rating: 4.9,
      reviewCount: 67,
      createdAt: new Date("2024-02-01"),
      updatedAt: new Date("2024-02-01"),
      // Propiedades requeridas
      isAvailable: true,
      completedBookings: 67,
      portfolio: [],
      certifications: [],
      languages: ["es"],
      // Campos adicionales
      user: {
        name: "Luis Fernández",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=luis",
      },
      slug: "luis-fernandez-marketing",
      location: "Rosario, Argentina",
      skills: ["Google Ads", "Facebook Ads", "SEO", "Analytics"],
      responseTime: "1 hora",
      services: [
        { id: "7", title: "Campaña Google Ads", price: 6000 },
        { id: "8", title: "Optimización SEO", price: 10000 },
        { id: "9", title: "Social Media", price: 7000 },
      ],
      reviews: [
        {
          id: "4",
          rating: 5,
          comment: "Aumentó mis ventas un 200%",
          client: "Roberto Silva",
        },
        {
          id: "5",
          rating: 5,
          comment: "Muy profesional y efectivo",
          client: "Laura Morales",
        },
      ],
    },
  ];

  async search(
    filters: any = {}
  ): Promise<PaginatedResponse<ProfessionalProfile>> {
    let filteredProfiles = [...this.mockProfiles];

    // Apply filters
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filteredProfiles = filteredProfiles.filter(
        profile =>
          profile.title.toLowerCase().includes(query) ||
          profile.description.toLowerCase().includes(query) ||
          profile.skills?.some((skill: string) =>
            skill.toLowerCase().includes(query)
          )
      );
    }

    if (filters.category) {
      filteredProfiles = filteredProfiles.filter(profile =>
        profile.title.toLowerCase().includes(filters.category.toLowerCase())
      );
    }

    if (filters.location) {
      filteredProfiles = filteredProfiles.filter(profile =>
        profile.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.minRate) {
      filteredProfiles = filteredProfiles.filter(
        profile => profile.hourlyRate >= parseInt(filters.minRate)
      );
    }

    if (filters.maxRate) {
      filteredProfiles = filteredProfiles.filter(
        profile => profile.hourlyRate <= parseInt(filters.maxRate)
      );
    }

    if (filters.rating) {
      filteredProfiles = filteredProfiles.filter(
        profile => profile.rating >= parseFloat(filters.rating)
      );
    }

    if (filters.isVerified !== undefined) {
      const isVerified = filters.isVerified === "true";
      filteredProfiles = filteredProfiles.filter(
        profile => profile.isVerified === isVerified
      );
    }

    // Sorting
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case "rating":
          filteredProfiles.sort((a, b) => b.rating - a.rating);
          break;
        case "price_low":
          filteredProfiles.sort((a, b) => a.hourlyRate - b.hourlyRate);
          break;
        case "price_high":
          filteredProfiles.sort((a, b) => b.hourlyRate - a.hourlyRate);
          break;
        case "newest":
          filteredProfiles.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          break;
        default: // relevance
          // Keep original order for relevance
          break;
      }
    }

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedProfiles = filteredProfiles.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredProfiles.length / limit);

    return {
      success: true,
      data: paginatedProfiles,
      pagination: {
        page,
        limit,
        total: filteredProfiles.length,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getSuggestions(query: string): Promise<string[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const suggestions = new Set<string>();
    const queryLower = query.toLowerCase();

    // Search in titles, skills, and locations
    this.mockProfiles.forEach(profile => {
      // Add titles
      if (profile.title.toLowerCase().includes(queryLower)) {
        suggestions.add(profile.title);
      }

      // Add skills
      profile.skills?.forEach((skill: string) => {
        if (skill.toLowerCase().includes(queryLower)) {
          suggestions.add(skill);
        }
      });

      // Add locations
      if (profile.location?.toLowerCase().includes(queryLower)) {
        const locationParts = profile.location.split(",");
        locationParts.forEach((part: string) => {
          const trimmed = part.trim();
          if (trimmed.toLowerCase().includes(queryLower)) {
            suggestions.add(trimmed);
          }
        });
      }
    });

    return Array.from(suggestions).slice(0, 10); // Return max 10 suggestions
  }
}
