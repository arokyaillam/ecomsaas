<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';

  // Props
  let {
    imageUrl = '',
    onSave,
    onCancel
  } = $props<{
    imageUrl: string;
    onSave: (croppedImage: string) => void;
    onCancel: () => void;
  }>();

  let imageElement: HTMLImageElement;
  let cropper: any = null;
  let currentImageUrl = $state(imageUrl);
  let CropperLib: any = null;
  let scale = $state(1);
  let rotate = $state(0);

  onMount(async () => {
    if (!browser) return;

    // Dynamically import cropperjs only on client side
    const module = await import('cropperjs');
    CropperLib = module.default;

    if (imageElement && currentImageUrl) {
      initCropper();
    }
  });

  onDestroy(() => {
    if (cropper) {
      cropper.destroy();
      cropper = null;
    }
  });

  function initCropper() {
    if (!CropperLib || !imageElement) return;

    if (cropper) {
      cropper.destroy();
    }

    cropper = new CropperLib(imageElement, {
      aspectRatio: 16 / 9,
      viewMode: 1,
      dragMode: 'move',
      autoCropArea: 1,
      restore: false,
      guides: true,
      center: true,
      highlight: false,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false,
      zoomable: true,
      scalable: true
    });
  }

  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          currentImageUrl = result;
          scale = 1;
          rotate = 0;
          // Wait for image to load then init cropper
          setTimeout(() => {
            if (imageElement && CropperLib) {
              initCropper();
            }
          }, 100);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  function zoomIn() {
    scale += 0.1;
    if (cropper) {
      // Get canvas and zoom
      const canvas = cropper.getCropperCanvas();
      if (canvas) {
        canvas.$zoom(0.1);
      }
    }
  }

  function zoomOut() {
    scale = Math.max(0.1, scale - 0.1);
    if (cropper) {
      const canvas = cropper.getCropperCanvas();
      if (canvas) {
        canvas.$zoom(-0.1);
      }
    }
  }

  function rotateLeft() {
    rotate -= 90;
    if (cropper) {
      const image = cropper.getCropperImage();
      if (image) {
        image.$rotate(-90);
      }
    }
  }

  function rotateRight() {
    rotate += 90;
    if (cropper) {
      const image = cropper.getCropperImage();
      if (image) {
        image.$rotate(90);
      }
    }
  }

  function reset() {
    scale = 1;
    rotate = 0;
    if (cropper) {
      const image = cropper.getCropperImage();
      const canvas = cropper.getCropperCanvas();
      if (image) {
        image.$scale(1);
        image.$rotate(0);
      }
    }
  }

  async function saveCroppedImage() {
    if (!cropper) return;

    const canvas = cropper.getCropperCanvas();
    if (!canvas) return;

    try {
      // Generate cropped canvas using v2 API
      const croppedCanvas = await canvas.$toCanvas({
        width: 1920,
        height: 1080
      });

      const dataUrl = croppedCanvas.toDataURL('image/jpeg', 0.9);
      onSave(dataUrl);
    } catch (error) {
      console.error('Failed to crop image:', error);
    }
  }
</script>

