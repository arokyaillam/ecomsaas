<script>
    let storeName = $state('');
    let domain = $state('');
    let email = $state('');
    let password = $state('');
    let loading = $state(false);
    let errorMessage = $state('');
    let successMessage = $state('');

    async function handleRegister(e) {
        e.preventDefault();
        loading = true;
        errorMessage = '';
        successMessage = '';

        try {
            const res = await fetch('http://localhost:8000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ storeName, domain, email, password })
            });
            const data = await res.json();
            
            if (!res.ok) {
                errorMessage = data.error || 'Failed to register';
                return;
            }

            successMessage = 'Store created successfully! Redirecting to login...';
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);

        } catch (err) {
            errorMessage = 'Network error. Backend not reachable.';
        } finally {
            loading = false;
        }
    }
</script>

<div class="auth-container">
    <div class="glass-card" style="width: 100%; max-width: 450px;">
        <h2 style="text-align: center; margin-bottom: 30px; font-size: 2rem;">Create your Store</h2>
        {#if errorMessage}<p class="error-text">{errorMessage}</p>{/if}
        {#if successMessage}<p class="success-text">{successMessage}</p>{/if}

        <form onsubmit={handleRegister}>
            <div class="input-group">
                <label>Store Name</label>
                <input type="text" bind:value={storeName} required placeholder="My Awesome Store" />
            </div>
            <div class="input-group">
                <label>Store Domain</label>
                <input type="text" bind:value={domain} required placeholder="awesome-store" />
            </div>
            <div class="input-group">
                <label>Email Address</label>
                <input type="email" bind:value={email} required placeholder="admin@store.com" />
            </div>
            <div class="input-group">
                <label>Password</label>
                <input type="password" bind:value={password} required placeholder="••••••••" minlength="6" />
            </div>
            <button type="submit" class="primary-btn" disabled={loading}>
                {loading ? 'Creating...' : 'Register Store'}
            </button>
        </form>
        <p style="text-align: center; margin-top: 20px; font-size: 0.9rem;">
            Already have a store? <a href="/login">Login here</a>
        </p>
    </div>
</div>
