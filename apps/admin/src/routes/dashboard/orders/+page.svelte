<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { API_BASE_URL } from '$lib/api';

    interface Order {
        id: string;
        orderNumber: string;
        customerName: string;
        email: string;
        total: string;
        status: string;
        paymentStatus: string;
        fulfillmentStatus: string;
        createdAt: string;
        itemCount?: number;
    }

    let orders = $state<Order[]>([]);
    let loading = $state(true);
    let error = $state('');
    let currentPage = $state(1);
    let totalPages = $state(1);
    let totalOrders = $state(0);
    let filterStatus = $state('');
    let searchQuery = $state('');

    const statusOptions = [
        { value: '', label: 'All Statuses' },
        { value: 'pending', label: 'Pending' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'processing', label: 'Processing' },
        { value: 'shipped', label: 'Shipped' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'cancelled', label: 'Cancelled' },
    ];

    const paymentStatusColors: Record<string, string> = {
        pending: 'warning',
        paid: 'success',
        failed: 'error',
        refunded: 'neutral',
        partially_refunded: 'neutral',
    };

    const fulfillmentStatusColors: Record<string, string> = {
        unfulfilled: 'warning',
        partial: 'neutral',
        fulfilled: 'success',
    };

    const orderStatusColors: Record<string, string> = {
        pending: 'warning',
        confirmed: 'info',
        processing: 'info',
        shipped: 'success',
        delivered: 'success',
        cancelled: 'error',
    };

    onMount(() => {
        fetchOrders();
    });

    async function fetchOrders() {
        loading = true;
        error = '';

        try {
            const token = localStorage.getItem('merchant_token');
            if (!token) {
                goto('/login');
                return;
            }

            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '20',
            });

            if (filterStatus) {
                params.append('status', filterStatus);
            }

            const res = await fetch(`${API_BASE_URL}/api/orders/admin?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(data.error || `Failed to fetch orders: ${res.status}`);
            }

            const data = await res.json();
            orders = data.data || [];
            totalPages = data.pagination?.totalPages || 1;
            totalOrders = data.pagination?.total || 0;
        } catch (err: any) {
            error = err.message || 'Failed to fetch orders';
            console.error('Orders fetch error:', err);
        } finally {
            loading = false;
        }
    }

    function viewOrder(orderId: string) {
        goto(`/dashboard/orders/${orderId}`);
    }

    function formatCurrency(value: string | number): string {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(num || 0);
    }

    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    function getInitials(name: string): string {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }

    $effect(() => {
        if (filterStatus !== undefined) {
            currentPage = 1;
            fetchOrders();
        }
    });
</script>

<div class="fade-in">
    <div class="dashboard-header">
        <div>
            <h2>Orders</h2>
            <p style="color: var(--text-secondary); margin-top: 4px;">Manage and track customer orders</p>
        </div>

        <div class="header-actions">
            <button class="action-btn secondary" onclick={() => goto('/dashboard')} style="margin-right: 8px;">Back</button>
        </div>
    </div>

    <!-- Filters -->
    <div class="filters-bar" style="margin-bottom: 24px; display: flex; gap: 16px; flex-wrap: wrap;">
        <div class="filter-group">
            <label>Status</label>
            <select bind:value={filterStatus}>
                {#each statusOptions as option}
                    <option value={option.value}>{option.label}</option>
                {/each}
            </select>
        </div>

        <div class="filter-group" style="flex: 1; min-width: 200px;">
            <label>Search</label>
            <input
                type="text"
                placeholder="Search by order # or customer..."
                bind:value={searchQuery}
                onkeydown={(e) => e.key === 'Enter' && fetchOrders()}
            />
        </div>

        <div class="filter-group" style="align-self: flex-end;">
            <button class="action-btn secondary" onclick={fetchOrders}>
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

    <!-- Orders Table -->
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
        {:else if orders.length === 0}
            <div class="empty-state" style="padding: 60px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin-bottom: 16px; opacity: 0.5;">
                    <circle cx="10" cy="20.5" r="1"></circle>
                    <circle cx="18" cy="20.5" r="1"></circle>
                    <path d="M2.5 2.5h3l2.7 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6l1.6-8.4H7.1"></path>
                </svg>
                <p style="font-size: 1.1rem; color: var(--text-secondary);">No orders found</p>
                {#if filterStatus}
                    <button class="action-btn secondary" onclick={() => { filterStatus = ''; }} style="margin-top: 16px;">
                        Clear Filters
                    </button>
                {/if}
            </div>
        {:else}
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Order</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Payment</th>
                        <th>Total</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {#each orders as order}
                        <tr class="clickable" onclick={() => viewOrder(order.id)}>
                            <td>
                                <span class="order-number">#{order.orderNumber}</span>
                            </td>
                            <td>
                                <div class="customer-cell">
                                    <div class="customer-avatar">
                                        {getInitials(order.customerName || 'Guest')}
                                    </div>
                                    <div class="customer-info">
                                        <span class="customer-name">{order.customerName || 'Guest'}</span>
                                        <span class="customer-email">{order.email || 'No email'}</span>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <span class="order-date">{formatDate(order.createdAt)}</span>
                            </td>
                            <td>
                                <span class="status-badge {orderStatusColors[order.status] || 'neutral'}">
                                    {order.status}
                                </span>
                            </td>
                            <td>
                                <span class="status-badge {paymentStatusColors[order.paymentStatus] || 'neutral'}">
                                    {order.paymentStatus}
                                </span>
                            </td>
                            <td>
                                <span class="order-total">{formatCurrency(order.total)}</span>
                            </td>
                            <td>
                                <button class="action-btn-icon" onclick={(e) => { e.stopPropagation(); viewOrder(order.id); }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M5 12h14"></path>
                                        <path d="m12 5 7 7-7 7"></path>
                                    </svg>
                                </button>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>

            <!-- Pagination -->
            {#if totalPages > 1}
                <div class="pagination">
                    <span class="pagination-info">Showing {orders.length} of {totalOrders} orders</span>
                    <div class="pagination-controls">
                        <button
                            class="page-btn"
                            disabled={currentPage === 1}
                            onclick={() => { currentPage--; fetchOrders(); }}
                        >
                            ‹
                        </button>
                        {#each Array(Math.min(5, totalPages)) as _, i}
                            {@const pageNum = i + 1}
                            <button
                                class="page-btn {pageNum === currentPage ? 'active' : ''}"
                                onclick={() => { currentPage = pageNum; fetchOrders(); }}
                            >
                                {pageNum}
                            </button>
                        {/each}
                        <button
                            class="page-btn"
                            disabled={currentPage === totalPages}
                            onclick={() => { currentPage++; fetchOrders(); }}
                        >
                            ›
                        </button>
                    </div>
                </div>
            {/if}
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

    .filter-group select,
    .filter-group input {
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

    .filter-group select:focus,
    .filter-group input:focus {
        outline: none;
        border-color: var(--accent-primary);
    }

    .clickable {
        cursor: pointer;
    }

    .clickable:hover {
        background: var(--surface-elevated);
    }

    .order-number {
        font-family: var(--font-mono);
        font-weight: 600;
        color: var(--accent-primary);
    }

    .customer-cell {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .customer-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: var(--accent-primary);
        color: var(--bg-color);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 600;
    }

    .customer-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .customer-name {
        font-weight: 500;
    }

    .customer-email {
        font-size: 0.75rem;
        color: var(--text-muted);
    }

    .order-date {
        font-size: 0.875rem;
        color: var(--text-secondary);
    }

    .order-total {
        font-family: var(--font-mono);
        font-weight: 600;
    }

    .action-btn-icon {
        padding: 8px;
        background: transparent;
        border: 1px solid var(--border-color);
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .action-btn-icon:hover {
        border-color: var(--accent-primary);
        color: var(--accent-primary);
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

    .status-badge.info {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
    }

    .status-badge.neutral {
        background: rgba(100, 116, 139, 0.1);
        color: #64748b;
    }
</style>
