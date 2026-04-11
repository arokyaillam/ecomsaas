<script lang="ts">
    import '../app.css';
    import { page } from '$app/stores';

    let { children } = $props();
    let isSidebarOpen = $state(false);
    let storeName = $state('My Store');

    // Check if this is a super admin route
    let isSuperAdminRoute = $derived($page.url.pathname.startsWith('/super-admin'));

    // Close sidebar when route changes on mobile
    $effect(() => {
        const unsubscribe = page.subscribe(() => {
            isSidebarOpen = false;
        });
        return unsubscribe;
    });

    function toggleSidebar() {
        isSidebarOpen = !isSidebarOpen;
    }
</script>

{#if isSuperAdminRoute}
    <!-- Super Admin routes: just render children without merchant sidebar -->
    {@render children()}
{:else}
    <!-- Merchant Admin routes: show COMMAND sidebar -->
    <button class="mobile-menu-btn" onclick={toggleSidebar} aria-label="Toggle menu">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
    </button>

    <div class="dashboard-layout scanlines">
        <aside class="sidebar" class:open={isSidebarOpen}>
            <div class="sidebar-header">
                <div class="logo-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                </div>
                <h1>COMMAND</h1>
            </div>

            <nav class="sidebar-nav">
                <ul>
                    <li>
                        <a href="/dashboard" class:active={$page.url.pathname === '/dashboard'}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="3" width="7" height="7"></rect>
                                <rect x="14" y="3" width="7" height="7"></rect>
                                <rect x="14" y="14" width="7" height="7"></rect>
                                <rect x="3" y="14" width="7" height="7"></rect>
                            </svg>
                            Overview
                        </a>
                    </li>
                    <li>
                        <a href="/dashboard/products" class:active={$page.url.pathname.startsWith('/dashboard/products')}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="m7.5 4.27 9 5.15"></path>
                                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
                            </svg>
                            Products
                        </a>
                    </li>
                    <li>
                        <a href="/dashboard/categories" class:active={$page.url.pathname.startsWith('/dashboard/categories')}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                                <path d="M3 6h18"></path>
                                <path d="M16 10a4 4 0 0 1-8 0"></path>
                            </svg>
                            Categories
                        </a>
                    </li>
                    <li>
                        <a href="/dashboard/inventory" class:active={$page.url.pathname.startsWith('/dashboard/inventory')}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
                                <path d="m3.3 7 8.7 5 8.7-5"></path>
                                <path d="M12 22V12"></path>
                            </svg>
                            Inventory
                        </a>
                    </li>
                    <li>
                        <a href="/dashboard/orders" class:active={$page.url.pathname.startsWith('/dashboard/orders')}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="10" cy="20.5" r="1"></circle>
                                <circle cx="18" cy="20.5" r="1"></circle>
                                <path d="M2.5 2.5h3l2.7 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6l1.6-8.4H7.1"></path>
                            </svg>
                            Orders
                        </a>
                    </li>
                    <li>
                        <a href="/dashboard/customers" class:active={$page.url.pathname.startsWith('/dashboard/customers')}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                            Customers
                        </a>
                    </li>
                    <li>
                        <a href="/dashboard/reviews" class:active={$page.url.pathname.startsWith('/dashboard/reviews')}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                            </svg>
                            Reviews
                        </a>
                    </li>
                    <li>
                        <a href="/dashboard/coupons" class:active={$page.url.pathname.startsWith('/dashboard/coupons')}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M3 9h18"></path>
                                <path d="M8 21h8"></path>
                                <path d="M12 17V9"></path>
                                <path d="M7 14a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"></path>
                                <path d="M17 14a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"></path>
                            </svg>
                            Coupons
                        </a>
                    </li>
                    <li>
                        <a href="/dashboard/analytics" class:active={$page.url.pathname.startsWith('/dashboard/analytics')}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M3 3v18h18"></path>
                                <path d="m19 9-5 5-4-4-3 3"></path>
                            </svg>
                            Analytics
                        </a>
                    </li>
                    <li>
                        <a href="/dashboard/settings" class:active={$page.url.pathname.startsWith('/dashboard/settings')}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            Settings
                        </a>
                    </li>
                </ul>
            </nav>

            <div class="sidebar-footer">
                <!-- System Status -->
                <div class="system-status">
                    <span class="system-status-label">System</span>
                    <div class="system-status-value">
                        <span class="status-indicator online"></span>
                        Online
                    </div>
                </div>

                <div class="system-metrics">
                    <div>
                        <div class="metric-row">
                            <span class="metric-label">CPU</span>
                            <span class="metric-value">42%</span>
                        </div>
                        <div class="metric-bar">
                            <div class="metric-bar-fill" style="width: 42%"></div>
                        </div>
                    </div>
                    <div>
                        <div class="metric-row">
                            <span class="metric-label">MEM</span>
                            <span class="metric-value">68%</span>
                        </div>
                        <div class="metric-bar">
                            <div class="metric-bar-fill" style="width: 68%"></div>
                        </div>
                    </div>
                </div>

                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color);">
                    <div class="store-info">
                        <div class="store-avatar">{storeName.charAt(0).toUpperCase()}</div>
                        <div class="store-details">
                            <h4>{storeName}</h4>
                            <p>Administrator</p>
                        </div>
                    </div>
                    <button class="logout-btn" onclick={() => {
                        localStorage.removeItem('merchant_token');
                        localStorage.removeItem('merchant_store_id');
                        window.location.href = '/login';
                    }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        Logout
                    </button>
                </div>
            </div>
        </aside>

        <main class="main-content">
            <div class="fade-in page-container">
                {@render children()}
            </div>
        </main>
    </div>
{/if}
