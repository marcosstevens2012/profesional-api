export interface UploadToken {
  url: string;
  key: string;
  fields?: Record<string, string>;
  headers?: Record<string, string>;
  method?: "PUT" | "POST";
  expiresAt?: Date;
}

export interface SignedDownloadUrl {
  url: string;
  expiresAt: Date;
}

export interface StorageMetadata {
  contentType: string;
  size: number;
  lastModified?: Date;
  customMetadata?: Record<string, string>;
}

export interface UploadResult {
  key: string;
  url?: string; // Para providers públicos
  metadata: StorageMetadata;
}

export abstract class StorageProvider {
  abstract readonly name: string;
  abstract readonly isPublic: boolean;

  /**
   * Genera un token/URL firmado para que el cliente pueda subir directamente
   */
  abstract generateUploadToken(
    _key: string,
    _options: {
      contentType: string;
      maxSize: number;
      expiresIn?: number;
    }
  ): Promise<UploadToken>;

  /**
   * Genera una URL firmada para descarga (solo para providers privados)
   */
  abstract generateSignedDownloadUrl(
    _key: string,
    _options?: {
      expiresIn?: number;
      filename?: string;
    }
  ): Promise<SignedDownloadUrl>;

  /**
   * Obtiene la URL pública directa (solo para providers públicos)
   */
  abstract getPublicUrl(_key: string): string;

  /**
   * Elimina un archivo del storage
   */
  abstract deleteFile(_key: string): Promise<void>;

  /**
   * Obtiene metadatos de un archivo
   */
  abstract getMetadata(_key: string): Promise<StorageMetadata>;

  /**
   * Valida si el archivo existe
   */
  abstract exists(_key: string): Promise<boolean>;
}
