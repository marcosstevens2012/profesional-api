import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  SignedDownloadUrl,
  StorageMetadata,
  StorageProvider,
  UploadToken,
} from "./storage.provider";

@Injectable()
export class VercelBlobStorageProvider extends StorageProvider {
  private readonly logger = new Logger(VercelBlobStorageProvider.name);
  private readonly token: string;
  private readonly baseUrl: string;

  readonly name = "vercel";
  readonly isPublic = true;

  constructor(private readonly _configService: ConfigService) {
    super();

    const token = this._configService.get<string>(
      "VERCEL_BLOB_READ_WRITE_TOKEN"
    );
    if (!token) {
      throw new Error(
        "VERCEL_BLOB_READ_WRITE_TOKEN is required for Vercel Blob storage"
      );
    }
    this.token = token;
    this.baseUrl = this._configService.get<string>(
      "BLOB_PUBLIC_BASE_URL",
      "https://blob.vercel-storage.com"
    );

    if (!this.token) {
      throw new Error(
        "VERCEL_BLOB_READ_WRITE_TOKEN must be configured for Vercel Blob storage"
      );
    }
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
      // Para Vercel Blob, generamos URL directa con token
      const uploadUrl = `${this.baseUrl}/upload`;

      return {
        url: uploadUrl,
        key,
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": options.contentType,
        },
        fields: {
          pathname: key,
          contentType: options.contentType,
        },
        expiresAt: new Date(Date.now() + (options.expiresIn || 3600) * 1000),
      };
    } catch (error) {
      this.logger.error("Error in generateUploadToken", { error, key });
      throw new InternalServerErrorException("Failed to generate upload token");
    }
  }

  async generateSignedDownloadUrl(
    key: string,
    _options?: {
      expiresIn?: number;
      filename?: string;
    }
  ): Promise<SignedDownloadUrl> {
    // Vercel Blob es público, no necesita URLs firmadas
    // Pero implementamos para mantener la interfaz consistente
    return {
      url: this.getPublicUrl(key),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año
    };
  }

  getPublicUrl(key: string): string {
    return `${this.baseUrl}/${key}`;
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/delete`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ urls: [this.getPublicUrl(key)] }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      this.logger.error("Error in deleteFile", { error, key });
      throw new InternalServerErrorException("Failed to delete file");
    }
  }

  async getMetadata(_key: string): Promise<StorageMetadata> {
    // Vercel Blob no tiene API para obtener metadatos fácilmente
    // Esta funcionalidad estaría limitada
    this.logger.warn("getMetadata not fully supported for Vercel Blob");
    return {
      contentType: "application/octet-stream",
      size: 0,
    };
  }

  async exists(key: string): Promise<boolean> {
    try {
      const response = await fetch(this.getPublicUrl(key), { method: "HEAD" });
      return response.ok;
    } catch (error) {
      this.logger.error("Error in exists", { error, key });
      return false;
    }
  }
}
