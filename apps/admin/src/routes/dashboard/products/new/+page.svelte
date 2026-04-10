<script lang="ts">
    import { onMount } from 'svelte';
    import { API_BASE_URL } from '$lib/api';
    import { goto } from '$app/navigation';
    import ImageUploader from '$components/ImageUploader.svelte';

    let categories = $state([] as any[]);
    let subcategories = $state([] as any[]);
    let loading = $state(true);
    let saving = $state(false);

    let activeTab = $state('details');

    // Images as array for the uploader
    let productImages = $state([] as string[]);

    let product = $state({
        titleEn: '',
        titleAr: '',
        descriptionEn: '',
        descriptionAr: '',
        categoryId: '',
        subcategoryId: '',
        sortOrder: 0,
        preparationTime: null,
        tags: '',
        images: '',
        youtubeVideoLinkId: '',
        salePrice: '',
        purchasePrice: '',
        purchaseLimit: null,
        barcode: '',
        discount: 0,
        discountType: 'Percent',
        souqDealDiscount: 0,
        currentQuantity: 0,
        isPublished: true
    });

    let errors = $state({} as Record<string, string>);

    // Sync images array to comma-separated string for API
    $effect(() => {
        product.images = productImages.join(',');
    });

    onMount(async () => {
        const token = localStorage.getItem('merchant_token');
        if (!token) {
            goto('/login');
            return;
        }
        try {
            const res = await fetch(`${API_BASE_URL}/api/categories`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                categories = data.data || [];
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        } finally {
            loading = false;
        }
    });

    $effect(() => {
        if (product.categoryId) {
            fetchSubcategories(product.categoryId);
        } else {
            subcategories = [];
            product.subcategoryId = '';
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

    async function handleSubmit(e: SubmitEvent) {
        e.preventDefault();
        errors = {};

        // Cross-tab validation
        if (!product.titleEn || product.titleEn.trim() === '') {
            activeTab = 'details';
            errors = { general: 'Product Title (English) is required.' };
            return;
        }
        if (!product.categoryId || product.categoryId === '') {
            activeTab = 'details';
            errors = { general: 'Category is required.' };
            return;
        }
        if (product.salePrice == null || product.salePrice === '' || isNaN(Number(product.salePrice))) {
            activeTab = 'business';
            errors = { general: 'Sale Price is required and must be a number.' };
            return;
        }
        if (product.currentQuantity == null || isNaN(Number(product.currentQuantity))) {
            activeTab = 'business';
            errors = { general: 'Current Stock Quantity is required and must be a number.' };
            return;
        }

        saving = true;
        
        const token = localStorage.getItem('merchant_token');
        
        try {
            const res = await fetch(`${API_BASE_URL}/api/products`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(product)
            });
            
            const data = await res.json();
            
            if (res.ok) {
                goto('/dashboard/products');
            } else {
                errors = data.error || { general: 'Failed to create product' };
            }
        } catch (error) {
            errors = { general: 'Network error. Please try again.' };
        } finally {
            saving = false;
        }
    }
</script>

<div class="fade-in">
    <div class="dashboard-header">
        <div>
            <h2>New Product</h2>
            <p style="color: var(--text-secondary); margin-top: 4px;">Add a new product to your store</p>
        </div>
        
        <div class="header-actions">
            <button class="action-btn secondary" onclick={() => goto('/dashboard/products')}>
                Cancel
            </button>
            <button type="submit" form="product-form" class="action-btn primary" disabled={saving}>
                {saving ? 'Creating...' : 'Create Product'}
            </button>
        </div>
    </div>

    <!-- Tabs Navigation -->
    <div class="tabs-container glass-card dashboard" style="padding: 0; margin-bottom: 24px; border-bottom: none; overflow: hidden; display: flex;">
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
        {#if errors.general}
            <div class="glass-card dashboard" style="margin-bottom: 24px; background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3);">
                <p style="color: #ef4444;">{errors.general}</p>
            </div>
        {/if}
        
        <div class="glass-card dashboard">
            <!-- PRODUCT DETAILS TAB -->
            {#if activeTab === 'details'}
                <h3 style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--glass-border); text-align: center;">Product Details</h3>
                
                <div class="form-grid">
                    <div class="input-row">
                        <label for="titleEn">Product Title (English) *</label>
                        <input id="titleEn" type="text" bind:value={product.titleEn} required placeholder="e.g. Premium Cotton T-Shirt" />
                    </div>
                    
                    <div class="input-row">
                        <label for="titleAr">Product Title (Arabic)</label>
                        <input id="titleAr" type="text" bind:value={product.titleAr} placeholder="Arabic product name (optional)" dir="rtl" />
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
                        <input id="sortOrder" type="number" bind:value={product.sortOrder} placeholder="0" />
                    </div>

                    <div class="input-row">
                        <label for="preparationTime">Preparation Time (Hours)</label>
                        <input id="preparationTime" type="number" min="0" bind:value={product.preparationTime} placeholder="e.g. 24" />
                    </div>

                    <div class="input-row">
                        <label for="tags">Tags</label>
                        <input id="tags" type="text" bind:value={product.tags} placeholder="e.g. new, featured, sale" />
                    </div>

                    <div class="input-row" style="align-items: flex-start;">
                        <label style="margin-top: 12px;">Product Images <br><small style="color:var(--text-muted)">(Recommended: 500px × 500px, Max 5 images)</small></label>
                        <ImageUploader
                            images={productImages}
                            onChange={(images) => productImages = images}
                            maxImages={5}
                            recommendedSize="500 × 500"
                        />
                    </div>

                    <div class="input-row">
                        <label for="youtubeVideoId">Youtube Video Link ID (Optional)</label>
                        <input id="youtubeVideoId" type="text" bind:value={product.youtubeVideoLinkId} placeholder="e.g. dQw4w9WgXcQ" />
                    </div>
                    
                    <div class="input-row" style="align-items: flex-start;">
                        <label for="descriptionEn" style="margin-top: 12px;">Description (English)</label>
                        <textarea id="descriptionEn" bind:value={product.descriptionEn} placeholder="Enter product description..." rows="5"></textarea>
                    </div>
                    
                    <div class="input-row" style="align-items: flex-start;">
                        <label for="descriptionAr" style="margin-top: 12px;">Description (Arabic)</label>
                        <textarea id="descriptionAr" bind:value={product.descriptionAr} placeholder="Arabic description (optional)" rows="5" dir="rtl"></textarea>
                    </div>

                    <div class="input-row">
                        <label>Publishing</label>
                        <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
                            <input type="checkbox" bind:checked={product.isPublished} 
                                style="width: 20px; height: 20px; accent-color: var(--accent-color);" />
                            <span>Publish immediately</span>
                        </label>
                    </div>
                </div>
            {/if}

            <!-- BUSINESS DETAILS TAB -->
            {#if activeTab === 'business'}
                <h3 style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--glass-border); text-align: center;">Business Details</h3>

                <div class="form-grid">
                    <div class="input-row">
                        <label for="salePrice">Sale Price *</label>
                        <div style="display:flex; gap:12px; align-items:center; width: 100%;">
                            <input id="salePrice" type="number" step="0.01" min="0" bind:value={product.salePrice} required placeholder="0.00" style="flex:1;" />
                            <span>KWD</span>
                        </div>
                    </div>
                    
                    <div class="input-row">
                        <label for="purchasePrice">Purchase Price</label>
                        <div style="display:flex; gap:12px; align-items:center; width: 100%;">
                            <input id="purchasePrice" type="number" step="0.01" min="0" bind:value={product.purchasePrice} placeholder="0.00" style="flex:1;" />
                            <span>KWD</span>
                        </div>
                    </div>

                    <div class="input-row">
                        <label for="purchaseLimit">Purchase limit</label>
                        <input id="purchaseLimit" type="number" min="0" bind:value={product.purchaseLimit} placeholder="Unlimited" />
                    </div>

                    <div class="input-row">
                        <label for="currentQuantity">Current Stock Quantity *</label>
                        <input id="currentQuantity" type="number" min="0" bind:value={product.currentQuantity} required placeholder="0" />
                    </div>

                    <div class="input-row">
                        <label for="barcode">Barcode</label>
                        <input id="barcode" type="text" bind:value={product.barcode} placeholder="e.g. PROD-001" />
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
                        <input id="discount" type="number" min="0" bind:value={product.discount} placeholder="0" />
                    </div>

                    <div class="input-row">
                        <label for="souqDealDiscount">Souq Deal Discount</label>
                        <input id="souqDealDiscount" type="number" min="0" bind:value={product.souqDealDiscount} placeholder="0" />
                    </div>
                </div>
            {/if}

            <!-- MODIFIER OPTIONS TAB -->
            {#if activeTab === 'modifiers'}
                <h3 style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--glass-border); text-align: center;">Modifier Options</h3>

                <div style="padding: 24px; background: rgba(255,255,255,0.02); border: 1px dashed var(--border-color); border-radius: 8px; text-align: center;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin-bottom: 16px; opacity: 0.5;">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                        <path d="M2 17l10 5 10-5"></path>
                        <path d="M2 12l10 5 10-5"></path>
                    </svg>
                    <p style="color: var(--text-secondary); margin-bottom: 8px;"><strong>Modifier groups will be available after product creation</strong></p>
                    <p style="color: var(--text-muted); font-size: 0.875rem;">Save this product first, then you can add size options, toppings, extras, and more.</p>
                </div>
            {/if}
        </div>
    </form>
</div>

<style>
    .tabs-container {
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
