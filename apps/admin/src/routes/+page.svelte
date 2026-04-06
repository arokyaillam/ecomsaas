<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    onMount(() => {
        const token = localStorage.getItem('merchant_token');
        if (token) {
            goto('/dashboard');
        } else {
            goto('/login');
        }
    });
</script>

<div class="auth-container">
    <div class="glass-card" style="text-align: center;">
        <div style="width: 40px; height: 40px; border: 3px solid var(--accent-color); border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
        <p>Loading EcomSaaS Admin...</p>
    </div>
</div>

<style>
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
</style>
