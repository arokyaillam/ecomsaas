<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import { browser } from '$app/environment';

  interface Props {
    imageUrl: string;
    onSave: (editedImage: string) => void;
    onCancel: () => void;
  }

  let { imageUrl, onSave, onCancel }: Props = $props();

  let canvasElement: HTMLDivElement;
  let cropperInstance: any = null;
  let isReady = $state(false);
  let scale = $state(1);
  let rotation = $state(0);

  onMount(async () => {
    if (!browser) return;

    // Import Cropper.js v2 and its web components
    await import('cropperjs');

    // Wait for DOM to be ready
    await tick();

    if (!canvasElement) return;

    // The cropper is already rendered via the template in the HTML
    // We just need to query the elements
    const cropperCanvas = canvasElement.querySelector('cropper-canvas');
    const cropperImage = canvasElement.querySelector('cropper-image');

    if (cropperCanvas && cropperImage) {
      cropperInstance = {
        canvas: cropperCanvas,
        image: cropperImage,
        selection: canvasElement.querySelector('cropper-selection')
      };
      isReady = true;
    }
  });

  onDestroy(() => {
    // Cleanup if needed
    cropperInstance = null;
  });

  async function zoomIn() {
    if (!cropperInstance?.image) return;

    scale = Math.min(3, scale + 0.1);
    // Scale relative to current
    await cropperInstance.image.$scale(1.1);
  }

  async function zoomOut() {
    if (!cropperInstance?.image || scale <= 0.5) return;

    scale = Math.max(0.5, scale - 0.1);
    await cropperInstance.image.$scale(0.9);
  }

  async function rotateLeft() {
    if (!cropperInstance?.image) return;

    rotation -= 90;
    await cropperInstance.image.$rotate(-90);
  }

  async function rotateRight() {
    if (!cropperInstance?.image) return;

    rotation += 90;
    await cropperInstance.image.$rotate(90);
  }

  async function reset() {
    if (!cropperInstance?.image) return;

    // Reset by reloading the image (resets all transformations)
    const currentSrc = cropperInstance.image.src;
    cropperInstance.image.src = '';
    await tick();
    cropperInstance.image.src = currentSrc;
    scale = 1;
    rotation = 0;
  }

  async function saveCroppedImage() {
    if (!cropperInstance?.canvas || !isReady) return;

    try {
      // Get the cropped canvas using cropper-canvas's $toCanvas method
      const canvas = await cropperInstance.canvas.$toCanvas({
        width: 500,
        height: 500,
      });

      if (!canvas) {
        console.error('Failed to get cropped canvas');
        return;
      }

      // Convert to optimized JPEG
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      onSave(dataUrl);
    } catch (error) {
      console.error('Failed to crop image:', error);
    }
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="modal-backdrop" onclick={handleBackdropClick} role="button" tabindex="0" onkeydown={(e) => e.key === 'Escape' && onCancel()}>
  <div class="modal-content">
    <!-- Header -->
    <div class="modal-header">
      <h3>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        Edit Image
      </h3>
      <button type="button" class="close-btn" onclick={onCancel} aria-label="Close">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <!-- Toolbar -->
    <div class="editor-toolbar">
      <div class="toolbar-group">
        <span class="toolbar-label">Zoom</span>
        <button type="button" class="tool-btn" onclick={zoomOut} title="Zoom Out">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </button>
        <button type="button" class="tool-btn" onclick={zoomIn} title="Zoom In">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="11" y1="8" x2="11" y2="14"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <span class="toolbar-label">Rotate</span>
        <button type="button" class="tool-btn" onclick={rotateLeft} title="Rotate Left">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
        </button>
        <button type="button" class="tool-btn" onclick={rotateRight} title="Rotate Right">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
          </svg>
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <button type="button" class="tool-btn" onclick={reset} title="Reset">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        Reset
      </button>
    </div>

    <!-- Image Container -->
    <div class="image-container">
      {#if !isReady}
        <div class="loading-state">
          <svg class="animate-spin" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v4"/>
            <path d="m16.2 7.8 2.9-2.9"/>
            <path d="M22 12h-4"/>
            <path d="m16.2 16.2 2.9 2.9"/>
            <path d="M12 22v-4"/>
            <path d="m4.9 19.1 2.9-2.9"/>
            <path d="M2 12h4"/>
            <path d="m4.9 4.9 2.9 2.9"/>
          </svg>
          Loading editor...
        </div>
      {/if}
      <div bind:this={canvasElement} class="cropper-wrapper" class:hidden={!isReady}>
        <cropper-canvas style="width: 100%; height: 100%;">
          <cropper-image src={imageUrl} alt="Picture" rotatable scalable translatable crossorigin="anonymous"></cropper-image>
          <cropper-shade hidden></cropper-shade>
          <cropper-selection initial-coverage="0.8" aspect-ratio="1" movable resizable zoomable>
            <cropper-handle action="n-resize"></cropper-handle>
            <cropper-handle action="e-resize"></cropper-handle>
            <cropper-handle action="s-resize"></cropper-handle>
            <cropper-handle action="w-resize"></cropper-handle>
            <cropper-handle action="ne-resize"></cropper-handle>
            <cropper-handle action="nw-resize"></cropper-handle>
            <cropper-handle action="se-resize"></cropper-handle>
            <cropper-handle action="sw-resize"></cropper-handle>
          </cropper-selection>
        </cropper-canvas>
      </div>
    </div>

    <!-- Info -->
    <div class="editor-info">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
      Drag to move • Scroll to zoom • Output: 500 × 500px
    </div>

    <!-- Actions -->
    <div class="modal-actions">
      <button type="button" class="action-btn secondary" onclick={onCancel}>Cancel</button>
      <button type="button" class="action-btn primary" onclick={saveCroppedImage} disabled={!isReady}>
        Save Changes
      </button>
    </div>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }

  .modal-content {
    background: var(--surface-color);
    border: 1px solid var(--border-color);
    width: 100%;
    max-width: 800px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-color);
  }

  .modal-header h3 {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.9375rem;
    font-weight: 600;
  }

  .close-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .close-btn:hover {
    color: var(--text-primary);
    background: var(--surface-elevated);
  }

  .editor-toolbar {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 12px 20px;
    background: var(--surface-elevated);
    border-bottom: 1px solid var(--border-color);
    flex-wrap: wrap;
  }

  .toolbar-group {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .toolbar-label {
    font-size: 0.6875rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-right: 8px;
  }

  .toolbar-divider {
    width: 1px;
    height: 24px;
    background: var(--border-color);
    margin: 0 8px;
  }

  .tool-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: var(--surface-color);
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .tool-btn:hover {
    border-color: var(--accent-color);
    color: var(--accent-color);
  }

  .image-container {
    position: relative;
    flex: 1;
    min-height: 400px;
    max-height: 500px;
    background: #0a0a0b;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cropper-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cropper-wrapper.hidden {
    display: none;
  }

  .loading-state {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  .animate-spin {
    animation: spin 1s linear infinite;
    color: var(--accent-color);
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .editor-info {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: rgba(245, 158, 11, 0.1);
    border-bottom: 1px solid var(--border-color);
    font-size: 0.75rem;
    color: var(--accent-color);
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 20px;
  }

  /* Cropper.js v2 specific styles */
  :global(cropper-canvas) {
    background-color: #0a0a0b !important;
    max-width: 100%;
    max-height: 100%;
  }

  :global(cropper-selection) {
    outline: 2px solid var(--accent-color) !important;
  }

  :global(cropper-handle) {
    background-color: var(--accent-color) !important;
  }
</style>
