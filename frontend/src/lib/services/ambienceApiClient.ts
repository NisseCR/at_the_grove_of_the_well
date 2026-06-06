import { assetUrl } from "@/lib/config";
import { apiClient } from "@/lib/services/apiClient";
import type { Ambience, AmbienceCategory } from "@/types/ambience";

class AmbienceApiClient {
  /**
   * @returns All ambience categories with their ambience entries.
   */
  async fetchAmbienceCategories(): Promise<AmbienceCategory[]> {
    const categories = await apiClient.get<AmbienceCategory[]>(
      "/ambience/categories",
    );
    return categories.map((c) => ({
      ...c,
      url: assetUrl(c.src),
      thumb_url: c.thumb_src ? assetUrl(c.thumb_src) : null,
    }));
  }

  /**
   * @returns All ambiences with resolved audio URLs.
   */
  async fetchAmbiences(): Promise<Ambience[]> {
    const ambiences = await apiClient.get<Ambience[]>("/ambience");
    return ambiences.map((a) => ({ ...a, url: assetUrl(a.src) }));
  }

  /**
   * @returns A single ambience with resolved audio URL.
   */
  async fetchAmbience(id: string): Promise<Ambience> {
    const ambience = await apiClient.get<Ambience>(`/ambience/${id}`);
    return { ...ambience, url: assetUrl(ambience.src) };
  }
}

export const ambienceApiClient = new AmbienceApiClient();
