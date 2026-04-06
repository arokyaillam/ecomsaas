<script lang="ts">
    import { goto } from '$app/navigation';
</script>

<div class="fade-in">
    <div class="dashboard-header">
        <div>
            <h2>Orders</h2>
            <p style="color: var(--text-secondary); margin-top: 4px;">Manage customer orders</p>
        </div>
        
        <div class="header-actions">
            <button class="action-btn secondary" onclick={() => goto('/dashboard')} style="margin-right: 8px;">Back</button>
        </div>
    </div>

    <div class="glass-card dashboard" style="text-align: center; padding: 60px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin-bottom: 16px; opacity: 0.5;">
            <circle cx="10" cy="20.5" r="1"></circle>
            <circle cx="18" cy="20.5" r="1"></circle>
            <path d="M2.5 2.5h3l2.7 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6l1.6-8.4H7.1"></path>
        </svg>
        <p style="font-size: 1.1rem; color: var(--text-secondary);">Orders management coming soon... 🚧</p>
    </div>
</div>
