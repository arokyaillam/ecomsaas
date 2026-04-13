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
                errorMessage = data.error || 'Authentication failed';
                return;
            }

            localStorage.setItem('merchant_token', data.token);
            localStorage.setItem('merchant_store_id', data.storeId);
            // Also set cookie for server-side auth check
            document.cookie = `merchant_token=${data.token}; path=/; max-age=${7*24*60*60}`;
            window.location.href = '/dashboard';

        } catch (err) {
            errorMessage = 'Network error. Backend unreachable.';
        } finally {
            loading = false;
        }
    }
</script>

<div class="auth-container scanlines">
    <div style="width: 100%; max-width: 420px;">
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 40px;">
            <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: var(--accent-color); margin-bottom: 20px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0a0a0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
            </div>
            <h1 style="font-size: 1.5rem; font-weight: 700; letter-spacing: 0.1em; margin-bottom: 8px;">COMMAND</h1>
            <p style="font-size: 0.8125rem; color: var(--text-muted); font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 0.05em;">Admin Console</p>
        </div>

        <!-- Login Panel -->
        <div class="panel">
            <div class="panel-header" style="border-bottom: 1px solid var(--border-color);">
                <h3 style="font-size: 0.875rem; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    Secure Login
                </h3>
            </div>

            <div class="panel-content">
                {#if errorMessage}
                    <div style="display: flex; align-items: center; gap: 8px; padding: 12px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); margin-bottom: 20px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--error)" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <span class="error-text" style="margin: 0; text-align: left;">{errorMessage}</span>
                    </div>
                {/if}

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
                        {#if loading}
                            <span style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                                <svg class="animate-pulse-subtle" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 2v4"></path>
                                    <path d="m16.2 7.8 2.9-2.9"></path>
                                    <path d="M22 12h-4"></path>
                                    <path d="m16.2 16.2 2.9 2.9"></path>
                                    <path d="M12 22v-4"></path>
                                    <path d="m4.9 19.1 2.9-2.9"></path>
                                    <path d="M2 12h4"></path>
                                    <path d="m4.9 4.9 2.9 2.9"></path>
                                </svg>
                                Authenticating...
                            </span>
                        {:else}
                            Access Console
                        {/if}
                    </button>
                </form>
            </div>
        </div>

        <p style="text-align: center; margin-top: 24px; font-size: 0.8125rem; color: var(--text-muted);">
            New merchant? <a href="/register" style="color: var(--accent-color);">Initialize store →</a>
        </p>
    </div>
</div>
