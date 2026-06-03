<script lang="ts">
  import { auth } from "@/stores/auth.svelte";

  type Props = {
    onclose: () => void;
    onsuccess: () => void;
  };

  let { onclose, onsuccess }: Props = $props();

  let password = $state("");
  let error = $state("");
  let loading = $state(false);

  async function submit() {
    if (!password) return;
    error = "";
    loading = true;
    try {
      await auth.login(password);
      onsuccess();
    } catch {
      error = "Incorrect password";
    } finally {
      loading = false;
    }
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.key === "Enter") submit();
    if (e.key === "Escape") onclose();
  }
</script>

<div class="backdrop" role="presentation" onclick={onclose}></div>

<div class="modal" role="dialog" aria-modal="true">
  <div class="modal-header">
    <span class="modal-title">Enter password</span>
    <button class="btn-close" onclick={onclose}>×</button>
  </div>

  <div class="modal-body">
    <input
      class="input"
      class:input-error={!!error}
      type="password"
      placeholder="Password"
      bind:value={password}
      {onkeydown}
      autofocus
    />
    {#if error}
      <p class="error">{error}</p>
    {/if}
  </div>

  <div class="modal-footer">
    <button class="btn-primary" onclick={submit} disabled={loading || !password}>
      {loading ? "Checking…" : "Unlock"}
    </button>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 100;
  }

  .modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 101;
    width: 320px;
    background: var(--color-glass-active);
    border: 1px solid var(--color-border-hover);
    border-radius: var(--radius-lg);
    backdrop-filter: blur(var(--blur-lg));
    -webkit-backdrop-filter: blur(var(--blur-lg));
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding: var(--space-6);
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .modal-title {
    font-family: var(--font-display);
    font-size: var(--text-base);
    color: var(--color-text);
    letter-spacing: var(--tracking-wide);
  }

  .btn-close {
    color: var(--color-text-muted);
    font-size: var(--text-lg);
    line-height: 1;
    padding: 0 var(--space-1);
    transition: color var(--ease-fast);
  }

  .btn-close:hover {
    color: var(--color-text);
  }

  .modal-body {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .input {
    width: 100%;
    padding: var(--space-2) var(--space-3);
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text);
    font-size: var(--text-sm);
    outline: none;
    transition: border-color var(--ease-fast);
  }

  .input:focus {
    border-color: var(--color-border-hover);
  }

  .input-error {
    border-color: rgba(200, 80, 80, 0.6);
  }

  .error {
    font-size: var(--text-xs);
    color: rgba(220, 100, 100, 0.9);
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
  }

  .btn-primary {
    padding: var(--space-2) var(--space-6);
    background: var(--color-accent-dim);
    border: 1px solid var(--color-border-active);
    border-radius: var(--radius-md);
    color: var(--color-text);
    font-size: var(--text-sm);
    transition:
      background var(--ease-fast),
      border-color var(--ease-fast);
  }

  .btn-primary:hover:not(:disabled) {
    background: rgba(200, 175, 120, 0.55);
    border-color: var(--color-accent);
  }

  .btn-primary:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
