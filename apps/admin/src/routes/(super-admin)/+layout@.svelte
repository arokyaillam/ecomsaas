<script lang="ts">
    import '../../app.css';
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    let { children } = $props();

    // Check super admin auth on mount
    onMount(() => {
        const token = localStorage.getItem('super_admin_token');
        const currentPath = $page.url.pathname;

        // Redirect to login if no token and not on login page
        if (!token && currentPath !== '/super-admin') {
            goto('/super-admin');
            return;
        }
    });
</script>

{@render children()}