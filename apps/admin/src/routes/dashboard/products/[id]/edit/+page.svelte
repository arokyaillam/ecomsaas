<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { API_BASE_URL } from '$lib/api';
    import ImageUploader from '$components/ImageUploader.svelte';
    import ModifierManager from '$components/ModifierManager.svelte';

    type Product = {
        id: string;
        titleEn: string;
        titleAr?: string;
        descriptionEn?: string;
        descriptionAr?: string;
        categoryId?: string;
        subcategoryId?: string;
        sortOrder: number;
        preparationTime?: number;
        tags?: string;
        images?: string;
        youtubeVideoLinkId?: string;
        salePrice: number;
        purchasePrice?: number;
        purchaseLimit?: number;
        barcode?: string;
        discountType: string;
        discount: number;
        souqDealDiscount?: number;
        currentQuantity: number;
        isPublished: boolean;
        createdAt: string;
        updatedAt: string;
        [key: string]: any;
    };

    let product = $state<Product | null>(null);
    let categories = $state<any[]>([]);
    let subcategories = $state<any[]>([]);
    let loading = $state(true);
    let saving = $state(false);
    let activeTab = $state('details');
    let productImages = $state<string[]>([]);

    // Get product ID from URL
    let productId = $derived($page.params.id);

    onMount(async () => {
        const token = localStorage.getItem('merchant_token');
        if (!token) {
            goto('/login');
            return;
        }

        try {
            const [res, catRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/products/${productId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${API_BASE_URL}/api/categories`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (res.ok) {
                const data = await res.json();
                product = data.data;
                // Load existing images (filter out base64 images from old data)
                if (product?.images) {
                    // If images contains base64 data, treat as empty (backwards compatibility)
                    if (product.images.includes('data:')) {
                        productImages = [];
                    } else {
                        productImages = product.images
                            .split(',')
                            .filter((url: string) => url.trim() !== '');
                    }
                }
            } else {
                goto('/dashboard/products');
                return;
            }

            if (catRes.ok) {
                const catData = await catRes.json();
                categories = catData.data || [];
            }
        } catch (error) {
            console.error('Failed to fetch:', error);
            goto('/dashboard/products');
        } finally {
            loading = false;
        }
    });

    // Fetch subcategories when category changes
    $effect(() => {
        const catId = product?.categoryId;
        if (catId) {
            fetchSubcategories(catId);
        } else {
            subcategories = [];
        }
    });

    async function fetchSubcategories(catId: string) {
        const token = localStorage.getItem('merchant_token');
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/categories/${catId}/subcategories`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                subcategories = data.data || [];
            }
        } catch (err) {
            console.error('Failed to fetch subcategories:', err);
        }
    }

    function handleImagesChange(images: string[]) {
        productImages = images;
        if (product) {
            product.images = images.join(',');
        }
    }

    async function handleSubmit(e: SubmitEvent) {
        e.preventDefault();
        if (!product) return;

        saving = true;
        const token = localStorage.getItem('merchant_token');

        try {
            const res = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(product)
            });

            if (res.ok) {
                goto('/dashboard/products');
            }
        } catch (error) {
            console.error('Failed to update product:', error);
        } finally {
            saving = false;
        }
    }
</script>

