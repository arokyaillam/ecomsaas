<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { API_BASE_URL } from '$lib/api';

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

    let product = $state(null as Product | null);
    let categories = $state([] as any[]);
    let loading = $state(true);
    let saving = $state(false);
    
    let activeTab = $state('details');

    onMount(async () => {
        const token = localStorage.getItem('merchant_token');
        if (!token) {
            goto('/login');
            return;
        }

        const productId = $page.params.id;
        
        // Fetch product and categories data
        try {
            const res = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const catRes = await fetch(`${API_BASE_URL}/api/categories`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                product = data.data;
            } else {
                goto('/dashboard/products');
                return;
            }
            
            if (catRes.ok) {
                const catData = await catRes.json();
                categories = catData.data || [];
            }
        } catch (error) {
            goto('/dashboard/products');
        } finally {
            loading = false;
        }
    });

    async function handleSubmit(e: SubmitEvent) {
        e.preventDefault();
        saving = true;
        
        const token = localStorage.getItem('merchant_token');
        const productId = $page.params.id;
        
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
                Back to Products
            </button>
            <!-- Moved save button out so it's always accessible -->
            {#if product}
                <button type="submit" form="product-form" class="action-btn primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            {/if}
        </div>
    </div>

    {#if loading}
        <div class="glass-card dashboard" style="text-align: center; padding: 60px;">
            <div class="skeleton" style="width: 200px; height: 32px; margin: 0 auto 24px;"></div>
            <div class="skeleton" style="width: 100%; height: 400px;"></div>
        </div>
    {:else if product}
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
            <div class="glass-card dashboard">
                <!-- PRODUCT DETAILS TAB -->
                {#if activeTab === 'details'}
                    <h3 style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--glass-border); text-align: center;">Product Details</h3>
                    
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
                            <input id="tags" type="text" bind:value={product.tags} />
                        </div>

                        <div class="input-row">
                            <label for="images">Images (JPG) <br><small style="color:var(--text-muted)">(Recommended Width/Height: 500px * 500px)</small></label>
                            <input id="images" type="text" bind:value={product.images} />
                        </div>

                        <div class="input-row">
                            <label for="youtubeVideoId">Youtube Video Link ID (Optional)</label>
                            <input id="youtubeVideoId" type="text" bind:value={product.youtubeVideoLinkId} />
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
                                    style="width: 20px; height: 20px; accent-color: var(--accent-color);" />
                                <span>Published</span>
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
                            <label for="purchaseLimit">Purchase limit</label>
                            <input id="purchaseLimit" type="number" min="0" bind:value={product.purchaseLimit} />
                        </div>

                        <div class="input-row">
                            <label for="currentQuantity">Current Stock Quantity *</label>
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
                {/if}

                <!-- MODIFIER OPTIONS TAB -->
                {#if activeTab === 'modifiers'}
                    <h3 style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--glass-border); text-align: center;">Modifier Options</h3>

                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 24px; background: rgba(255,255,255,0.02); border: 1px dashed var(--border-color); border-radius: 8px;">
                        <p style="color: var(--text-secondary);">If You Need More Choice Options For Customers Of This Product, please Click Here.</p>
                        <button type="button" class="action-btn primary" onclick={() => alert('Modifier groups logic coming soon!')}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Add Modifier Group
                        </button>
                    </div>
                {/if}
            </div>
        </form>
    {/if}
</div>

<style>
    .tab-btn {
        flex: 1;
        padding: 16px;
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        color: var(--text-secondary);
        font-family: 'Outfit', sans-serif;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s;
    }
    .tab-btn:hover {
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-primary);
    }
    .tab-btn.active {
        color: var(--accent-color);
        border-bottom: 2px solid var(--accent-color);
        font-weight: 500;
        background: rgba(255, 255, 255, 0.02);
    }

    .form-grid {
        display: flex;
        flex-direction: column;
    }
    
    .input-row {
        display: grid;
        grid-template-columns: 250px 1fr;
        align-items: center;
        padding: 16px 0;
        border-bottom: 1px solid var(--glass-border);
    }
    
    .input-row:last-child {
        border-bottom: none;
    }

    .input-row label {
        color: var(--text-primary);
        font-weight: 500;
        font-size: 0.95rem;
    }

    .input-row input[type="text"],
    .input-row input[type="number"],
    .input-row select,
    .input-row textarea {
        width: 100%;
        background: var(--input-bg);
        border: 1px solid var(--glass-border);
        color: var(--text-primary);
        padding: 12px 16px;
        border-radius: 8px;
        font-family: inherit;
        font-size: 0.95rem;
    }
    
    .input-row textarea {
        resize: vertical;
    }
</style>
