<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    onMount(() => {
        goto('/login');
    });
</script>

<div class="auth-container">
    <p>Redirecting to login...</p>
</div>
