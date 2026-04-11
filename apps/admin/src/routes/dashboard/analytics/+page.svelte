<script lang="ts">
  import { onMount } from 'svelte';
  import { TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign, Package, ArrowUp, ArrowDown } from 'lucide-svelte';

  interface Stats {
    revenue: number;
    orders: number;
    customers: number;
    averageOrderValue: number;
  }

  interface ChartPoint {
    date: string;
    orders: number;
    revenue: number;
  }

  let loading = $state(true);
  let period: 'today' | 'week' | 'month' | 'year' = $state('week');
  let stats: Stats = $state({ revenue: 0, orders: 0, customers: 0, averageOrderValue: 0 });
  let chartData: ChartPoint[] = $state([]);
  let topProducts: any[] = $state([]);
  let prevStats: Stats = $state({ revenue: 0, orders: 0, customers: 0, averageOrderValue: 0 });

  import { API_BASE_URL } from '$lib/api';

  onMount(() => {
    fetchAnalytics();
  });

  async function fetchAnalytics() {
    loading = true;
    try {
      const token = localStorage.getItem('merchant_token');

      // Fetch current period stats
      const statsRes = await fetch(`${API_BASE_URL}/api/analytics/dashboard?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (statsRes.ok) {
        const data = await statsRes.json();
        stats = data.data;
        topProducts = data.data.topProducts || [];
      }

      // Fetch previous period stats for comparison
      const prevPeriodMap: Record<string, string> = {
        today: 'yesterday',
        week: 'prevWeek',
        month: 'prevMonth',
        year: 'prevYear',
      };
      const prevPeriod = prevPeriodMap[period] || 'week';
      const prevRes = await fetch(`${API_BASE_URL}/api/analytics/dashboard?period=${prevPeriod}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (prevRes.ok) {
        const prevData = await prevRes.json();
        prevStats = prevData.data;
      } else {
        // Fallback: if previous period endpoint doesn't support these values, use zeroes
        prevStats = { revenue: 0, orders: 0, customers: 0, averageOrderValue: 0 };
      }

      const chartRes = await fetch(`${API_BASE_URL}/api/analytics/sales-chart?period=${period === 'today' ? '24h' : period === 'week' ? '7d' : period === 'month' ? '30d' : '12m'}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (chartRes.ok) {
        const data = await chartRes.json();
        chartData = data.data;
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      loading = false;
    }
  }

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  }

  function formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US', { notation: 'compact' }).format(value);
  }

  function getPercentChange(current: number, previous: number): number {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  }

  let revenueChange = $derived(getPercentChange(stats.revenue, prevStats.revenue));
  let ordersChange = $derived(getPercentChange(stats.orders, prevStats.orders));
  let customersChange = $derived(getPercentChange(stats.customers, prevStats.customers));
  let aovChange = $derived(getPercentChange(stats.averageOrderValue, prevStats.averageOrderValue));
</script>

<div class="page-container">
  <!-- Header -->
  <div class="dashboard-header">
    <div>
      <h2>Analytics Overview</h2>
      <p>Real-time performance metrics and insights</p>
    </div>
    <div class="flex gap-2">
      {#each [['today' as const, 'Today'], ['week' as const, '7 Days'], ['month' as const, '30 Days'], ['year' as const, 'Year']] as [p, label]}
        <button
          onclick={() => { period = p; fetchAnalytics(); }}
          class="period-btn {period === p ? 'active' : ''}"
        >
          {label}
        </button>
      {/each}
    </div>
  </div>

  <!-- Stats Grid -->
  <div class="stats-grid mb-8">
    <div class="stat-card">
      <div class="stat-header">
        <div class="stat-icon">
          <DollarSign class="w-5 h-5" />
        </div>
        <span class="stat-trend {revenueChange >= 0 ? 'positive' : 'negative'}">
          {#if revenueChange >= 0}
            <ArrowUp class="w-3 h-3" />
          {:else}
            <ArrowDown class="w-3 h-3" />
          {/if}
          {Math.abs(revenueChange).toFixed(1)}%
        </span>
      </div>
      <p class="stat-label">Revenue</p>
      {#if loading}
        <div class="skeleton h-8 w-24 mt-2"></div>
      {:else}
        <p class="stat-value">{formatCurrency(stats.revenue)}</p>
      {/if}
    </div>

    <div class="stat-card">
      <div class="stat-header">
        <div class="stat-icon">
          <ShoppingCart class="w-5 h-5" />
        </div>
        <span class="stat-trend {ordersChange >= 0 ? 'positive' : 'negative'}">
          {#if ordersChange >= 0}
            <ArrowUp class="w-3 h-3" />
          {:else}
            <ArrowDown class="w-3 h-3" />
          {/if}
          {Math.abs(ordersChange).toFixed(1)}%
        </span>
      </div>
      <p class="stat-label">Orders</p>
      {#if loading}
        <div class="skeleton h-8 w-16 mt-2"></div>
      {:else}
        <p class="stat-value">{formatNumber(stats.orders)}</p>
      {/if}
    </div>

    <div class="stat-card">
      <div class="stat-header">
        <div class="stat-icon">
          <Users class="w-5 h-5" />
        </div>
        <span class="stat-trend {customersChange >= 0 ? 'positive' : 'negative'}">
          {#if customersChange >= 0}
            <ArrowUp class="w-3 h-3" />
          {:else}
            <ArrowDown class="w-3 h-3" />
          {/if}
          {Math.abs(customersChange).toFixed(1)}%
        </span>
      </div>
      <p class="stat-label">New Customers</p>
      {#if loading}
        <div class="skeleton h-8 w-16 mt-2"></div>
      {:else}
        <p class="stat-value">{formatNumber(stats.customers)}</p>
      {/if}
    </div>

    <div class="stat-card">
      <div class="stat-header">
        <div class="stat-icon">
          <Package class="w-5 h-5" />
        </div>
        <span class="stat-trend {aovChange >= 0 ? 'positive' : 'negative'}">
          {#if aovChange >= 0}
            <ArrowUp class="w-3 h-3" />
          {:else}
            <ArrowDown class="w-3 h-3" />
          {/if}
          {Math.abs(aovChange).toFixed(1)}%
        </span>
      </div>
      <p class="stat-label">Avg Order Value</p>
      {#if loading}
        <div class="skeleton h-8 w-20 mt-2"></div>
      {:else}
        <p class="stat-value">{formatCurrency(stats.averageOrderValue)}</p>
      {/if}
    </div>
  </div>

  <!-- Charts & Products Grid -->
  <div class="content-grid">
    <!-- Sales Chart -->
    <div class="panel">
      <div class="panel-header">
        <h3>
          <TrendingUp class="w-4 h-4" />
          Sales Overview
        </h3>
      </div>
      <div class="panel-content">
        {#if loading}
          <div class="skeleton h-64"></div>
        {:else if chartData.length === 0}
          <div class="h-64 flex items-center justify-center text-gray-400">
            No data available for this period
          </div>
        {:else}
          <div class="chart-container">
            <svg viewBox="0 0 800 200" class="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.4" />
                  <stop offset="100%" stop-color="#f59e0b" stop-opacity="0" />
                </linearGradient>
              </defs>

              <!-- Grid lines -->
              {#each [0, 50, 100, 150] as y}
                <line x1="0" y1={y} x2="800" y2={y} stroke="#27272a" stroke-width="1" />
              {/each}

              <!-- Revenue area -->
              {#if chartData.length > 1}
                {@const maxRevenue = Math.max(...chartData.map(d => d.revenue)) || 1}
                {@const points = chartData.map((d, i) => {
                  const x = (i / (chartData.length - 1)) * 800;
                  const y = 200 - (d.revenue / maxRevenue) * 180;
                  return `${x},${y}`;
                }).join(' ')}
                <polygon
                  points={`0,200 ${points} 800,200`}
                  fill="url(#revenueGradient)"
                />
                <polyline
                  points={points}
                  fill="none"
                  stroke="#f59e0b"
                  stroke-width="2"
                />

                <!-- Data points -->
                {#each chartData as point, i}
                  {@const x = chartData.length === 1 ? 400 : (i / (chartData.length - 1)) * 800}
                  {@const y = 200 - (point.revenue / maxRevenue) * 180}
                  <circle cx={x} cy={y} r="4" fill="#f59e0b" />
                {/each}
              {/if}
            </svg>
          </div>
          <div class="chart-labels">
            {#each chartData.filter((_, i) => i % Math.ceil(chartData.length / 6) === 0 || i === chartData.length - 1) as point}
              <span>{point.date}</span>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <!-- Top Products -->
    <div class="panel">
      <div class="panel-header">
        <h3>
          <Package class="w-4 h-4" />
          Top Products
        </h3>
      </div>
      <div class="panel-content">
        {#if loading}
          <div class="space-y-3">
            {#each Array(5) as _}
              <div class="skeleton h-12"></div>
            {/each}
          </div>
        {:else if topProducts.length === 0}
          <div class="empty-state">
            <Package class="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No sales data yet</p>
          </div>
        {:else}
          <table class="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th class="text-right">Orders</th>
                <th class="text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {#each topProducts as product}
                <tr>
                  <td>
                    <div class="product-cell">
                      {#if product.images}
                        <img src={product.images.split(',')[0]} alt={product.title} class="product-image" />
                      {:else}
                        <div class="product-image flex items-center justify-center bg-surface-elevated">
                          <Package class="w-4 h-4 text-muted" />
                        </div>
                      {/if}
                      <span class="font-medium">{product.title}</span>
                    </div>
                  </td>
                  <td class="text-right">{product.order_count || 0}</td>
                  <td class="text-right font-mono">{formatCurrency(product.revenue || 0)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .period-btn {
    padding: 10px 18px;
    background: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
    font-size: 0.8125rem;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .period-btn:hover {
    border-color: var(--accent-primary);
    color: var(--accent-primary);
  }

  .period-btn.active {
    background: var(--accent-primary);
    border-color: var(--accent-primary);
    color: var(--bg-color);
  }

  .chart-container {
    height: 200px;
    position: relative;
  }

  .chart-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 16px;
    font-size: 0.6875rem;
    color: var(--text-muted);
    font-family: var(--font-mono);
  }

  .text-right {
    text-align: right;
  }

  .text-muted {
    color: var(--text-muted);
  }

  .bg-surface-elevated {
    background: var(--surface-elevated);
  }
</style>
