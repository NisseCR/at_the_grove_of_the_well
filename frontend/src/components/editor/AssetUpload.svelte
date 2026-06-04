<script lang="ts">
  import { Upload } from "@lucide/svelte";

  interface Props {
    accept: string;
    uploading: boolean;
    onUpload: (file: File, label: string) => void;
    onBulkUpload: (files: File[]) => void;
  }

  const { accept, uploading, onUpload, onBulkUpload }: Props = $props();

  let files = $state<File[]>([]);
  let label = $state("");
  let fileInput: HTMLInputElement;

  function onFileChange(e: Event) {
    const selected = Array.from((e.target as HTMLInputElement).files ?? []);
    files = selected;
    if (selected.length === 1) {
      label = selected[0].name.replace(/\.[^/.]+$/, "");
    } else {
      label = "";
    }
  }

  function handleUpload() {
    if (files.length === 0) return;
    if (files.length === 1) {
      onUpload(files[0], label.trim() || files[0].name);
    } else {
      onBulkUpload(files);
    }
    files = [];
    label = "";
    fileInput.value = "";
  }

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
  {:else if files.length === 1}
    <div class="single">
      <input
        class="label-input"
        bind:value={label}
        placeholder="Label"
        onkeydown={(e) => e.key === "Enter" && handleUpload()}
      />
      <button class="upload-btn" onclick={handleUpload} disabled={uploading}>
        {uploading ? "Uploading…" : "Upload"}
      </button>
      <button class="cancel-btn" onclick={cancel} disabled={uploading}>×</button>
    </div>
  {:else}
    <div class="bulk">
      <span class="bulk-label">{files.length} files selected</span>
      <button class="upload-btn" onclick={handleUpload} disabled={uploading}>
        {uploading ? "Uploading…" : `Upload ${files.length}`}
      </button>
      <button class="cancel-btn" onclick={cancel} disabled={uploading}>×</button>
    </div>
  {/if}

  <input
    type="file"
    bind:this={fileInput}
    {accept}
    multiple
    onchange={onFileChange}
    hidden
  />
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

  .single,
  .bulk {
    display: flex;
    align-items: center;
    gap: var(--space-3);
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

  .upload-btn:disabled {
    opacity: 0.5;
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
