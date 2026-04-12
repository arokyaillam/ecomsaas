<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { API_BASE_URL } from '$lib/api';
    import {
        LayoutDashboard,
        Users,
        CreditCard,
        LogOut,
        Search,
        Filter,
        Plus,
        CheckCircle,
        XCircle,
        AlertCircle,
        MoreVertical,
        Store,
        TrendingUp,
        ShoppingBag,
        DollarSign,
        ChevronLeft,
        ChevronRight,
        Edit3,
        Trash2,
        RefreshCw
    } from 'lucide-svelte';

    type Merchant = {
        id: string;
        name: string;
        domain: string;
        status: 'pending' | 'active' | 'suspended' | 'deactivated';
        isApproved: boolean;
        ownerEmail: string;
        ownerName: string;
        totalOrders: number;
        totalRevenue: string;
        createdAt: string;
        plan?: { name: string; price: string };
    };

    type DashboardStats = {
        totalMerchants: number;
        totalRevenue: number;
        totalOrders: number;
        merchantsByStatus: Array<{ status: string; count: number }>;
        recentMerchants: Merchant[];
    };

    type Plan = {
        id: string;
        name: string;
        description: string;
        price: number;
        currency: string;
        interval: 'month' | 'year';
        features: string[];
        maxProducts: number;
        maxStorage: number;
        isActive: boolean;
    };

    let merchants = $state<Merchant[]>([]);
    let plans = $state<Plan[]>([]);
    let stats = $state<DashboardStats | null>(null);
    let loading = $state(true);
    let activeTab = $state<'overview' | 'merchants' | 'plans'>('overview');
    let sidebarOpen = $state(false);

    // Filters
    let statusFilter = $state('');
    let searchQuery = $state('');
    let currentPage = $state(1);
    let totalPages = $state(1);

    // Register Modal
    let showRegisterModal = $state(false);
    let registerLoading = $state(false);
    let registerData = $state({
        storeName: '',
        domain: '',
        email: '',
        password: '',
        planId: ''
    });

    // Edit Plan Modal
    let showEditPlanModal = $state(false);
    let editingPlan = $state<Plan | null>(null);


    onMount(() => {
        const token = localStorage.getItem('super_admin_token');
        if (!token) {
            goto('/super-admin');
            return;
        }
        loadDashboard();
        loadMerchants();
        loadPlans();
    });

    $effect(() => {
        if (activeTab === 'plans') {
            loadPlans();
        } else if (activeTab === 'merchants') {
            loadMerchants();
        }
    });

    async function loadDashboard() {
        const token = localStorage.getItem('super_admin_token');
        try {
            const res = await fetch(`${API_BASE_URL}/api/super-admin/dashboard`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to load dashboard');
            const data = await res.json();
            stats = data.data;
        } catch (err: any) {
            console.error(err);
        }
    }

    async function loadMerchants() {
        const token = localStorage.getItem('super_admin_token');
        loading = true;
        try {
            let url = `${API_BASE_URL}/api/super-admin/merchants?page=${currentPage}&limit=10`;
            if (statusFilter) url += `&status=${statusFilter}`;
            if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to load merchants');
            const data = await res.json();
            merchants = data.data;
            totalPages = data.pagination?.totalPages || 1;
        } catch (err: any) {
            console.error(err);
        } finally {
            loading = false;
        }
    }

    async function loadPlans() {
        const token = localStorage.getItem('super_admin_token');
        loading = true;
        try {
            const res = await fetch(`${API_BASE_URL}/api/super-admin/plans`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to load plans');
            const data = await res.json();
            plans = data.data;
        } catch (err: any) {
            console.error(err);
        } finally {
            loading = false;
        }
    }

    async function updateMerchantStatus(id: string, status: string) {
        const token = localStorage.getItem('super_admin_token');
        try {
            const res = await fetch(`${API_BASE_URL}/api/super-admin/merchants/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });
            if (!res.ok) throw new Error('Failed to update status');
            await loadMerchants();
            await loadDashboard();
        } catch (err: any) {
            alert(err.message);
        }
    }

    async function registerMerchant() {
        if (!registerData.storeName || !registerData.domain || !registerData.email || !registerData.password) {
            alert('Please fill in all fields');
            return;
        }

        registerLoading = true;
        const token = localStorage.getItem('super_admin_token');

        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    storeName: registerData.storeName,
                    domain: registerData.domain.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                    email: registerData.email,
                    password: registerData.password
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Registration failed');
            }

            const data = await res.json();

            if (registerData.planId) {
                await fetch(`${API_BASE_URL}/api/super-admin/merchants/${data.storeId}/plan`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ planId: registerData.planId })
                });
            }

            registerData = { storeName: '', domain: '', email: '', password: '', planId: '' };
            showRegisterModal = false;
            await loadMerchants();
            await loadDashboard();
            alert('Merchant registered successfully!');
        } catch (err: any) {
            alert(err.message);
        } finally {
            registerLoading = false;
        }
    }

    async function updatePlan() {
        if (!editingPlan) return;
        const token = localStorage.getItem('super_admin_token');

        try {
            const res = await fetch(`${API_BASE_URL}/api/super-admin/plans/${editingPlan.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editingPlan)
            });

            if (!res.ok) throw new Error('Failed to update plan');

            showEditPlanModal = false;
            editingPlan = null;
            await loadPlans();
            alert('Plan updated successfully!');
        } catch (err: any) {
            alert(err.message);
        }
    }

    function openEditPlan(plan: Plan) {
        editingPlan = { ...plan };
        showEditPlanModal = true;
    }

    // Delete functions
    async function deleteStore(merchant: Merchant) {
        const confirmed = confirm(
            `Delete Store: ${merchant.name}\n\n` +
            `Domain: ${merchant.domain}\n` +
            `Owner: ${merchant.ownerEmail}\n\n` +
            `The store will be deactivated. All data is preserved and can be recovered by reactivating.\n\n` +
            `Click OK to delete.`
        );

        if (!confirmed) return;

        const token = localStorage.getItem('super_admin_token');
        try {
            const res = await fetch(`${API_BASE_URL}/api/super-admin/stores/${merchant.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete store');
            }

            await loadMerchants();
            await loadDashboard();
            alert('Store deleted successfully!');
        } catch (err: any) {
            alert('Error: ' + err.message);
        }
    }

    function logout() {
        localStorage.removeItem('super_admin_token');
        localStorage.removeItem('super_admin_user');
        goto('/super-admin');
    }

    function formatCurrency(value: number) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(value);
    }

    function getStatusColor(status: string): string {
        switch (status) {
            case 'active': return '#22c55e';
            case 'pending': return '#f59e0b';
            case 'suspended': return '#ef4444';
            case 'deactivated': return '#6b7280';
            default: return '#6b7280';
        }
    }

    function getStatusBg(status: string): string {
        switch (status) {
            case 'active': return 'rgba(34, 197, 94, 0.1)';
            case 'pending': return 'rgba(245, 158, 11, 0.1)';
            case 'suspended': return 'rgba(239, 68, 68, 0.1)';
            case 'deactivated': return 'rgba(107, 114, 128, 0.1)';
            default: return 'rgba(107, 114, 128, 0.1)';
        }
    }
</script>

<div class="super-admin-app">
    <!-- Mobile Header -->
    <header class="mobile-header">
        <button class="menu-toggle" onclick={() => sidebarOpen = !sidebarOpen}>
            <LayoutDashboard size={24} />
        </button>
        <span class="mobile-title">Super Admin</span>
        <div style="width: 40px;"></div>
    </header>

    <!-- Sidebar -->
    <aside class="sidebar" class:open={sidebarOpen}>
        <div class="sidebar-brand">
            <div class="brand-icon">
                <Store size={28} />
            </div>
            <div class="brand-text">
                <h1>Super Admin</h1>
                <span>Platform Control</span>
            </div>
        </div>

        <nav class="sidebar-nav">
            <button class="nav-item" class:active={activeTab === 'overview'} onclick={() => { activeTab = 'overview'; sidebarOpen = false; }}>
                <LayoutDashboard size={20} />
                <span>Overview</span>
            </button>
            <button class="nav-item" class:active={activeTab === 'merchants'} onclick={() => { activeTab = 'merchants'; sidebarOpen = false; }}>
                <Users size={20} />
                <span>Merchants</span>
                {#if stats && stats.totalMerchants > 0}
                    <span class="nav-badge">{stats.totalMerchants}</span>
                {/if}
            </button>
            <button class="nav-item" class:active={activeTab === 'plans'} onclick={() => { activeTab = 'plans'; sidebarOpen = false; }}>
                <CreditCard size={20} />
                <span>Plans</span>
            </button>
        </nav>

        <div class="sidebar-footer">
            <button class="logout-btn" onclick={logout}>
                <LogOut size={18} />
                <span>Logout</span>
            </button>
        </div>
    </aside>

    <!-- Overlay for mobile -->
    {#if sidebarOpen}
        <div class="sidebar-overlay" onclick={() => sidebarOpen = false}></div>
    {/if}

    <!-- Main Content -->
    <main class="main-content">
        {#if activeTab === 'overview'}
            <div class="page-content">
                <header class="page-header">
                    <div>
                        <h2>Platform Overview</h2>
                        <p>Monitor platform performance and merchant activity</p>
                    </div>
                    <button class="btn btn-primary" onclick={() => showRegisterModal = true}>
                        <Plus size={18} />
                        Register Merchant
                    </button>
                </header>

                {#if stats}
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-header">
                                <div class="stat-icon" style="background: linear-gradient(135deg, #22c55e, #16a34a);">
                                    <Users size={24} color="white" />
                                </div>
                                <div class="stat-trend positive">
                                    <TrendingUp size={14} />
                                    Live
                                </div>
                            </div>
                            <div class="stat-value">{stats.totalMerchants}</div>
                            <div class="stat-label">Total Merchants</div>
                        </div>

                        <div class="stat-card">
                            <div class="stat-header">
                                <div class="stat-icon" style="background: linear-gradient(135deg, #f59e0b, #d97706);">
                                    <DollarSign size={24} color="white" />
                                </div>
                                <div class="stat-trend">
                                    <RefreshCw size={14} />
                                    Real-time
                                </div>
                            </div>
                            <div class="stat-value">{formatCurrency(stats.totalRevenue)}</div>
                            <div class="stat-label">Total Revenue</div>
                        </div>

                        <div class="stat-card">
                            <div class="stat-header">
                                <div class="stat-icon" style="background: linear-gradient(135deg, #3b82f6, #2563eb);">
                                    <ShoppingBag size={24} color="white" />
                                </div>
                                <div class="stat-trend">
                                    <RefreshCw size={14} />
                                    Real-time
                                </div>
                            </div>
                            <div class="stat-value">{stats.totalOrders}</div>
                            <div class="stat-label">Total Orders</div>
                        </div>
                    </div>

                    <div class="content-grid">
                        <div class="panel">
                            <div class="panel-header">
                                <h3>Merchants by Status</h3>
                            </div>
                            <div class="panel-body">
                                {#if stats.merchantsByStatus.length > 0}
                                    <div class="status-list">
                                        {#each stats.merchantsByStatus as item}
                                            <div class="status-item">
                                                <div class="status-info">
                                                    <span class="status-dot" style="background: {getStatusColor(item.status)}"></span>
                                                    <span class="status-name">{item.status}</span>
                                                </div>
                                                <span class="status-count">{item.count}</span>
                                            </div>
                                        {/each}
                                    </div>
                                {:else}
                                    <div class="empty-state">
                                        <AlertCircle size={32} />
                                        <p>No merchant data available</p>
                                    </div>
                                {/if}
                            </div>
                        </div>

                        <div class="panel">
                            <div class="panel-header">
                                <h3>Recent Merchants</h3>
                                <a href="#" class="link" onclick={() => activeTab = 'merchants'}>View All</a>
                            </div>
                            <div class="panel-body">
                                {#if stats.recentMerchants.length > 0}
                                    <div class="recent-list">
                                        {#each stats.recentMerchants.slice(0, 5) as merchant}
                                            <div class="recent-item">
                                                <div class="recent-avatar">
                                                    {merchant.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div class="recent-info">
                                                    <div class="recent-name">{merchant.name}</div>
                                                    <div class="recent-domain">{merchant.domain}</div>
                                                </div>
                                                <span class="status-pill" style="background: {getStatusBg(merchant.status)}; color: {getStatusColor(merchant.status)}">
                                                    {merchant.status}
                                                </span>
                                            </div>
                                        {/each}
                                    </div>
                                {:else}
                                    <div class="empty-state">
                                        <Store size={32} />
                                        <p>No recent merchants</p>
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </div>
                {:else}
                    <div class="loading-state">
                        <RefreshCw size={32} class="spinning" />
                        <p>Loading dashboard...</p>
                    </div>
                {/if}
            </div>

        {:else if activeTab === 'merchants'}
            <div class="page-content">
                <header class="page-header">
                    <div>
                        <h2>Merchant Management</h2>
                        <p>Manage all merchants on the platform</p>
                    </div>
                    <button class="btn btn-primary" onclick={() => showRegisterModal = true}>
                        <Plus size={18} />
                        Register Merchant
                    </button>
                </header>

                <div class="filters-bar">
                    <div class="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search merchants..."
                            bind:value={searchQuery}
                            onkeyup={(e) => e.key === 'Enter' && loadMerchants()}
                        />
                    </div>
                    <div class="filter-group">
                        <select bind:value={statusFilter} onchange={loadMerchants}>
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                            <option value="deactivated">Deactivated</option>
                        </select>
                        <button class="btn btn-secondary" onclick={loadMerchants}>
                            <Filter size={16} />
                            Filter
                        </button>
                    </div>
                </div>

                {#if loading}
                    <div class="loading-state">
                        <RefreshCw size={32} class="spinning" />
                        <p>Loading merchants...</p>
                    </div>
                {:else if merchants.length === 0}
                    <div class="empty-state-card">
                        <Users size={48} />
                        <h3>No merchants found</h3>
                        <p>Get started by registering your first merchant</p>
                        <button class="btn btn-primary" onclick={() => showRegisterModal = true}>
                            <Plus size={18} />
                            Register Merchant
                        </button>
                    </div>
                {:else}
                    <div class="data-table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Merchant</th>
                                    <th>Status</th>
                                    <th>Plan</th>
                                    <th>Orders</th>
                                    <th>Revenue</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each merchants as merchant}
                                    <tr>
                                        <td>
                                            <div class="merchant-cell">
                                                <div class="merchant-avatar">
                                                    {merchant.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div class="merchant-info">
                                                    <div class="merchant-name">{merchant.name}</div>
                                                    <div class="merchant-domain">{merchant.domain}</div>
                                                    <div class="merchant-email">{merchant.ownerEmail}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span class="status-pill" style="background: {getStatusBg(merchant.status)}; color: {getStatusColor(merchant.status)}">
                                                {merchant.status}
                                            </span>
                                        </td>
                                        <td>{merchant.plan?.name || 'No Plan'}</td>
                                        <td>{merchant.totalOrders || 0}</td>
                                        <td>{formatCurrency(Number(merchant.totalRevenue) || 0)}</td>
                                        <td>
                                            <div class="action-buttons">
                                                {#if merchant.status === 'pending'}
                                                    <button class="icon-btn success" title="Approve" onclick={() => updateMerchantStatus(merchant.id, 'active')}>
                                                        <CheckCircle size={18} />
                                                    </button>
                                                {/if}
                                                {#if merchant.status === 'active'}
                                                    <button class="icon-btn warning" title="Suspend" onclick={() => updateMerchantStatus(merchant.id, 'suspended')}>
                                                        <AlertCircle size={18} />
                                                    </button>
                                                {:else if merchant.status === 'suspended'}
                                                    <button class="icon-btn success" title="Activate" onclick={() => updateMerchantStatus(merchant.id, 'active')}>
                                                        <CheckCircle size={18} />
                                                    </button>
                                                {/if}
                                                {#if merchant.status !== 'deactivated'}
                                                    <button class="icon-btn warning" title="Deactivate" onclick={() => updateMerchantStatus(merchant.id, 'deactivated')}>
                                                        <XCircle size={18} />
                                                    </button>
                                                {/if}
                                                <button class="icon-btn danger" title="Delete Store" onclick={() => deleteStore(merchant)}>
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>

                    {#if totalPages > 1}
                        <div class="pagination">
                            <button class="page-btn" disabled={currentPage === 1} onclick={() => { currentPage--; loadMerchants(); }}>
                                <ChevronLeft size={16} />
                            </button>
                            <span class="page-info">Page {currentPage} of {totalPages}</span>
                            <button class="page-btn" disabled={currentPage === totalPages} onclick={() => { currentPage++; loadMerchants(); }}>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    {/if}
                {/if}
            </div>

        {:else}
            <div class="page-content">
                <header class="page-header">
                    <div>
                        <h2>Plan Management</h2>
                        <p>Manage merchant subscription plans</p>
                    </div>
                </header>

                {#if loading}
                    <div class="loading-state">
                        <RefreshCw size={32} class="spinning" />
                        <p>Loading plans...</p>
                    </div>
                {:else if plans.length === 0}
                    <div class="empty-state-card">
                        <CreditCard size={48} />
                        <h3>No plans found</h3>
                    </div>
                {:else}
                    <div class="plans-grid">
                        {#each plans as plan}
                            <div class="plan-card {plan.isActive ? 'active' : 'inactive'}">
                                {#if plan.price === 0}
                                    <div class="plan-badge free">FREE</div>
                                {:else if plan.name === 'Professional'}
                                    <div class="plan-badge popular">POPULAR</div>
                                {/if}

                                <div class="plan-header">
                                    <h3>{plan.name}</h3>
                                    <div class="plan-price">
                                        ${plan.price}
                                        <span>/{plan.interval}</span>
                                    </div>
                                    <p class="plan-description">{plan.description}</p>
                                </div>

                                <div class="plan-features">
                                    <div class="feature-item">
                                        <CheckCircle size={16} />
                                        <span>Up to {plan.maxProducts} products</span>
                                    </div>
                                    <div class="feature-item">
                                        <CheckCircle size={16} />
                                        <span>{plan.maxStorage}MB storage</span>
                                    </div>
                                    {#each plan.features as feature}
                                        <div class="feature-item">
                                            <CheckCircle size={16} />
                                            <span>{feature}</span>
                                        </div>
                                    {/each}
                                </div>

                                <button class="btn btn-secondary btn-full" onclick={() => openEditPlan(plan)}>
                                    <Edit3 size={16} />
                                    Edit Plan
                                </button>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        {/if}
    </main>
</div>

<!-- Register Merchant Modal -->
{#if showRegisterModal}
    <div class="modal-overlay" onclick={() => showRegisterModal = false}>
        <div class="modal" onclick={(e) => e.stopPropagation()}>
            <div class="modal-header">
                <h3>Register New Merchant</h3>
                <button class="close-btn" onclick={() => showRegisterModal = false}>
                    <XCircle size={24} />
                </button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Store Name</label>
                    <input type="text" bind:value={registerData.storeName} placeholder="My Store" />
                </div>
                <div class="form-group">
                    <label>Domain</label>
                    <div class="input-prefix">
                        <input type="text" bind:value={registerData.domain} placeholder="my-store" />
                        <span>.localhost</span>
                    </div>
                </div>
                <div class="form-group">
                    <label>Owner Email</label>
                    <input type="email" bind:value={registerData.email} placeholder="owner@example.com" />
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" bind:value={registerData.password} placeholder="••••••••" />
                </div>
                <div class="form-group">
                    <label>Plan</label>
                    <select bind:value={registerData.planId}>
                        <option value="">Select a plan</option>
                        {#each plans as plan}
                            <option value={plan.id}>{plan.name} (${plan.price}/{plan.interval})</option>
                        {/each}
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick={() => showRegisterModal = false}>Cancel</button>
                <button class="btn btn-primary" onclick={registerMerchant} disabled={registerLoading}>
                    {#if registerLoading}
                        <RefreshCw size={16} class="spinning" />
                        Registering...
                    {:else}
                        <Plus size={16} />
                        Register Merchant
                    {/if}
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- Edit Plan Modal -->
{#if showEditPlanModal && editingPlan}
    <div class="modal-overlay" onclick={() => showEditPlanModal = false}>
        <div class="modal" onclick={(e) => e.stopPropagation()}>
            <div class="modal-header">
                <h3>Edit Plan</h3>
                <button class="close-btn" onclick={() => showEditPlanModal = false}>
                    <XCircle size={24} />
                </button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Plan Name</label>
                    <input type="text" bind:value={editingPlan.name} />
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Price</label>
                        <input type="number" bind:value={editingPlan.price} />
                    </div>
                    <div class="form-group">
                        <label>Interval</label>
                        <select bind:value={editingPlan.interval}>
                            <option value="month">Month</option>
                            <option value="year">Year</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Max Products</label>
                        <input type="number" bind:value={editingPlan.maxProducts} />
                    </div>
                    <div class="form-group">
                        <label>Max Storage (MB)</label>
                        <input type="number" bind:value={editingPlan.maxStorage} />
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick={() => showEditPlanModal = false}>Cancel</button>
                <button class="btn btn-primary" onclick={updatePlan}>
                    <CheckCircle size={16} />
                    Save Changes
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .super-admin-app {
        display: flex;
        min-height: 100vh;
        background: #0f172a;
        color: #f8fafc;
    }

    /* Mobile Header */
    .mobile-header {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 60px;
        background: #1e293b;
        border-bottom: 1px solid #334155;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
        z-index: 100;
    }

    .menu-toggle {
        background: none;
        border: none;
        color: #f8fafc;
        cursor: pointer;
        padding: 8px;
    }

    .mobile-title {
        font-weight: 600;
        font-size: 1.1rem;
    }

    /* Sidebar */
    .sidebar {
        width: 280px;
        background: #1e293b;
        border-right: 1px solid #334155;
        display: flex;
        flex-direction: column;
        position: fixed;
        height: 100vh;
        z-index: 50;
        transition: transform 0.3s ease;
    }

    .sidebar-brand {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 24px;
        border-bottom: 1px solid #334155;
    }

    .brand-icon {
        width: 44px;
        height: 44px;
        background: linear-gradient(135deg, #22c55e, #16a34a);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .brand-text h1 {
        font-size: 1.1rem;
        font-weight: 700;
        margin: 0;
    }

    .brand-text span {
        font-size: 0.75rem;
        color: #94a3b8;
    }

    .sidebar-nav {
        flex: 1;
        padding: 16px 12px;
    }

    .nav-item {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        padding: 12px 16px;
        background: none;
        border: none;
        color: #94a3b8;
        font-size: 0.9375rem;
        cursor: pointer;
        border-radius: 8px;
        transition: all 0.2s;
        margin-bottom: 4px;
    }

    .nav-item:hover {
        color: #f8fafc;
        background: #334155;
    }

    .nav-item.active {
        color: #f8fafc;
        background: #0ea5e9;
    }

    .nav-badge {
        margin-left: auto;
        background: #ef4444;
        color: white;
        font-size: 0.75rem;
        padding: 2px 8px;
        border-radius: 12px;
    }

    .sidebar-footer {
        padding: 16px;
        border-top: 1px solid #334155;
    }

    .logout-btn {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 12px;
        background: transparent;
        border: 1px solid #334155;
        color: #94a3b8;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .logout-btn:hover {
        border-color: #ef4444;
        color: #ef4444;
    }

    /* Main Content */
    .main-content {
        flex: 1;
        margin-left: 280px;
        padding: 32px;
        min-height: 100vh;
    }

    .page-content {
        max-width: 1400px;
        margin: 0 auto;
    }

    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 32px;
    }

    .page-header h2 {
        font-size: 1.75rem;
        font-weight: 700;
        margin: 0 0 8px 0;
    }

    .page-header p {
        color: #94a3b8;
        margin: 0;
    }

    /* Buttons */
    .btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 20px;
        font-size: 0.875rem;
        font-weight: 500;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-primary {
        background: #0ea5e9;
        color: white;
    }

    .btn-primary:hover {
        background: #0284c7;
    }

    .btn-secondary {
        background: #334155;
        color: #f8fafc;
    }

    .btn-secondary:hover {
        background: #475569;
    }

    .btn-full {
        width: 100%;
        justify-content: center;
    }

    .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    /* Stats Grid */
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 24px;
        margin-bottom: 32px;
    }

    .stat-card {
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 16px;
        padding: 24px;
    }

    .stat-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;
    }

    .stat-icon {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .stat-trend {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 0.75rem;
        color: #22c55e;
        background: rgba(34, 197, 94, 0.1);
        padding: 4px 8px;
        border-radius: 6px;
    }

    .stat-value {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 4px;
    }

    .stat-label {
        color: #94a3b8;
        font-size: 0.875rem;
    }

    /* Content Grid */
    .content-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 24px;
    }

    .panel {
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 16px;
        overflow: hidden;
    }

    .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        border-bottom: 1px solid #334155;
    }

    .panel-header h3 {
        font-size: 1rem;
        font-weight: 600;
        margin: 0;
    }

    .panel-body {
        padding: 24px;
    }

    .link {
        color: #0ea5e9;
        text-decoration: none;
        font-size: 0.875rem;
    }

    .link:hover {
        text-decoration: underline;
    }

    /* Status List */
    .status-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .status-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .status-info {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .status-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
    }

    .status-name {
        text-transform: capitalize;
    }

    .status-count {
        font-weight: 600;
        font-family: monospace;
    }

    /* Recent List */
    .recent-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .recent-item {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .recent-avatar {
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #0ea5e9, #0284c7);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 1rem;
    }

    .recent-info {
        flex: 1;
    }

    .recent-name {
        font-weight: 500;
        margin-bottom: 2px;
    }

    .recent-domain {
        font-size: 0.75rem;
        color: #94a3b8;
    }

    .status-pill {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: capitalize;
    }

    /* Filters */
    .filters-bar {
        display: flex;
        gap: 16px;
        margin-bottom: 24px;
        flex-wrap: wrap;
    }

    .search-box {
        flex: 1;
        min-width: 250px;
        display: flex;
        align-items: center;
        gap: 12px;
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 10px;
        padding: 0 16px;
    }

    .search-box input {
        flex: 1;
        background: none;
        border: none;
        color: #f8fafc;
        padding: 12px 0;
        font-size: 0.9375rem;
    }

    .search-box input:focus {
        outline: none;
    }

    .filter-group {
        display: flex;
        gap: 8px;
    }

    .filter-group select {
        background: #1e293b;
        border: 1px solid #334155;
        color: #f8fafc;
        padding: 10px 16px;
        border-radius: 10px;
        font-size: 0.875rem;
    }

    /* Data Table */
    .data-table-container {
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 16px;
        overflow: hidden;
        overflow-x: auto;
    }

    .data-table {
        width: 100%;
        border-collapse: collapse;
    }

    .data-table th {
        text-align: left;
        padding: 16px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #94a3b8;
        border-bottom: 1px solid #334155;
        white-space: nowrap;
    }

    .data-table td {
        padding: 16px;
        border-bottom: 1px solid #334155;
        font-size: 0.9375rem;
        white-space: nowrap;
    }

    .data-table tr:last-child td {
        border-bottom: none;
    }

    .merchant-cell {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .merchant-avatar {
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
    }

    .merchant-info {
        flex: 1;
    }

    .merchant-name {
        font-weight: 500;
        margin-bottom: 2px;
    }

    .merchant-domain {
        font-size: 0.75rem;
        color: #94a3b8;
    }

    .merchant-email {
        font-size: 0.75rem;
        color: #64748b;
        font-family: monospace;
    }

    .action-buttons {
        display: flex;
        gap: 8px;
    }

    .icon-btn {
        width: 36px;
        height: 36px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
    }

    .icon-btn.success {
        background: rgba(34, 197, 94, 0.1);
        color: #22c55e;
    }

    .icon-btn.success:hover {
        background: rgba(34, 197, 94, 0.2);
    }

    .icon-btn.warning {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
    }

    .icon-btn.warning:hover {
        background: rgba(245, 158, 11, 0.2);
    }

    .icon-btn.danger {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
    }

    .icon-btn.danger:hover {
        background: rgba(239, 68, 68, 0.2);
    }

    /* Pagination */
    .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 16px;
        margin-top: 24px;
    }

    .page-btn {
        width: 40px;
        height: 40px;
        background: #1e293b;
        border: 1px solid #334155;
        color: #f8fafc;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .page-btn:hover:not(:disabled) {
        background: #334155;
    }

    .page-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .page-info {
        color: #94a3b8;
        font-size: 0.875rem;
    }

    /* Plans Grid */
    .plans-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 24px;
    }

    .plan-card {
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 16px;
        padding: 24px;
        position: relative;
    }

    .plan-card.active {
        border-color: #0ea5e9;
    }

    .plan-card.inactive {
        opacity: 0.7;
    }

    .plan-badge {
        position: absolute;
        top: 16px;
        right: 16px;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.625rem;
        font-weight: 700;
        letter-spacing: 0.05em;
    }

    .plan-badge.free {
        background: linear-gradient(135deg, #22c55e, #16a34a);
        color: white;
    }

    .plan-badge.popular {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white;
    }

    .plan-header {
        margin-bottom: 24px;
    }

    .plan-header h3 {
        font-size: 1.25rem;
        font-weight: 700;
        margin: 0 0 8px 0;
    }

    .plan-price {
        font-size: 2.5rem;
        font-weight: 700;
        margin-bottom: 8px;
    }

    .plan-price span {
        font-size: 1rem;
        font-weight: 400;
        color: #94a3b8;
    }

    .plan-description {
        color: #94a3b8;
        font-size: 0.875rem;
        margin: 0;
    }

    .plan-features {
        margin-bottom: 24px;
    }

    .feature-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 0;
        border-bottom: 1px solid #334155;
        color: #cbd5e1;
        font-size: 0.875rem;
    }

    .feature-item:last-child {
        border-bottom: none;
    }

    /* Modal */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 16px;
    }

    .modal {
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 16px;
        width: 100%;
        max-width: 480px;
        max-height: 90vh;
        overflow-y: auto;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        border-bottom: 1px solid #334155;
    }

    .modal-header h3 {
        font-size: 1.125rem;
        font-weight: 600;
        margin: 0;
    }

    .close-btn {
        background: none;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        padding: 4px;
    }

    .close-btn:hover {
        color: #f8fafc;
    }

    .modal-body {
        padding: 24px;
    }

    .form-group {
        margin-bottom: 20px;
    }

    .form-group label {
        display: block;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #94a3b8;
        margin-bottom: 8px;
    }

    .form-group input,
    .form-group select {
        width: 100%;
        padding: 12px 16px;
        background: #0f172a;
        border: 1px solid #334155;
        border-radius: 8px;
        color: #f8fafc;
        font-size: 0.9375rem;
    }

    .form-group input:focus,
    .form-group select:focus {
        outline: none;
        border-color: #0ea5e9;
    }

    .input-prefix {
        display: flex;
        align-items: center;
        background: #0f172a;
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 0 16px;
    }

    .input-prefix input {
        flex: 1;
        background: none;
        border: none;
        padding: 12px 0;
    }

    .input-prefix span {
        color: #64748b;
        font-size: 0.875rem;
    }

    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
    }

    .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 20px 24px;
        border-top: 1px solid #334155;
    }

    /* Empty State */
    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px;
        color: #64748b;
        text-align: center;
    }

    .empty-state-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 64px 32px;
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 16px;
        color: #64748b;
        text-align: center;
    }

    .empty-state-card h3 {
        margin: 16px 0 8px;
        color: #f8fafc;
    }

    .empty-state-card p {
        margin: 0 0 24px;
    }

    /* Loading */
    .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 64px;
        color: #64748b;
    }

    .loading-state p {
        margin-top: 16px;
    }

    .spinning {
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    /* Sidebar Overlay */
    .sidebar-overlay {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 40;
    }

    /* Responsive */
    @media (max-width: 1024px) {
        .sidebar {
            transform: translateX(-100%);
        }

        .sidebar.open {
            transform: translateX(0);
        }

        .main-content {
            margin-left: 0;
            padding-top: 80px;
        }

        .mobile-header {
            display: flex;
        }

        .sidebar-overlay {
            display: block;
        }

        .content-grid {
            grid-template-columns: 1fr;
        }

        .stats-grid {
            grid-template-columns: 1fr;
        }
    }

    @media (max-width: 768px) {
        .main-content {
            padding: 80px 16px 32px;
        }

        .page-header {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
        }

        .filters-bar {
            flex-direction: column;
        }

        .search-box {
            width: 100%;
        }

        .form-row {
            grid-template-columns: 1fr;
        }

        .data-table-container {
            font-size: 0.875rem;
        }

        .data-table th,
        .data-table td {
            padding: 12px;
        }
    }

    /* Delete Modal Styles */
    .modal-danger {
        border: 2px solid #ef4444;
    }

    .modal-header-icon {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 16px;
    }

    .modal-header-icon.warning {
        background: rgba(245, 158, 11, 0.2);
        border: 2px solid #f59e0b;
    }

    .modal-header-icon.danger {
        background: rgba(239, 68, 68, 0.2);
        border: 2px solid #ef4444;
    }

    .modal-header h3 {
        text-align: center;
        margin: 0;
    }

    .delete-confirmation {
        text-align: center;
    }

    .delete-warning {
        font-size: 1.1rem;
        margin-bottom: 20px;
        color: #f8fafc;
    }

    .delete-warning.danger-text {
        color: #fca5a5;
    }

    .delete-details {
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 20px;
        text-align: left;
    }

    .detail-item {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #334155;
    }

    .detail-item:last-child {
        border-bottom: none;
    }

    .detail-label {
        color: #94a3b8;
        font-size: 0.875rem;
    }

    .detail-value {
        color: #f8fafc;
        font-weight: 500;
    }

    .detail-value.mono {
        font-family: monospace;
        font-size: 0.75rem;
    }

    .delete-info {
        display: flex;
        align-items: center;
        gap: 12px;
        background: rgba(245, 158, 11, 0.1);
        border: 1px solid rgba(245, 158, 11, 0.3);
        border-radius: 8px;
        padding: 12px 16px;
        color: #fbbf24;
        font-size: 0.875rem;
    }

    .delete-alert {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 8px;
        padding: 16px;
        color: #fca5a5;
    }

    .delete-alert strong {
        color: #ef4444;
        display: block;
        margin-bottom: 4px;
    }

    .delete-alert span {
        font-size: 0.875rem;
    }

    .modal-footer-danger {
        border-top: 1px solid #334155;
    }

    .btn-warning {
        background: #f59e0b;
        color: #0f172a;
    }

    .btn-warning:hover {
        background: #d97706;
    }

    .btn-danger {
        background: #dc2626;
        color: white;
    }

    .btn-danger:hover {
        background: #b91c1c;
    }
</style>
