<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Percent, Tag, Calendar, Trash2, Edit, Plus, Search, Filter } from 'lucide-svelte';

  interface Coupon {
    id: string;
    code: string;
    type: 'percentage' | 'fixed_amount';
    value: number;
    description?: string;
    minOrderAmount?: number;
    maxDiscountAmount?: number;
    usageLimit?: number;
    usageCount: number;
    isActive: boolean;
    startsAt?: string;
    expiresAt?: string;
    createdAt: string;
  }

  let coupons: Coupon[] = $state([]);
  let loading = $state(true);
  let error = $state('');
  let statusFilter = $state('');
  let searchQuery = $state('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  onMount(async () => {
    await fetchCoupons();
  });

  async function fetchCoupons() {
    try {
      const token = localStorage.getItem('merchant_token');
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`${API_URL}/api/coupons/admin?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        coupons = data.data;
      } else {
        error = 'Failed to load coupons';
      }
    } catch (err) {
      error = 'Failed to load coupons';
    } finally {
      loading = false;
    }
  }

  async function deleteCoupon(couponId: string) {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const token = localStorage.getItem('merchant_token');
      const res = await fetch(`${API_URL}/api/coupons/admin/${couponId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        coupons = coupons.filter(c => c.id !== couponId);
      } else {
        error = 'Failed to delete coupon';
      }
    } catch (err) {
      error = 'Failed to delete coupon';
    }
  }

  function getStatus(coupon: Coupon): string {
    if (!coupon.isActive) return 'inactive';
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return 'expired';
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return 'exhausted';
    return 'active';
  }

  function getStatusClass(status: string): string {
    switch (status) {
      case 'active': return 'status-badge published';
      case 'inactive': return 'status-badge draft';
      case 'expired': return 'status-badge error';
      case 'exhausted': return 'status-badge warning';
      default: return 'status-badge draft';
    }
  }

  let filteredCoupons = $derived(coupons.filter(c =>
    searchQuery === '' ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ));

  let activeCount = $derived(coupons.filter(c => getStatus(c) === 'active').length);
  let expiredCount = $derived(coupons.filter(c => getStatus(c) === 'expired').length);
  let totalUsage = $derived(coupons.reduce((sum, c) => sum + c.usageCount, 0));
</script>