<div class="fade-in">
    <div class="dashboard-header">
        <div>
            <h2>Edit Product</h2>
            <p style="color: var(--text-secondary); margin-top: 4px;">Update product details</p>
        </div>

        <div class="header-actions">
            <button class="action-btn secondary" onclick={() => goto('/dashboard/products')}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Back
            </button>
            {#if product}
                <button type="submit" form="product-form" class="action-btn primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            {/if}
        </div>
    </div>

    {#if loading}
        <div class="panel" style="text-align: center; padding: 60px;">
            <div class="skeleton" style="width: 200px; height: 32px; margin: 0 auto 24px;"></div>
            <div class="skeleton" style="width: 100%; height: 400px;"></div>
        </div>
    {:else if product}
        <!-- Tabs -->
        <div class="panel tabs-container" style="padding: 0; margin-bottom: 20px;">
            <button class="tab-btn {activeTab === 'details' ? 'active' : ''}" onclick={() => activeTab = 'details'}>
                Product Details
            </button>
            <button class="tab-btn {activeTab === 'business' ? 'active' : ''}" onclick={() => activeTab = 'business'}>
                Business Details
            </button>
            <button class="tab-btn {activeTab === 'modifiers' ? 'active' : ''}" onclick={() => activeTab = 'modifiers'}>
                Modifier Options
            </button>
        </div>

        <form id="product-form" onsubmit={handleSubmit}>
            <div class="panel">
                {#if activeTab === 'details'}
                    <div class="panel-header">
                        <h3>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
                            </svg>
                            Product Details
                        </h3>
                    </div>

                    <div class="panel-content">
                        <div class="form-grid">
                            <div class="input-row">
                                <label for="titleEn">Product Title (English) *</label>
                                <input id="titleEn" type="text" bind:value={product.titleEn} required />
                            </div>

                            <div class="input-row">
                                <label for="titleAr">Product Title (Arabic)</label>
                                <input id="titleAr" type="text" bind:value={product.titleAr} dir="rtl" />
                            </div>

                            <div class="input-row">
                                <label for="categoryId">Category *</label>
                                <select id="categoryId" bind:value={product.categoryId} required>
                                    <option value="">Select a category</option>
                                    {#each categories as category}
                                        <option value={category.id}>{category.nameEn}</option>
                                    {/each}
                                </select>
                            </div>

                            <div class="input-row">
                                <label for="subcategoryId">Sub-category</label>
                                <select id="subcategoryId" bind:value={product.subcategoryId}>
                                    <option value="">Select a subcategory</option>
                                    {#each subcategories as sub}
                                        <option value={sub.id}>{sub.nameEn}</option>
                                    {/each}
                                </select>
                            </div>

                            <div class="input-row">
                                <label for="sortOrder">Sort Order</label>
                                <input id="sortOrder" type="number" bind:value={product.sortOrder} />
                            </div>

                            <div class="input-row">
                                <label for="preparationTime">Preparation Time (Hours)</label>
                                <input id="preparationTime" type="number" min="0" bind:value={product.preparationTime} />
                            </div>

                            <div class="input-row">
                                <label for="tags">Tags</label>
                                <input id="tags" type="text" bind:value={product.tags} placeholder="e.g. new, featured, sale" />
                            </div>

                            <div class="input-row" style="align-items: flex-start;">
                                <label style="margin-top: 12px;">
                                    Product Images<br>
                                    <small style="color:var(--text-muted)">(Recommended: 500px × 500px, Max 5)</small>
                                </label>
                                <ImageUploader
                                    images={productImages}
                                    onChange={handleImagesChange}
                                    maxImages={5}
                                    recommendedSize="500 × 500"
                                />
                            </div>

                            <div class="input-row">
                                <label for="youtubeVideoId">Youtube Video ID</label>
                                <input id="youtubeVideoId" type="text" bind:value={product.youtubeVideoLinkId} placeholder="e.g. dQw4w9WgXcQ" />
                            </div>

                            <div class="input-row" style="align-items: flex-start;">
                                <label for="descriptionEn" style="margin-top: 12px;">Description (English)</label>
                                <textarea id="descriptionEn" bind:value={product.descriptionEn} rows="5"></textarea>
                            </div>

                            <div class="input-row" style="align-items: flex-start;">
                                <label for="descriptionAr" style="margin-top: 12px;">Description (Arabic)</label>
                                <textarea id="descriptionAr" bind:value={product.descriptionAr} rows="5" dir="rtl"></textarea>
                            </div>

                            <div class="input-row">
                                <label>Publishing</label>
                                <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
                                    <input type="checkbox" bind:checked={product.isPublished}
                                        style="width: 18px; height: 18px; accent-color: var(--accent-color);" />
                                    <span>Published</span>
                                </label>
                            </div>
                        </div>
                    </div>
                {/if}

                {#if activeTab === 'business'}
                    <div class="panel-header">
                        <h3>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                            </svg>
                            Business Details
                        </h3>
                    </div>

                    <div class="panel-content">
                        <div class="form-grid">
                            <div class="input-row">
                                <label for="salePrice">Sale Price *</label>
                                <div style="display:flex; gap:12px; align-items:center; width: 100%;">
                                    <input id="salePrice" type="number" step="0.01" min="0" bind:value={product.salePrice} required style="flex:1;" />
                                    <span>KWD</span>
                                </div>
                            </div>

                            <div class="input-row">
                                <label for="purchasePrice">Purchase Price</label>
                                <div style="display:flex; gap:12px; align-items:center; width: 100%;">
                                    <input id="purchasePrice" type="number" step="0.01" min="0" bind:value={product.purchasePrice} style="flex:1;" />
                                    <span>KWD</span>
                                </div>
                            </div>

                            <div class="input-row">
                                <label for="purchaseLimit">Purchase Limit</label>
                                <input id="purchaseLimit" type="number" min="0" bind:value={product.purchaseLimit} />
                            </div>

                            <div class="input-row">
                                <label for="currentQuantity">Current Stock *</label>
                                <input id="currentQuantity" type="number" min="0" bind:value={product.currentQuantity} required />
                            </div>

                            <div class="input-row">
                                <label for="barcode">Barcode</label>
                                <input id="barcode" type="text" bind:value={product.barcode} />
                            </div>

                            <div class="input-row">
                                <label for="discountType">Discount Type</label>
                                <select id="discountType" bind:value={product.discountType}>
                                    <option value="Percent">Percent (%)</option>
                                    <option value="Fixed">Fixed Amount</option>
                                </select>
                            </div>

                            <div class="input-row">
                                <label for="discount">Discount</label>
                                <input id="discount" type="number" min="0" bind:value={product.discount} />
                            </div>

                            <div class="input-row">
                                <label for="souqDealDiscount">Souq Deal Discount</label>
                                <input id="souqDealDiscount" type="number" min="0" bind:value={product.souqDealDiscount} />
                            </div>
                        </div>
                    </div>
                {/if}

                {#if activeTab === 'modifiers'}
                    <div class="panel-header">
                        <h3>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                            </svg>
                            Modifier Options
                        </h3>
                    </div>

                    <div class="panel-content" style="padding: 24px;">
                        <ModifierManager productId={productId} />
                    </div>
                {/if}
            </div>
        </form>
    {/if}
</div>

<style>
    .tabs-container {
        display: flex;
        border-bottom: 1px solid var(--border-color);
    }

    .tab-btn {
        flex: 1;
        padding: 14px 16px;
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        color: var(--text-secondary);
        font-family: var(--font-sans);
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .tab-btn:hover {
        background: rgba(255, 255, 255, 0.02);
        color: var(--text-primary);
    }

    .tab-btn.active {
        color: var(--accent-color);
        border-bottom-color: var(--accent-color);
        font-weight: 500;
        background: rgba(245, 158, 11, 0.05);
    }

    .form-grid {
        display: flex;
        flex-direction: column;
    }

    .input-row {
        display: grid;
        grid-template-columns: 240px 1fr;
        align-items: center;
        padding: 14px 0;
        border-bottom: 1px solid var(--border-subtle);
    }

    .input-row:last-child {
        border-bottom: none;
    }

    .input-row label {
        color: var(--text-primary);
        font-weight: 500;
        font-size: 0.875rem;
    }

    .input-row input[type="text"],
    .input-row input[type="number"],
    .input-row select,
    .input-row textarea {
        width: 100%;
        background: var(--surface-color);
        border: 1px solid var(--border-color);
        color: var(--text-primary);
        padding: 10px 12px;
        border-radius: 0;
        font-family: var(--font-sans);
        font-size: 0.875rem;
        outline: none;
        transition: all 0.15s ease;
    }

    .input-row input:focus,
    .input-row select:focus,
    .input-row textarea:focus {
        border-color: var(--accent-color);
        box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.2);
    }

    .input-row textarea {
        resize: vertical;
        min-height: 80px;
    }
</style>
