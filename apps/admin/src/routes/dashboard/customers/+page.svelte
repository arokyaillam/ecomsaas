<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { API_BASE_URL } from '$lib/api';

    interface Customer {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string;
        isVerified: boolean;
        marketingEmails: boolean;
        lastLoginAt: string;
        createdAt: string;
        orderCount: number;
        totalSpent: number;
    }

    let customers = $state<Customer[]>([]);
    let loading = $state(true);
    let error = $state('');
    let currentPage = $state(1);
    let totalPages = $state(1);
    let totalCustomers = $state(0);
    let searchQuery = $state('');

    onMount(() => {
        fetchCustomers();
    });

    async function fetchCustomers() {
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

            if (searchQuery) {
                params.append('search', searchQuery);
            }

            const res = await fetch(`${API_BASE_URL}/api/customers/admin?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(data.error || `Failed to fetch customers: ${res.status}`);
            }

            const data = await res.json();
            customers = data.data || [];
            totalPages = data.pagination?.totalPages || 1;
            totalCustomers = data.pagination?.total || 0;
        } catch (err: any) {
            error = err.message || 'Failed to fetch customers';
            console.error('Customers fetch error:', err);
        } finally {
            loading = false;
        }
    }

    function viewCustomer(customerId: string) {
        goto(`/dashboard/customers/${customerId}`);
    }

    function formatCurrency(value: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(value || 0);
    }

    function formatDate(dateString: string): string {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    }

    function getInitials(firstName: string, lastName: string): string {
        const first = firstName?.[0] || '';
        const last = lastName?.[0] || '';
        return (first + last).toUpperCase() || '?';
    }

    function getFullName(customer: Customer): string {
        if (customer.firstName && customer.lastName) {
            return `${customer.firstName} ${customer.lastName}`;
        }
        return customer.firstName || customer.lastName || 'Guest';
    }

    $effect(() => {
        if (searchQuery === '') {
            currentPage = 1;
            fetchCustomers();
        }
    });
</script>

<div class="fade-in">
    <div class="dashboard-header">
        <div>
            <h2>Customers</h2>
            <p style="color: var(--text-secondary); margin-top: 4px;">View and manage customer accounts</p>
        </div>

        <div class="header-actions">
            <button class="action-btn secondary" onclick={() => goto('/dashboard')} style="margin-right: 8px;">Back</button>
        </div>
    </div>

    <!-- Filters -->
    <div class="filters-bar" style="margin-bottom: 24px; display: flex; gap: 16px; flex-wrap: wrap;">
        <div class="filter-group" style="flex: 1; min-width: 200px;">
            <label>Search</label>
            <div style="display: flex; gap: 8px;">
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    bind:value={searchQuery}
                    onkeydown={(e) => e.key === 'Enter' && fetchCustomers()}
                />
                <button class="action-btn secondary" onclick={fetchCustomers}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="m21 21-4.3-4.3"></path>
                        <circle cx="11" cy="11" r="8"></circle>
                    </svg>
                </button>
            </div>
        </div>

        <div class="filter-group" style="align-self: flex-end;">
            <button class="action-btn secondary" onclick={fetchCustomers}>
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

    <!-- Stats Cards -->
    {#if !loading && !error}
        <div class="stats-grid" style="margin-bottom: 24px;">
            <div class="stat-card">
                <div class="stat-value">{totalCustomers}</div>
                <div class="stat-label">Total Customers</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">{customers.filter(c => c.isVerified).length}</div>
                <div class="stat-label">Verified</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">{customers.reduce((sum, c) => sum + c.orderCount, 0)}</div>
                <div class="stat-label">Total Orders</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">{formatCurrency(customers.reduce((sum, c) => sum + c.totalSpent, 0))}</div>
                <div class="stat-label">Total Revenue</div>
            </div>
        </div>
    {/if}

    <!-- Customers Table -->
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
        {:else if customers.length === 0}
            <div class="empty-state" style="padding: 60px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin-bottom: 16px; opacity: 0.5;">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                </svg>
                <p style="font-size: 1.1rem; color: var(--text-secondary);">No customers found</p>
                {#if searchQuery}
                    <button class="action-btn secondary" onclick={() => { searchQuery = ''; fetchCustomers(); }} style="margin-top: 16px;">
                        Clear Search
                    </button>
                {/if}
            </div>
        {:else}
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Customer</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Orders</th>
                        <th>Total Spent</th>
                        <th>Joined</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {#each customers as customer}
                        <tr class="clickable" onclick={() => viewCustomer(customer.id)}>
                            <td>
                                <div class="customer-cell">
                                    <div class="customer-avatar">
                                        {getInitials(customer.firstName, customer.lastName)}
                                    </div>
                                    <span class="customer-name">{getFullName(customer)}</span>
                                </div>
                            </td>
                            <td>
                                <span class="customer-email">{customer.email}</span>
                            </td>
                            <td>
                                <span class="customer-phone">{customer.phone || '—'}</span>
                            </td>
                            <td>
                                <span class="stat-badge">{customer.orderCount}</span>
                            </td>
                            <td>
                                <span class="customer-spent">{formatCurrency(customer.totalSpent)}</span>
                            </td>
                            <td>
                                <span class="customer-date">{formatDate(customer.createdAt)}</span>
                            </td>
                            <td>
                                {#if customer.isVerified}
                                    <span class="status-badge success">Verified</span>
                                {:else}
                                    <span class="status-badge warning">Pending</span>
                                {/if}
                            </td>
                            <td>
                                <button class="action-btn-icon" onclick={(e) => { e.stopPropagation(); viewCustomer(customer.id); }}>
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
                    <span class="pagination-info">Showing {customers.length} of {totalCustomers} customers</span>
                    <div class="pagination-controls">
                        <button
                            class="page-btn"
                            disabled={currentPage === 1}
                            onclick={() => { currentPage--; fetchCustomers(); }}
                        >
                            ‹
                        </button>
                        {#each Array(Math.min(5, totalPages)) as _, i}
                            {@const pageNum = i + 1}
                            <button
                                class="page-btn {pageNum === currentPage ? 'active' : ''}"
                                onclick={() => { currentPage = pageNum; fetchCustomers(); }}
                            >
                                {pageNum}
                            </button>
                        {/each}
                        <button
                            class="page-btn"
                            disabled={currentPage === totalPages}
                            onclick={() => { currentPage++; fetchCustomers(); }}
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

    .filter-group input {
        padding: 10px 14px;
        background: var(--bg-color);
        border: 1px solid var(--border-color);
        color: var(--text-primary);
        font-size: 0.875rem;
        min-width: 250px;
    }

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

    .customer-name {
        font-weight: 500;
    }

    .customer-email {
        font-size: 0.875rem;
        color: var(--text-secondary);
    }

    .customer-phone {
        font-size: 0.875rem;
        color: var(--text-secondary);
    }

    .customer-spent {
        font-family: var(--font-mono);
        font-weight: 600;
        color: var(--text-primary);
    }

    .customer-date {
        font-size: 0.875rem;
        color: var(--text-secondary);
    }

    .stat-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 2px 10px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
        background: var(--surface-elevated);
        color: var(--text-secondary);
        min-width: 32px;
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
</style>