<div class="page-container">
  <div class="dashboard-header">
    <div>
      <h2>Coupons</h2>
      <p>Manage discount codes and promotions</p>
    </div>
    <button
      onclick={() => goto('/dashboard/coupons/new')}
      class="action-btn primary"
    >
      <Plus class="w-4 h-4" />
      Create Coupon
    </button>
  </div>

  <!-- Stats -->
  <div class="stats-grid mb-8">
    <div class="stat-card">
      <div class="flex items-center gap-4">
        <div class="stat-icon">
          <Tag class="w-5 h-5" />
        </div>
        <div>
          <p class="stat-label">Active Coupons</p>
          <p class="stat-value">{activeCount}</p>
        </div>
      </div>
    </div>

    <div class="stat-card">
      <div class="flex items-center gap-4">
        <div class="stat-icon">
          <Calendar class="w-5 h-5" />
        </div>
        <div>
          <p class="stat-label">Expired</p>
          <p class="stat-value">{expiredCount}</p>
        </div>
      </div>
    </div>

    <div class="stat-card">
      <div class="flex items-center gap-4">
        <div class="stat-icon">
          <Percent class="w-5 h-5" />
        </div>
        <div>
          <p class="stat-label">Total Usage</p>
          <p class="stat-value">{totalUsage}</p>
        </div>
      </div>
    </div>
  </div>

  {#if error}
    <div class="error-banner">{error}</div>
  {/if}

  <!-- Filters -->
  <div class="panel mb-6">
    <div class="panel-content">
      <div class="flex gap-4 items-center">
        <div class="flex-1 relative">
          <Search class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search coupons..."
            class="search-input"
          />
        </div>
        <div class="flex items-center gap-3">
          <Filter class="w-4 h-4 text-muted" />
          <select bind:value={statusFilter} onchange={fetchCoupons}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>
    </div>
  </div>

  <!-- Coupons Table -->
  <div class="panel">
    {#if loading}
      <div class="panel-content">
        <div class="p-8 text-center text-muted">Loading coupons...</div>
      </div>
    {:else if filteredCoupons.length === 0}
      <div class="panel-content">
        <div class="empty-state">
          <Tag class="w-12 h-12 mb-4 opacity-30" />
          <p class="mb-4">No coupons found</p>
          <button
            onclick={() => goto('/dashboard/coupons/new')}
            class="action-btn primary"
          >
            Create your first coupon
          </button>
        </div>
      </div>
    {:else}
      <table class="data-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Type</th>
            <th>Value</th>
            <th>Usage</th>
            <th>Status</th>
            <th>Expires</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredCoupons as coupon}
            <tr>
              <td>
                <div class="font-medium">{coupon.code}</div>
                {#if coupon.description}
                  <div class="text-sm text-muted">{coupon.description}</div>
                {/if}
              </td>
              <td>
                <span class="text-sm">
                  {coupon.type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                </span>
              </td>
              <td class="font-mono">
                {#if coupon.type === 'percentage'}
                  {coupon.value}%
                {:else}
                  ${coupon.value}
                {/if}
              </td>
              <td>
                <div class="text-sm">
                  {coupon.usageCount}
                  {#if coupon.usageLimit}
                    / {coupon.usageLimit}
                  {/if}
                </div>
                {#if coupon.usageLimit}
                  <div class="usage-bar">
                    <div
                      class="usage-fill"
                      style="width: {Math.min(100, (coupon.usageCount / coupon.usageLimit) * 100)}%"
                    />
                  </div>
                {/if}
              </td>
              <td>
                <span class={getStatusClass(getStatus(coupon))}>
                  {getStatus(coupon)}
                </span>
              </td>
              <td class="text-sm text-muted">
                {#if coupon.expiresAt}
                  {new Date(coupon.expiresAt).toLocaleDateString()}
                {:else}
                  No expiry
                {/if}
              </td>
              <td class="text-right">
                <div class="flex justify-end gap-2">
                  <button
                    onclick={() => goto(`/dashboard/coupons/${coupon.id}/edit`)}
                    class="icon-btn"
                    title="Edit"
                  >
                    <Edit class="w-4 h-4" />
                  </button>
                  <button
                    onclick={() => deleteCoupon(coupon.id)}
                    class="icon-btn danger"
                    title="Delete"
                  >
                    <Trash2 class="w-4 h-4" />
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
  .error-banner {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: var(--error);
    padding: 12px 16px;
    margin-bottom: 24px;
    font-size: 0.875rem;
  }

  .search-input {
    width: 100%;
    padding: 12px 16px 12px 44px;
    background: var(--surface-color);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    font-size: 0.9375rem;
    outline: none;
    transition: all 0.25s ease;
  }

  .search-input:focus {
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.2), 0 0 20px rgba(245, 158, 11, 0.1);
  }

  select {
    padding: 12px 36px 12px 16px;
    background: var(--surface-color);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    font-size: 0.9375rem;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
  }

  select:focus {
    border-color: var(--accent-primary);
    outline: none;
  }

  .usage-bar {
    width: 80px;
    height: 4px;
    background: var(--border-color);
    margin-top: 8px;
    overflow: hidden;
  }

  .usage-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
    transition: width 0.3s ease;
  }

  .icon-btn {
    padding: 8px;
    background: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .icon-btn:hover {
    border-color: var(--accent-secondary);
    color: var(--accent-secondary);
    box-shadow: 0 0 15px var(--accent-secondary-glow);
  }

  .icon-btn.danger:hover {
    border-color: var(--error);
    color: var(--error);
    box-shadow: 0 0 15px rgba(239, 68, 68, 0.3);
  }

  .text-right {
    text-align: right;
  }

  .text-muted {
    color: var(--text-muted);
  }

  .text-sm {
    font-size: 0.8125rem;
  }

  .font-medium {
    font-weight: 500;
  }

  .font-mono {
    font-family: var(--font-mono);
  }

  .mb-4 {
    margin-bottom: 16px;
  }

  .mb-6 {
    margin-bottom: 24px;
  }

  .mb-8 {
    margin-bottom: 32px;
  }

  .mt-8 {
    margin-top: 32px;
  }

  .p-8 {
    padding: 32px;
  }

  .gap-4 {
    gap: 16px;
  }

  .items-center {
    align-items: center;
  }

  .flex {
    display: flex;
  }

  .flex-1 {
    flex: 1;
  }

  .justify-end {
    justify-content: flex-end;
  }

  .relative {
    position: relative;
  }

  .absolute {
    position: absolute;
  }

  .left-4 {
    left: 16px;
  }

  .top-1\/2 {
    top: 50%;
  }

  .-translate-y-1\/2 {
    transform: translateY(-50%);
  }

  .opacity-30 {
    opacity: 0.3;
  }
</style>
