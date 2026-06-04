import { assetUrl } from "@/lib/config";
import { apiClient } from "@/lib/services/apiClient";
import type { AmbienceAsset, AmbienceCategory } from "@/types/ambience";

class AmbienceApiClient {
  private withUrl<T extends { src: string }>(item: T): T & { url: string } {
    return { ...item, url: assetUrl(item.src) };
  }

  async fetchAmbienceCategories(): Promise<AmbienceCategory[]> {
    const categories = await apiClient.get<AmbienceCategory[]>("/ambience/categories");
    return categories.map((c) => this.withUrl(c));
  }

  async fetchAmbiences(): Promise<AmbienceAsset[]> {
    const ambiences = await apiClient.get<AmbienceAsset[]>("/ambience");
    return ambiences.map((a) => this.withUrl(a));
  }

  async fetchAmbience(ambienceId: string): Promise<AmbienceAsset> {
    const ambience = await apiClient.get<AmbienceAsset>(`/ambience/${ambienceId}`);
    return this.withUrl(ambience);
  }


}

export const ambienceApiClient = new AmbienceApiClient();
