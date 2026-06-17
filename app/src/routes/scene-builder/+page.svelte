<script lang="ts">
  import { onMount } from "svelte";
  import SceneAsset from "$lib/components/scene/SceneAsset.svelte";
  import { configToScene, sceneToConfig } from "./sceneBuilder";
  import type { Scene, SceneSlotState } from "$lib/types/scene";

  // ── Split pane ──────────────────────────────────────────────────────────────
  let splitRatio = $state(0.5);
  let isDragging = $state(false);
  let containerEl: HTMLElement;

  function startDrag(e: MouseEvent) {
    isDragging = true;
    e.preventDefault();
  }

  function onMousemove(e: MouseEvent) {
    if (!isDragging || !containerEl) return;
    const { left, width } = containerEl.getBoundingClientRect();
    splitRatio = Math.max(0.1, Math.min(0.9, (e.clientX - left) / width));
  }

  function stopDrag() {
    isDragging = false;
  }

  // ── Scene slot (local — does not affect the player) ─────────────────────────
  let slotState: SceneSlotState = $state({
    current: null,
    next: null,
    isTransitioning: false,
  });
  let currentContainer: HTMLElement | null = $state(null);

  function sortedLayers(scene: Scene) {
    return [...scene.layers].sort((a, b) => a.order - b.order);
  }

  // ── JSON editor ─────────────────────────────────────────────────────────────
  const INITIAL_JSON = `{
  "background": {
    "src": ""
  }
}`;

  let jsonText = $state(INITIAL_JSON);
  let parseError = $state<string | null>(null);
  let debounceTimer: ReturnType<typeof setTimeout>;

  function onInput(e: Event) {
    const text = (e.target as HTMLTextAreaElement).value;
    jsonText = text;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => applyInstant(text), 300);
  }

  function applyInstant(text: string) {
    try {
      const raw = JSON.parse(text);
      parseError = null;
      slotState.current = configToScene(raw);
    } catch (err) {
      parseError = err instanceof Error ? err.message : "Invalid JSON";
    }
  }

  // ── Scene loader ─────────────────────────────────────────────────────────────
  let allScenes = $state<Scene[]>([]);

  onMount(async () => {
    try {
      const res = await fetch("/api/scene");
      allScenes = await res.json();
    } catch {}
  });

  function loadScene(e: Event) {
    const id = (e.target as HTMLSelectElement).value;
    if (!id) return;
    fetch(`/api/scene/${id}`)
      .then((r) => r.json())
      .then((scene: Scene) => {
        jsonText = JSON.stringify(sceneToConfig(scene), null, 2);
        applyInstant(jsonText);
      })
      .catch(() => {});
  }
</script>

<svelte:document onmousemove={onMousemove} onmouseup={stopDrag} />

<div class="builder" class:dragging={isDragging} bind:this={containerEl}>
  <!-- Editor pane -->
  <div class="pane editor-pane" style:width="{splitRatio * 100}%">
    <div class="toolbar">
      <span class="toolbar-label">Scene JSON</span>
      <select onchange={loadScene}>
        <option value="">Load existing…</option>
        {#each allScenes as s}
          <option value={s.id}>{s.label}</option>
        {/each}
      </select>
    </div>

    <textarea
      class="editor"
      value={jsonText}
      oninput={onInput}
      spellcheck={false}
      autocomplete="off"
    ></textarea>

    {#if parseError}
      <div class="status-bar error">{parseError}</div>
    {/if}
  </div>

  <!-- Drag handle -->
  <div
    class="divider"
    onmousedown={startDrag}
    role="separator"
    aria-orientation="vertical"
  ></div>

  <!-- Preview pane -->
  <div class="pane preview-pane">
    <div class="toolbar">
      <span class="toolbar-label">
        {slotState.current ? slotState.current.label : "Preview"}
      </span>
    </div>

    <div class="preview-viewport">
      {#if slotState.current}
        <div class="scene-slot" bind:this={currentContainer}>
          <SceneAsset asset={slotState.current.background} zIndex={0} />
          {#each sortedLayers(slotState.current) as layer (layer.id)}
            <SceneAsset asset={layer} zIndex={layer.order + 1} />
          {/each}
        </div>
      {:else}
        <p class="empty">Enter a valid scene JSON to preview</p>
      {/if}
    </div>
  </div>
</div>

<style>
  .builder {
    display: flex;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    background: #000;
  }

  .builder.dragging {
    cursor: col-resize;
    user-select: none;
  }

  .pane {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 0;
  }

  .editor-pane {
    background: #111;
    flex-shrink: 0;
  }

  .preview-pane {
    flex: 1;
  }

  /* ── Toolbar ── */
  .toolbar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.4rem 0.75rem;
    background: #1a1a1a;
    border-bottom: 1px solid #2a2a2a;
    flex-shrink: 0;
    min-height: 36px;
  }

  .toolbar-label {
    flex: 1;
    font-size: 0.72rem;
    color: #666;
    font-family: monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  select {
    font-size: 0.72rem;
    background: #222;
    color: #bbb;
    border: 1px solid #333;
    border-radius: 3px;
    padding: 0.15rem 0.4rem;
    cursor: pointer;
    max-width: 180px;
  }

  select:focus {
    outline: none;
    border-color: #555;
  }

  /* ── Editor ── */
  .editor {
    flex: 1;
    width: 100%;
    padding: 0.75rem;
    background: #111;
    color: #d4d4d4;
    font-family: "Cascadia Code", "Consolas", "Fira Code", monospace;
    font-size: 0.8rem;
    line-height: 1.65;
    border: none;
    resize: none;
    outline: none;
    overflow: auto;
    tab-size: 2;
  }

  .status-bar {
    padding: 0.35rem 0.75rem;
    font-size: 0.72rem;
    font-family: monospace;
    flex-shrink: 0;
    border-top: 1px solid transparent;
  }

  .status-bar.error {
    background: #2a1010;
    color: #f87171;
    border-top-color: #4a1a1a;
  }

  /* ── Divider ── */
  .divider {
    width: 4px;
    background: #222;
    cursor: col-resize;
    flex-shrink: 0;
    transition: background 0.15s;
  }

  .divider:hover,
  .dragging .divider {
    background: #444;
  }

  /* ── Preview ── */
  .preview-viewport {
    flex: 1;
    position: relative;
    overflow: hidden;
    background: #000;
  }

  .scene-slot {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .empty {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    color: #333;
    font-size: 0.8rem;
    font-family: monospace;
  }
</style>
