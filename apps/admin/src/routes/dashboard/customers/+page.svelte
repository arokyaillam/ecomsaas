<script lang="ts">
    import { goto } from '$app/navigation';
</script>

<div class="fade-in">
    <div class="dashboard-header">
        <div>
            <h2>Customers</h2>
            <p style="color: var(--text-secondary); margin-top: 4px;">View and manage customers</p>
        </div>
        
        <div class="header-actions">
            <button class="action-btn secondary" onclick={() => goto('/dashboard')} style="margin-right: 8px;">Back</button>
        </div>
    </div>

    <div class="glass-card dashboard" style="text-align: center; padding: 60px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin-bottom: 16px; opacity: 0.5;">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
        </svg>
        <p style="font-size: 1.1rem; color: var(--text-secondary);">Customers management coming soon... 🚧</p>
    </div>
</div>
