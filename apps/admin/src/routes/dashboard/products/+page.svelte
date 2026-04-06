<script lang="ts">
    import { onMount } from 'svelte';
    import { API_BASE_URL } from '$lib/api';
    import { goto } from '$app/navigation';

    type Product = {
        id: string;
        titleEn: string;
        titleAr?: string;
        barcode?: string;
        images?: string;
        categoryId?: string;
        salePrice: number;
        purchasePrice?: number;
        discount: number;
        discountType: string;
        isPublished: boolean;
        currentQuantity: number;
        [key: string]: any;
    };

    let products = $state([] as Product[]);
    let categories = $state([] as any[]);
    let loading = $state(true);
    let searchQuery = $state('');
    let showDeleteModal = $state(false);
    let productToDelete = $state(null as Product | null);
    let deleteLoading = $state(false);

    onMount(async () => {
        const token = localStorage.getItem('merchant_token');
        if (!token) {
            goto('/login');
            return;
        }
        await fetchProducts(token);
    });

    async function fetchProducts(token: string) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/products`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const catRes = await fetch(`${API_BASE_URL}/api/categories`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                products = data.data || [];
            } else if (res.status === 401) {
                localStorage.removeItem('merchant_token');
                goto('/login');
            }

            if (catRes.ok) {
                const catData = await catRes.json();
                categories = catData.data || [];
            }
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            loading = false;
        }
    }

    function confirmDelete(product: Product) {
        productToDelete = product;
        showDeleteModal = true;
    }

    async function deleteProduct() {
        if (!productToDelete) return;
        
        deleteLoading = true;
        const token = localStorage.getItem('merchant_token');
        
        try {
            const res = await fetch(`${API_BASE_URL}/api/products/${productToDelete.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                products = products.filter(p => p.id !== productToDelete?.id);
                showDeleteModal = false;
                productToDelete = null;
            } else if (res.status === 401) {
                localStorage.removeItem('merchant_token');
                goto('/login');
            }
        } catch (error) {
            console.error('Failed to delete product:', error);
        } finally {
            deleteLoading = false;
        }
    }

    function formatCurrency(value: number) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(value);
    }

    function getCategoryName(id?: string) {
        if (!id) return 'Uncategorized';
        const found = categories.find(c => c.id === id);
        return found ? found.nameEn : 'Uncategorized';
    }

    let filteredProducts = $derived(products.filter(p => 
        p.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()))
    ));
</script>

<div class="fade-in">
    <!-- Header -->
    <div class="dashboard-header">
        <div>
            <h2>Products</h2>
            <p style="color: var(--text-secondary); margin-top: 4px;">Manage your store products</p>
        </div>
        
        <div class="header-actions">
            <button class="action-btn secondary" onclick={() => goto('/dashboard')} style="margin-right: 8px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
                    <path d="M19 12H5M12 19l-7-7 7-7"></path>
                </svg>
                Back
            </button>
            <a href="/dashboard/products/new" class="action-btn primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add Product
            </a>
        </div>
    </div>

    <!-- Search Bar -->
    <div class="glass-card dashboard" style="margin-bottom: 24px;">
        <div style="display: flex; gap: 16px; align-items: center;">
            <div style="flex: 1; position: relative;">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--text-secondary);">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input 
                    type="text" 
                    placeholder="Search products by name or barcode..." 
                    bind:value={searchQuery}
                    style="padding-left: 48px;"
                />
            </div>
            <span style="color: var(--text-secondary); font-size: 0.9rem;">{filteredProducts.length} products</span>
        </div>
    </div>

    <!-- Products Table -->
    <div class="glass-card dashboard">
        {#if loading}
            <div style="display: flex; flex-direction: column; gap: 16px; padding: 24px;">
                {#each Array(5) as _}
                    <div class="skeleton" style="width: 100%; height: 60px;"></div>
                {/each}
            </div>
        {:else if filteredProducts.length === 0}
            <div style="text-align: center; padding: 60px 24px; color: var(--text-secondary);">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin-bottom: 16px; opacity: 0.5;">
                    <path d="m7.5 4.27 9 5.15"></path>
                    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
                </svg>
                <p style="font-size: 1.1rem; margin-bottom: 8px;">{searchQuery ? 'No products found' : 'No products yet'}</p>
                <p style="margin-bottom: 24px;">{searchQuery ? 'Try adjusting your search' : 'Get started by adding your first product'}</p>
                
                {#if !searchQuery}
                    <a href="/dashboard/products/new" class="action-btn primary">Add First Product</a>
                {/if}
            </div>
        {:else}
            <div style="overflow-x: auto;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each filteredProducts as product}
                            <tr>
                                <td>
                                    <div class="product-cell">
                                        <div class="product-image">
                                            {#if product.images}
                                                <img src={product.images.split(',')[0]} alt={product.titleEn} />
                                            {:else}
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                    <circle cx="9" cy="9" r="2"></circle>
                                                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                                                </svg>
                                            {/if}
                                        </div>
                                        <div class="product-name">
                                            <h4>{product.titleEn}</h4>
                                            <span>{product.barcode || 'No barcode'}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span style="background: var(--input-bg); padding: 6px 12px; border-radius: 20px; font-size: 0.8rem;">{getCategoryName(product.categoryId)}</span>
                                </td>
                                <td>
                                    <div>{formatCurrency(product.salePrice)}</div>
                                    {#if product.discount > 0}
                                        <span style="font-size: 0.75rem; color: #86efac;">-{product.discount}{product.discountType === 'Percent' ? '%' : ''} off</span>
                                    {/if}
                                </td>
                                <td>
                                    <span style="color: {product.currentQuantity > 10 ? '#86efac' : product.currentQuantity > 0 ? '#fdba74' : '#ef4444'}; font-weight: 600;">{product.currentQuantity}</span>
                                </td>
                                <td>
                                    <span class="status-badge {product.isPublished ? 'published' : 'draft'}">
                                        {product.isPublished ? 'Published' : 'Draft'}
                                    </span>
                                </td>
                                <td>
                                    <div style="display: flex; gap: 8px;">
                                        <a href="/dashboard/products/{product.id}/edit" class="action-btn secondary" style="padding: 6px 12px;" aria-label="Edit product">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                                            </svg>
                                        </a>
                                        
                                        <button class="action-btn secondary" style="padding: 6px 12px; background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); color: #ef4444;" onclick={() => confirmDelete(product)} aria-label="Delete product">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M3 6h18"></path>
                                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    </div>
</div>

<!-- Delete Modal -->
{#if showDeleteModal}
    <div style="position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 200;">
        <div class="glass-card" style="width: 100%; max-width: 400px;">
            <h3 style="margin-bottom: 16px;">Delete Product?</h3>
            <p style="color: var(--text-secondary); margin-bottom: 24px;">
                Are you sure you want to delete "{productToDelete?.titleEn}"? This action cannot be undone.
            </p>
            
            <div style="display: flex; gap: 12px;">
                <button class="action-btn secondary" onclick={() => { showDeleteModal = false; productToDelete = null; }} style="flex: 1;">Cancel</button>
                <button class="action-btn" style="flex: 1; background: #ef4444; color: white;" onclick={deleteProduct} disabled={deleteLoading}>
                    {deleteLoading ? 'Deleting...' : 'Delete'}
                </button>
            </div>
        </div>
    </div>
{/if}