<div class="image-editor">
  <!-- Toolbar -->
  <div class="editor-toolbar">
    <div class="toolbar-group">
      <label class="file-input-label">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        Upload Image
        <input
          type="file"
          accept="image/*"
          onchange={handleFileSelect}
          style="display: none;"
        />
      </label>
    </div>

    <div class="toolbar-group">
      <button class="tool-btn" onclick={zoomOut} title="Zoom Out">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          <line x1="8" y1="11" x2="14" y2="11"/>
        </svg>
      </button>
      <button class="tool-btn" onclick={zoomIn} title="Zoom In">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          <line x1="11" y1="8" x2="11" y2="14"/>
          <line x1="8" y1="11" x2="14" y2="11"/>
        </svg>
      </button>
    </div>

    <div class="toolbar-group">
      <button class="tool-btn" onclick={rotateLeft} title="Rotate Left">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
        </svg>
      </button>
      <button class="tool-btn" onclick={rotateRight} title="Rotate Right">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
          <path d="M21 3v5h-5"/>
        </svg>
      </button>
      <button class="tool-btn" onclick={reset} title="Reset">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
      </button>
    </div>
  </div>

  <!-- Image Container -->
  <div class="image-container">
    {#if currentImageUrl}
      <img
        bind:this={imageElement}
        src={currentImageUrl}
        alt="To crop"
        class="cropper-image"
      />
    {:else}
      <div class="placeholder">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <p>Upload an image to get started</p>
        <label class="upload-btn">
          Choose Image
          <input
            type="file"
            accept="image/*"
            onchange={handleFileSelect}
            style="display: none;"
          />
        </label>
      </div>
    {/if}
  </div>

  <!-- Instructions -->
  <div class="editor-instructions">
    <p>💡 <strong>Tip:</strong> Drag to move, use mouse wheel to zoom. The crop area is fixed at 16:9 aspect ratio.</p>
  </div>

  <!-- Actions -->
  <div class="editor-actions">
    <button class="action-btn secondary" onclick={onCancel}>Cancel</button>
    <button class="action-btn primary" onclick={saveCroppedImage} disabled={!currentImageUrl}>
      Save Hero Image
    </button>
  </div>
</div>

<style>
  /* Cropper.js v2 Styles - Web Component Based */
  :global(cropper-canvas) {
    display: block !important;
    width: 100% !important;
    height: 400px !important;
    background-color: #0f172a;
  }

  :global(cropper-selection) {
    outline: 2px solid #0ea5e9;
    outline-offset: -2px;
  }

  :global(cropper-handle) {
    background-color: #0ea5e9;
    width: 10px;
    height: 10px;
  }

  :global(cropper-image) {
    max-width: 100%;
    max-height: 100%;
  }

  .image-editor {
    display: flex;
    flex-direction: column;
    gap: 16px;
    background: var(--glass-bg, rgba(30, 41, 59, 0.8));
    border-radius: 12px;
    padding: 20px;
    border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
  }

  .editor-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    padding: 12px;
    background: rgba(15, 23, 42, 0.5);
    border-radius: 8px;
    align-items: center;
    justify-content: space-between;
  }

  .toolbar-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .file-input-label {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: linear-gradient(135deg, var(--primary-color, #0ea5e9), var(--secondary-color, #6366f1));
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    color: white;
    transition: all 0.2s;
  }

  .file-input-label:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .tool-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: var(--text-color, #f8fafc);
    cursor: pointer;
    transition: all 0.2s;
  }

  .tool-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .image-container {
    position: relative;
    width: 100%;
    min-height: 400px;
    background: #0f172a;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cropper-image {
    max-width: 100%;
    max-height: 400px;
    display: block;
  }

  .placeholder {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    color: var(--text-secondary, #94a3b8);
  }

  .placeholder svg {
    opacity: 0.5;
  }

  .upload-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: linear-gradient(135deg, var(--primary-color, #0ea5e9), var(--secondary-color, #6366f1));
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    color: white;
    transition: all 0.2s;
  }

  .upload-btn:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .editor-instructions {
    padding: 12px 16px;
    background: rgba(14, 165, 233, 0.1);
    border: 1px solid rgba(14, 165, 233, 0.2);
    border-radius: 8px;
    font-size: 0.85rem;
    color: var(--text-secondary, #94a3b8);
  }

  .editor-instructions strong {
    color: var(--primary-color, #0ea5e9);
  }

  .editor-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border-radius: 10px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }

  .action-btn.primary {
    background: linear-gradient(135deg, var(--primary-color, #0ea5e9), var(--secondary-color, #6366f1));
    color: white;
  }

  .action-btn.primary:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(14, 165, 233, 0.3);
  }

  .action-btn.primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .action-btn.secondary {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-color, #f8fafc);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .action-btn.secondary:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  @media (max-width: 640px) {
    .editor-toolbar {
      flex-direction: column;
      align-items: stretch;
    }

    .toolbar-group {
      justify-content: center;
    }

    .image-container {
      min-height: 300px;
    }

    :global(cropper-canvas) {
      height: 300px !important;
    }
  }
</style>
