import { Injectable } from "@nestjs/common";

@Injectable()
export class ServicesService {
  getCategories() {
    return {
      data: [
        { id: "1", name: "Salud y Bienestar", slug: "salud-bienestar" },
        { id: "2", name: "Educación", slug: "educacion" },
        { id: "3", name: "Tecnología", slug: "tecnologia" },
        { id: "4", name: "Hogar y Reparaciones", slug: "hogar-reparaciones" },
        { id: "5", name: "Eventos", slug: "eventos" },
      ],
    };
  }

  create(createServiceDto: any) {
    return { message: "Service created", data: createServiceDto };
  }

  findAll(filters: { category?: string; location?: string; query?: string }) {
    return {
      message: "Services found",
      data: [],
      filters,
      pagination: { page: 1, limit: 10, total: 0 },
    };
  }

  findOne(id: string) {
    return { message: `Service ${id}`, data: { id } };
  }

  update(id: string, updateServiceDto: any) {
    return { message: `Service ${id} updated`, data: updateServiceDto };
  }

  remove(id: string) {
    return { message: `Service ${id} deleted` };
  }
}
