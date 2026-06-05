import { assetUrl } from "@/lib/config";
import { apiClient } from "@/lib/services/apiClient";
import type {
  AudioAsset,
  BrokenAsset,
  ImageAsset,
  ReconcileResult,
  VideoAsset,
} from "@/types/assets";

type RawImageAsset = Omit<ImageAsset, "url" | "thumb_url">;
type RawAudioAsset = Omit<AudioAsset, "url">;
type RawVideoAsset = Omit<VideoAsset, "url" | "thumb_url">;

/** Fields that can be patched on any asset. */
export interface AssetPatch {
  label?: string;
  artist?: string;
}

class AssetApiClient {
  /**
   * Resolves CDN URL fields for an image asset.
   * @param raw - Image asset without computed URL fields.
   */
  private withImageUrl(raw: RawImageAsset): ImageAsset {
    return {
      ...raw,
      url: assetUrl(raw.src),
      thumb_url: raw.thumb_src ? assetUrl(raw.thumb_src) : null,
    };
  }

  /**
   * Resolves CDN URL field for an audio asset.
   * @param raw - Audio asset without computed URL field.
   */
  private withAudioUrl(raw: RawAudioAsset): AudioAsset {
    return { ...raw, url: assetUrl(raw.src) };
  }

  /**
   * Resolves CDN URL fields for a video asset.
   * @param raw - Video asset without computed URL fields.
   */
  private withVideoUrl(raw: RawVideoAsset): VideoAsset {
    return {
      ...raw,
      url: assetUrl(raw.src),
      thumb_url: raw.thumb_src ? assetUrl(raw.thumb_src) : null,
    };
  }

  // ---------------------------------------------------------------------------
  // Images
  // ---------------------------------------------------------------------------

  /** @returns All image assets ordered by label. */
  async listImages(): Promise<ImageAsset[]> {
    const raw = await apiClient.get<RawImageAsset[]>("/assets/images");
    return raw.map((a) => this.withImageUrl(a));
  }

  /**
   * Uploads a single image file.
   * @param file - The image file to upload.
   * @param label - Display label for the asset.
   * @param artist - Optional artist credit.
   */
  async uploadImage(file: File, label: string, artist?: string): Promise<ImageAsset> {
    const form = new FormData();
    form.append("file", file);
    form.append("label", label);
    if (artist) form.append("artist", artist);
    const raw = await apiClient.uploadForm<RawImageAsset>("/assets/images", form);
    return this.withImageUrl(raw);
  }

  /**
   * Uploads multiple image files. Label defaults to each file's name stem.
   * @param files - The image files to upload.
   */
  async uploadImagesBulk(files: File[]): Promise<ImageAsset[]> {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    const raw = await apiClient.uploadForm<RawImageAsset[]>("/assets/images/bulk", form);
    return raw.map((a) => this.withImageUrl(a));
  }

  /**
   * Updates label and/or artist on an image asset.
   * @param id - Asset UUID.
   * @param patch - Fields to update (only provided fields are changed).
   */
  async patchImage(id: string, patch: AssetPatch): Promise<ImageAsset> {
    const raw = await apiClient.patch<RawImageAsset>(`/assets/images/${id}`, patch);
    return this.withImageUrl(raw);
  }

  /**
   * Replaces the file for an existing image asset. Label and ID are unchanged.
   * @param id - Asset UUID.
   * @param file - Replacement image file.
   */
  async replaceImage(id: string, file: File): Promise<ImageAsset> {
    const form = new FormData();
    form.append("file", file);
    const raw = await apiClient.uploadForm<RawImageAsset>(`/assets/images/${id}/replace`, form);
    return this.withImageUrl(raw);
  }

  /**
   * Permanently deletes an image asset from the DB and R2.
   * @param id - Asset UUID.
   */
  async deleteImage(id: string): Promise<void> {
    await apiClient.delete<void>(`/assets/images/${id}`);
  }

  // ---------------------------------------------------------------------------
  // Audio
  // ---------------------------------------------------------------------------

  /** @returns All audio assets ordered by label. */
  async listAudio(): Promise<AudioAsset[]> {
    const raw = await apiClient.get<RawAudioAsset[]>("/assets/audio");
    return raw.map((a) => this.withAudioUrl(a));
  }

  /**
   * Uploads a single audio file. Normalises to -16 LUFS / 48 kHz OGG.
   * @param file - The audio file to upload.
   * @param label - Display label for the asset.
   * @param artist - Optional artist credit.
   * @param normMode - ``"music"`` normalises up and down (default).
   *                   ``"ambience"`` only reduces loudness if the source is above target.
   */
  async uploadAudio(
    file: File,
    label: string,
    artist?: string,
    normMode: "music" | "ambience" = "music",
  ): Promise<AudioAsset> {
    const form = new FormData();
    form.append("file", file);
    form.append("label", label);
    if (artist) form.append("artist", artist);
    form.append("norm_mode", normMode);
    const raw = await apiClient.uploadForm<RawAudioAsset>("/assets/audio", form);
    return this.withAudioUrl(raw);
  }

