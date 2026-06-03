<script lang="ts">
  import { assetUrl } from "@/lib/config";
  import { apiClient } from "@/lib/services/apiClient";

  type Props = {
    src: string;
    onpick: (src: string) => void;
  };

  let { src, onpick }: Props = $props();

  let uploading = $state(false);
  let error = $state<string | null>(null);

  async function onFileSelected(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = "";

    uploading = true;
    error = null;
    try {
      const body = new FormData();
      body.append("file", file);
      const data = await apiClient.upload<{ src: string }>("/image/upload", body);
      onpick(data.src);
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : "Upload failed";
    } finally {
      uploading = false;
    }
  }
</script>

<div class="picker">
  {#if src}
    <div class="preview" style="background-image: url('{assetUrl(src)}')"></div>
  {:else}
    <div class="preview empty"></div>
  {/if}

  <div class="controls">
    <label class="file-label" class:disabled={uploading}>
      <input type="file" accept="image/*" onchange={onFileSelected} disabled={uploading} />
      <span>{uploading ? "Uploading…" : src ? "Replace" : "Choose image…"}</span>
    </label>
    {#if src}
      <span class="src-path">{src}</span>
    {/if}
    {#if error}
      <span class="error">{error}</span>
    {/if}
  </div>
</div>

<style>
  .picker {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  .preview {
    width: 80px;
    height: 50px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background-size: cover;
    background-position: center;
    filter: saturate(var(--image-saturation));
    flex-shrink: 0;
  }

  .preview.empty {
    background-color: rgba(12, 10, 18, 0.6);
  }

  .controls {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .file-label {
    display: inline-flex;
    cursor: pointer;
  }

  .file-label input[type="file"] {
    display: none;
  }

  .file-label span {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    padding: var(--space-1) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    transition: color var(--ease-fast), border-color var(--ease-fast);
  }

  .file-label:hover:not(.disabled) span {
    color: var(--color-text);
    border-color: var(--color-border-hover);
  }

  .file-label.disabled {
    opacity: 0.5;
    cursor: default;
  }

  .src-path {
    font-size: var(--text-xs);
    color: var(--color-text-faint);
  }

  .error {
    font-size: var(--text-xs);
    color: #c87060;
  }
</style>
