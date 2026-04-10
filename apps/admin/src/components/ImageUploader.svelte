<script lang="ts">
  import ImageEditorModal from './ImageEditorModal.svelte';
  import { API_BASE_URL } from '$lib/api';

  interface Props {
    images: string[];
    onChange: (images: string[]) => void;
    maxImages?: number;
    recommendedSize?: string;
  }

  let { images = [], onChange, maxImages = 5, recommendedSize = '500 x 500' }: Props = $props();

  let dragOver = $state(false);
  let editingImage: { url: string; index: number } | null = $state(null);
  let fileInput: HTMLInputElement;
  let uploading = $state(false);
  let uploadError = $state('');

  async function uploadImageToServer(file: File): Promise<string | null> {
    const token = localStorage.getItem('merchant_token');
    if (!token) {
      uploadError = 'Please log in to upload images';
      return null;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        return data.url;
      } else {
        const err = await res.json();
        uploadError = err.error || 'Failed to upload image';
        return null;
      }
    } catch (err) {
      uploadError = 'Network error during upload';
      return null;
    }
  }

  async function uploadBase64ImageToServer(dataUrl: string, filename: string): Promise<string | null> {
    const token = localStorage.getItem('merchant_token');
    if (!token) {
      uploadError = 'Please log in to upload images';
      return null;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/upload/base64`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ image: dataUrl, filename })
      });

      if (res.ok) {
        const data = await res.json();
        return data.url;
      } else {
        const err = await res.json();
        uploadError = err.error || 'Failed to upload image';
        return null;
      }
    } catch (err) {
      uploadError = 'Network error during upload';
      return null;
    }
  }

  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files) {
      processFiles(files);
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragOver = false;
    const files = event.dataTransfer?.files;
    if (files) {
      processFiles(files);
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    dragOver = true;
  }

  function handleDragLeave() {
    dragOver = false;
  }

  function processFiles(files: FileList) {
    const remainingSlots = maxImages - images.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result) {
            // Resize and optimize image
            optimizeImage(result, file.name);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  async function optimizeImage(dataUrl: string, filename: string) {
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Target 800x800 for product images (good balance of quality and size)
      const targetSize = 800;
      canvas.width = targetSize;
      canvas.height = targetSize;

      // Calculate crop dimensions to maintain aspect ratio
      const scale = Math.max(targetSize / img.width, targetSize / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const offsetX = (targetSize - scaledWidth) / 2;
      const offsetY = (targetSize - scaledHeight) / 2;

      // Fill with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetSize, targetSize);

      // Draw image centered and cropped
      ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

      // Convert to optimized JPEG
      const optimizedUrl = canvas.toDataURL('image/jpeg', 0.85);

      // Upload to server
      uploading = true;
      uploadError = '';
      const uploadedUrl = await uploadBase64ImageToServer(optimizedUrl, filename);
      uploading = false;

      if (uploadedUrl) {
        addImage(uploadedUrl);
      }
    };
    img.src = dataUrl;
  }

  function addImage(url: string) {
    const newImages = [...images, url];
    onChange(newImages);
  }

  function removeImage(index: number) {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  }

  function moveImage(index: number, direction: 'up' | 'down') {
    if (direction === 'up' && index > 0) {
      const newImages = [...images];
      [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
      onChange(newImages);
    } else if (direction === 'down' && index < images.length - 1) {
      const newImages = [...images];
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
      onChange(newImages);
    }
  }

  function openImageEditor(index: number) {
    editingImage = { url: images[index], index };
  }

  function closeImageEditor() {
    editingImage = null;
  }

  async function saveEditedImage(editedUrl: string) {
    if (editingImage) {
      uploading = true;
      uploadError = '';
      // Upload the edited image to server
      const uploadedUrl = await uploadBase64ImageToServer(editedUrl, 'edited-image.jpg');
      uploading = false;

      if (uploadedUrl) {
        const newImages = [...images];
        newImages[editingImage.index] = uploadedUrl;
        onChange(newImages);
      }
    }
    closeImageEditor();
  }
</script>

<div class="image-uploader">
  {#if uploadError}
    <div class="upload-error">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      {uploadError}
    </div>
  {/if}

  {#if uploading}
    <div class="uploading-state">
      <div class="spinner"></div>
      <span>Uploading image...</span>
    </div>
  {/if}

  <!-- Upload Area -->
  {#if images.length < maxImages && !uploading}
    <div
      class="upload-zone"
      class:dragover={dragOver}
      ondrop={handleDrop}
      ondragover={handleDragOver}
      ondragleave={handleDragLeave}
      onclick={() => fileInput.click()}
      role="button"
      tabindex="0"
      onkeydown={(e) => e.key === 'Enter' && fileInput.click()}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
      <p class="upload-text">Drop images here or click to upload</p>
      <p class="upload-hint">Supports: JPG, PNG, WebP • Max {maxImages} images</p>
      <p class="upload-hint">Recommended: {recommendedSize}px</p>
      <button type="button" class="upload-btn">Select Files</button>
    </div>
  {/if}

  <input
    bind:this={fileInput}
    type="file"
    accept="image/*"
    multiple
    onchange={handleFileSelect}
    style="display: none;"
  />

  <!-- Image Gallery -->
  {#if images.length > 0}
    <div class="image-gallery">
      {#each images as image, index}
        <div class="image-card">
          <img src={image} alt="Product {index + 1}" />

          {#if index === 0}
            <span class="badge-primary">Primary</span>
          {/if}

          <div class="image-overlay">
            <button type="button" class="icon-btn" onclick={() => openImageEditor(index)} title="Edit">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>

            {#if images.length > 1}
              <div class="reorder-btns">
                {#if index > 0}
                  <button type="button" class="icon-btn" onclick={() => moveImage(index, 'up')} title="Move up">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="18 15 12 9 6 15"/>
                    </svg>
                  </button>
                {/if}
                {#if index < images.length - 1}
                  <button type="button" class="icon-btn" onclick={() => moveImage(index, 'down')} title="Move down">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                {/if}
              </div>
            {/if}

            <button type="button" class="icon-btn danger" onclick={() => removeImage(index)} title="Remove">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Image Editor Modal -->
  {#if editingImage}
    <ImageEditorModal
      imageUrl={editingImage.url}
      onSave={saveEditedImage}
      onCancel={closeImageEditor}
    />
  {/if}
</div>

<style>
  .image-uploader {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .upload-error {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
    font-size: 0.875rem;
    border-radius: 4px;
  }

  .uploading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 24px;
    background: var(--surface-elevated);
    border: 1px dashed var(--border-color);
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid var(--border-color);
    border-top-color: var(--accent-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .upload-zone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 24px;
    background: var(--surface-elevated);
    border: 2px dashed var(--border-color);
    cursor: pointer;
    transition: all 0.15s ease;
    color: var(--text-secondary);
  }

  .upload-zone:hover,
  .upload-zone.dragover {
    border-color: var(--accent-color);
    background: rgba(245, 158, 11, 0.05);
    color: var(--accent-color);
  }

  .upload-zone svg {
    margin-bottom: 12px;
    color: currentColor;
  }

  .upload-text {
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 8px;
  }

  .upload-hint {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-bottom: 4px;
  }

  .upload-btn {
    margin-top: 16px;
    padding: 10px 20px;
    background: var(--accent-color);
    color: var(--bg-color);
    border: none;
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .upload-btn:hover {
    background: #fbbf24;
    box-shadow: 0 0 16px rgba(245, 158, 11, 0.3);
  }

  .image-gallery {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }

  .image-card {
    position: relative;
    aspect-ratio: 1;
    background: var(--surface-elevated);
    border: 1px solid var(--border-color);
    overflow: hidden;
  }

  .image-card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .badge-primary {
    position: absolute;
    top: 8px;
    left: 8px;
    padding: 2px 8px;
    background: var(--accent-color);
    color: var(--bg-color);
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .image-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .image-card:hover .image-overlay {
    opacity: 1;
  }

  .reorder-btns {
    display: flex;
    gap: 4px;
  }

  .icon-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface-color);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .icon-btn:hover {
    border-color: var(--accent-color);
    color: var(--accent-color);
  }

  .icon-btn.danger:hover {
    border-color: var(--error);
    color: var(--error);
  }
</style>
