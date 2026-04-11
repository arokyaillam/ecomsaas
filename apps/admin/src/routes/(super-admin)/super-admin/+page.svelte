<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { API_BASE_URL } from '$lib/api';
    import { Shield, AlertCircle, LogIn, ArrowLeft, Store } from 'lucide-svelte';

    let email = $state('');
    let password = $state('');
    let error = $state('');
    let loading = $state(false);

    onMount(() => {
        const token = localStorage.getItem('super_admin_token');
        if (token) {
            goto('/super-admin/dashboard');
        }
    });

    async function handleLogin() {
        if (!email || !password) {
            error = 'Please enter email and password';
            return;
        }

        loading = true;
        error = '';

        try {
            const res = await fetch(`${API_BASE_URL}/api/super-admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                error = data.error || 'Login failed';
                return;
            }

            localStorage.setItem('super_admin_token', data.token);
            localStorage.setItem('super_admin_user', JSON.stringify(data.admin));

            goto('/super-admin/dashboard');
        } catch (err) {
            error = 'Network error. Please try again.';
        } finally {
            loading = false;
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter') handleLogin();
    }
</script>

<div class="login-page">
    <div class="login-wrapper">
        <div class="login-brand">
            <div class="brand-icon">
                <Shield size={40} />
            </div>
            <h1>Super Admin</h1>
            <p>Platform Management Console</p>
        </div>

        <div class="login-card">
            <div class="card-header">
                <h2>Welcome Back</h2>
                <p>Sign in to manage your platform</p>
            </div>

            {#if error}
                <div class="alert alert-error">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            {/if}

            <div class="form-group">
                <label for="email">Email Address</label>
                <div class="input-wrapper">
                    <input
                        id="email"
                        type="email"
                        bind:value={email}
                        placeholder="superadmin@ecomsaas.com"
                        onkeydown={handleKeydown}
                    />
                </div>
            </div>

            <div class="form-group">
                <label for="password">Password</label>
                <div class="input-wrapper">
                    <input
                        id="password"
                        type="password"
                        bind:value={password}
                        placeholder="••••••••"
                        onkeydown={handleKeydown}
                    />
                </div>
            </div>

            <button
                class="btn btn-primary btn-large"
                onclick={handleLogin}
                disabled={loading}
            >
                {#if loading}
                    <div class="spinner"></div>
                    Signing in...
                {:else}
                    <LogIn size={20} />
                    Sign In
                {/if}
            </button>

            <div class="divider">
                <span>or</span>
            </div>

            <a href="/login" class="btn btn-secondary">
                <Store size={18} />
                Merchant Login
            </a>
        </div>

        <div class="login-footer">
            <a href="/">
                <ArrowLeft size={16} />
                Back to Website
            </a>
        </div>
    </div>
</div>

<style>
    .login-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        padding: 24px;
    }

    .login-wrapper {
        width: 100%;
        max-width: 440px;
    }

    .login-brand {
        text-align: center;
        margin-bottom: 40px;
    }

    .brand-icon {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #0ea5e9, #0284c7);
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 24px;
        color: white;
        box-shadow: 0 20px 40px rgba(14, 165, 233, 0.3);
    }

    .login-brand h1 {
        font-size: 2rem;
        font-weight: 700;
        margin: 0 0 8px 0;
        background: linear-gradient(135deg, #f8fafc, #94a3b8);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .login-brand p {
        color: #64748b;
        font-size: 1rem;
        margin: 0;
    }

    .login-card {
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 20px;
        padding: 40px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }

    .card-header {
        text-align: center;
        margin-bottom: 32px;
    }

    .card-header h2 {
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0 0 8px 0;
        color: #f8fafc;
    }

    .card-header p {
        color: #64748b;
        margin: 0;
        font-size: 0.9375rem;
    }

    .alert {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 16px;
        border-radius: 12px;
        margin-bottom: 20px;
        font-size: 0.875rem;
    }

    .alert-error {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.2);
        color: #ef4444;
    }

    .form-group {
        margin-bottom: 20px;
    }

    .form-group label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        color: #cbd5e1;
        margin-bottom: 8px;
    }

    .input-wrapper input {
        width: 100%;
        padding: 14px 16px;
        background: #0f172a;
        border: 1px solid #334155;
        border-radius: 12px;
        color: #f8fafc;
        font-size: 1rem;
        transition: all 0.2s;
    }

    .input-wrapper input:focus {
        outline: none;
        border-color: #0ea5e9;
        box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
    }

    .input-wrapper input::placeholder {
        color: #475569;
    }

    .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        width: 100%;
        padding: 14px 24px;
        font-size: 0.9375rem;
        font-weight: 600;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-large {
        padding: 16px 24px;
        font-size: 1rem;
    }

    .btn-primary {
        background: linear-gradient(135deg, #0ea5e9, #0284c7);
        color: white;
    }

    .btn-primary:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 10px 20px rgba(14, 165, 233, 0.3);
    }

    .btn-secondary {
        background: transparent;
        border: 1px solid #334155;
        color: #94a3b8;
    }

    .btn-secondary:hover {
        border-color: #475569;
        color: #f8fafc;
    }

    .btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .spinner {
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .divider {
        display: flex;
        align-items: center;
        gap: 16px;
        margin: 24px 0;
        color: #475569;
        font-size: 0.875rem;
    }

    .divider::before,
    .divider::after {
        content: '';
        flex: 1;
        height: 1px;
        background: #334155;
    }

    .login-footer {
        text-align: center;
        margin-top: 32px;
    }

    .login-footer a {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: #64748b;
        text-decoration: none;
        font-size: 0.875rem;
        transition: color 0.2s;
    }

    .login-footer a:hover {
        color: #f8fafc;
    }

    @media (max-width: 480px) {
        .login-card {
            padding: 28px;
        }

        .login-brand h1 {
            font-size: 1.5rem;
        }
    }
</style>
