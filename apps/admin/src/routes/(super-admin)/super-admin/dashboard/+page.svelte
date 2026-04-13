<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { API_BASE_URL, STOREFRONT_BASE_URL } from '$lib/api';
    import { fade, slide, fly } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';

    // Icons
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
        RefreshCw,
        Shield,
        Activity,
        Clock,
        FileText,
        AlertTriangle,
        X,
        Eye,
        Ban,
        CheckCheck,
        Lock,
        Package,
        Crown,
        Zap,
        Settings,
        Link as LinkIcon,
        Copy
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
        totalCustomers: number;
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

    type ActivityLog = {
        id: string;
        entityType: string;
        action: string;
        metadata: any;
        createdAt: string;
    };

    type Plan = {
        id: string;
        name: string;
        description: string;
        price: string;
        currency: string;
        interval: 'month' | 'year';
        features: string[];
        maxProducts: number;
        maxStorage: number;
        isActive: boolean;
        createdAt: string;
    };

    // State
    let merchants = $state<Merchant[]>([]);
    let plans = $state<Plan[]>([]);
    let stats = $state<DashboardStats | null>(null);
    let loading = $state(true);
    let plansLoading = $state(false);
    let activeTab = $state<'overview' | 'merchants' | 'activity' | 'plans'>('overview');
    let sidebarCollapsed = $state(false);

    // Filters
    let statusFilter = $state('');
    let searchQuery = $state('');
    let currentPage = $state(1);
    let totalPages = $state(1);

    // Selected merchant for detail view
    let selectedMerchant = $state<Merchant | null>(null);
    let merchantLogs = $state<ActivityLog[]>([]);
    let loadingLogs = $state(false);

    // Modals
    let showApproveModal = $state(false);
    let showSuspendModal = $state(false);
    let showDeleteModal = $state(false);
    let showDeleteConfirmModal = $state(false);
    let showPlanModal = $state(false);
    let showDeletePlanModal = $state(false);
    let showCreateMerchantModal = $state(false);
    let actionLoading = $state(false);
    let actionReason = $state('');
    let deleteToken = $state('');
    let deleteStep = $state(1); // 1 = request, 2 = confirm

    // Create merchant form
    let merchantForm = $state({
        storeName: '',
        domain: '',
        ownerEmail: '',
        ownerName: '',
        password: '',
        confirmPassword: '',
        planId: ''
    });

    // Plan form
    let editingPlan = $state<Plan | null>(null);
    let planForm = $state({
        name: '',
        description: '',
        price: '',
        currency: 'USD',
        interval: 'month' as 'month' | 'year',
        features: '',
        maxProducts: 100,
        maxStorage: 1024,
        isActive: true
    });

    // Toast notifications
    let toasts = $state<Array<{id: number, message: string, type: 'success' | 'error'}>>([]);

    onMount(() => {
        const token = localStorage.getItem('super_admin_token');
        if (!token) {
            goto('/super-admin');
            return;
        }
        loadDashboard();
        loadMerchants();
    });

    function showToast(message: string, type: 'success' | 'error' = 'success') {
        const id = Date.now();
        toasts = [...toasts, { id, message, type }];
        setTimeout(() => {
            toasts = toasts.filter(t => t.id !== id);
        }, 4000);
    }

    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('URL copied to clipboard!', 'success');
        }).catch(() => {
            showToast('Failed to copy URL', 'error');
        });
    }

    async function loadDashboard() {
        const token = localStorage.getItem('super_admin_token');
        try {
            const res = await fetch(`${API_BASE_URL}/api/super-admin/dashboard`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                stats = data.data;
            }
        } catch (err) {
            console.error('Failed to load dashboard:', err);
        }
    }

    async function loadMerchants() {
        loading = true;
        const token = localStorage.getItem('super_admin_token');
        try {
            const params = new URLSearchParams();
            params.set('page', currentPage.toString());
            params.set('limit', '10');
            if (statusFilter) params.set('status', statusFilter);
            if (searchQuery) params.set('search', searchQuery);

            const res = await fetch(`${API_BASE_URL}/api/super-admin/merchants?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                merchants = data.data;
                totalPages = data.pagination.totalPages;
            }
        } catch (err) {
            console.error('Failed to load merchants:', err);
        } finally {
            loading = false;
        }
    }

    async function loadMerchantDetail(merchant: Merchant) {
        selectedMerchant = merchant;
        loadingLogs = true;
        const token = localStorage.getItem('super_admin_token');

        try {
            // Get detailed merchant info
            const res = await fetch(`${API_BASE_URL}/api/super-admin/merchants/${merchant.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                selectedMerchant = data.data;
            }

            // Get activity logs
            const logsRes = await fetch(`${API_BASE_URL}/api/super-admin/merchants/${merchant.id}/activity?limit=20`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (logsRes.ok) {
                const logsData = await logsRes.json();
                merchantLogs = logsData.data;
            }
        } catch (err) {
            console.error('Failed to load merchant detail:', err);
        } finally {
            loadingLogs = false;
        }
    }

    async function approveMerchant(merchant: Merchant) {
        actionLoading = true;
        const token = localStorage.getItem('super_admin_token');
        try {
            const res = await fetch(`${API_BASE_URL}/api/super-admin/merchants/${merchant.id}/approve`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Failed to approve');

            showToast(`Merchant "${merchant.name}" approved successfully`);
            showApproveModal = false;
            await loadMerchants();
            await loadDashboard();
            if (selectedMerchant) await loadMerchantDetail(selectedMerchant);
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            actionLoading = false;
        }
    }

    async function suspendMerchant(merchant: Merchant, reason: string) {
        actionLoading = true;
        const token = localStorage.getItem('super_admin_token');
        try {
            const res = await fetch(`${API_BASE_URL}/api/super-admin/merchants/${merchant.id}/suspend`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ reason })
            });

            if (!res.ok) throw new Error('Failed to suspend');

            showToast(`Merchant "${merchant.name}" suspended`);
            showSuspendModal = false;
            actionReason = '';
            await loadMerchants();
            await loadDashboard();
            if (selectedMerchant) await loadMerchantDetail(selectedMerchant);
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            actionLoading = false;
        }
    }

    async function requestDelete(merchant: Merchant) {
        actionLoading = true;
        const token = localStorage.getItem('super_admin_token');
        try {
            const res = await fetch(`${API_BASE_URL}/api/super-admin/merchants/${merchant.id}/delete-request`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Failed to request delete');

            const data = await res.json();
            deleteToken = data.data.confirmationToken;
            deleteStep = 2;
            showToast('Delete confirmation required. Check details.');
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            actionLoading = false;
        }
    }

    async function confirmDelete(merchant: Merchant, token: string, reason: string) {
        actionLoading = true;
        const authToken = localStorage.getItem('super_admin_token');
        try {
            const res = await fetch(`${API_BASE_URL}/api/super-admin/merchants/${merchant.id}/delete-confirm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ confirmationToken: token, reason })
            });

            if (!res.ok) throw new Error('Failed to delete');

            showToast(`Merchant "${merchant.name}" deleted permanently`);
            showDeleteConfirmModal = false;
            showDeleteModal = false;
            deleteStep = 1;
            deleteToken = '';
            actionReason = '';
            selectedMerchant = null;
            await loadMerchants();
            await loadDashboard();
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            actionLoading = false;
        }
    }

    // Create Merchant
    async function createMerchant() {
        // Validate form
        if (!merchantForm.storeName || !merchantForm.domain || !merchantForm.ownerEmail || !merchantForm.ownerName || !merchantForm.password) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        if (merchantForm.password !== merchantForm.confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        if (merchantForm.password.length < 8) {
            showToast('Password must be at least 8 characters', 'error');
            return;
        }

        actionLoading = true;
        const token = localStorage.getItem('super_admin_token');

        try {
            const payload: any = {
                storeName: merchantForm.storeName,
                domain: merchantForm.domain.toLowerCase(),
                ownerEmail: merchantForm.ownerEmail.toLowerCase(),
                ownerName: merchantForm.ownerName,
                password: merchantForm.password
            };
            // Only include planId if a plan is selected
            if (merchantForm.planId) {
                payload.planId = merchantForm.planId;
            }

            const res = await fetch(`${API_BASE_URL}/api/super-admin/merchants`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create merchant');
            }

            showToast(`Merchant "${merchantForm.storeName}" created successfully`);
            showCreateMerchantModal = false;
            merchantForm = {
                storeName: '',
                domain: '',
                ownerEmail: '',
                ownerName: '',
                password: '',
                confirmPassword: '',
                planId: ''
            };
            await loadMerchants();
            await loadDashboard();
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            actionLoading = false;
        }
    }

    function resetMerchantForm() {
        merchantForm = {
            storeName: '',
            domain: '',
            ownerEmail: '',
            ownerName: '',
            password: '',
            confirmPassword: '',
            planId: ''
        };
        showCreateMerchantModal = false;
    }

    function logout() {
        localStorage.removeItem('super_admin_token');
        localStorage.removeItem('super_admin_user');
        goto('/super-admin');
    }

    // Plan Management Functions
    async function loadPlans() {
        plansLoading = true;
        const token = localStorage.getItem('super_admin_token');
        try {
            const res = await fetch(`${API_BASE_URL}/api/super-admin/plans`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                plans = data.data;
            }
        } catch (err) {
            console.error('Failed to load plans:', err);
        } finally {
            plansLoading = false;
        }
    }

    function openPlanModal(plan: Plan | null = null) {
        editingPlan = plan;
        if (plan) {
            planForm = {
                name: plan.name,
                description: plan.description,
                price: plan.price,
                currency: plan.currency,
                interval: plan.interval,
                features: plan.features.join('\n'),
                maxProducts: plan.maxProducts,
                maxStorage: plan.maxStorage,
                isActive: plan.isActive
            };
        } else {
            planForm = {
                name: '',
                description: '',
                price: '',
                currency: 'USD',
                interval: 'month',
                features: '',
                maxProducts: 100,
                maxStorage: 1024,
                isActive: true
            };
        }
        showPlanModal = true;
    }

    async function savePlan() {
        actionLoading = true;
        const token = localStorage.getItem('super_admin_token');

        const body = {
            ...planForm,
            price: parseFloat(planForm.price) || 0,
            features: planForm.features.split('\n').filter(f => f.trim())
        };

        try {
            const url = editingPlan
                ? `${API_BASE_URL}/api/super-admin/plans/${editingPlan.id}`
                : `${API_BASE_URL}/api/super-admin/plans`;
            const method = editingPlan ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (!res.ok) throw new Error('Failed to save plan');

            showToast(editingPlan ? 'Plan updated successfully' : 'Plan created successfully');
            showPlanModal = false;
            editingPlan = null;
            await loadPlans();
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            actionLoading = false;
        }
    }

    function confirmDeletePlan(plan: Plan) {
        editingPlan = plan;
        showDeletePlanModal = true;
    }

    async function deletePlan() {
        if (!editingPlan) return;
        actionLoading = true;
        const token = localStorage.getItem('super_admin_token');

        try {
            const res = await fetch(`${API_BASE_URL}/api/super-admin/plans/${editingPlan.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete plan');
            }

            showToast('Plan deleted successfully');
            showDeletePlanModal = false;
            editingPlan = null;
            await loadPlans();
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            actionLoading = false;
        }
    }

    function formatCurrency(value: number | string) {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(num || 0);
    }

    function formatDate(dateString: string) {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function getStatusIcon(status: string) {
        switch (status) {
            case 'active': return CheckCircle;
            case 'pending': return Clock;
            case 'suspended': return Ban;
            case 'deactivated': return XCircle;
            default: return AlertCircle;
        }
    }

    function getActionIcon(action: string) {
        switch (action) {
            case 'approved': return CheckCheck;
            case 'suspended': return Ban;
            case 'deleted': return Trash2;
            case 'delete_requested': return AlertTriangle;
            case 'status_changed': return Activity;
            default: return FileText;
        }
    }
</script>

<!-- Fonts -->
<svelte:head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
    <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<!-- Toast Notifications -->
<div class="toast-container">
    {#each toasts as toast}
        <div class="toast {toast.type}" transition:fly={{ y: -50, duration: 300 }}>
            <span class="toast-message">{toast.message}</span>
        </div>
    {/each}
</div>

<div class="admin-app">
    <!-- Sidebar -->
    <aside class="sidebar" class:collapsed={sidebarCollapsed}>
        <div class="sidebar-header">
            <div class="brand">
                <div class="brand-mark">
                    <Shield size={28} strokeWidth={1.5} />
                </div>
                {#if !sidebarCollapsed}
                    <div class="brand-text" transition:slide={{ duration: 200 }}>
                        <span class="brand-title">Command</span>
                        <span class="brand-subtitle">Super Admin</span>
                    </div>
                {/if}
            </div>
            <button class="collapse-btn" onclick={() => sidebarCollapsed = !sidebarCollapsed}>
                {#if sidebarCollapsed}
                    <ChevronRight size={18} />
                {:else}
                    <ChevronLeft size={18} />
                {/if}
            </button>
        </div>

        <nav class="sidebar-nav">
            <button
                class="nav-item"
                class:active={activeTab === 'overview'}
                onclick={() => activeTab = 'overview'}
            >
                <LayoutDashboard size={20} />
                {#if !sidebarCollapsed}
                    <span transition:fade={{ duration: 150 }}>Overview</span>
                {/if}
            </button>

            <button
                class="nav-item"
                class:active={activeTab === 'merchants'}
                onclick={() => { activeTab = 'merchants'; selectedMerchant = null; }}
            >
                <Store size={20} />
                {#if !sidebarCollapsed}
                    <span transition:fade={{ duration: 150 }}>Merchants</span>
                    {#if stats}
                        <span class="nav-badge">{stats.totalMerchants}</span>
                    {/if}
                {/if}
            </button>

            <button
                class="nav-item"
                class:active={activeTab === 'activity'}
                onclick={() => activeTab = 'activity'}
            >
                <Activity size={20} />
                {#if !sidebarCollapsed}
                    <span transition:fade={{ duration: 150 }}>Activity</span>
                {/if}
            </button>

            <button
                class="nav-item"
                class:active={activeTab === 'plans'}
                onclick={() => { activeTab = 'plans'; loadPlans(); }}
            >
                <Crown size={20} />
                {#if !sidebarCollapsed}
                    <span transition:fade={{ duration: 150 }}>Plans</span>
                {/if}
            </button>
        </nav>

        <div class="sidebar-footer">
            <button class="logout-btn" onclick={logout}>
                <LogOut size={18} />
                {#if !sidebarCollapsed}
                    <span>Logout</span>
                {/if}
            </button>
        </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
        {#if activeTab === 'overview'}
            <div class="page-container" in:fade={{ duration: 300 }}>
                <header class="page-header">
                    <div class="header-content">
                        <h1 class="page-title">Platform Overview</h1>
                        <p class="page-subtitle">System status and merchant metrics</p>
                    </div>
                    <button class="btn-primary" onclick={() => activeTab = 'merchants'}>
                        <Plus size={18} />
                        Manage Merchants
                    </button>
                </header>

                {#if stats}
                    <div class="stats-grid">
                        <div class="stat-card primary">
                            <div class="stat-visual">
                                <div class="stat-icon">
                                    <Users size={28} />
                                </div>
                                <div class="stat-trend">
                                    <TrendingUp size={14} />
                                    <span>Live</span>
                                </div>
                            </div>
                            <div class="stat-data">
                                <span class="stat-value mono">{stats.totalMerchants.toLocaleString()}</span>
                                <span class="stat-label">Total Merchants</span>
                            </div>
                            <div class="stat-decoration"></div>
                        </div>

                        <div class="stat-card accent">
                            <div class="stat-visual">
                                <div class="stat-icon">
                                    <DollarSign size={28} />
                                </div>
                            </div>
                            <div class="stat-data">
                                <span class="stat-value mono">{formatCurrency(stats.totalRevenue)}</span>
                                <span class="stat-label">Platform Revenue</span>
                            </div>
                            <div class="stat-decoration"></div>
                        </div>

                        <div class="stat-card">
                            <div class="stat-visual">
                                <div class="stat-icon">
                                    <ShoppingBag size={28} />
                                </div>
                            </div>
                            <div class="stat-data">
                                <span class="stat-value mono">{stats.totalOrders.toLocaleString()}</span>
                                <span class="stat-label">Total Orders</span>
                            </div>
                        </div>
                    </div>

                    <div class="content-grid">
                        <section class="panel status-distribution">
                            <div class="panel-header">
                                <h3>Status Distribution</h3>
                            </div>
                            <div class="panel-body">
                                {#if stats.merchantsByStatus.length > 0}
                                    <div class="status-chart">
                                        {#each stats.merchantsByStatus as item}
                                            {@const percentage = (item.count / stats.totalMerchants) * 100}
                                            <div class="chart-bar" style="--bar-height: {percentage}%">
                                                <div class="bar-fill status-{item.status}"></div>
                                                <span class="bar-value mono">{item.count}</span>
                                                <span class="bar-label">{item.status}</span>
                                            </div>
                                        {/each}
                                    </div>
                                {:else}
                                    <div class="empty-state">
                                        <AlertCircle size={32} />
                                        <p>No data available</p>
                                    </div>
                                {/if}
                            </div>
                        </section>

                        <section class="panel recent-activity">
                            <div class="panel-header">
                                <h3>Recent Merchants</h3>
                                <button class="btn-text" onclick={() => activeTab = 'merchants'}>View All</button>
                            </div>
                            <div class="panel-body">
                                {#if stats.recentMerchants.length > 0}
                                    <div class="merchant-list-compact">
                                        {#each stats.recentMerchants.slice(0, 6) as merchant}
                                            <button
                                                class="merchant-item"
                                                onclick={() => { selectedMerchant = merchant; activeTab = 'merchants'; }}
                                            >
                                                <div class="merchant-avatar">
                                                    {merchant.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div class="merchant-info">
                                                    <span class="merchant-name">{merchant.name}</span>
                                                    <span class="merchant-domain mono">{merchant.domain}</span>
                                                </div>
                                                <span class="status-badge status-{merchant.status}">
                                                    {merchant.status}
                                                </span>
                                            </button>
                                        {/each}
                                    </div>
                                {:else}
                                    <div class="empty-state">
                                        <Store size={32} />
                                        <p>No recent merchants</p>
                                    </div>
                                {/if}
                            </div>
                        </section>
                    </div>
                {:else}
                    <div class="loading-state">
                        <div class="spinner"></div>
                        <p>Loading metrics...</p>
                    </div>
                {/if}
            </div>

        {:else if activeTab === 'merchants'}
            <div class="page-container" in:fade={{ duration: 300 }}>
                {#if selectedMerchant}
                    {@const viewStoreUrl = `${STOREFRONT_BASE_URL.replace(/https?:\/\/localhost/, `$&${selectedMerchant.domain}.`)}`}
                    <!-- Merchant Detail View -->
                    <div class="detail-view">
                        <div class="detail-header">
                            <button class="btn-text" onclick={() => selectedMerchant = null}>
                                <ChevronLeft size={18} />
                                Back to merchants
                            </button>
                            <div class="detail-actions">
                                <!-- View Store Button -->
                                <a
                                    href={viewStoreUrl}
                                    target="_blank"
                                    class="btn-secondary"
                                    style="text-decoration: none; display: inline-flex; align-items: center; gap: 8px;"
                                >
                                    <Eye size={18} />
                                    View Store
                                </a>

                                {#if selectedMerchant.status !== 'active'}
                                    <button
                                        class="btn-success"
                                        onclick={() => showApproveModal = true}
                                        disabled={actionLoading}
                                    >
                                        <CheckCheck size={18} />
                                        Approve
                                    </button>
                                {/if}
                                {#if selectedMerchant.status !== 'suspended'}
                                    <button
                                        class="btn-warning"
                                        onclick={() => showSuspendModal = true}
                                        disabled={actionLoading}
                                    >
                                        <Ban size={18} />
                                        Suspend
                                    </button>
                                {/if}
                                <button
                                    class="btn-danger"
                                    onclick={() => { deleteStep = 1; showDeleteModal = true; }}
                                    disabled={actionLoading}
                                >
                                    <Trash2 size={18} />
                                    Delete
                                </button>
                            </div>
                        </div>

                        <div class="detail-content">
                            <div class="detail-main">
                                <div class="detail-card">
                                    <div class="merchant-profile">
                                        <div class="profile-avatar">
                                            {selectedMerchant.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div class="profile-info">
                                            <h2>{selectedMerchant.name}</h2>
                                            <span class="profile-domain mono">{selectedMerchant.domain}</span>
                                            <span class="status-badge status-{selectedMerchant.status} large">
                                                {selectedMerchant.status}
                                            </span>
                                        </div>
                                    </div>

                                    <!-- Store URL Section -->
                                    <div class="store-url-section">
                                        <div class="url-label">
                                            <LinkIcon size={16} />
                                            <span>Store URL</span>
                                        </div>
                                        <div class="url-display-box">
                                            <span class="url-text">{`${STOREFRONT_BASE_URL.replace(/https?:\/\//, `$&${selectedMerchant!.domain}.`)}`}</span>
                                            <button
                                                class="btn-copy"
                                                onclick={() => copyToClipboard(`${STOREFRONT_BASE_URL.replace(/https?:\/\//, `$&${selectedMerchant!.domain}.`)}`)}
                                                title="Copy URL"
                                            >
                                                <Copy size={16} />
                                            </button>
                                        </div>
                                        <p class="url-hint">Customers can access the store at this URL</p>
                                    </div>

                                    <div class="detail-stats">
                                        <div class="detail-stat">
                                            <span class="stat-label">Total Orders</span>
                                            <span class="stat-value mono">{selectedMerchant.totalOrders || 0}</span>
                                        </div>
                                        <div class="detail-stat">
                                            <span class="stat-label">Revenue</span>
                                            <span class="stat-value mono">{formatCurrency(selectedMerchant.totalRevenue)}</span>
                                        </div>
                                        <div class="detail-stat">
                                            <span class="stat-label">Customers</span>
                                            <span class="stat-value mono">{selectedMerchant.totalCustomers || 0}</span>
                                        </div>
                                        <div class="detail-stat">
                                            <span class="stat-label">Joined</span>
                                            <span class="stat-value mono">{formatDate(selectedMerchant.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>

                                {#if merchantLogs.length > 0}
                                    <div class="detail-card">
                                        <h3>Activity Timeline</h3>
                                        <div class="timeline">
                                            {#each merchantLogs as log}
                                                <div class="timeline-item">
                                                    <div class="timeline-icon">
                                                        <svelte:component this={getActionIcon(log.action)} size={16} />
                                                    </div>
                                                    <div class="timeline-content">
                                                        <span class="timeline-action">{log.action}</span>
                                                        {#if log.metadata?.reason}
                                                            <span class="timeline-reason">{log.metadata.reason}</span>
                                                        {/if}
                                                        <span class="timeline-time">{formatDate(log.createdAt)}</span>
                                                    </div>
                                                </div>
                                            {/each}
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </div>

                    <!-- Approve Modal -->
                    {#if showApproveModal}
                        <div class="modal-overlay" onclick={() => showApproveModal = false} transition:fade={{ duration: 200 }}>
                            <div class="modal" onclick={(e) => e.stopPropagation()} transition:slide={{ duration: 300, easing: quintOut }}>
                                <div class="modal-header">
                                    <h3>Approve Merchant</h3>
                                    <button class="btn-icon" onclick={() => showApproveModal = false}>
                                        <X size={20} />
                                    </button>
                                </div>
                                <div class="modal-body">
                                    <p>Are you sure you want to approve <strong>{selectedMerchant.name}</strong>?</p>
                                    <p class="text-secondary">This will activate their store and allow them to start selling.</p>
                                </div>
                                <div class="modal-footer">
                                    <button class="btn-secondary" onclick={() => showApproveModal = false}>Cancel</button>
                                    <button
                                        class="btn-success"
                                        onclick={() => selectedMerchant && approveMerchant(selectedMerchant)}
                                        disabled={actionLoading}
                                    >
                                        {#if actionLoading}
                                            <div class="spinner small"></div>
                                        {:else}
                                            <CheckCheck size={18} />
                                        {/if}
                                        Confirm Approval
                                    </button>
                                </div>
                            </div>
                        </div>
                    {/if}

                    <!-- Suspend Modal -->
                    {#if showSuspendModal}
                        <div class="modal-overlay" onclick={() => showSuspendModal = false} transition:fade={{ duration: 200 }}>
                            <div class="modal" onclick={(e) => e.stopPropagation()} transition:slide={{ duration: 300, easing: quintOut }}>
                                <div class="modal-header">
                                    <h3>Suspend Merchant</h3>
                                    <button class="btn-icon" onclick={() => showSuspendModal = false}>
                                        <X size={20} />
                                    </button>
                                </div>
                                <div class="modal-body">
                                    <p>You are about to suspend <strong>{selectedMerchant.name}</strong>.</p>
                                    <div class="form-group">
                                        <label for="suspend-reason">Reason for suspension <span class="required">*</span></label>
                                        <textarea
                                            id="suspend-reason"
                                            bind:value={actionReason}
                                            placeholder="Enter reason..."
                                            rows="3"
                                        ></textarea>
                                    </div>
                                </div>
                                <div class="modal-footer">
                                    <button class="btn-secondary" onclick={() => { showSuspendModal = false; actionReason = ''; }}>Cancel</button>
                                    <button
                                        class="btn-warning"
                                        onclick={() => selectedMerchant && suspendMerchant(selectedMerchant, actionReason)}
                                        disabled={actionLoading || !actionReason.trim()}
                                    >
                                        {#if actionLoading}
                                            <div class="spinner small"></div>
                                        {:else}
                                            <Ban size={18} />
                                        {/if}
                                        Confirm Suspension
                                    </button>
                                </div>
                            </div>
                        </div>
                    {/if}

                    <!-- Delete Modal (Two-step) -->
                    {#if showDeleteModal}
                        <div class="modal-overlay" onclick={() => showDeleteModal = false} transition:fade={{ duration: 200 }}>
                            <div class="modal modal-delete" onclick={(e) => e.stopPropagation()} transition:slide={{ duration: 300, easing: quintOut }}>
                                {#if deleteStep === 1}
                                    <div class="modal-header danger">
                                        <div class="modal-icon danger">
                                            <AlertTriangle size={24} />
                                        </div>
                                        <h3>Request Delete Confirmation</h3>
                                        <button class="btn-icon" onclick={() => showDeleteModal = false}>
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <div class="modal-body">
                                        <p class="warning-text">You are about to request deletion of <strong>{selectedMerchant.name}</strong>.</p>
                                        <div class="warning-box">
                                            <AlertTriangle size={20} />
                                            <span>This action requires two-step confirmation and cannot be undone.</span>
                                        </div>
                                        <ul class="delete-consequences">
                                            <li>All store data will be permanently deleted</li>
                                            <li>Orders and customer records will be removed</li>
                                            <li>Products and inventory will be erased</li>
                                        </ul>
                                    </div>
                                    <div class="modal-footer">
                                        <button class="btn-secondary" onclick={() => showDeleteModal = false}>Cancel</button>
                                        <button
                                            class="btn-danger"
                                            onclick={() => selectedMerchant && requestDelete(selectedMerchant)}
                                            disabled={actionLoading}
                                        >
                                            {#if actionLoading}
                                                <div class="spinner small"></div>
                                            {:else}
                                                <Lock size={18} />
                                            {/if}
                                            Request Confirmation
                                        </button>
                                    </div>
                                {:else}
                                    <div class="modal-header danger">
                                        <div class="modal-icon danger">
                                            <Trash2 size={24} />
                                        </div>
                                        <h3>Confirm Permanent Deletion</h3>
                                        <button class="btn-icon" onclick={() => { showDeleteModal = false; deleteStep = 1; }}>
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <div class="modal-body">
                                        <div class="confirmation-token">
                                            <span class="token-label">Confirmation Token</span>
                                            <code class="token-value mono">{deleteToken.substring(0, 20)}...</code>
                                        </div>
                                        <div class="form-group">
                                            <label for="delete-reason">Reason for deletion <span class="required">*</span></label>
                                            <textarea
                                                id="delete-reason"
                                                bind:value={actionReason}
                                                placeholder="Enter detailed reason for audit log..."
                                                rows="3"
                                            ></textarea>
                                        </div>
                                        <div class="warning-box strong">
                                            <AlertTriangle size={20} />
                                            <span>Type your reason and click "Permanently Delete" to proceed. This action is irreversible.</span>
                                        </div>
                                    </div>
                                    <div class="modal-footer">
                                        <button class="btn-secondary" onclick={() => { showDeleteModal = false; deleteStep = 1; actionReason = ''; }}>Cancel</button>
                                        <button
                                            class="btn-danger strong"
                                            onclick={() => selectedMerchant && confirmDelete(selectedMerchant, deleteToken, actionReason)}
                                            disabled={actionLoading || !actionReason.trim()}
                                        >
                                            {#if actionLoading}
                                                <div class="spinner small"></div>
                                            {:else}
                                                <Trash2 size={18} />
                                            {/if}
                                            Permanently Delete
                                        </button>
                                    </div>
                                {/if}
                            </div>
                        </div>
                    {/if}
                {:else}
                    <!-- Merchant List View -->
                    <header class="page-header">
                        <div class="header-content">
                            <h1 class="page-title">Merchant Management</h1>
                            <p class="page-subtitle">View and manage all platform merchants</p>
                        </div>
                        <button class="btn-primary" onclick={() => { loadPlans(); showCreateMerchantModal = true; }}>
                            <Plus size={18} />
                            Create Merchant
                        </button>
                    </header>

                    <div class="filters-bar">
                        <div class="search-box">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search by name or domain..."
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
                            <button class="btn-secondary" onclick={loadMerchants}>
                                <Filter size={16} />
                                Filter
                            </button>
                        </div>
                    </div>

                    {#if loading}
                        <div class="loading-state">
                            <div class="spinner"></div>
                            <p>Loading merchants...</p>
                        </div>
                    {:else if merchants.length > 0}
                        <div class="data-table-container">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Merchant</th>
                                        <th>Status</th>
                                        <th>Revenue</th>
                                        <th>Orders</th>
                                        <th>Joined</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each merchants as merchant}
                                        <tr class="clickable" onclick={() => loadMerchantDetail(merchant)}>
                                            <td>
                                                <div class="merchant-cell">
                                                    <div class="cell-avatar">
                                                        {merchant.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div class="cell-info">
                                                        <span class="cell-name">{merchant.name}</span>
                                                        <span class="cell-domain mono">{merchant.domain}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span class="status-badge status-{merchant.status}">
                                                    <svelte:component this={getStatusIcon(merchant.status)} size={14} />
                                                    {merchant.status}
                                                </span>
                                            </td>
                                            <td class="mono">{formatCurrency(merchant.totalRevenue)}</td>
                                            <td class="mono">{merchant.totalOrders || 0}</td>
                                            <td class="mono">{new Date(merchant.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <div class="action-buttons">
                                                    <button class="btn-icon-sm" title="View" onclick={(e) => { e.stopPropagation(); loadMerchantDetail(merchant); }}>
                                                        <Eye size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>

                        <div class="pagination">
                            <button
                                class="btn-secondary"
                                disabled={currentPage === 1}
                                onclick={() => { currentPage--; loadMerchants(); }}
                            >
                                <ChevronLeft size={16} />
                                Previous
                            </button>
                            <span class="page-info">Page {currentPage} of {totalPages}</span>
                            <button
                                class="btn-secondary"
                                disabled={currentPage === totalPages}
                                onclick={() => { currentPage++; loadMerchants(); }}
                            >
                                Next
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    {:else}
                        <div class="empty-state">
                            <Store size={48} />
                            <h3>No merchants found</h3>
                            <p>Try adjusting your search or filters</p>
                        </div>
                    {/if}
                {/if}
            </div>

        {:else if activeTab === 'activity'}
            <div class="page-container" in:fade={{ duration: 300 }}>
                <div class="page-header">
                    <div class="header-title">
                        <h1 class="page-title">Activity Log</h1>
                        <p class="page-subtitle">Track all actions across the platform</p>
                    </div>
                </div>

                <div class="activity-list">
                    {#if merchantLogs.length > 0}
                        {#each merchantLogs as log}
                            <div class="activity-item">
                                <div class="activity-icon">
                                    <svelte:component this={getActionIcon(log.action)} size={18} />
                                </div>
                                <div class="activity-content">
                                    <div class="activity-header">
                                        <span class="activity-action">{log.action}</span>
                                        <span class="activity-entity">{log.entityType}</span>
                                    </div>
                                    <p class="activity-details">{JSON.stringify(log.metadata)}</p>
                                    <span class="activity-time">{formatDate(log.createdAt)}</span>
                                </div>
                            </div>
                        {/each}
                    {:else}
                        <div class="empty-state">
                            <Activity size={48} />
                            <h3>No activity yet</h3>
                            <p>Activity will appear here when actions are performed</p>
                        </div>
                    {/if}
                </div>
            </div>

        {:else if activeTab === 'plans'}
            <div class="page-container" in:fade={{ duration: 300 }}>
                <div class="page-header">
                    <div class="header-title">
                        <h1 class="page-title">Subscription Plans</h1>
                        <p class="page-subtitle">Manage merchant subscription tiers</p>
                    </div>
                    <button class="btn-primary" onclick={() => openPlanModal()}>
                        <Plus size={18} />
                        Create Plan
                    </button>
                </div>

                {#if plansLoading}
                    <div class="loading-state">
                        <div class="spinner"></div>
                        <p>Loading plans...</p>
                    </div>
                {:else if plans.length > 0}
                    <div class="plans-grid">
                        {#each plans as plan}
                            <div class="plan-card" class:inactive={!plan.isActive}>
                                <div class="plan-header">
                                    <div class="plan-icon">
                                        <Crown size={24} />
                                    </div>
                                    <div class="plan-status">
                                        {#if plan.isActive}
                                            <span class="status-badge active">Active</span>
                                        {:else}
                                            <span class="status-badge inactive">Inactive</span>
                                        {/if}
                                    </div>
                                </div>

                                <h3 class="plan-name">{plan.name}</h3>
                                <p class="plan-description">{plan.description}</p>

                                <div class="plan-price">
                                    <span class="price-amount">{formatCurrency(plan.price)}</span>
                                    <span class="price-interval">/{plan.interval}</span>
                                </div>

                                <div class="plan-limits">
                                    <div class="limit-item">
                                        <Package size={14} />
                                        <span>{plan.maxProducts} products</span>
                                    </div>
                                    <div class="limit-item">
                                        <Zap size={14} />
                                        <span>{plan.maxStorage}MB storage</span>
                                    </div>
                                </div>

                                <div class="plan-features">
                                    {#each plan.features.slice(0, 4) as feature}
                                        <div class="feature-item">
                                            <CheckCircle size={14} />
                                            <span>{feature}</span>
                                        </div>
                                    {/each}
                                    {#if plan.features.length > 4}
                                        <span class="more-features">+{plan.features.length - 4} more</span>
                                    {/if}
                                </div>

                                <div class="plan-actions">
                                    <button class="btn-secondary" onclick={() => openPlanModal(plan)}>
                                        <Edit3 size={16} />
                                        Edit
                                    </button>
                                    <button class="btn-danger" onclick={() => confirmDeletePlan(plan)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        {/each}
                    </div>
                {:else}
                    <div class="empty-state">
                        <Crown size={48} />
                        <h3>No plans yet</h3>
                        <p>Create your first subscription plan to get started</p>
                        <button class="btn-primary" onclick={() => openPlanModal()}>
                            <Plus size={18} />
                            Create Plan
                        </button>
                    </div>
                {/if}
            </div>
        {/if}
    </main>
</div>

<!-- Plan Modal -->
{#if showPlanModal}
    <div class="modal-overlay" transition:fade={{ duration: 200 }} onclick={() => showPlanModal = false}>
        <div class="modal" transition:slide={{ duration: 300 }} onclick={(e) => e.stopPropagation()}>
            <div class="modal-header">
                <h2>{editingPlan ? 'Edit Plan' : 'Create Plan'}</h2>
                <button class="btn-icon" onclick={() => showPlanModal = false}>
                    <X size={20} />
                </button>
            </div>

            <div class="modal-body">
                <div class="form-group">
                    <label for="plan-name">Plan Name</label>
                    <input
                        id="plan-name"
                        type="text"
                        class="form-input"
                        bind:value={planForm.name}
                        placeholder="e.g., Professional"
                    />
                </div>

                <div class="form-group">
                    <label for="plan-description">Description</label>
                    <textarea
                        id="plan-description"
                        class="form-textarea"
                        bind:value={planForm.description}
                        placeholder="Describe what this plan includes..."
                        rows={3}
                    ></textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="plan-price">Price</label>
                        <input
                            id="plan-price"
                            type="number"
                            class="form-input"
                            bind:value={planForm.price}
                            placeholder="29.99"
                            step="0.01"
                            min="0"
                        />
                    </div>

                    <div class="form-group">
                        <label for="plan-currency">Currency</label>
                        <select id="plan-currency" class="form-select" bind:value={planForm.currency}>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                            <option value="INR">INR</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="plan-interval">Interval</label>
                        <select id="plan-interval" class="form-select" bind:value={planForm.interval}>
                            <option value="month">Monthly</option>
                            <option value="year">Yearly</option>
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="plan-products">Max Products</label>
                        <input
                            id="plan-products"
                            type="number"
                            class="form-input"
                            bind:value={planForm.maxProducts}
                            min="1"
                        />
                    </div>

                    <div class="form-group">
                        <label for="plan-storage">Max Storage (MB)</label>
                        <input
                            id="plan-storage"
                            type="number"
                            class="form-input"
                            bind:value={planForm.maxStorage}
                            min="1"
                        />
                    </div>
                </div>

                <div class="form-group">
                    <label for="plan-features">Features (one per line)</label>
                    <textarea
                        id="plan-features"
                        class="form-textarea"
                        bind:value={planForm.features}
                        placeholder="Unlimited orders&#10;Priority support&#10;Custom domain"
                        rows={4}
                    ></textarea>
                </div>

                <div class="form-group checkbox">
                    <label>
                        <input type="checkbox" bind:checked={planForm.isActive} />
                        <span>Active</span>
                    </label>
                </div>
            </div>

            <div class="modal-footer">
                <button class="btn-secondary" onclick={() => showPlanModal = false}>Cancel</button>
                <button class="btn-primary" onclick={savePlan} disabled={actionLoading || !planForm.name || !planForm.price}>
                    {#if actionLoading}
                        <div class="spinner-sm"></div>
                    {:else}
                        <CheckCheck size={18} />
                    {/if}
                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- Delete Plan Confirmation Modal -->
{#if showDeletePlanModal}
    <div class="modal-overlay" transition:fade={{ duration: 200 }} onclick={() => showDeletePlanModal = false}>
        <div class="modal modal-sm" transition:slide={{ duration: 300 }} onclick={(e) => e.stopPropagation()}>
            <div class="modal-header">
                <h2>Delete Plan</h2>
                <button class="btn-icon" onclick={() => showDeletePlanModal = false}>
                    <X size={20} />
                </button>
            </div>

            <div class="modal-body">
                <div class="confirm-icon danger">
                    <AlertTriangle size={32} />
                </div>
                <p class="confirm-text">
                    Are you sure you want to delete the plan "{editingPlan?.name}"? This action cannot be undone.
                </p>
                {#if actionLoading}
                    <p class="confirm-subtext">Deleting...</p>
                {/if}
            </div>

            <div class="modal-footer">
                <button class="btn-secondary" onclick={() => showDeletePlanModal = false} disabled={actionLoading}>Cancel</button>
                <button class="btn-danger" onclick={deletePlan} disabled={actionLoading}>
                    {#if actionLoading}
                        <div class="spinner-sm"></div>
                    {:else}
                        <Trash2 size={18} />
                    {/if}
                    Delete Plan
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- Create Merchant Modal -->
{#if showCreateMerchantModal}
    <div class="modal-overlay" transition:fade={{ duration: 200 }} onclick={() => resetMerchantForm()}>
        <div class="modal" onclick={(e) => e.stopPropagation()} transition:slide={{ duration: 300, easing: quintOut }}>
            <div class="modal-header">
                <div class="modal-icon">
                    <Store size={24} />
                </div>
                <h3>Create New Merchant</h3>
                <button class="btn-icon" onclick={() => resetMerchantForm()}>
                    <X size={20} />
                </button>
            </div>

            <div class="modal-body">
                <form class="plan-form" onsubmit={(e) => { e.preventDefault(); createMerchant(); }}>
                    <div class="form-section">
                        <h4 class="form-section-title">Store Information</h4>
                        <div class="form-group">
                            <label class="form-label" for="storeName">Store Name *</label>
                            <input
                                type="text"
                                id="storeName"
                                class="form-input"
                                bind:value={merchantForm.storeName}
                                placeholder="e.g., My Awesome Store"
                                required
                            />
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="domain">Domain *</label>
                            <div class="domain-input-wrapper">
                                <input
                                    type="text"
                                    id="domain"
                                    class="form-input domain-input"
                                    bind:value={merchantForm.domain}
                                    placeholder="my-store"
                                    required
                                    pattern="[a-z0-9\-]+"
                                    title="Only lowercase letters, numbers, and hyphens allowed"
                                />
                                <span class="domain-suffix">.{API_BASE_URL?.replace(/^https?:\/\//, '').split('/')[0] || 'yourdomain.com'}</span>
                            </div>
                            <p class="form-hint">This will be the URL for the merchant's store</p>
                        </div>
                    </div>

                    <div class="form-section">
                        <h4 class="form-section-title">Owner Information</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label" for="ownerName">Owner Name *</label>
                                <input
                                    type="text"
                                    id="ownerName"
                                    class="form-input"
                                    bind:value={merchantForm.ownerName}
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="ownerEmail">Owner Email *</label>
                                <input
                                    type="email"
                                    id="ownerEmail"
                                    class="form-input"
                                    bind:value={merchantForm.ownerEmail}
                                    placeholder="owner@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label" for="password">Password *</label>
                                <input
                                    type="password"
                                    id="password"
                                    class="form-input"
                                    bind:value={merchantForm.password}
                                    placeholder="Min 8 characters"
                                    required
                                    minlength="8"
                                />
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="confirmPassword">Confirm Password *</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    class="form-input"
                                    bind:value={merchantForm.confirmPassword}
                                    placeholder="Re-enter password"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div class="form-section">
                        <h4 class="form-section-title">Plan (Optional)</h4>
                        <div class="form-group">
                            <label class="form-label" for="planId">Select Plan</label>
                            <select id="planId" class="form-select" bind:value={merchantForm.planId}>
                                <option value="">-- No Plan --</option>
                                {#each plans as plan}
                                    <option value={plan.id}>{plan.name} - ${plan.price}/{plan.interval}</option>
                                {/each}
                            </select>
                        </div>
                    </div>
                </form>
            </div>

            <div class="modal-footer">
                <button class="btn-secondary" onclick={() => resetMerchantForm()} disabled={actionLoading}>Cancel</button>
                <button class="btn-primary" onclick={createMerchant} disabled={actionLoading}>
                    {#if actionLoading}
                        <div class="spinner-sm"></div>
                    {:else}
                        <Plus size={18} />
                    {/if}
                    Create Merchant
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    /* CSS Variables - Dark Editorial Theme */
    :global(:root) {
        --bg-primary: #0a0a0b;
        --bg-secondary: #141415;
        --bg-tertiary: #1c1c1e;
        --bg-elevated: #242426;

        --text-primary: #fafafa;
        --text-secondary: #a1a1aa;
        --text-tertiary: #71717a;

        --accent-primary: #f59e0b;
        --accent-secondary: #d97706;
        --accent-glow: rgba(245, 158, 11, 0.15);

        --status-active: #22c55e;
        --status-pending: #f59e0b;
        --status-suspended: #ef4444;
        --status-deactivated: #6b7280;

        --danger: #ef4444;
        --danger-glow: rgba(239, 68, 68, 0.15);
        --success: #22c55e;
        --warning: #f59e0b;

        --border-subtle: rgba(255, 255, 255, 0.06);
        --border-default: rgba(255, 255, 255, 0.1);

        --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
        --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
        --shadow-lg: 0 8px 30px rgba(0, 0, 0, 0.5);
        --shadow-glow: 0 0 40px var(--accent-glow);

        --radius-sm: 6px;
        --radius-md: 10px;
        --radius-lg: 16px;

        --font-display: 'Crimson Pro', serif;
        --font-body: 'Space Grotesk', sans-serif;
        --font-mono: 'JetBrains Mono', monospace;
    }

    /* Global Styles */
    :global(*) {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    :global(body) {
        font-family: var(--font-body);
        background: var(--bg-primary);
        color: var(--text-primary);
        line-height: 1.6;
        -webkit-font-smoothing: antialiased;
    }

    /* Toast Notifications */
    .toast-container {
        position: fixed;
        top: 24px;
        right: 24px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 12px;
        pointer-events: none;
    }

    .toast {
        padding: 16px 24px;
        border-radius: var(--radius-md);
        font-size: 14px;
        font-weight: 500;
        box-shadow: var(--shadow-lg);
        pointer-events: auto;
        min-width: 280px;
    }

    .toast.success {
        background: var(--bg-elevated);
        border: 1px solid var(--status-active);
        color: var(--status-active);
    }

    .toast.error {
        background: var(--bg-elevated);
        border: 1px solid var(--danger);
        color: var(--danger);
    }

    /* Layout */
    .admin-app {
        display: flex;
        min-height: 100vh;
        background: var(--bg-primary);
    }

    /* Sidebar */
    .sidebar {
        width: 280px;
        background: var(--bg-secondary);
        border-right: 1px solid var(--border-subtle);
        display: flex;
        flex-direction: column;
        transition: width 0.3s ease;
        position: fixed;
        height: 100vh;
        z-index: 100;
    }

    .sidebar.collapsed {
        width: 80px;
    }

    .sidebar-header {
        padding: 24px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid var(--border-subtle);
    }

    .brand {
        display: flex;
        align-items: center;
        gap: 14px;
    }

    .brand-mark {
        width: 44px;
        height: 44px;
        background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--bg-primary);
        flex-shrink: 0;
    }

    .brand-text {
        display: flex;
        flex-direction: column;
    }

    .brand-title {
        font-family: var(--font-display);
        font-size: 22px;
        font-weight: 700;
        line-height: 1;
        letter-spacing: -0.02em;
    }

    .brand-subtitle {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--text-tertiary);
        font-weight: 600;
    }

    .collapse-btn {
        width: 32px;
        height: 32px;
        border: none;
        background: transparent;
        color: var(--text-tertiary);
        cursor: pointer;
        border-radius: var(--radius-sm);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
    }

    .collapse-btn:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }

    .sidebar-nav {
        flex: 1;
        padding: 16px 12px;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .nav-item {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 16px;
        border: none;
        background: transparent;
        color: var(--text-secondary);
        font-size: 14px;
        font-weight: 500;
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all 0.2s;
        position: relative;
    }

    .nav-item:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }

    .nav-item.active {
        background: var(--accent-glow);
        color: var(--accent-primary);
    }

    .nav-item.active::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 20px;
        background: var(--accent-primary);
        border-radius: 0 2px 2px 0;
    }

    .nav-badge {
        margin-left: auto;
        background: var(--accent-primary);
        color: var(--bg-primary);
        font-size: 11px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 20px;
    }

    .sidebar-footer {
        padding: 16px;
        border-top: 1px solid var(--border-subtle);
    }

    .logout-btn {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 12px 16px;
        border: none;
        background: transparent;
        color: var(--text-tertiary);
        font-size: 14px;
        font-weight: 500;
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all 0.2s;
    }

    .logout-btn:hover {
        background: var(--danger-glow);
        color: var(--danger);
    }

    /* Main Content */
    .main-content {
        flex: 1;
        margin-left: 280px;
        padding: 32px;
        min-height: 100vh;
    }

    .sidebar.collapsed + .main-content {
        margin-left: 80px;
    }

    .page-container {
        max-width: 1400px;
        margin: 0 auto;
    }

    /* Page Header */
    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 32px;
    }

    .page-title {
        font-family: var(--font-display);
        font-size: 36px;
        font-weight: 700;
        letter-spacing: -0.02em;
        margin-bottom: 8px;
    }

    .page-subtitle {
        color: var(--text-secondary);
        font-size: 15px;
    }

    /* Buttons */
    .btn-primary {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 24px;
        background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
        color: var(--bg-primary);
        border: none;
        border-radius: var(--radius-md);
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: var(--shadow-sm);
    }

    .btn-primary:hover {
        transform: translateY(-1px);
        box-shadow: var(--shadow-md), var(--shadow-glow);
    }

    .btn-secondary {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 18px;
        background: var(--bg-tertiary);
        color: var(--text-primary);
        border: 1px solid var(--border-default);
        border-radius: var(--radius-md);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-secondary:hover:not(:disabled) {
        background: var(--bg-elevated);
        border-color: var(--text-tertiary);
    }

    .btn-secondary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .btn-success {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 18px;
        background: var(--status-active);
        color: white;
        border: none;
        border-radius: var(--radius-md);
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-success:hover:not(:disabled) {
        filter: brightness(1.1);
    }

    .btn-warning {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 18px;
        background: var(--warning);
        color: var(--bg-primary);
        border: none;
        border-radius: var(--radius-md);
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-danger {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 18px;
        background: var(--danger);
        color: white;
        border: none;
        border-radius: var(--radius-md);
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-danger:hover:not(:disabled) {
        filter: brightness(1.1);
    }

    .btn-danger.strong {
        background: linear-gradient(135deg, #dc2626, #ef4444);
    }

    .btn-text {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: transparent;
        color: var(--text-secondary);
        border: none;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-text:hover {
        color: var(--text-primary);
    }

    .btn-icon {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        color: var(--text-tertiary);
        border: none;
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-icon:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }

    .btn-icon-sm {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        color: var(--text-tertiary);
        border: none;
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-icon-sm:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }

    /* Stats Grid */
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 24px;
        margin-bottom: 32px;
    }

    .stat-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-lg);
        padding: 28px;
        position: relative;
        overflow: hidden;
        transition: all 0.3s;
    }

    .stat-card:hover {
        border-color: var(--border-default);
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
    }

    .stat-card.primary {
        border-color: var(--accent-primary);
        background: linear-gradient(135deg, var(--bg-secondary), var(--accent-glow));
    }

    .stat-card.accent {
        border-color: var(--accent-primary);
    }

    .stat-visual {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;
    }

    .stat-icon {
        width: 56px;
        height: 56px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-default);
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--accent-primary);
    }

    .stat-card.primary .stat-icon {
        background: var(--accent-primary);
        color: var(--bg-primary);
        border-color: var(--accent-primary);
    }

    .stat-trend {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: var(--status-active);
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .stat-data {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .stat-value {
        font-family: var(--font-mono);
        font-size: 32px;
        font-weight: 500;
        letter-spacing: -0.02em;
    }

    .stat-label {
        font-size: 14px;
        color: var(--text-secondary);
        font-weight: 500;
    }

    .stat-decoration {
        position: absolute;
        top: -50%;
        right: -20%;
        width: 200px;
        height: 200px;
        background: radial-gradient(circle, var(--accent-glow), transparent 70%);
        opacity: 0.5;
        pointer-events: none;
    }

    /* Content Grid */
    .content-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
    }

    .panel {
        background: var(--bg-secondary);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-lg);
        overflow: hidden;
    }

    .panel-header {
        padding: 20px 24px;
        border-bottom: 1px solid var(--border-subtle);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .panel-header h3 {
        font-family: var(--font-display);
        font-size: 18px;
        font-weight: 600;
    }

    .panel-body {
        padding: 24px;
    }

    /* Status Distribution Chart */
    .status-chart {
        display: flex;
        align-items: flex-end;
        justify-content: space-around;
        height: 200px;
        gap: 16px;
        padding-top: 40px;
    }

    .chart-bar {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        min-width: 60px;
        max-width: 100px;
    }

    .bar-fill {
        width: 100%;
        height: var(--bar-height, 0%);
        border-radius: var(--radius-sm) var(--radius-sm) 0 0;
        transition: height 0.6s ease;
        min-height: 4px;
    }

    .bar-fill.status-active { background: var(--status-active); }
    .bar-fill.status-pending { background: var(--status-pending); }
    .bar-fill.status-suspended { background: var(--status-suspended); }
    .bar-fill.status-deactivated { background: var(--status-deactivated); }

    .bar-value {
        font-size: 18px;
        font-weight: 600;
    }

    .bar-label {
        font-size: 12px;
        color: var(--text-tertiary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    /* Merchant List Compact */
    .merchant-list-compact {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .merchant-item {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px;
        background: var(--bg-tertiary);
        border: 1px solid transparent;
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
        width: 100%;
    }

    .merchant-item:hover {
        border-color: var(--border-default);
        background: var(--bg-elevated);
    }

    .merchant-avatar {
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        font-weight: 700;
        color: var(--bg-primary);
        flex-shrink: 0;
    }

    .merchant-info {
        flex: 1;
        min-width: 0;
    }

    .merchant-name {
        display: block;
        font-weight: 600;
        font-size: 14px;
        margin-bottom: 2px;
    }

    .merchant-domain {
        display: block;
        font-size: 12px;
        color: var(--text-tertiary);
    }

    /* Status Badges */
    .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.03em;
    }

    .status-badge.status-active {
        background: rgba(34, 197, 94, 0.1);
        color: var(--status-active);
        border: 1px solid rgba(34, 197, 94, 0.2);
    }

    .status-badge.status-pending {
        background: rgba(245, 158, 11, 0.1);
        color: var(--status-pending);
        border: 1px solid rgba(245, 158, 11, 0.2);
    }

    .status-badge.status-suspended {
        background: rgba(239, 68, 68, 0.1);
        color: var(--status-suspended);
        border: 1px solid rgba(239, 68, 68, 0.2);
    }

    .status-badge.status-deactivated {
        background: rgba(107, 114, 128, 0.1);
        color: var(--status-deactivated);
        border: 1px solid rgba(107, 114, 128, 0.2);
    }

    .status-badge.large {
        padding: 8px 16px;
        font-size: 13px;
    }

    /* Filters Bar */
    .filters-bar {
        display: flex;
        gap: 16px;
        margin-bottom: 24px;
    }

    .search-box {
        flex: 1;
        max-width: 400px;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-md);
        transition: all 0.2s;
    }

    .search-box:focus-within {
        border-color: var(--accent-primary);
        box-shadow: 0 0 0 3px var(--accent-glow);
    }

    .search-box input {
        flex: 1;
        background: transparent;
        border: none;
        color: var(--text-primary);
        font-size: 14px;
        outline: none;
    }

    .search-box input::placeholder {
        color: var(--text-tertiary);
    }

    .filter-group {
        display: flex;
        gap: 12px;
    }

    .filter-group select {
        padding: 10px 16px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-md);
        color: var(--text-primary);
        font-size: 14px;
        cursor: pointer;
        outline: none;
    }

    .filter-group select:focus {
        border-color: var(--accent-primary);
    }

    /* Data Table */
    .data-table-container {
        background: var(--bg-secondary);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-lg);
        overflow: hidden;
    }

    .data-table {
        width: 100%;
        border-collapse: collapse;
    }

    .data-table th {
        padding: 16px 20px;
        text-align: left;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-tertiary);
        background: var(--bg-tertiary);
        border-bottom: 1px solid var(--border-subtle);
    }

    .data-table td {
        padding: 16px 20px;
        border-bottom: 1px solid var(--border-subtle);
        font-size: 14px;
    }

    .data-table tbody tr {
        transition: all 0.2s;
    }

    .data-table tbody tr:hover {
        background: var(--bg-tertiary);
    }

    .data-table tbody tr.clickable {
        cursor: pointer;
    }

    .data-table tbody tr:last-child td {
        border-bottom: none;
    }

    .merchant-cell {
        display: flex;
        align-items: center;
        gap: 14px;
    }

    .cell-avatar {
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        color: var(--bg-primary);
    }

    .cell-info {
        display: flex;
        flex-direction: column;
    }

    .cell-name {
        font-weight: 600;
    }

    .cell-domain {
        font-size: 12px;
        color: var(--text-tertiary);
    }

    .action-buttons {
        display: flex;
        gap: 8px;
    }

    /* Pagination */
    .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 16px;
        margin-top: 24px;
    }

    .page-info {
        font-size: 14px;
        color: var(--text-secondary);
    }

    /* Detail View */
    .detail-view {
        animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .detail-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
    }

    .detail-actions {
        display: flex;
        gap: 12px;
    }

    .detail-content {
        display: grid;
        gap: 24px;
    }

    .detail-main {
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    .detail-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-lg);
        padding: 28px;
    }

    .detail-card h3 {
        font-family: var(--font-display);
        font-size: 20px;
        font-weight: 600;
        margin-bottom: 20px;
    }

    .merchant-profile {
        display: flex;
        gap: 20px;
        margin-bottom: 28px;
    }

    .profile-avatar {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
        border-radius: var(--radius-lg);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        font-weight: 700;
        color: var(--bg-primary);
    }

    .profile-info h2 {
        font-family: var(--font-display);
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 8px;
    }

    .profile-domain {
        display: block;
        font-family: var(--font-mono);
        font-size: 14px;
        color: var(--text-secondary);
        margin-bottom: 12px;
    }

    .detail-stats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
    }

    .detail-stat {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 20px;
        background: var(--bg-tertiary);
        border-radius: var(--radius-md);
    }

    .detail-stat .stat-label {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-tertiary);
    }

    .detail-stat .stat-value {
        font-family: var(--font-mono);
        font-size: 24px;
        font-weight: 500;
    }

    /* Store URL Section */
    .store-url-section {
        margin: 24px 0;
        padding: 20px;
        background: var(--bg-tertiary);
        border-radius: var(--radius-md);
        border: 1px solid var(--border-default);
    }

    .url-label {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        font-size: 14px;
        color: var(--text-secondary);
        font-weight: 500;
    }

    .url-display-box {
        display: flex;
        align-items: center;
        gap: 12px;
        background: var(--bg-secondary);
        padding: 14px 16px;
        border-radius: var(--radius-md);
        border: 1px solid var(--border-default);
    }

    .url-text {
        flex: 1;
        font-family: var(--font-mono);
        font-size: 14px;
        color: var(--accent-primary);
        word-break: break-all;
    }

    .btn-copy {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-default);
        border-radius: var(--radius-md);
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-copy:hover {
        background: var(--accent-primary);
        border-color: var(--accent-primary);
        color: white;
    }

    .url-hint {
        margin-top: 8px;
        font-size: 12px;
        color: var(--text-tertiary);
    }

    /* Timeline */
    .timeline {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .timeline-item {
        display: flex;
        gap: 16px;
        padding: 16px;
        background: var(--bg-tertiary);
        border-radius: var(--radius-md);
        border-left: 3px solid var(--accent-primary);
    }

    .timeline-icon {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
        color: var(--accent-primary);
    }

    .timeline-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .timeline-action {
        font-weight: 600;
        text-transform: capitalize;
    }

    .timeline-reason {
        font-size: 13px;
        color: var(--text-secondary);
        font-style: italic;
    }

    .timeline-time {
        font-size: 12px;
        color: var(--text-tertiary);
        font-family: var(--font-mono);
    }

    /* Modals */
    .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 24px;
    }

    .modal {
        background: var(--bg-secondary);
        border: 1px solid var(--border-default);
        border-radius: var(--radius-lg);
        width: 100%;
        max-width: 480px;
        box-shadow: var(--shadow-lg);
        overflow: hidden;
    }

    .modal-delete {
        max-width: 520px;
    }

    .modal-header {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 24px 24px 0;
    }

    .modal-header.danger {
        padding-top: 24px;
    }

    .modal-icon {
        width: 48px;
        height: 48px;
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .modal-icon.danger {
        background: var(--danger-glow);
        color: var(--danger);
    }

    .modal-header h3 {
        flex: 1;
        font-family: var(--font-display);
        font-size: 22px;
        font-weight: 600;
    }

    .modal-body {
        padding: 20px 24px;
    }

    .modal-body p {
        margin-bottom: 16px;
        line-height: 1.6;
    }

    .modal-body p.warning-text {
        font-size: 16px;
    }

    .warning-box {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 16px;
        background: var(--danger-glow);
        border: 1px solid rgba(239, 68, 68, 0.2);
        border-radius: var(--radius-md);
        color: var(--danger);
        font-size: 13px;
        margin-bottom: 16px;
    }

    .warning-box.strong {
        background: rgba(239, 68, 68, 0.15);
        border-color: var(--danger);
    }

    .delete-consequences {
        list-style: none;
        padding: 0;
        margin: 0 0 20px;
    }

    .delete-consequences li {
        padding: 8px 0;
        padding-left: 24px;
        position: relative;
        color: var(--text-secondary);
        font-size: 14px;
    }

    .delete-consequences li::before {
        content: '×';
        position: absolute;
        left: 0;
        color: var(--danger);
        font-weight: 700;
    }

    .confirmation-token {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 20px;
        padding: 16px;
        background: var(--bg-tertiary);
        border-radius: var(--radius-md);
        border: 1px dashed var(--border-default);
    }

    .token-label {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-tertiary);
    }

    .token-value {
        font-family: var(--font-mono);
        font-size: 14px;
        color: var(--accent-primary);
    }

    .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 0 24px 24px;
    }

    /* Form Elements */
    .form-group {
        margin-bottom: 20px;
    }

    .form-group label {
        display: block;
        margin-bottom: 8px;
        font-size: 14px;
        font-weight: 500;
    }

    .form-group .required {
        color: var(--danger);
    }

    .form-group textarea {
        width: 100%;
        padding: 12px 16px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-default);
        border-radius: var(--radius-md);
        color: var(--text-primary);
        font-size: 14px;
        font-family: inherit;
        resize: vertical;
        outline: none;
        transition: all 0.2s;
    }

    .form-group textarea:focus {
        border-color: var(--accent-primary);
        box-shadow: 0 0 0 3px var(--accent-glow);
    }

    .form-group textarea::placeholder {
        color: var(--text-tertiary);
    }

    /* Loading States */
    .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px;
        gap: 16px;
        color: var(--text-secondary);
    }

    .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--bg-tertiary);
        border-top-color: var(--accent-primary);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    .spinner.small {
        width: 18px;
        height: 18px;
        border-width: 2px;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    /* Empty State */
    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px;
        gap: 16px;
        color: var(--text-secondary);
        text-align: center;
    }

    .empty-state h3 {
        font-family: var(--font-display);
        font-size: 20px;
        font-weight: 600;
        color: var(--text-primary);
    }

    /* Typography Utilities */
    .mono {
        font-family: var(--font-mono);
    }

    .text-secondary {
        color: var(--text-secondary);
    }

    /* Responsive */
    @media (max-width: 1200px) {
        .stats-grid {
            grid-template-columns: repeat(2, 1fr);
        }

        .content-grid {
            grid-template-columns: 1fr;
        }
    }

    @media (max-width: 768px) {
        .sidebar {
            transform: translateX(-100%);
        }

        .sidebar.open {
            transform: translateX(0);
        }

        .main-content {
            margin-left: 0;
            padding: 20px;
        }

        .stats-grid {
            grid-template-columns: 1fr;
        }

        .detail-stats {
            grid-template-columns: repeat(2, 1fr);
        }

        .filters-bar {
            flex-direction: column;
        }

        .search-box {
            max-width: 100%;
        }
    }

    /* Plans Section */
    .plans-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 24px;
    }

    .plan-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border-default);
        border-radius: var(--radius-lg);
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        transition: all 0.2s;
    }

    .plan-card:hover {
        border-color: var(--border-default);
        box-shadow: var(--shadow-md);
    }

    .plan-card.inactive {
        opacity: 0.6;
    }

    .plan-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .plan-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
        border-radius: var(--radius-md);
        color: white;
    }

    .plan-status .status-badge {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .status-badge.active {
        background: rgba(34, 197, 94, 0.15);
        color: var(--status-active);
    }

    .status-badge.inactive {
        background: rgba(107, 114, 128, 0.15);
        color: var(--text-tertiary);
    }

    .plan-name {
        font-family: var(--font-display);
        font-size: 24px;
        font-weight: 600;
    }

    .plan-description {
        font-size: 14px;
        color: var(--text-secondary);
        line-height: 1.5;
    }

    .plan-price {
        display: flex;
        align-items: baseline;
        gap: 4px;
    }

    .price-amount {
        font-family: var(--font-mono);
        font-size: 32px;
        font-weight: 600;
        color: var(--accent-primary);
    }

    .price-interval {
        font-size: 14px;
        color: var(--text-secondary);
    }

    .plan-limits {
        display: flex;
        gap: 16px;
        padding: 12px 0;
        border-top: 1px solid var(--border-subtle);
        border-bottom: 1px solid var(--border-subtle);
    }

    .limit-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: var(--text-secondary);
    }

    .plan-features {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .feature-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: var(--text-secondary);
    }

    .feature-item :global(svg) {
        color: var(--status-active);
    }

    .more-features {
        font-size: 12px;
        color: var(--text-tertiary);
        font-style: italic;
    }

    .plan-actions {
        display: flex;
        gap: 8px;
        margin-top: auto;
    }

    .plan-actions button {
        flex: 1;
    }

    .plan-actions .btn-danger {
        flex: 0 0 auto;
        width: 40px;
        padding: 0;
    }

    /* Activity Section */
    .activity-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .activity-item {
        display: flex;
        gap: 16px;
        padding: 16px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-md);
        transition: all 0.2s;
    }

    .activity-item:hover {
        border-color: var(--border-default);
    }

    .activity-icon {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-tertiary);
        border-radius: var(--radius-md);
        color: var(--accent-primary);
    }

    .activity-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .activity-header {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .activity-action {
        font-weight: 600;
        text-transform: capitalize;
        color: var(--text-primary);
    }

    .activity-entity {
        font-size: 12px;
        padding: 2px 8px;
        background: var(--bg-tertiary);
        border-radius: 4px;
        color: var(--text-secondary);
        text-transform: capitalize;
    }

    .activity-details {
        font-size: 13px;
        color: var(--text-secondary);
        font-family: var(--font-mono);
        opacity: 0.7;
    }

    .activity-time {
        font-size: 12px;
        color: var(--text-tertiary);
        font-family: var(--font-mono);
    }

    /* Form Row */
    .form-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
    }

    .form-group.checkbox {
        flex-direction: row;
        align-items: center;
        gap: 8px;
    }

    .form-group.checkbox label {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
    }

    .form-group.checkbox input[type="checkbox"] {
        width: 18px;
        height: 18px;
        accent-color: var(--accent-primary);
    }

    .form-select {
        width: 100%;
        padding: 12px 16px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-default);
        border-radius: var(--radius-md);
        color: var(--text-primary);
        font-size: 14px;
        font-family: inherit;
        outline: none;
        transition: all 0.2s;
        cursor: pointer;
    }

    .form-select:focus {
        border-color: var(--accent-primary);
        box-shadow: 0 0 0 3px var(--accent-glow);
    }

    /* Modal Small */
    .modal-sm {
        max-width: 400px;
    }

    /* Create Merchant Form Styles */
    .form-section {
        margin-bottom: 24px;
    }

    .form-section-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-secondary);
        margin-bottom: 16px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
    }

    @media (max-width: 640px) {
        .form-row {
            grid-template-columns: 1fr;
        }
    }

    .domain-input-wrapper {
        display: flex;
        align-items: center;
        gap: 0;
    }

    .domain-input {
        border-radius: var(--radius-md) 0 0 var(--radius-md);
        border-right: none;
        flex: 1;
    }

    .domain-suffix {
        padding: 12px 16px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-default);
        border-left: none;
        border-radius: 0 var(--radius-md) var(--radius-md) 0;
        color: var(--text-tertiary);
        font-size: 14px;
        white-space: nowrap;
    }

    .form-hint {
        font-size: 12px;
        color: var(--text-tertiary);
        margin-top: 6px;
    }

    .page-header .btn-primary {
        display: flex;
        align-items: center;
        gap: 8px;
    }
</style>
