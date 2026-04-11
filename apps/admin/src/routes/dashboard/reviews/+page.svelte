<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Star, Check, X, MessageSquare, Trash2, Filter } from 'lucide-svelte';
  import { API_BASE_URL } from '$lib/api';

  interface Review {
    id: string;
    productId: string;
    customerId: string;
    rating: number;
    title: string;
    content: string;
    isApproved: boolean;
    isVerified: boolean;
    helpfulCount: number;
    response?: string;
    createdAt: string;
    product: {
      titleEn: string;
      images: string;
    };
    customer: {
      name: string;
      email: string;
    };
  }

  let reviews: Review[] = $state([]);
  let loading = $state(true);
  let error = $state('');
  let statusFilter = $state('');
  let respondingTo: string | null = $state(null);
  let responseText = $state('');


  onMount(async () => {
    await fetchReviews();
  });

  async function fetchReviews() {
    try {
      const token = localStorage.getItem('merchant_token');
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`${API_BASE_URL}/api/reviews/admin?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        reviews = data.data;
      } else {
        error = 'Failed to load reviews';
      }
    } catch (err) {
      error = 'Failed to load reviews';
    } finally {
      loading = false;
    }
  }

  async function approveReview(reviewId: string, isApproved: boolean) {
    try {
      const token = localStorage.getItem('merchant_token');
      const res = await fetch(`${API_BASE_URL}/api/reviews/admin/${reviewId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isApproved }),
      });

      if (res.ok) {
        reviews = reviews.map(r => r.id === reviewId ? { ...r, isApproved } : r);
      }
    } catch (err) {
      console.error('Failed to update review:', err);
    }
  }

  async function submitResponse(reviewId: string) {
    if (!responseText.trim()) return;

    try {
      const token = localStorage.getItem('merchant_token');
      const res = await fetch(`${API_BASE_URL}/api/reviews/admin/${reviewId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ response: responseText }),
      });

      if (res.ok) {
        reviews = reviews.map(r =>
          r.id === reviewId ? { ...r, response: responseText } : r
        );
        respondingTo = null;
        responseText = '';
      }
    } catch (err) {
      console.error('Failed to submit response:', err);
    }
  }

  async function deleteReview(reviewId: string) {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      const token = localStorage.getItem('merchant_token');
      const res = await fetch(`${API_BASE_URL}/api/reviews/admin/${reviewId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        reviews = reviews.filter(r => r.id !== reviewId);
      }
    } catch (err) {
      console.error('Failed to delete review:', err);
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  let pendingCount = $derived(reviews.filter(r => !r.isApproved).length);
  let approvedCount = $derived(reviews.filter(r => r.isApproved).length);
  let averageRating = $derived(reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0');
</script>

<div class="page-container">
  <!-- Header -->
  <div class="dashboard-header">
    <div>
      <h2>Reviews</h2>
      <p>Manage customer reviews and feedback</p>
    </div>
  </div>

  <!-- Stats -->
  <div class="stats-grid mb-8">
    <div class="stat-card">
      <div class="flex items-center gap-4">
        <div class="stat-icon star-icon">
          <Star class="w-5 h-5" />
        </div>
        <div>
          <p class="stat-label">Average Rating</p>
          <p class="stat-value">{averageRating}</p>
        </div>
      </div>
    </div>

    <div class="stat-card">
      <div class="flex items-center gap-4">
        <div class="stat-icon">
          <MessageSquare class="w-5 h-5" />
        </div>
        <div>
          <p class="stat-label">Total Reviews</p>
          <p class="stat-value">{reviews.length}</p>
        </div>
      </div>
    </div>

    <div class="stat-card">
      <div class="flex items-center gap-4">
        <div class="stat-icon success-icon">
          <Check class="w-5 h-5" />
        </div>
        <div>
          <p class="stat-label">Approved</p>
          <p class="stat-value">{approvedCount}</p>
        </div>
      </div>
    </div>

    <div class="stat-card">
      <div class="flex items-center gap-4">
        <div class="stat-icon warning-icon">
          <X class="w-5 h-5" />
        </div>
        <div>
          <p class="stat-label">Pending</p>
          <p class="stat-value">{pendingCount}</p>
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
      <div class="flex items-center gap-3">
        <Filter class="w-4 h-4 text-muted" />
        <select bind:value={statusFilter} onchange={fetchReviews}>
          <option value="">All Reviews</option>
          <option value="pending">Pending Approval</option>
        </select>
      </div>
    </div>
  </div>

  <!-- Reviews List -->
  <div class="panel">
    {#if loading}
      <div class="panel-content">
        <div class="p-8 text-center text-muted">Loading reviews...</div>
      </div>
    {:else if reviews.length === 0}
      <div class="panel-content">
        <div class="empty-state">
          <MessageSquare class="w-12 h-12 mb-4 opacity-30" />
          <p>No reviews yet</p>
        </div>
      </div>
    {:else}
      <div class="review-list">
        {#each reviews as review}
          <div class="review-item">
            <div class="flex items-start gap-4">
              <!-- Product Image -->
              {#if review.product?.images}
                <img
                  src={review.product.images.split(',')[0]}
                  alt={review.product.titleEn}
                  class="product-thumbnail"
                />
              {:else}
                <div class="product-thumbnail flex items-center justify-center bg-surface-elevated">
                  <MessageSquare class="w-5 h-5 text-muted" />
                </div>
              {/if}

              <div class="flex-1">
                <!-- Review Header -->
                <div class="review-header">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <div class="stars">
                        {#each [1, 2, 3, 4, 5] as star}
                          <Star class="star-icon-sm {star <= review.rating ? 'filled' : 'empty'}" />
                        {/each}
                      </div>
                      <span class={review.isApproved ? 'status-badge published' : 'status-badge warning'}>
                        {review.isApproved ? 'Approved' : 'Pending'}
                      </span>
                      {#if review.isVerified}
                        <span class="status-badge info">Verified</span>
                      {/if}
                    </div>
                    <p class="review-title">{review.title}</p>
                    <p class="review-meta">
                      {review.product?.titleEn} • {review.customer?.name} • {formatDate(review.createdAt)}
                    </p>
                  </div>

                  <!-- Actions -->
                  <div class="flex items-center gap-2">
                    {#if !review.isApproved}
                      <button
                        onclick={() => approveReview(review.id, true)}
                        class="icon-btn success"
                        title="Approve"
                      >
                        <Check class="w-4 h-4" />
                      </button>
                    {:else}
                      <button
                        onclick={() => approveReview(review.id, false)}
                        class="icon-btn warning"
                        title="Unapprove"
                      >
                        <X class="w-4 h-4" />
                      </button>
                    {/if}
                    <button
                      onclick={() => { respondingTo = respondingTo === review.id ? null : review.id; }}
                      class="icon-btn"
                      title="Respond"
                    >
                      <MessageSquare class="w-4 h-4" />
                    </button>
                    <button
                      onclick={() => deleteReview(review.id)}
                      class="icon-btn danger"
                      title="Delete"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <!-- Review Content -->
                <p class="review-content">{review.content}</p>

                {#if review.response}
                  <div class="response-box">
                    <p class="response-label">Store Response:</p>
                    <p class="response-text">{review.response}</p>
                  </div>
                {/if}

                {#if respondingTo === review.id}
                  <div class="response-form">
                    <textarea
                      bind:value={responseText}
                      placeholder="Write a response..."
                      rows={3}
                      class="response-input"
                    />
                    <div class="flex gap-2 mt-3">
                      <button
                        onclick={() => submitResponse(review.id)}
                        class="action-btn primary"
                      >
                        Submit Response
                      </button>
                      <button
                        onclick={() => { respondingTo = null; responseText = ''; }}
                        class="action-btn secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
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

  .text-muted {
    color: var(--text-muted);
  }

  .bg-surface-elevated {
    background: var(--surface-elevated);
  }

  .star-icon {
    color: #fbbf24;
    border-color: rgba(251, 191, 36, 0.3);
  }

  .success-icon {
    color: var(--success);
    border-color: rgba(16, 185, 129, 0.3);
  }

  .warning-icon {
    color: var(--accent-primary);
    border-color: rgba(245, 158, 11, 0.3);
  }

  .review-list {
    display: flex;
    flex-direction: column;
  }

  .review-item {
    padding: 24px;
    border-bottom: 1px solid var(--border-subtle);
    transition: all 0.2s ease;
  }

  .review-item:last-child {
    border-bottom: none;
  }

  .review-item:hover {
    background: linear-gradient(90deg, rgba(245, 158, 11, 0.02) 0%, transparent 50%);
  }

  .product-thumbnail {
    width: 56px;
    height: 56px;
    border-radius: 0;
    object-fit: cover;
    border: 1px solid var(--border-color);
    background: var(--surface-elevated);
    flex-shrink: 0;
  }

  .review-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .stars {
    display: flex;
    gap: 2px;
  }

  :global(.star-icon-sm) {
    width: 14px;
    height: 14px;
  }

  :global(.star-icon-sm.filled) {
    fill: #fbbf24;
    color: #fbbf24;
  }

  :global(.star-icon-sm.empty) {
    color: var(--border-color);
  }

  :global(.status-badge.info) {
    background: rgba(59, 130, 246, 0.1);
    color: #60a5fa;
    border-color: rgba(59, 130, 246, 0.4);
  }

  .review-title {
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 4px;
  }

  .review-meta {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-family: var(--font-mono);
  }

  .review-content {
    color: var(--text-secondary);
    line-height: 1.6;
    margin-bottom: 16px;
  }

  .response-box {
    margin-top: 16px;
    padding: 16px;
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(6, 182, 212, 0.02) 100%);
    border: 1px solid rgba(6, 182, 212, 0.2);
    border-left: 2px solid var(--accent-secondary);
  }

  .response-label {
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--accent-secondary);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-family: var(--font-mono);
    margin-bottom: 8px;
  }

  .response-text {
    font-size: 0.875rem;
    color: var(--text-secondary);
    line-height: 1.5;
  }

  .response-form {
    margin-top: 16px;
  }

  .response-input {
    width: 100%;
    background: var(--surface-color);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    padding: 12px 14px;
    font-family: var(--font-display);
    font-size: 0.9375rem;
    outline: none;
    resize: vertical;
    transition: all 0.25s ease;
  }

  .response-input:focus {
    border-color: var(--accent-secondary);
    box-shadow: 0 0 0 1px rgba(6, 182, 212, 0.2), 0 0 20px rgba(6, 182, 212, 0.1);
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

  .icon-btn.success:hover {
    border-color: var(--success);
    color: var(--success);
    box-shadow: 0 0 15px rgba(16, 185, 129, 0.3);
  }

  .icon-btn.warning:hover {
    border-color: var(--accent-primary);
    color: var(--accent-primary);
    box-shadow: 0 0 15px var(--accent-primary-glow);
  }

  .icon-btn.danger:hover {
    border-color: var(--error);
    color: var(--error);
    box-shadow: 0 0 15px rgba(239, 68, 68, 0.3);
  }

  .flex {
    display: flex;
  }

  .flex-1 {
    flex: 1;
  }

  .items-center {
    align-items: center;
  }

  .items-start {
    align-items: flex-start;
  }

  .justify-between {
    justify-content: space-between;
  }

  .gap-2 {
    gap: 8px;
  }

  .gap-3 {
    gap: 12px;
  }

  .gap-4 {
    gap: 16px;
  }

  .mb-1 {
    margin-bottom: 4px;
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

  .mt-3 {
    margin-top: 12px;
  }

  .mt-16 {
    margin-top: 16px;
  }

  .p-8 {
    padding: 32px;
  }

  .opacity-30 {
    opacity: 0.3;
  }

  .w-4 {
    width: 16px;
  }

  .h-4 {
    height: 16px;
  }

  .w-5 {
    width: 20px;
  }

  .h-5 {
    height: 20px;
  }

  .w-12 {
    width: 48px;
  }

  .h-12 {
    height: 48px;
  }
</style>
