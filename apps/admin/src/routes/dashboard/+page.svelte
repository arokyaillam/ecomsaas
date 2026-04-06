<script lang="ts">
    import { onMount } from 'svelte';
    import { API_BASE_URL } from '$lib/api';
    import { goto } from '$app/navigation';

    type Product = {
        id: string;
        titleEn: string;
        titleAr?: string;
        salePrice: number;
        barcode?: string;
        images?: string;
        isPublished: boolean;
        currentQuantity: number;
        [key: string]: any;
    };

    // Stats
    let stats = $state({
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalCustomers: 0
    });
    
    let recentProducts = $state([] as Product[]);
    let loading = $state(true);
    let storeId = $state('');

    onMount(async () => {
        const token = localStorage.getItem('merchant_token');
        if (!token) {
            goto('/login');
            return;
        }
        
        storeId = localStorage.getItem('merchant_store_id') || '';
        await fetchDashboardData(token);
    });

    async function fetchDashboardData(token: string) {
        try {
            // Fetch products
            const productsRes = await fetch(`${API_BASE_URL}/api/products`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (productsRes.ok) {
                const productsData = await productsRes.json();
                recentProducts = productsData.data?.slice(0, 5) || [];
                stats.totalProducts = productsData.data?.length || 0;
            }
            
            // Mock data for other stats (will be replaced with real API calls)
            stats.totalOrders = 128;
            stats.totalRevenue = 24580;
            stats.totalCustomers = 85;
            
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            loading = false;
        }
    }

    function formatCurrency(value: number) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(value);
    }

    function formatDate(dateString: string) {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }
</script>

<div class="fade-in">
    <!-- Header -->
    <div class="dashboard-header">
        <div>
            <h2>Dashboard</h2>
            <p style="color: var(--text-secondary); margin-top: 4px;">Welcome back! Here's what's happening with your store today.</p>
        </div>
        <div class="header-actions">
            <a href="/dashboard/products/new" class="action-btn primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add Product
            </a>
        </div>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon purple">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="m7.5 4.27 9 5.15"></path>
                        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
                    </svg>
                </div>
                <span class="stat-trend positive">+12%</span>
            </div>
            {#if loading}
                <div class="skeleton" style="width: 80px; height: 32px;"></div>
            {:else}
                <div class="stat-value">{stats.totalProducts}</div>
            {/if}
            <div class="stat-label">Total Products</div>
        </div>

        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon blue">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="10" cy="20.5" r="1"></circle>
                        <circle cx="18" cy="20.5" r="1"></circle>
                        <path d="M2.5 2.5h3l2.7 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6l1.6-8.4H7.1"></path>
                    </svg>
                </div>
                <span class="stat-trend positive">+8%</span>
            </div>
            {#if loading}
                <div class="skeleton" style="width: 80px; height: 32px;"></div>
            {:else}
                <div class="stat-value">{stats.totalOrders}</div>
            {/if}
            <div class="stat-label">Total Orders</div>
        </div>

        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon green">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="2" x2="12" y2="22"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                </div>
                <span class="stat-trend positive">+23%</span>
            </div>
            {#if loading}
                <div class="skeleton" style="width: 100px; height: 32px;"></div>
            {:else}
                <div class="stat-value">{formatCurrency(stats.totalRevenue)}</div>
            {/if}
            <div class="stat-label">Total Revenue</div>
        </div>

        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon orange">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                    </svg>
                </div>
                <span class="stat-trend positive">+5%</span>
            </div>
            {#if loading}
                <div class="skeleton" style="width: 80px; height: 32px;"></div>
            {:else}
                <div class="stat-value">{stats.totalCustomers}</div>
            {/if}
            <div class="stat-label">Total Customers</div>
        </div>
    </div>

    <!-- Content Grid -->
    <div class="content-grid">
        <!-- Recent Products -->
        <div class="glass-card dashboard">
            <div class="card-header">
                <h3>Recent Products</h3>
                <a href="/dashboard/products" class="action-btn secondary">View All</a>
            </div>
            
            {#if loading}
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    {#each Array(3) as _}
                        <div class="skeleton" style="width: 100%; height: 60px;"></div>
                    {/each}
                </div>
            {:else if recentProducts.length === 0}
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin-bottom: 16px; opacity: 0.5;">
                        <path d="m7.5 4.27 9 5.15"></path>
                        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
                    </svg>
                    <p>No products yet. Add your first product!</p>
                    <a href="/dashboard/products/new" class="action-btn primary" style="margin-top: 16px; display: inline-flex;">Add Product</a>
                </div>
            {:else}
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Price</th>
                            <th>Status</th>
                            <th>Stock</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each recentProducts as product}
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
                                <td>{formatCurrency(product.salePrice)}</td>
                                <td>
                                    <span class="status-badge {product.isPublished ? 'published' : 'draft'}">
                                        {product.isPublished ? 'Published' : 'Draft'}
                                    </span>
                                </td>
                                <td>{product.currentQuantity}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            {/if}
        </div>

        <!-- Quick Actions -->
        <div class="glass-card dashboard">
            <div class="card-header">
                <h3>Quick Actions</h3>
            </div>
            
            <div class="quick-actions">
                <a href="/dashboard/products/new" class="quick-action-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="m7.5 4.27 9 5.15"></path>
                        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
                    </svg>
                    <span>New Product</span>
                </a>
                
                <a href="/dashboard/categories/new" class="quick-action-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                        <path d="M3 6h18"></path>
                    </svg>
                    <span>New Category</span>
                </a>
                
                <a href="/dashboard/orders" class="quick-action-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    <span>View Orders</span>
                </a>
                
                <a href="/dashboard/settings" class="quick-action-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <span>Settings</span>
                </a>
            </div>
            
            <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--glass-border);">
                <h4 style="font-size: 0.9rem; margin-bottom: 12px;">Store ID</h4>
                <code style="background: var(--input-bg); padding: 8px 12px; border-radius: 8px; font-size: 0.8rem; color: var(--accent-color); display: block;">{storeId}</code>
            </div>
        </div>
    </div>
</div>
