import { assetUrl } from "@/lib/config";
import { apiClient } from "@/lib/services/apiClient";
import type { Ambience, AmbienceCategory } from "@/types/ambience";

/** Fields accepted when creating a new ambience. */
export interface AmbienceCreatePayload {
  label: string;
  slug?: string;
  volume?: number;
  loop?: boolean;
  audio_asset_id?: string;
}

/** Fields accepted when patching an ambience. Only provided fields are changed. */
export type AmbiencePatchPayload = Partial<AmbienceCreatePayload>;

/** Fields accepted when creating an ambience category. */
export interface AmbienceCategoryCreatePayload {
  label: string;
  display_order?: number;
}

/** Fields accepted when patching an ambience category. */
export interface AmbienceCategoryPatchPayload {
  label?: string;
  display_order?: number;
  thumb_id?: string;
}

class AmbienceApiClient {
  // ---------------------------------------------------------------------------
  // Reads (used by controller + engine)
  // ---------------------------------------------------------------------------

  /** @returns All ambience categories with their ambience entries. */
  async fetchAmbienceCategories(): Promise<AmbienceCategory[]> {
    const categories = await apiClient.get<AmbienceCategory[]>("/ambience/categories");
    return categories.map((c) => ({
      ...c,
      url: assetUrl(c.src),
      thumb_url: c.thumb_src ? assetUrl(c.thumb_src) : null,
    }));
  }

  /** @returns All ambience entities with resolved audio URLs. */
  async fetchAmbiences(): Promise<Ambience[]> {
    const ambiences = await apiClient.get<Ambience[]>("/ambience");
    return ambiences.map((a) => ({ ...a, url: assetUrl(a.src) }));
  }

  /** @returns A single ambience entity with resolved audio URL. */
  async fetchAmbience(ambienceId: string): Promise<Ambience> {
    const ambience = await apiClient.get<Ambience>(`/ambience/${ambienceId}`);
    return { ...ambience, url: assetUrl(ambience.src) };
  }

  // ---------------------------------------------------------------------------
  // Ambience writes (editor)
  // ---------------------------------------------------------------------------

  /**
   * Create a new ambience entity.
   * @param payload - Initial field values.
   */
  async createAmbience(payload: AmbienceCreatePayload): Promise<Ambience> {
    const ambience = await apiClient.post<Ambience>("/ambience", payload);
    return { ...ambience, url: assetUrl(ambience.src) };
  }

  /**
   * Update one or more fields on an ambience.
   * @param id - Ambience UUID.
   * @param patch - Fields to update (only provided fields are changed).
   */
  async patchAmbience(id: string, patch: AmbiencePatchPayload): Promise<Ambience> {
    const ambience = await apiClient.patch<Ambience>(`/ambience/${id}`, patch);
    return { ...ambience, url: assetUrl(ambience.src) };
  }

  /**
   * Permanently delete an ambience.
   * @param id - Ambience UUID.
   */
  async deleteAmbience(id: string): Promise<void> {
    await apiClient.delete<void>(`/ambience/${id}`);
  }

  // ---------------------------------------------------------------------------
  // Category writes (editor)
  // ---------------------------------------------------------------------------

  /**
   * Create a new ambience category.
   * @param payload - Initial field values.
   */
  async createCategory(payload: AmbienceCategoryCreatePayload): Promise<AmbienceCategory> {
    const cat = await apiClient.post<AmbienceCategory>("/ambience/categories", payload);
    return { ...cat, url: assetUrl(cat.src), thumb_url: cat.thumb_src ? assetUrl(cat.thumb_src) : null };
  }

  /**
   * Update one or more fields on an ambience category.
   * @param id - Category UUID.
   * @param patch - Fields to update.
   */
  async patchCategory(id: string, patch: AmbienceCategoryPatchPayload): Promise<AmbienceCategory> {
    const cat = await apiClient.patch<AmbienceCategory>(`/ambience/categories/${id}`, patch);
    return { ...cat, url: assetUrl(cat.src), thumb_url: cat.thumb_src ? assetUrl(cat.thumb_src) : null };
  }

  /**
   * Permanently delete an ambience category. Linked ambiences are not deleted.
   * @param id - Category UUID.
   */
  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete<void>(`/ambience/categories/${id}`);
  }

  /**
   * Add an ambience to a category.
   * @param categoryId - Category UUID.
   * @param ambienceId - Ambience UUID.
   */
  async addAmbienceToCategory(categoryId: string, ambienceId: string): Promise<void> {
    await apiClient.post<void>(`/ambience/categories/${categoryId}/ambiences/${ambienceId}`, {});
  }

  /**
   * Remove an ambience from a category.
   * @param categoryId - Category UUID.
   * @param ambienceId - Ambience UUID.
   */
  async removeAmbienceFromCategory(categoryId: string, ambienceId: string): Promise<void> {
    await apiClient.delete<void>(`/ambience/categories/${categoryId}/ambiences/${ambienceId}`);
  }
}

export const ambienceApiClient = new AmbienceApiClient();
