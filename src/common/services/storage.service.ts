import { BadRequestException, Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not found in environment variables');
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Upload a file to Supabase Storage
   * @param userId - User ID (used for folder organization)
   * @param file - File buffer
   * @param fileName - Original filename
   * @param fileType - MIME type
   * @returns Public URL of the uploaded file
   */
  async uploadProfessionalDocument(
    userId: string,
    file: Buffer,
    fileName: string,
    fileType: string,
  ): Promise<string> {
    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

    if (!allowedTypes.includes(fileType)) {
      throw new BadRequestException(
        'Tipo de archivo no permitido. Solo se aceptan imágenes (JPG, PNG, WEBP) y PDF',
      );
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.length > maxSize) {
      throw new BadRequestException('El archivo no debe superar los 10MB');
    }

    // Generate unique filename: userId/timestamp-filename
    const timestamp = Date.now();
    const filePath = `${userId}/${timestamp}-${fileName}`;

    // Upload to Supabase Storage
    const { error } = await this.supabase.storage
      .from('professional-documents')
      .upload(filePath, file, {
        contentType: fileType,
        upsert: false,
      });

    if (error) {
      console.error('Error uploading to Supabase Storage:', error);
      throw new BadRequestException(`Error al subir archivo: ${error.message}`);
    }

    // Obtener URL pública del archivo
    const { data: urlData } = this.supabase.storage
      .from('professional-documents')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  }

  /**
   * Delete a file from Supabase Storage
   * @param fileUrl - Public URL of the file to delete
   */
  async deleteProfessionalDocument(fileUrl: string): Promise<void> {
    try {
      // Extraer el path del archivo de la URL
      const url = new URL(fileUrl);
      const pathParts = url.pathname.split('/');
      // El path completo incluye: userId/timestamp-filename
      const filePath = pathParts.slice(-2).join('/');

      const { error } = await this.supabase.storage
        .from('professional-documents')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting from Supabase Storage:', error);
        throw new BadRequestException(`Error al eliminar archivo: ${error.message}`);
      }
    } catch (error) {
      console.error('Error parsing file URL:', error);
      throw new BadRequestException('URL de archivo inválida');
    }
  }

  /**
   * Get signed URL for private file access
   * @param filePath - Path to the file in storage
   * @param expiresIn - Expiration time in seconds (default 1 hour)
   */
  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from('professional-documents')
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Error creating signed URL:', error);
      throw new BadRequestException(`Error al generar URL: ${error.message}`);
    }

    return data.signedUrl;
  }
}
