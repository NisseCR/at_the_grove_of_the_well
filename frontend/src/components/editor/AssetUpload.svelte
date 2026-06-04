<script lang="ts">
  import { Upload } from "@lucide/svelte";
  import type { AssetType } from "@/types/assets";

  interface Props {
    type: AssetType;
    uploading: boolean;
    /** Called when a single file is ready to upload, with its label. */
    onUpload: (file: File, label: string) => void;
    /** Called when multiple files are ready to upload. Labels derived from filenames. */
    onBulkUpload: (files: File[]) => void;
  }

  const { type, uploading, onUpload, onBulkUpload }: Props = $props();

  let files = $state<File[]>([]);
  let label = $state("");
  let didUpload = $state(false);
  let fileInput: HTMLInputElement;

  const accept = $derived(
    type === "image" ? "image/*" : type === "audio" ? "audio/*" : "video/webm"
  );

  /** Clear the staged files once the parent signals upload is complete. */
  $effect(() => {
    if (didUpload && !uploading) {
      files = [];
      label = "";
      if (fileInput) fileInput.value = "";
      didUpload = false;
    }
  });

  /** Handle file picker selection — pre-fills label from filename for single files. */
  function onFileChange(e: Event) {
    const selected = Array.from((e.target as HTMLInputElement).files ?? []);
    files = selected;
    if (selected.length === 1) {
      label = selected[0].name.replace(/\.[^/.]+$/, "");
    } else {
      label = "";
    }
  }

  /** Dispatch upload or bulk upload depending on how many files were selected. */
  function handleUpload() {
    if (files.length === 0) return;
    didUpload = true;
    if (files.length === 1) {
      onUpload(files[0], label.trim() || files[0].name);
    } else {
      onBulkUpload(files);
    }
  }

  /** Clear the current file selection without uploading. */
  function cancel() {
    files = [];
    label = "";
    fileInput.value = "";
  }
</script>

<div class="upload">
  {#if files.length === 0}
    <button class="pick-btn" onclick={() => fileInput.click()} disabled={uploading}>
      <Upload size={13} />
      Upload
    </button>
  {:else if uploading}
    <div class="uploading">
      <span class="spinner"></span>
      <span class="uploading-name">
        {files.length === 1 ? files[0].name : `${files.length} files`}
      </span>
      {#if type === "audio"}
        <span class="uploading-hint">Processing audio — this may take a moment…</span>
      {:else}
        <span class="uploading-hint">Uploading…</span>
      {/if}
    </div>
  {:else if files.length === 1}
    <div class="staged">
      <input
        class="label-input"
        bind:value={label}
        placeholder="Label"
        onkeydown={(e) => e.key === "Enter" && handleUpload()}
      />
      <button class="upload-btn" onclick={handleUpload}>Upload</button>
      <button class="cancel-btn" onclick={cancel}>×</button>
    </div>
  {:else}
    <div class="staged">
      <span class="bulk-label">{files.length} files selected</span>
      <button class="upload-btn" onclick={handleUpload}>Upload {files.length}</button>
      <button class="cancel-btn" onclick={cancel}>×</button>
    </div>
  {/if}

  <input type="file" bind:this={fileInput} {accept} multiple onchange={onFileChange} hidden />
</div>

<style>
  .upload {
    margin-bottom: var(--space-6);
  }

  .pick-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-wide);
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--space-2) var(--space-4);
    background: var(--color-glass);
    transition:
      color var(--ease-fast),
      border-color var(--ease-fast);
  }

  .pick-btn:hover:not(:disabled) {
    color: var(--color-text);
    border-color: var(--color-accent);
  }

  .pick-btn:disabled {
    opacity: 0.4;
  }

  .staged {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .uploading {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .spinner {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 1.5px solid var(--color-border);
    border-top-color: var(--color-accent);
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .uploading-name {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .uploading-hint {
    font-size: var(--text-xs);
    color: var(--color-text-faint);
  }

  .label-input {
    font-size: var(--text-xs);
    color: var(--color-text);
    background: var(--color-glass);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--space-2) var(--space-3);
    outline: none;
    width: 200px;
    transition: border-color var(--ease-fast);
  }

  .label-input:focus {
    border-color: var(--color-accent);
  }

  .bulk-label {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .upload-btn {
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-wide);
    color: var(--color-bg, #000);
    background: var(--color-accent);
    border-radius: var(--radius-sm);
    padding: var(--space-2) var(--space-4);
    transition: opacity var(--ease-fast);
  }

  .upload-btn:hover {
    opacity: 0.85;
  }

  .cancel-btn {
    font-size: var(--text-sm);
    color: var(--color-text-faint);
    transition: color var(--ease-fast);
  }

  .cancel-btn:hover {
    color: var(--color-text);
  }
</style>
