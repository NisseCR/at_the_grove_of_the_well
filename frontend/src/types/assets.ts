export interface Tag {
  id: string;
  label: string;
}

export interface ImageAsset {
  id: string;
  label: string;
  artist: string | null;
  src: string;
  thumb_src: string | null;
  url: string;
  thumb_url: string | null;
  created_at: string;
  updated_at: string;
  tags: Tag[];
}

export interface AudioAsset {
  id: string;
  label: string;
  artist: string | null;
  src: string;
  url: string;
  duration: number | null;
  created_at: string;
  updated_at: string;
  tags: Tag[];
}

export interface VideoAsset {
  id: string;
  label: string;
  artist: string | null;
  src: string;
  thumb_src: string | null;
  url: string;
  thumb_url: string | null;
  duration: number | null;
  created_at: string;
  updated_at: string;
  tags: Tag[];
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
