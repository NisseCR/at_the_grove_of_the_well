<script lang="ts">
  import { Upload, Loader2 } from "@lucide/svelte";

  interface Props {
    /** MIME type filter for the file picker, e.g. "image/*". */
    accept: string;
    /** Whether multiple files can be selected at once. */
    multiple?: boolean;
    /** Whether an upload is currently in progress. */
    uploading?: boolean;
    /** Called with the selected files when the user submits. */
    onfiles: (files: File[]) => void;
  }

  let { accept, multiple = true, uploading = false, onfiles }: Props = $props();

  let isDragging = $state(false);
  let fileInput: HTMLInputElement;

  /** Opens the native file picker. */
  function openPicker() {
    fileInput.click();
  }

  /** Extracts files from a native input change event. */
  function handleInputChange(e: Event) {
    const files = Array.from((e.target as HTMLInputElement).files ?? []);
    if (files.length) onfiles(files);
    fileInput.value = "";
  }

  /** Prevents default browser behaviour so we can handle the drop ourselves. */
  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    isDragging = true;
  }

  function handleDragLeave() {
    isDragging = false;
  }

  /** Extracts dropped files and forwards them via the onfiles callback. */
  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
    const files = Array.from(e.dataTransfer?.files ?? []);
    if (files.length) onfiles(files);
  }
</script>

<button
  class="zone"
  class:dragging={isDragging}
  class:uploading
  onclick={openPicker}
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
  disabled={uploading}
  type="button"
>
  {#if uploading}
    <span class="spin"><Loader2 size={22} strokeWidth={1.5} /></span>
    <span class="label">Uploading…</span>
  {:else}
    <Upload size={22} strokeWidth={1.5} />
    <span class="label">
      {multiple ? "Drop files here or click to browse" : "Drop a file here or click to browse"}
    </span>
  {/if}
</button>

<input
  bind:this={fileInput}
  type="file"
  {accept}
  {multiple}
  onchange={handleInputChange}
  style="display:none"
/>

<style>
  .zone {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    width: 100%;
    padding: var(--space-8);
    border: 2px dashed var(--color-border);
    border-radius: var(--radius-md, 8px);
    background: rgba(255, 255, 255, 0.03);
    color: var(--color-text-faint);
    cursor: pointer;
    transition:
      border-color var(--ease-fast),
      background var(--ease-fast),
      color var(--ease-fast);
  }

  .zone:hover:not(:disabled) {
    border-color: var(--color-text-muted);
    color: var(--color-text-muted);
    background: rgba(255, 255, 255, 0.05);
  }

  .zone.dragging {
    border-color: var(--color-accent);
    color: var(--color-accent);
    background: rgba(255, 255, 255, 0.07);
  }

  /* Keep the default arrow cursor while uploading — no "stop" sign. */
  .zone:disabled {
    opacity: 0.7;
    cursor: default;
  }

  .label {
    font-size: var(--text-sm);
    font-family: var(--font-body);
  }

  .spin {
    display: flex;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
