<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { API_BASE_URL } from '$lib/api';

    interface Product {
        id: string;
        titleEn: string;
        titleAr?: string;
        images?: string;
        currentQuantity: number;
        salePrice: string;
        barcode?: string;
        isPublished: boolean;
        categoryId: string;
        categoryName?: string;
    }

    let products = $state<Product[]>([]);
    let loading = $state(true);
    let error = $state('');
    let searchQuery = $state('');
    let stockFilter = $state('all'); // all, low, out
    let updating = $state<string | null>(null);

    const stockFilters = [
        { value: 'all', label: 'All Products' },
        { value: 'low', label: 'Low Stock (< 5)' },
        { value: 'out', label: 'Out of Stock' },
    ];

    onMount(() => {
        fetchProducts();
    });

    async function fetchProducts() {
        loading = true;
        error = '';

        try {
            const token = localStorage.getItem('merchant_token');
            if (!token) {
                goto('/login');
                return;
            }

            const res = await fetch(`${API_BASE_URL}/api/products`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(data.error || `Failed to fetch products: ${res.status}`);
            }

            const data = await res.json();
            products = data.data || [];
        } catch (err: any) {
            error = err.message || 'Failed to fetch products';
            console.error('Products fetch error:', err);
        } finally {
            loading = false;
        }
    }

    async function updateStock(productId: string, newQuantity: number) {
        updating = productId;

        try {
            const token = localStorage.getItem('merchant_token');

            const res = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ currentQuantity: newQuantity }),
            });

            if (!res.ok) {
                throw new Error('Failed to update stock');
            }

            // Update local state
            products = products.map(p =>
                p.id === productId ? { ...p, currentQuantity: newQuantity } : p
            );
        } catch (err: any) {
            alert(err.message || 'Failed to update stock');
        } finally {
            updating = null;
        }
    }

    function adjustStock(productId: string, currentQty: number, delta: number) {
        const newQty = Math.max(0, currentQty + delta);
        updateStock(productId, newQty);
    }

    function setStock(productId: string, event: Event) {
        const target = event.target as HTMLInputElement;
        const newQty = parseInt(target.value) || 0;
        updateStock(productId, newQty);
    }

    function viewProduct(productId: string) {
        goto(`/dashboard/products/${productId}/edit`);
    }

    let filteredProducts = $derived(products.filter(p => {
        // Search filter
        const matchesSearch = !searchQuery ||
            p.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.barcode?.toLowerCase().includes(searchQuery.toLowerCase());

        // Stock filter
        let matchesStock = true;
        if (stockFilter === 'low') {
            matchesStock = p.currentQuantity > 0 && p.currentQuantity < 5;
        } else if (stockFilter === 'out') {
            matchesStock = p.currentQuantity === 0;
        }

        return matchesSearch && matchesStock;
    }));

    let stats = $derived({
        total: products.length,
        lowStock: products.filter(p => p.currentQuantity > 0 && p.currentQuantity < 5).length,
        outOfStock: products.filter(p => p.currentQuantity === 0).length,
        totalValue: products.reduce((sum, p) => sum + (p.currentQuantity * parseFloat(p.salePrice || '0')), 0),
    });
</script>

