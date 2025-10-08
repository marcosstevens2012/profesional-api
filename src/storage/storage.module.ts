import { Module, Provider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { StorageProvider } from "./storage.provider";
import { SupabaseStorageProvider } from "./supabase.storage.provider";
import { VercelBlobStorageProvider } from "./vercelblob.storage.provider";

export const STORAGE_PROVIDER_TOKEN = "STORAGE_PROVIDER";

const storageProviderFactory: Provider = {
  provide: STORAGE_PROVIDER_TOKEN,
  useFactory: (configService: ConfigService): StorageProvider => {
    const provider = configService.get<string>("STORAGE_PROVIDER", "supabase");

    switch (provider) {
      case "supabase":
        return new SupabaseStorageProvider(configService);
      case "vercel":
        return new VercelBlobStorageProvider(configService);
      default:
        throw new Error(`Unknown storage provider: ${provider}`);
    }
  },
  inject: [ConfigService],
};

@Module({
  providers: [storageProviderFactory],
  exports: [STORAGE_PROVIDER_TOKEN],
})
export class StorageModule {}
