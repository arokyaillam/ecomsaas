<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { API_BASE_URL } from '$lib/api';

    interface Address {
        id: string;
        name: string;
        firstName: string;
        lastName: string;
        addressLine1: string;
        addressLine2: string | null;
        city: string;
        state: string | null;
        country: string;
        postalCode: string;
        phone: string | null;
        isDefault: boolean;
    }

    interface CustomerOrder {
        id: string;
        orderNumber: string;
        total: string;
        status: string;
        paymentStatus: string;
        createdAt: string;
    }

    interface Customer {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        avatarUrl: string | null;
        isVerified: boolean;
        marketingEmails: boolean;
        createdAt: string;
        lastLoginAt: string | null;
        addresses: Address[];
        orders: CustomerOrder[];
        stats: {
            orderCount: number;
            totalSpent: number;
        };
    }

    let customer = $state<Customer | null>(null);
    let loading = $state(true);
    let error = $state('');

    const customerId = $page.params.id;

    const statusColors: Record<string, string> = {
        pending: 'warning',
        confirmed: 'info',
        processing: 'info',
        shipped: 'success',
        delivered: 'success',
        cancelled: 'error',
    };

    const paymentColors: Record<string, string> = {
        pending: 'warning',
        paid: 'success',
        failed: 'error',
        refunded: 'neutral',
    };

    onMount(() => {
        fetchCustomer();
    });

    async function fetchCustomer() {
        loading = true;
        error = '';
        try {
            const token = localStorage.getItem('merchant_token');
            if (!token) { goto('/login'); return; }

            const res = await fetch(`${API_BASE_URL}/api/customers/admin/${customerId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(data.error || 'Failed to fetch customer');
            }

            const data = await res.json();
            customer = data.data;
        } catch (err: any) {
            error = err.message || 'Failed to fetch customer';
        } finally {
            loading = false;
        }
    }

    function formatCurrency(value: number | string): string {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num || 0);
    }

    function formatDate(dateString: string | null): string {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
        });
    }

    function formatDateTime(dateString: string): string {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
        });
    }

    function getInitials(firstName: string, lastName: string): string {
        const first = firstName?.[0] || '';
        const last = lastName?.[0] || '';
        return (first + last).toUpperCase() || '?';
    }
</script>

<div class="fade-in">
    <div class="dashboard-header">
        <div style="display: flex; align-items: center; gap: 12px;">
            <button class="action-btn secondary" onclick={() => goto('/dashboard/customers')}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg>
            </button>
            <div>
                <h2>{customer ? `${customer.firstName} ${customer.lastName}` : 'Customer'}</h2>
                <p style="color: var(--text-secondary); margin-top: 4px;">{customer?.email || 'Loading...'}</p>
            </div>
        </div>
    </div>

    {#if error}
        <div class="error-message" style="padding: 20px; color: var(--error);">{error}</div>
    {/if}

    {#if loading}
        <div style="padding: 40px; text-align: center;"><div class="skeleton" style="width: 100%; height: 400px;"></div></div>
    {:else if customer}
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
            <!-- Left Column -->
            <div style="display: flex; flex-direction: column; gap: 24px;">
                <!-- Customer Profile -->
                <div class="glass-card" style="padding: 24px;">
                    <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px;">
                        <div style="width: 56px; height: 56px; border-radius: 50%; background: var(--accent-primary); color: var(--bg-color); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: 600;">
                            {getInitials(customer.firstName, customer.lastName)}
                        </div>
                        <div>
                            <h3 style="margin: 0;">{customer.firstName} {customer.lastName}</h3>
                            <p style="color: var(--text-secondary); margin: 0;">{customer.email}</p>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label style="font-size: 0.75rem; color: var(--text-secondary);">Phone</label>
                            <p>{customer.phone || 'N/A'}</p>
                        </div>
                        <div>
                            <label style="font-size: 0.75rem; color: var(--text-secondary);">Verified</label>
                            <p>{customer.isVerified ? '<span class="status-badge success">Yes</span>' : '<span class="status-badge warning">No</span>'}</p>
                        </div>
                        <div>
                            <label style="font-size: 0.75rem; color: var(--text-secondary);">Joined</label>
                            <p>{formatDate(customer.createdAt)}</p>
                        </div>
                        <div>
                            <label style="font-size: 0.75rem; color: var(--text-secondary);">Last Login</label>
                            <p>{formatDate(customer.lastLoginAt)}</p>
                        </div>
                        <div>
                            <label style="font-size: 0.75rem; color: var(--text-secondary);">Marketing Emails</label>
                            <p>{customer.marketingEmails ? 'Subscribed' : 'Unsubscribed'}</p>
                        </div>
                    </div>
                </div>

                <!-- Stats -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div class="glass-card" style="padding: 20px; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; font-family: var(--font-mono);">{customer.stats?.orderCount || 0}</div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary);">Total Orders</div>
                    </div>
                    <div class="glass-card" style="padding: 20px; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; font-family: var(--font-mono);">{formatCurrency(customer.stats?.totalSpent || 0)}</div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary);">Total Spent</div>
                    </div>
                </div>

                <!-- Addresses -->
                <div class="glass-card" style="padding: 24px;">
                    <h3 style="margin-bottom: 16px;">Addresses</h3>
                    {#if customer.addresses && customer.addresses.length > 0}
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            {#each customer.addresses as address}
                                <div style="padding: 12px; background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 8px;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                        <span style="font-weight: 500;">{address.name}</span>
                                        {#if address.isDefault}
                                            <span class="status-badge success" style="font-size: 0.7rem;">Default</span>
                                        {/if}
                                    </div>
                                    <p style="color: var(--text-secondary); font-size: 0.875rem;">{address.firstName} {address.lastName}</p>
                                    <p style="color: var(--text-secondary); font-size: 0.875rem;">{address.addressLine1}</p>
                                    {#if address.addressLine2}
                                        <p style="color: var(--text-secondary); font-size: 0.875rem;">{address.addressLine2}</p>
                                    {/if}
                                    <p style="color: var(--text-secondary); font-size: 0.875rem;">{address.city}, {address.state || ''} {address.postalCode}</p>
                                    <p style="color: var(--text-secondary); font-size: 0.875rem;">{address.country}</p>
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <p style="color: var(--text-secondary); text-align: center; padding: 20px;">No addresses on file</p>
                    {/if}
                </div>
            </div>

            <!-- Right Column: Orders -->
            <div style="display: flex; flex-direction: column; gap: 24px;">
                <div class="glass-card" style="padding: 24px;">
                    <h3 style="margin-bottom: 16px;">Recent Orders</h3>
                    {#if customer.orders && customer.orders.length > 0}
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Order</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Payment</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each customer.orders as order}
                                    <tr class="clickable" onclick={() => goto(`/dashboard/orders/${order.id}`)}>
                                        <td><span style="font-family: var(--font-mono); font-weight: 600; color: var(--accent-primary);">#{order.orderNumber}</span></td>
                                        <td><span style="font-size: 0.875rem; color: var(--text-secondary);">{formatDate(order.createdAt)}</span></td>
                                        <td><span class="status-badge {statusColors[order.status] || 'neutral'}">{order.status}</span></td>
                                        <td><span class="status-badge {paymentColors[order.paymentStatus] || 'neutral'}">{order.paymentStatus}</span></td>
                                        <td style="font-family: var(--font-mono); font-weight: 600;">{formatCurrency(order.total)}</td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    {:else}
                        <p style="color: var(--text-secondary); text-align: center; padding: 20px;">No orders yet</p>
                    {/if}
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .clickable { cursor: pointer; }
    .clickable:hover { background: var(--surface-elevated); }

    .status-badge {
        display: inline-flex;
        align-items: center;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: capitalize;
    }

    .status-badge.success { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
    .status-badge.warning { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
    .status-badge.error { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
    .status-badge.info { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
    .status-badge.neutral { background: rgba(100, 116, 139, 0.1); color: #64748b; }
</style>