<div class="fade-in">
    <div class="dashboard-header">
        <div>
            <h2>Inventory</h2>
            <p style="color: var(--text-secondary); margin-top: 4px;">Manage product stock levels</p>
        </div>

        <div class="header-actions">
            <button class="action-btn secondary" onclick={() => goto('/dashboard')} style="margin-right: 8px;">Back</button>
        </div>
    </div>

    <!-- Stats -->
    <div class="stats-grid" style="margin-bottom: 24px;">
        <div class="stat-card">
            <div class="stat-value">{stats.total}</div>
            <div class="stat-label">Total Products</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" style="color: var(--accent-primary);">{stats.lowStock}</div>
            <div class="stat-label">Low Stock</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" style="color: var(--error);">{stats.outOfStock}</div>
            <div class="stat-label">Out of Stock</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.totalValue.toFixed(0)}</div>
            <div class="stat-label">Inventory Value</div>
        </div>
    </div>

    <!-- Filters -->
    <div class="filters-bar" style="margin-bottom: 24px; display: flex; gap: 16px; flex-wrap: wrap;">
        <div class="filter-group" style="flex: 1; min-width: 200px;">
            <label>Search</label>
            <div style="display: flex; gap: 8px;">
                <input
                    type="text"
                    placeholder="Search by name or barcode..."
                    bind:value={searchQuery}
                />
            </div>
        </div>

        <div class="filter-group">
            <label>Stock Filter</label>
            <select bind:value={stockFilter}>
                {#each stockFilters as filter}
                    <option value={filter.value}>{filter.label}</option>
                {/each}
            </select>
        </div>

        <div class="filter-group" style="align-self: flex-end;">
            <button class="action-btn secondary" onclick={fetchProducts}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                    <path d="M3 3v5h5"></path>
                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
                    <path d="M16 16h5v5"></path>
                </svg>
                Refresh
            </button>
        </div>
    </div>

    <!-- Inventory Table -->
    <div class="glass-card">
        {#if error}
            <div class="error-message" style="padding: 20px; color: var(--error);">
                {error}
            </div>
        {/if}

        {#if loading}
            <div style="padding: 40px; text-align: center;">
                <div class="skeleton" style="width: 100%; height: 400px;"></div>
            </div>
        {:else if filteredProducts.length === 0}
            <div class="empty-state" style="padding: 60px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin-bottom: 16px; opacity: 0.5;">
                    <path d="m7.5 4.27 9 5.15"></path>
                    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
                </svg>
                <p style="font-size: 1.1rem; color: var(--text-secondary);">No products found</p>
                {#if searchQuery || stockFilter !== 'all'}
                    <button class="action-btn secondary" onclick={() => { searchQuery = ''; stockFilter = 'all'; }} style="margin-top: 16px;">
                        Clear Filters
                    </button>
                {/if}
            </div>
        {:else}
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>SKU/Barcode</th>
                        <th>Price</th>
                        <th>Stock Level</th>
                        <th>Status</th>
                        <th>Quick Adjust</th>
                    </tr>
                </thead>
                <tbody>
                    {#each filteredProducts as product}
                        {@const isLowStock = product.currentQuantity > 0 && product.currentQuantity < 5}
                        {@const isOutOfStock = product.currentQuantity === 0}
                        <tr class:warning={isLowStock} class:error={isOutOfStock}>
                            <td>
                                <div class="product-cell">
                                    <div class="product-image">
                                        {#if product.images}
                                            <img src={product.images.split(',')[0]} alt={product.titleEn} />
                                        {:else}
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                                <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                                                <circle cx="9" cy="9" r="2"></circle>
                                                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                                            </svg>
                                        {/if}
                                    </div>
                                    <div class="product-name">
                                        <h4>{product.titleEn}</h4>
                                        {#if product.titleAr}
                                            <span>{product.titleAr}</span>
                                        {/if}
                                    </div>
                                </div>
                            </td>
                            <td>
                                <span class="mono-text">{product.barcode || '—'}</span>
                            </td>
                            <td>
                                <span class="mono-text">${parseFloat(product.salePrice).toFixed(2)}</span>
                            </td>
                            <td>
                                <div class="stock-input-group">
                                    <button
                                        class="stock-btn"
                                        onclick={() => adjustStock(product.id, product.currentQuantity, -1)}
                                        disabled={updating === product.id || product.currentQuantity === 0}
                                    >
                                        −
                                    </button>
                                    <input
                                        type="number"
                                        class="stock-input"
                                        value={product.currentQuantity}
                                        min="0"
                                        onchange={(e) => setStock(product.id, e)}
                                        disabled={updating === product.id}
                                    />
                                    <button
                                        class="stock-btn"
                                        onclick={() => adjustStock(product.id, product.currentQuantity, 1)}
                                        disabled={updating === product.id}
                                    >
                                        +
                                    </button>
                                </div>
                            </td>
                            <td>
                                {#if isOutOfStock}
                                    <span class="status-badge error">Out of Stock</span>
                                {:else if isLowStock}
                                    <span class="status-badge warning">Low Stock</span>
                                {:else}
                                    <span class="status-badge success">In Stock</span>
                                {/if}
                            </td>
                            <td>
                                <div class="quick-actions">
                                    <button
                                        class="action-btn-icon"
                                        onclick={() => viewProduct(product.id)}
                                        title="Edit Product"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                        </svg>
                                    </button>
                                    <button
                                        class="action-btn-icon"
                                        onclick={() => adjustStock(product.id, product.currentQuantity, 10)}
                                        disabled={updating === product.id}
                                        title="Add 10 units"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M12 5v14"></path>
                                            <path d="M5 12h14"></path>
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        {/if}
    </div>
</div>

<style>
    .filters-bar {
        background: var(--surface-color);
        border: 1px solid var(--border-color);
        padding: 16px 20px;
    }

    .filter-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .filter-group label {
        font-size: 0.6875rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
    }

    .filter-group input,
    .filter-group select {
        padding: 10px 14px;
        background: var(--bg-color);
        border: 1px solid var(--border-color);
        color: var(--text-primary);
        font-size: 0.875rem;
        min-width: 150px;
    }

    .filter-group input {
        min-width: 250px;
    }

    .filter-group input:focus,
    .filter-group select:focus {
        outline: none;
        border-color: var(--accent-primary);
    }

    .mono-text {
        font-family: var(--font-mono);
    }

    .product-cell {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .product-image {
        width: 48px;
        height: 48px;
        border: 1px solid var(--border-color);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        background: var(--surface-elevated);
    }

    .product-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .product-name h4 {
        font-weight: 500;
        margin: 0;
    }

    .product-name span {
        font-size: 0.75rem;
        color: var(--text-muted);
    }

    .stock-input-group {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .stock-btn {
        width: 32px;
        height: 32px;
        background: var(--surface-elevated);
        border: 1px solid var(--border-color);
        color: var(--text-primary);
        font-size: 1.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .stock-btn:hover:not(:disabled) {
        border-color: var(--accent-primary);
        color: var(--accent-primary);
    }

    .stock-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .stock-input {
        width: 60px;
        height: 32px;
        text-align: center;
        background: var(--bg-color);
        border: 1px solid var(--border-color);
        color: var(--text-primary);
        font-family: var(--font-mono);
        font-size: 0.875rem;
    }

    .stock-input:focus {
        outline: none;
        border-color: var(--accent-primary);
    }

    .quick-actions {
        display: flex;
        gap: 8px;
    }

    .action-btn-icon {
        padding: 8px;
        background: transparent;
        border: 1px solid var(--border-color);
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .action-btn-icon:hover {
        border-color: var(--accent-primary);
        color: var(--accent-primary);
    }

    .action-btn-icon:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    tr.warning {
        background: rgba(245, 158, 11, 0.05);
    }

    tr.error {
        background: rgba(239, 68, 68, 0.05);
    }

    .status-badge.success {
        background: rgba(34, 197, 94, 0.1);
        color: #22c55e;
    }

    .status-badge.warning {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
    }

    .status-badge.error {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
    }

    /* Remove number input arrows */
    .stock-input::-webkit-outer-spin-button,
    .stock-input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    .stock-input[type=number] {
        -moz-appearance: textfield;
    }
</style>
