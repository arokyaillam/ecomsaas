<script lang="ts">
  import { page } from '$app/stores';
</script>

<div class="error-page">
  <div class="error-container">
    <div class="error-code">{$page.status}</div>
    <div class="error-divider"></div>
    <h1 class="error-title">
      {#if $page.status === 404}
        Page Not Found
      {:else if $page.status === 403}
        Access Denied
      {:else}
        Something Went Wrong
      {/if}
    </h1>
    <p class="error-message">{$page.error?.message || 'An unexpected error occurred.'}</p>
    <div class="error-actions">
      <a href="/dashboard" class="btn-primary">Go to Dashboard</a>
      <button onclick={() => window.location.reload()} class="btn-secondary">Try Again</button>
    </div>
  </div>
</div>

<style>
  .error-page {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: var(--bg-color);
    padding: 2rem;
  }

  .error-container {
    text-align: center;
    max-width: 400px;
  }

  .error-code {
    font-family: var(--font-mono);
    font-size: 6rem;
    font-weight: 700;
    color: var(--accent-primary);
    line-height: 1;
  }

  .error-divider {
    width: 60px;
    height: 2px;
    background: var(--accent-primary);
    margin: 1.5rem auto;
  }

  .error-title {
    font-family: var(--font-mono);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 0.75rem;
  }

  .error-message {
    color: var(--text-secondary);
    font-size: 0.875rem;
    margin-bottom: 2rem;
    line-height: 1.6;
  }

  .error-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
  }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    padding: 0.75rem 1.5rem;
    background: var(--accent-primary);
    color: var(--bg-color);
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    text-decoration: none;
    border: none;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .btn-primary:hover {
    opacity: 0.9;
  }

  .btn-secondary {
    display: inline-flex;
    align-items: center;
    padding: 0.75rem 1.5rem;
    background: transparent;
    color: var(--text-secondary);
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border: 1px solid var(--border-color);
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-secondary:hover {
    border-color: var(--accent-primary);
    color: var(--accent-primary);
  }
</style>