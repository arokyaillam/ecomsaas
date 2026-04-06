<script lang="ts">
    import { API_BASE_URL } from '$lib/api';
    
    let email = $state('');
    let password = $state('');
    let loading = $state(false);
    let errorMessage = $state('');

    async function handleLogin(e: SubmitEvent) {
        e.preventDefault();
        loading = true;
        errorMessage = '';

        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            
            if (!res.ok) {
                errorMessage = data.error || 'Invalid credentials';
                return;
            }

            localStorage.setItem('merchant_token', data.token);
            localStorage.setItem('merchant_store_id', data.storeId);
            window.location.href = '/dashboard';

        } catch (err) {
            errorMessage = 'Network error. Backend not reachable.';
        } finally {
            loading = false;
        }
    }
</script>

<div class="auth-container">
    <div class="glass-card" style="width: 100%; max-width: 450px;">
        <h2 style="text-align: center; margin-bottom: 30px; font-size: 2rem;">Merchant Login</h2>
        {#if errorMessage}<p class="error-text">{errorMessage}</p>{/if}

        <form onsubmit={handleLogin}>
            <div class="input-group">
                <label for="email">Email Address</label>
                <input id="email" type="email" bind:value={email} required placeholder="admin@store.com" />
            </div>
            <div class="input-group">
                <label for="password">Password</label>
                <input id="password" type="password" bind:value={password} required placeholder="••••••••" />
            </div>
            <button type="submit" class="primary-btn" disabled={loading}>
                {loading ? 'Authenticating...' : 'Secure Login'}
            </button>
        </form>
        <p style="text-align: center; margin-top: 20px; font-size: 0.9rem;">
            New merchant? <a href="/register">Create a store</a>
        </p>
    </div>
</div>
