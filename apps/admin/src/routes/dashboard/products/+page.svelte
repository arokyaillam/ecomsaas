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
            <button class="action-btn secondary" onclick={() => goto('/dashboard')}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                >
                    <path d="M19 12H5M12 19l-7-7 7-7"></path>
                </svg>
                Back
            </button>
            <a href="/dashboard/products/new" class="action-btn primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                >
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add Product
            </a>
        </div>
    </div>

    <!-- Search Bar -->
    <div class="panel" style="margin-bottom: 20px;">
        <div class="panel-content">
            <div style="display: flex; gap: 16px; align-items: center;">
                <div style="flex: 1; position: relative;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted);"
                    >
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <input
                        type="text"
                        placeholder="Search products by name or barcode..."
                        bind:value={searchQuery}
                        style="padding-left: 40px;"
                    />
                </div>
                <span style="color: var(--text-muted); font-size: 0.75rem; font-family: var(--font-mono);">{filteredProducts.length} products</span>
            </div>
        </div>
    </div>

    <!-- Products Table -->
    <div class="panel">
        {#if loading}
            <div class="panel-content">
                {#each Array(5) as _}
                    <div class="skeleton" style="width: 100%; height: 56px; margin-bottom: 12px;"></div>
                {/each}
            </div>
        {:else if filteredProducts.length === 0}
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"
                >
                    <path d="m7.5 4.27 9 5.15"></path>
                    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
                </svg>
                <p>{searchQuery ? 'No products found' : 'No products yet'}</p>
                <p style="font-size: 0.8125rem; margin-bottom: 20px;">{searchQuery ? 'Try adjusting your search' : 'Get started by adding your first product'}</p>

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
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each filteredProducts as product}
                            <tr>
                                <td>
                                    <div class="product-cell">
                                        <div class="product-image">
                                            {#if product.images && !product.images.includes('data:')}
                                                <img src={product.images.split(',')[0]} alt={product.titleEn} />
                                            {:else}
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                                                >
                                                    <rect x="3" y="3" width="18" height="18" rx="2"></rect>
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
                                    <span class="category-badge">{getCategoryName(product.categoryId)}</span>
                                </td>
                                <td>
                                    <div style="font-family: var(--font-mono);">{formatCurrency(product.salePrice)}</div>
                                    {#if product.discount > 0}
                                        <span style="font-size: 0.6875rem; color: var(--success);"
                                        >-{product.discount}{product.discountType === 'Percent' ? '%' : ''} off</span>
                                    {/if}
                                </td>
                                <td>
                                    <span style="font-family: var(--font-mono); color: {product.currentQuantity > 10 ? 'var(--success)' : product.currentQuantity > 0 ? 'var(--accent-color)' : 'var(--error)'};"
                                    >
                                        {product.currentQuantity}
                                    </span>
                                </td>
                                <td>
                                    <span class="status-badge {product.isPublished ? 'published' : 'draft'}">
                                        {product.isPublished ? 'Published' : 'Draft'}
                                    </span>
                                </td>
                                <td>
                                    <div style="display: flex; gap: 8px;">
                                        <a href="/dashboard/products/{product.id}/edit" class="icon-btn" title="Edit"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                            >
                                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                                            </svg>
                                        </a>

                                        <button class="icon-btn danger" onclick={() => confirmDelete(product)} title="Delete"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                            >
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
    <div class="modal-backdrop">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Delete Product?</h3>
                <button class="close-btn" onclick={() => { showDeleteModal = false; productToDelete = null; }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            <div class="modal-body">
                <p>
                    Are you sure you want to delete "<strong>{productToDelete?.titleEn}</strong>"? This action cannot be undone.
                </p>
            </div>

            <div class="modal-footer">
                <button class="action-btn secondary" onclick={() => { showDeleteModal = false; productToDelete = null; }}>
                    Cancel
                </button>
                <button class="action-btn danger" onclick={deleteProduct} disabled={deleteLoading}>
                    {deleteLoading ? 'Deleting...' : 'Delete'}
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .category-badge {
        display: inline-block;
        padding: 4px 10px;
        background: var(--surface-elevated);
        border: 1px solid var(--border-color);
        font-size: 0.6875rem;
        color: var(--text-secondary);
        font-family: var(--font-mono);
    }

    .icon-btn {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--surface-color);
        border: 1px solid var(--border-color);
        color: var(--text-secondary);
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
        background: rgba(239, 68, 68, 0.1);
    }

    .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.8);
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
        max-width: 400px;
    }

    .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid var(--border-color);
    }

    .modal-header h3 {
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

    .modal-body {
        padding: 20px;
    }

    .modal-body p {
        color: var(--text-secondary);
        font-size: 0.875rem;
        line-height: 1.5;
    }

    .modal-body strong {
        color: var(--text-primary);
    }

    .modal-footer {
        display: flex;
        gap: 12px;
        padding: 16px 20px;
        border-top: 1px solid var(--border-color);
    }

    .action-btn.danger {
        background: transparent;
        border-color: var(--error);
        color: var(--error);
    }

    .action-btn.danger:hover {
        background: rgba(239, 68, 68, 0.1);
    }
</style>
