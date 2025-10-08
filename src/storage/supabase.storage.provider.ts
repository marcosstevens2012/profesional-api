import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  SignedDownloadUrl,
  StorageMetadata,
  StorageProvider,
  UploadToken,
} from "./storage.provider";

@Injectable()
export class SupabaseStorageProvider extends StorageProvider {
  private readonly logger = new Logger(SupabaseStorageProvider.name);
  private supabase: SupabaseClient;
  private bucketName: string;
  private signedUrlTtl: number;

  readonly name = "supabase";
  readonly isPublic = false;

  constructor(private readonly _configService: ConfigService) {
    super();

    const supabaseUrl = this._configService.get<string>("SUPABASE_URL");
    const serviceRoleKey = this._configService.get<string>(
      "SUPABASE_SERVICE_ROLE_KEY"
    );

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured"
      );
    }

    this.supabase = createClient(supabaseUrl, serviceRoleKey);
    this.bucketName = this._configService.get<string>(
      "SUPABASE_STORAGE_BUCKET",
      "attachments"
    );
    this.signedUrlTtl = this._configService.get<number>(
      "SUPABASE_SIGNED_URL_TTL",
      900
    ); // 15 min default
  }

  async generateUploadToken(
    key: string,
    options: {
      contentType: string;
      maxSize: number;
      expiresIn?: number;
    }
  ): Promise<UploadToken> {
    try {
      const expiresIn = options.expiresIn || this.signedUrlTtl;

      // Generar URL firmada para upload
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUploadUrl(key, {
          upsert: false, // No permitir sobrescribir
        });

      if (error) {
        this.logger.error("Error generating upload token", { error, key });
        throw new InternalServerErrorException(
          "Failed to generate upload token"
        );
      }

      return {
        url: data.signedUrl,
        key,
        method: "PUT",
        headers: {
          "Content-Type": options.contentType,
          "Content-Length": options.maxSize.toString(),
        },
        expiresAt: new Date(Date.now() + expiresIn * 1000),
      };
    } catch (error) {
      this.logger.error("Error in generateUploadToken", { error, key });
      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException("Failed to generate upload token");
    }
  }

  async generateSignedDownloadUrl(
    key: string,
    options?: {
      expiresIn?: number;
      filename?: string;
    }
  ): Promise<SignedDownloadUrl> {
    try {
      const expiresIn = options?.expiresIn || this.signedUrlTtl;

      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUrl(key, expiresIn, {
          download: options?.filename, // Force download with specific filename
        });

      if (error) {
        this.logger.error("Error generating signed download URL", {
          error,
          key,
        });
        throw new InternalServerErrorException(
          "Failed to generate download URL"
        );
      }

      return {
        url: data.signedUrl,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
      };
    } catch (error) {
      this.logger.error("Error in generateSignedDownloadUrl", { error, key });
      throw new InternalServerErrorException("Failed to generate download URL");
    }
  }

  getPublicUrl(key: string): string {
    // Supabase storage es privado por defecto, esta función no debería usarse
    // pero la implementamos por la interfaz
    const { data } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(key);

    return data.publicUrl;
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([key]);

      if (error) {
        this.logger.error("Error deleting file", { error, key });
        throw new InternalServerErrorException("Failed to delete file");
      }
    } catch (error) {
      this.logger.error("Error in deleteFile", { error, key });
      throw new InternalServerErrorException("Failed to delete file");
    }
  }

  async getMetadata(key: string): Promise<StorageMetadata> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list("", {
          search: key,
        });

      if (error) {
        this.logger.error("Error getting file metadata", { error, key });
        throw new InternalServerErrorException("Failed to get file metadata");
      }

      const file = data?.find(f => f.name === key.split("/").pop());
      if (!file) {
        throw new BadRequestException("File not found");
      }

      return {
        contentType: file.metadata?.mimetype || "application/octet-stream",
        size: file.metadata?.size || 0,
        lastModified: file.updated_at ? new Date(file.updated_at) : undefined,
        customMetadata: file.metadata,
      };
    } catch (error) {
      this.logger.error("Error in getMetadata", { error, key });
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException("Failed to get file metadata");
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list("", {
          search: key,
        });

      if (error) {
        this.logger.error("Error checking file existence", { error, key });
        return false;
      }

      return data?.some(f => f.name === key.split("/").pop()) || false;
    } catch (error) {
      this.logger.error("Error in exists", { error, key });
      return false;
    }
  }
}
