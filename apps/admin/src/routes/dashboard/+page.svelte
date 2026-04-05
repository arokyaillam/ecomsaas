<script>
    import { onMount } from 'svelte';

    let storeId = $state('');

    onMount(() => {
        const token = localStorage.getItem('merchant_token');
        if (!token) {
            window.location.href = '/login';
        }
        storeId = localStorage.getItem('merchant_store_id') || '';
    });

    function logout() {
        localStorage.removeItem('merchant_token');
        localStorage.removeItem('merchant_store_id');
        window.location.href = '/login';
    }
</script>

<div class="auth-container">
    <div class="glass-card" style="width: 100%; max-width: 800px;">
        <h2 style="font-size: 2rem;">Admin Dashboard</h2>
        <p style="color: var(--text-secondary); margin-top: 10px;">
            Welcome to your Store Admin Panel. Your securely identified Store ID is: <br/><strong style="color: var(--text-primary); font-family: monospace;">{storeId}</strong>
        </p>
        
        <div style="margin-top: 40px; border-top: 1px solid var(--glass-border); padding-top: 20px;">
            <p>Products and Orders module will go here in Phase 4.</p>
            <button class="primary-btn" onclick={logout} style="margin-top: 40px; width: auto; padding: 10px 30px; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.5);">Logout</button>
        </div>
    </div>
</div>
