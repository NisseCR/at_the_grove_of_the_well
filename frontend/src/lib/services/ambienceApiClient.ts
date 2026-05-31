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

  async fetchAmbienceCategoriesRaw(): Promise<AmbienceCategory[]> {
    return apiClient.get<AmbienceCategory[]>("/ambience/categories");
  }

  async fetchAmbiences(): Promise<AmbienceAsset[]> {
    const ambiences = await apiClient.get<AmbienceAsset[]>("/ambience");
    return ambiences.map((ambience) => this.prependAssetBase(ambience));
  }

  async fetchAmbiencesRaw(): Promise<AmbienceAsset[]> {
    return apiClient.get<AmbienceAsset[]>("/ambience");
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

  async deleteAmbience(ambienceId: string): Promise<AmbienceAsset> {
    return apiClient.delete<AmbienceAsset>(`/ambience/${ambienceId}`);
  }

  async fetchAmbienceCategory(categoryId: string): Promise<AmbienceCategory> {
    const category = await apiClient.get<AmbienceCategory>(`/ambience/categories/${categoryId}`);
    return { ...category, src: `${STATIC_BASE}/${category.src}` };
  }

  async createCategory(category: AmbienceCategory): Promise<AmbienceCategory> {
    return apiClient.post<AmbienceCategory>("/ambience/categories", category);
  }

  async updateCategory(categoryId: string, category: AmbienceCategory): Promise<AmbienceCategory> {
    return apiClient.put<AmbienceCategory>(`/ambience/categories/${categoryId}`, category);
  }

  async deleteCategory(categoryId: string): Promise<AmbienceCategory> {
    return apiClient.delete<AmbienceCategory>(`/ambience/categories/${categoryId}`);
  }
}

export const ambienceApiClient = new AmbienceApiClient();
