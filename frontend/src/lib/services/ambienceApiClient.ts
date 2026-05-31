import { STATIC_BASE } from "@/lib/config";
import { apiClient } from "@/lib/services/apiClient";
import type { AmbienceAsset, AmbienceCategory } from "@/types/ambience";

class AmbienceApiClient {
  private prependAssetBase(ambience: AmbienceAsset): AmbienceAsset {
    return {
      ...ambience,
      src: `${STATIC_BASE}/${ambience.src}`,
    };
  }

  async fetchAmbienceCategories(): Promise<AmbienceCategory[]> {
    const categories = await apiClient.get<AmbienceCategory[]>("/ambience/categories");
    return categories.map((category) => ({
      ...category,
      src: `${STATIC_BASE}/${category.src}`,
    }));
  }

  async fetchAmbiences(): Promise<AmbienceAsset[]> {
    const ambiences = await apiClient.get<AmbienceAsset[]>("/ambience");
    return ambiences.map((ambience) => this.prependAssetBase(ambience));
  }

  async fetchAmbience(ambienceId: string): Promise<AmbienceAsset> {
    const ambience = await apiClient.get<AmbienceAsset>(
      `/ambience/${ambienceId}`,
    );
    return this.prependAssetBase(ambience);
  }

  async createAmbience(ambience: AmbienceAsset): Promise<AmbienceAsset> {
    return apiClient.post<AmbienceAsset>("/ambience", ambience);
  }

  async updateAmbience(
    ambienceId: string,
    ambience: AmbienceAsset,
  ): Promise<AmbienceAsset> {
    return apiClient.put<AmbienceAsset>(`/ambience/${ambienceId}`, ambience);
  }

  async deleteAmbience(ambienceId: string): Promise<void> {
    return apiClient.delete<void>(`/ambience/${ambienceId}`);
  }
}

export const ambienceApiClient = new AmbienceApiClient();
