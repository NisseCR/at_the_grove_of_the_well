import { assetUrl } from "@/lib/config";
import { apiClient } from "@/lib/services/apiClient";
import type { AmbienceAsset, AmbienceCategory } from "@/types/ambience";

class AmbienceApiClient {
  async fetchAmbienceCategories(): Promise<AmbienceCategory[]> {
    const categories = await apiClient.get<AmbienceCategory[]>("/ambience/categories");
    return categories.map((c) => ({
      ...c,
      url: assetUrl(c.src),
      thumb_url: c.thumb_src ? assetUrl(c.thumb_src) : null,
    }));
  }

  async fetchAmbiences(): Promise<AmbienceAsset[]> {
    const ambiences = await apiClient.get<AmbienceAsset[]>("/ambience");
    return ambiences.map((a) => ({ ...a, url: assetUrl(a.src) }));
  }

  async fetchAmbience(ambienceId: string): Promise<AmbienceAsset> {
    const ambience = await apiClient.get<AmbienceAsset>(`/ambience/${ambienceId}`);
    return { ...ambience, url: assetUrl(ambience.src) };
  }


}

export const ambienceApiClient = new AmbienceApiClient();