  /**
   * Uploads multiple audio files. Label defaults to each file's name stem.
   * @param files - The audio files to upload.
   * @param normMode - Normalisation mode applied to the entire batch.
   */
  async uploadAudioBulk(
    files: File[],
    normMode: "music" | "ambience" = "music",
  ): Promise<AudioAsset[]> {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    form.append("norm_mode", normMode);
    const raw = await apiClient.uploadForm<RawAudioAsset[]>("/assets/audio/bulk", form);
    return raw.map((a) => this.withAudioUrl(a));
  }

  /**
   * Updates label and/or artist on an audio asset.
   * @param id - Asset UUID.
   * @param patch - Fields to update (only provided fields are changed).
   */
  async patchAudio(id: string, patch: AssetPatch): Promise<AudioAsset> {
    const raw = await apiClient.patch<RawAudioAsset>(`/assets/audio/${id}`, patch);
    return this.withAudioUrl(raw);
  }

  /**
   * Replaces the file for an existing audio asset. Label and ID are unchanged.
   * @param id - Asset UUID.
   * @param file - Replacement audio file.
   * @param normMode - Normalisation mode to apply to the replacement file.
   */
  async replaceAudio(
    id: string,
    file: File,
    normMode: "music" | "ambience" = "music",
  ): Promise<AudioAsset> {
    const form = new FormData();
    form.append("file", file);
    form.append("norm_mode", normMode);
    const raw = await apiClient.uploadForm<RawAudioAsset>(`/assets/audio/${id}/replace`, form);
    return this.withAudioUrl(raw);
  }

  /**
   * Permanently deletes an audio asset from the DB and R2.
   * @param id - Asset UUID.
   */
  async deleteAudio(id: string): Promise<void> {
    await apiClient.delete<void>(`/assets/audio/${id}`);
  }

  // ---------------------------------------------------------------------------
  // Video
  // ---------------------------------------------------------------------------

  /** @returns All video assets ordered by label. */
  async listVideo(): Promise<VideoAsset[]> {
    const raw = await apiClient.get<RawVideoAsset[]>("/assets/video");
    return raw.map((a) => this.withVideoUrl(a));
  }

  /**
   * Uploads a single video file.
   * @param file - The video file to upload.
   * @param label - Display label for the asset.
   * @param artist - Optional artist credit.
   */
  async uploadVideo(file: File, label: string, artist?: string): Promise<VideoAsset> {
    const form = new FormData();
    form.append("file", file);
    form.append("label", label);
    if (artist) form.append("artist", artist);
    const raw = await apiClient.uploadForm<RawVideoAsset>("/assets/video", form);
    return this.withVideoUrl(raw);
  }

  /**
   * Uploads multiple video files. Label defaults to each file's name stem.
   * @param files - The video files to upload.
   */
  async uploadVideoBulk(files: File[]): Promise<VideoAsset[]> {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    const raw = await apiClient.uploadForm<RawVideoAsset[]>("/assets/video/bulk", form);
    return raw.map((a) => this.withVideoUrl(a));
  }

  /**
   * Updates label and/or artist on a video asset.
   * @param id - Asset UUID.
   * @param patch - Fields to update (only provided fields are changed).
   */
  async patchVideo(id: string, patch: AssetPatch): Promise<VideoAsset> {
    const raw = await apiClient.patch<RawVideoAsset>(`/assets/video/${id}`, patch);
    return this.withVideoUrl(raw);
  }

  /**
   * Replaces the file for an existing video asset. Label and ID are unchanged.
   * @param id - Asset UUID.
   * @param file - Replacement video file.
   */
  async replaceVideo(id: string, file: File): Promise<VideoAsset> {
    const form = new FormData();
    form.append("file", file);
    const raw = await apiClient.uploadForm<RawVideoAsset>(`/assets/video/${id}/replace`, form);
    return this.withVideoUrl(raw);
  }

  /**
   * Permanently deletes a video asset from the DB and R2.
   * @param id - Asset UUID.
   */
  async deleteVideo(id: string): Promise<void> {
    await apiClient.delete<void>(`/assets/video/${id}`);
  }

  // ---------------------------------------------------------------------------
  // Reconcile
  // ---------------------------------------------------------------------------

  /** @returns Diff between R2 bucket contents and DB asset records. */
  async reconcile(): Promise<ReconcileResult> {
    return apiClient.get<ReconcileResult>("/assets/reconcile");
  }

  /**
   * Deletes an orphaned R2 file that has no matching DB record.
   * @param key - R2 object key.
   */
  async deleteOrphan(key: string): Promise<void> {
    await apiClient.delete<void>(`/assets/orphan/${key}`);
  }

  /**
   * Deletes a broken DB asset record whose R2 file is missing.
   * @param asset - The broken asset to remove from the DB.
   */
  async deleteBrokenAsset(asset: BrokenAsset): Promise<void> {
    const path = asset.type === "image" ? "images" : asset.type === "audio" ? "audio" : "video";
    await apiClient.delete<void>(`/assets/${path}/${asset.id}`);
  }
}

export const assetApiClient = new AssetApiClient();
