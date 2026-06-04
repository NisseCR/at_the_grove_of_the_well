export interface ImageAsset {
  id: string;
  label: string;
  src: string;
  thumb_src: string | null;
  url: string;
  thumb_url: string | null;
}

export interface AudioAsset {
  id: string;
  label: string;
  src: string;
  url: string;
}

export interface VideoAsset {
  id: string;
  label: string;
  src: string;
  url: string;
}

export type AnyAsset = ImageAsset | AudioAsset | VideoAsset;
export type AssetType = "image" | "audio" | "video";

export interface OrphanedFile {
  key: string;
}

export interface BrokenAsset {
  id: string;
  label: string;
  src: string;
  type: AssetType;
}

export interface ReconcileResult {
  orphaned_files: OrphanedFile[];
  broken_assets: BrokenAsset[];
}
