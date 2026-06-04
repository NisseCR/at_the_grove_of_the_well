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
type RawVideoAsset = Omit<VideoAsset, "url">;

class AssetApiClient {
  private withImageUrl(raw: RawImageAsset): ImageAsset {
    return {
      ...raw,
      url: assetUrl(raw.src),
      thumb_url: raw.thumb_src ? assetUrl(raw.thumb_src) : null,
    };
  }

  private withAudioUrl(raw: RawAudioAsset): AudioAsset {
    return { ...raw, url: assetUrl(raw.src) };
  }

  private withVideoUrl(raw: RawVideoAsset): VideoAsset {
    return { ...raw, url: assetUrl(raw.src) };
  }

  // ---------------------------------------------------------------------------
  // Images
  // ---------------------------------------------------------------------------

  async listImages(): Promise<ImageAsset[]> {
    const raw = await apiClient.get<RawImageAsset[]>("/assets/images");
    return raw.map((a) => this.withImageUrl(a));
  }

  async uploadImage(file: File, label: string): Promise<ImageAsset> {
    const form = new FormData();
    form.append("file", file);
    form.append("label", label);
    const raw = await apiClient.uploadForm<RawImageAsset>("/assets/images", form);
    return this.withImageUrl(raw);
  }

  async uploadImagesBulk(files: File[]): Promise<ImageAsset[]> {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    const raw = await apiClient.uploadForm<RawImageAsset[]>("/assets/images/bulk", form);
    return raw.map((a) => this.withImageUrl(a));
  }

  async patchImageLabel(id: string, label: string): Promise<ImageAsset> {
    const raw = await apiClient.patch<RawImageAsset>(`/assets/images/${id}`, { label });
    return this.withImageUrl(raw);
  }

  async replaceImage(id: string, file: File): Promise<ImageAsset> {
    const form = new FormData();
    form.append("file", file);
    const raw = await apiClient.uploadForm<RawImageAsset>(`/assets/images/${id}/replace`, form);
    return this.withImageUrl(raw);
  }

  async deleteImage(id: string): Promise<void> {
    await apiClient.delete<void>(`/assets/images/${id}`);
  }

  // ---------------------------------------------------------------------------
  // Audio
  // ---------------------------------------------------------------------------

  async listAudio(): Promise<AudioAsset[]> {
    const raw = await apiClient.get<RawAudioAsset[]>("/assets/audio");
    return raw.map((a) => this.withAudioUrl(a));
  }

  async uploadAudio(file: File, label: string): Promise<AudioAsset> {
    const form = new FormData();
    form.append("file", file);
    form.append("label", label);
    const raw = await apiClient.uploadForm<RawAudioAsset>("/assets/audio", form);
    return this.withAudioUrl(raw);
  }

  async uploadAudioBulk(files: File[]): Promise<AudioAsset[]> {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    const raw = await apiClient.uploadForm<RawAudioAsset[]>("/assets/audio/bulk", form);
    return raw.map((a) => this.withAudioUrl(a));
  }

  async patchAudioLabel(id: string, label: string): Promise<AudioAsset> {
    const raw = await apiClient.patch<RawAudioAsset>(`/assets/audio/${id}`, { label });
    return this.withAudioUrl(raw);
  }

  async replaceAudio(id: string, file: File): Promise<AudioAsset> {
    const form = new FormData();
    form.append("file", file);
    const raw = await apiClient.uploadForm<RawAudioAsset>(`/assets/audio/${id}/replace`, form);
    return this.withAudioUrl(raw);
  }

  async deleteAudio(id: string): Promise<void> {
    await apiClient.delete<void>(`/assets/audio/${id}`);
  }

  // ---------------------------------------------------------------------------
  // Video
  // ---------------------------------------------------------------------------

  async listVideo(): Promise<VideoAsset[]> {
    const raw = await apiClient.get<RawVideoAsset[]>("/assets/video");
    return raw.map((a) => this.withVideoUrl(a));
  }

  async uploadVideo(file: File, label: string): Promise<VideoAsset> {
    const form = new FormData();
    form.append("file", file);
    form.append("label", label);
    const raw = await apiClient.uploadForm<RawVideoAsset>("/assets/video", form);
    return this.withVideoUrl(raw);
  }

  async uploadVideoBulk(files: File[]): Promise<VideoAsset[]> {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    const raw = await apiClient.uploadForm<RawVideoAsset[]>("/assets/video/bulk", form);
    return raw.map((a) => this.withVideoUrl(a));
  }

  async patchVideoLabel(id: string, label: string): Promise<VideoAsset> {
    const raw = await apiClient.patch<RawVideoAsset>(`/assets/video/${id}`, { label });
    return this.withVideoUrl(raw);
  }

  async replaceVideo(id: string, file: File): Promise<VideoAsset> {
    const form = new FormData();
    form.append("file", file);
    const raw = await apiClient.uploadForm<RawVideoAsset>(`/assets/video/${id}/replace`, form);
    return this.withVideoUrl(raw);
  }

  async deleteVideo(id: string): Promise<void> {
    await apiClient.delete<void>(`/assets/video/${id}`);
  }

  // ---------------------------------------------------------------------------
  // Reconcile
  // ---------------------------------------------------------------------------

  async reconcile(): Promise<ReconcileResult> {
    return apiClient.get<ReconcileResult>("/assets/reconcile");
  }

  async deleteOrphan(key: string): Promise<void> {
    await apiClient.delete<void>(`/assets/orphan/${key}`);
  }

  async deleteBrokenAsset(asset: BrokenAsset): Promise<void> {
    const path = asset.type === "image" ? "images" : asset.type === "audio" ? "audio" : "video";
    await apiClient.delete<void>(`/assets/${path}/${asset.id}`);
  }
}

export const assetApiClient = new AssetApiClient();
