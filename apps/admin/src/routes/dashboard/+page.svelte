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

    // Recent activity data - empty until backend provides real data
    let recentActivity = $state([] as Array<{ id: number; action: string; detail: string; time: string; type: string }>);

    onMount(async () => {
        const token = localStorage.getItem('merchant_token');
        if (!token) {
            goto('/login');
            return;
        }

        storeId = localStorage.getItem('merchant_store_id') || '';
        await fetchDashboardData(token);
    });

    let errorMessage = $state('');

    async function fetchDashboardData(token: string) {
        try {
            // Fetch products
            const productsRes = await fetch(`${API_BASE_URL}/api/products`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!productsRes.ok) {
                const errorData = await productsRes.json().catch(() => ({ error: 'Unknown error' }));
                console.error('API Error:', errorData);
                errorMessage = `API Error: ${errorData.error || productsRes.statusText}`;
                // Use mock data for demo
                recentProducts = [];
                stats.totalProducts = 0;
            } else {
                const productsData = await productsRes.json();
                recentProducts = productsData.data?.slice(0, 5) || [];
                stats.totalProducts = productsData.data?.length || 0;
            }

            // Orders/Revenue/Customers stats would be fetched from their respective endpoints
            stats.totalOrders = 0;
            stats.totalRevenue = 0;
            stats.totalCustomers = 0;

        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            errorMessage = 'Failed to connect to API. Make sure backend is running on port 8000.';
        } finally {
            loading = false;
        }
    }

    function formatCurrency(value: number) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
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
    {#if errorMessage}
    <div style="display: flex; align-items: center; gap: 10px; padding: 14px 18px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); margin-bottom: 24px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--error)" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span style="color: var(--error); font-size: 0.875rem;">{errorMessage}</span>
    </div>
    {/if}

    <!-- Header -->
    <div class="dashboard-header">
        <div>
            <h2>Overview</h2>
            <p>Real-time store metrics and activity</p>
        </div>
        <div class="header-actions">
            <button class="action-btn secondary">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Export
            </button>
            <a href="/dashboard/products/new" class="action-btn primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
                <div class="stat-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
                <div class="stat-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
                <div class="stat-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
                <div class="stat-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
        <!-- Chart Panel -->
        <div class="panel">
            <div class="panel-header">
                <h3>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 3v18h18"></path>
                        <path d="m19 9-5 5-4-4-3 3"></path>
                    </svg>
                    Revenue Trend
                </h3>
                <div style="display: flex; gap: 4px;">
                    {#each ['1H', '24H', '7D', '30D'] as range}
                        <button class="page-btn {range === '24H' ? 'active' : ''}">{range}</button>
                    {/each}
                </div>
            </div>
            <div class="panel-content">
                <div class="chart-container">
                    <div class="chart-grid grid-pattern"></div>
                    <svg viewBox="0 0 800 200" class="w-full h-full" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.25" />
                                <stop offset="100%" stop-color="#f59e0b" stop-opacity="0" />
                            </linearGradient>
                        </defs>
                        <!-- Area fill -->
                        <path
                            d="M0,160 Q50,150 100,140 T200,100 T300,80 T400,60 T500,50 T600,40 T700,45 T800,35 L800,200 L0,200 Z"
                            fill="url(#chartGradient)"
                        />
                        <!-- Main line -->
                        <path
                            d="M0,160 Q50,150 100,140 T200,100 T300,80 T400,60 T500,50 T600,40 T700,45 T800,35"
                            fill="none"
                            stroke="#f59e0b"
                            stroke-width="2"
                        />
                        <!-- Secondary line -->
                        <path
                            d="M0,180 Q100,170 200,165 T400,150 T600,140 T800,135"
                            fill="none"
                            stroke="#52525b"
                            stroke-width="1"
                            stroke-dasharray="4 4"
                        />
                    </svg>
                </div>
            </div>
        </div>

        <!-- Activity Feed -->
        <div class="panel">
            <div class="panel-header">
                <h3>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                    Activity Log
                </h3>
                <span style="font-size: 0.625rem; color: var(--text-muted); font-family: var(--font-mono); text-transform: uppercase;">Live</span>
            </div>

            <div class="panel-content">
                <div class="activity-list">
                    {#each recentActivity as activity}
                        <div class="activity-item">
                            <div class="activity-icon {activity.type}">
                                {#if activity.type === 'success'}
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                {:else if activity.type === 'warning'}
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path>
                                        <line x1="12" y1="9" x2="12" y2="13"></line>
                                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                    </svg>
                                {:else}
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="16" x2="12" y2="12"></line>
                                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                    </svg>
                                {/if}
                            </div>
                            <div class="activity-content">
                                <div class="activity-title">{activity.action}</div>
                                <div class="activity-meta">{activity.detail}</div>
                            </div>
                            <div class="activity-time">{activity.time}</div>
                        </div>
                    {/each}
                </div>
            </div>

            <div style="padding: 12px 20px; border-top: 1px solid var(--border-color); text-align: center;">
                <button style="font-size: 0.6875rem; color: var(--text-muted); font-family: var(--font-mono); background: none; border: none; cursor: pointer; text-transform: uppercase; letter-spacing: 0.05em;">
                    View All Logs →
                </button>
            </div>
        </div>
    </div>

    <!-- Recent Products Panel -->
    <div class="panel" style="margin-bottom: 28px;">
        <div class="panel-header">
            <h3>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="m7.5 4.27 9 5.15"></path>
                    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
                </svg>
                Recent Products
            </h3>
            <a href="/dashboard/products" class="action-btn secondary">View All</a>
        </div>

        {#if loading}
            <div class="panel-content">
                {#each Array(3) as _}
                    <div class="skeleton" style="width: 100%; height: 60px; margin-bottom: 12px;"></div>
                {/each}
            </div>
        {:else if recentProducts.length === 0}
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <path d="m7.5 4.27 9 5.15"></path>
                    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
                </svg>
                <p>No products yet. Add your first product!</p>
                <a href="/dashboard/products/new" class="action-btn primary" style="display: inline-flex;">Add Product</a>
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
                            <td style="font-family: var(--font-mono);">{formatCurrency(product.salePrice)}</td>
                            <td>
                                <span class="status-badge {product.isPublished ? 'published' : 'draft'}">
                                    {product.isPublished ? 'Published' : 'Draft'}
                                </span>
                            </td>
                            <td style="font-family: var(--font-mono); color: {product.currentQuantity < 5 ? 'var(--accent-color)' : 'var(--text-primary)'}">
                                {product.currentQuantity}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>

            <div class="pagination">
                <span class="pagination-info">Showing 1-{recentProducts.length} of {stats.totalProducts} entries</span>
                <div class="pagination-controls">
                    <button class="page-btn" disabled>‹</button>
                    <button class="page-btn active">1</button>
                    <button class="page-btn">2</button>
                    <button class="page-btn">›</button>
                </div>
            </div>
        {/if}
    </div>

    <!-- Quick Actions + Store Info -->
    <div class="content-grid">
        <!-- Quick Actions -->
        <div class="panel">
            <div class="panel-header">
                <h3>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <zap width="16" height="16"></zap>
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    Quick Actions
                </h3>
            </div>

            <div class="panel-content">
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
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                        </svg>
                        <span>Settings</span>
                    </a>
                </div>
            </div>
        </div>

        <!-- Store Info -->
        <div class="panel">
            <div class="panel-header">
                <h3>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Store Details
                </h3>
            </div>

            <div class="panel-content">
                <div style="margin-bottom: 20px;">
                    <label style="display: block; font-size: 0.625rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;">Store ID</label>
                    <code class="code-block">{storeId || 'Not configured'}</code>
                </div>

                <div>
                    <label style="display: block; font-size: 0.625rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;">API Endpoint</label>
                    <code class="code-block">{API_BASE_URL}/api</code>
                </div>
            </div>
        </div>
    </div>
</div>
