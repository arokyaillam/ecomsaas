<script lang="ts">
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { API_BASE_URL } from '$lib/api';
    import ImageEditor from '../../../components/ImageEditor.svelte';

    let storeId = $state('');
    let storeDomain = $state('');
    let userEmail = $state('');
    let userName = $state('');
    let loading = $state(true);
    let saving = $state(false);
    let heroSaving = $state(false);
    let successMessage = $state('');
    let errorMessage = $state('');
    let heroSuccessMessage = $state('');
    let heroErrorMessage = $state('');
    let showImageEditor = $state(false);

    // Active Tab State
    let activeTab = $state('profile'); // 'profile', 'theme', 'hero'

    // Password Change State
    let showPasswordModal = $state(false);
    let passwordForm = $state({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    let passwordLoading = $state(false);
    let passwordError = $state('');
    let passwordSuccess = $state('');

    // Theme State
    let theme = $state({
        primaryColor: '#0ea5e9',
        secondaryColor: '#6366f1',
        accentColor: '#8b5cf6',
        backgroundColor: '#0f172a',
        surfaceColor: '#1e293b',
        textColor: '#f8fafc',
        textSecondaryColor: '#94a3b8',
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: '12px',
        fontFamily: 'Inter, sans-serif',
        logoUrl: '',
        faviconUrl: '',
        currency: 'USD',
        language: 'en'
    });

    // Hero State
    let hero = $state({
        heroImage: '',
        heroTitle: 'Welcome to Our Store',
        heroSubtitle: 'Discover amazing products at great prices',
        heroCtaText: 'Explore Collection',
        heroCtaLink: '#products',
        heroEnabled: true
    });

    // Preset themes
    const presets = [
        { name: 'Default Dark', colors: { primary: '#0ea5e9', secondary: '#6366f1', accent: '#8b5cf6', background: '#0f172a', surface: '#1e293b', text: '#f8fafc', textSecondary: '#94a3b8', border: 'rgba(255,255,255,0.1)' }},
        { name: 'Ocean', colors: { primary: '#06b6d4', secondary: '#3b82f6', accent: '#8b5cf6', background: '#0c4a6e', surface: '#164e63', text: '#ecfeff', textSecondary: '#a5f3fc', border: 'rgba(255,255,255,0.1)' }},
        { name: 'Forest', colors: { primary: '#22c55e', secondary: '#16a34a', accent: '#84cc16', background: '#064e3b', surface: '#065f46', text: '#f0fdf4', textSecondary: '#bbf7d0', border: 'rgba(255,255,255,0.1)' }},
        { name: 'Sunset', colors: { primary: '#f97316', secondary: '#ea580c', accent: '#fbbf24', background: '#431407', surface: '#7c2d12', text: '#fff7ed', textSecondary: '#fed7aa', border: 'rgba(255,255,255,0.1)' }},
        { name: 'Rose', colors: { primary: '#e11d48', secondary: '#db2777', accent: '#f472b6', background: '#4c0519', surface: '#831843', text: '#fff1f2', textSecondary: '#fecdd3', border: 'rgba(255,255,255,0.1)' }},
    ];

    onMount(async () => {
        storeId = localStorage.getItem('merchant_store_id') || '';
        const token = localStorage.getItem('merchant_token');

        if (!token) {
            goto('/login');
            return;
        }

        // Fetch current store data
        try {
            const res = await fetch(`${API_BASE_URL}/api/store/${storeId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                storeDomain = data.data?.domain || '';
                userEmail = data.data?.ownerEmail || '';
                userName = data.data?.ownerName || '';

                if (data.data?.theme) {
                    const t = data.data.theme;
                    theme = {
                        primaryColor: t.primaryColor || theme.primaryColor,
                        secondaryColor: t.secondaryColor || theme.secondaryColor,
                        accentColor: t.accentColor || theme.accentColor,
                        backgroundColor: t.backgroundColor || theme.backgroundColor,
                        surfaceColor: t.surfaceColor || theme.surfaceColor,
                        textColor: t.textColor || theme.textColor,
                        textSecondaryColor: t.textSecondaryColor || theme.textSecondaryColor,
                        borderColor: t.borderColor || theme.borderColor,
                        borderRadius: t.borderRadius || theme.borderRadius,
                        fontFamily: t.fontFamily || theme.fontFamily,
                        logoUrl: t.logoUrl || '',
                        faviconUrl: t.faviconUrl || '',
                        currency: data.data.currency || 'USD',
                        language: data.data.language || 'en'
                    };
                }
                if (data.data?.hero) {
                    const h = data.data.hero;
                    hero = {
                        heroImage: h.image || '',
                        heroTitle: h.title || 'Welcome to Our Store',
                        heroSubtitle: h.subtitle || 'Discover amazing products at great prices',
                        heroCtaText: h.ctaText || 'Explore Collection',
                        heroCtaLink: h.ctaLink || '#products',
                        heroEnabled: h.enabled ?? true
                    };
                }
            }
        } catch (error) {
            console.error('Failed to fetch theme:', error);
        } finally {
            loading = false;
        }
    });

    async function changePassword() {
        passwordError = '';
        passwordSuccess = '';

        if (!passwordForm.currentPassword) {
            passwordError = 'Current password is required';
            return;
        }
        if (!passwordForm.newPassword || passwordForm.newPassword.length < 8) {
            passwordError = 'New password must be at least 8 characters';
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            passwordError = 'Passwords do not match';
            return;
        }

        passwordLoading = true;
        const token = localStorage.getItem('merchant_token');

        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword
                })
            });

            const data = await res.json();

            if (res.ok) {
                passwordSuccess = 'Password changed successfully!';
                passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
                setTimeout(() => {
                    showPasswordModal = false;
                    passwordSuccess = '';
                }, 2000);
            } else {
                passwordError = data.error || 'Failed to change password';
            }
        } catch (err) {
            passwordError = 'Network error. Please try again.';
        } finally {
            passwordLoading = false;
        }
    }

    function closePasswordModal() {
        showPasswordModal = false;
        passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
        passwordError = '';
        passwordSuccess = '';
    }

    function applyPreset(preset: any) {
        theme = { ...theme,
            primaryColor: preset.colors.primary,
            secondaryColor: preset.colors.secondary,
            accentColor: preset.colors.accent,
            backgroundColor: preset.colors.background,
            surfaceColor: preset.colors.surface,
            textColor: preset.colors.text,
            textSecondaryColor: preset.colors.textSecondary,
            borderColor: preset.colors.border
        };
    }

    async function saveTheme() {
        saving = true;
        successMessage = '';
        errorMessage = '';

        const token = localStorage.getItem('merchant_token');

        try {
            const res = await fetch(`${API_BASE_URL}/api/store/theme`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(theme)
            });

            if (res.ok) {
                successMessage = 'Theme updated successfully!';
            } else {
                errorMessage = 'Failed to update theme';
            }
        } catch (error) {
            errorMessage = 'Network error. Please try again.';
        } finally {
            saving = false;
        }
    }

    async function saveHero() {
        heroSaving = true;
        heroSuccessMessage = '';
        heroErrorMessage = '';

        const token = localStorage.getItem('merchant_token');

        try {
            const res = await fetch(`${API_BASE_URL}/api/store/hero`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(hero)
            });

            if (res.ok) {
                heroSuccessMessage = 'Hero section updated successfully!';
            } else {
                heroErrorMessage = 'Failed to update hero section';
            }
        } catch (error) {
            heroErrorMessage = 'Network error. Please try again.';
        } finally {
            heroSaving = false;
        }
    }

    function handleImageSave(croppedImage: string) {
        hero.heroImage = croppedImage;
        showImageEditor = false;
    }

    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text);
    }
</script>

<div class="fade-in">
    <!-- Header -->
    <div class="dashboard-header">
        <div>
            <h2>Store Settings</h2>
            <p style="color: var(--text-secondary); margin-top: 4px;">Manage your store profile, theme, and hero section</p>
        </div>
        <div class="header-actions">
            <button class="action-btn secondary" onclick={() => goto('/dashboard')}>Back</button>
        </div>
    </div>

    <!-- Success/Error Messages -->
    {#if successMessage}
        <div class="glass-card dashboard" style="margin-bottom: 24px; background: rgba(34, 197, 94, 0.1); border-color: rgba(34, 197, 94, 0.3);">
            <p style="color: #22c55e; display: flex; align-items: center; gap: 8px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 6L9 17l-5-5"/>
                </svg>
                {successMessage}
            </p>
        </div>
    {/if}

    {#if errorMessage}
        <div class="glass-card dashboard" style="margin-bottom: 24px; background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3);">
            <p style="color: #ef4444;">{errorMessage}</p>
        </div>
    {/if}

    <!-- Tabs Navigation -->
    <div class="settings-tabs" style="margin-bottom: 24px;">
        <button
            class="tab-btn"
            class:active={activeTab === 'profile'}
            onclick={() => activeTab = 'profile'}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Profile & Store
        </button>
        <button
            class="tab-btn"
            class:active={activeTab === 'theme'}
            onclick={() => activeTab = 'theme'}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5"></circle>
                <path d="M12 1v2"></path>
                <path d="M12 21v2"></path>
                <path d="M4.22 4.22l1.42 1.42"></path>
                <path d="M18.36 18.36l1.42 1.42"></path>
                <path d="M1 12h2"></path>
                <path d="M21 12h2"></path>
                <path d="M4.22 19.78l1.42-1.42"></path>
                <path d="M18.36 5.64l1.42-1.42"></path>
            </svg>
            Theme & Appearance
        </button>
        <button
            class="tab-btn"
            class:active={activeTab === 'hero'}
            onclick={() => activeTab = 'hero'}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            Hero Section
        </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
        {#if loading}
            <div class="glass-card dashboard">
                <div style="display: flex; flex-direction: column; gap: 16px; padding: 24px;">
                    {#each Array(4) as _}
                        <div class="skeleton" style="height: 60px;"></div>
                    {/each}
                </div>
            </div>
        {:else}
            <!-- Profile Tab -->
            {#if activeTab === 'profile'}
                <div class="glass-card dashboard">
                    <div class="tab-header">
                        <h3>Profile & Store Information</h3>
                        <p style="color: var(--text-secondary);">View your store details and manage your account password</p>
                    </div>

                    <div class="tab-body">
                        <!-- Store URL -->
                        <div class="form-section">
                            <label class="form-label">Store URL</label>
                            <div class="url-display">
                                <div class="url-box">
                                    <span class="url-protocol">https://</span>
                                    <span class="url-domain">{storeDomain || 'your-store'}.example.com</span>
                                </div>
                                <button class="action-btn secondary" onclick={() => copyToClipboard(`https://${storeDomain}.example.com`)} disabled={!storeDomain}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                    </svg>
                                    Copy
                                </button>
                            </div>
                            <p class="form-hint">Your customers can visit your store at this URL</p>
                        </div>

                        <!-- Owner Info -->
                        <div class="form-section">
                            <label class="form-label">Account Information</label>
                            <div class="info-grid">
                                <div class="info-item">
                                    <span class="info-label">Owner Name</span>
                                    <span class="info-value">{userName || 'Not set'}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Email Address</span>
                                    <span class="info-value">{userEmail || 'Not set'}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Password Change -->
                        <div class="form-section">
                            <label class="form-label">Security</label>
                            <button class="action-btn" onclick={() => showPasswordModal = true}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                                Change Password
                            </button>
                        </div>
                    </div>
                </div>
            {/if}

            <!-- Theme Tab -->
            {#if activeTab === 'theme'}
                <div class="content-grid" style="grid-template-columns: 1fr 400px;">
                    <div class="glass-card dashboard">
                        <div class="tab-header">
                            <h3>Theme Customization</h3>
                            <p style="color: var(--text-secondary);">Customize your store colors and appearance</p>
                        </div>

                        <div class="tab-body">
                            <!-- Presets -->
                            <div class="form-section">
                                <label class="form-label">Quick Presets</label>
                                <div class="preset-grid">
                                    {#each presets as preset}
                                        <button class="preset-btn" onclick={() => applyPreset(preset)}>
                                            <div class="preset-colors">
                                                <span style="background: {preset.colors.primary}"></span>
                                                <span style="background: {preset.colors.secondary}"></span>
                                                <span style="background: {preset.colors.accent}"></span>
                                            </div>
                                            <span class="preset-name">{preset.name}</span>
                                        </button>
                                    {/each}
                                </div>
                            </div>

                            <!-- Color Settings -->
                            <div class="form-section">
                                <label class="form-label">Colors</label>
                                <div class="color-grid">
                                    <div class="color-picker">
                                        <label>Primary</label>
                                        <div class="color-input">
                                            <input type="color" bind:value={theme.primaryColor} />
                                            <input type="text" bind:value={theme.primaryColor} />
                                        </div>
                                    </div>
                                    <div class="color-picker">
                                        <label>Secondary</label>
                                        <div class="color-input">
                                            <input type="color" bind:value={theme.secondaryColor} />
                                            <input type="text" bind:value={theme.secondaryColor} />
                                        </div>
                                    </div>
                                    <div class="color-picker">
                                        <label>Accent</label>
                                        <div class="color-input">
                                            <input type="color" bind:value={theme.accentColor} />
                                            <input type="text" bind:value={theme.accentColor} />
                                        </div>
                                    </div>
                                    <div class="color-picker">
                                        <label>Background</label>
                                        <div class="color-input">
                                            <input type="color" bind:value={theme.backgroundColor} />
                                            <input type="text" bind:value={theme.backgroundColor} />
                                        </div>
                                    </div>
                                    <div class="color-picker">
                                        <label>Surface</label>
                                        <div class="color-input">
                                            <input type="color" bind:value={theme.surfaceColor} />
                                            <input type="text" bind:value={theme.surfaceColor} />
                                        </div>
                                    </div>
                                    <div class="color-picker">
                                        <label>Text</label>
                                        <div class="color-input">
                                            <input type="color" bind:value={theme.textColor} />
                                            <input type="text" bind:value={theme.textColor} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Border Radius -->
                            <div class="form-section">
                                <label class="form-label">Border Radius</label>
                                <div class="slider-group">
                                    <input type="range" min="0" max="32" value={parseInt(theme.borderRadius)} oninput={(e) => theme.borderRadius = `${e.currentTarget.value}px`} />
                                    <span>{theme.borderRadius}</span>
                                </div>
                            </div>

                            <!-- Currency -->
                            <div class="form-section">
                                <label class="form-label">Currency</label>
                                <select bind:value={theme.currency}>
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="GBP">GBP (£)</option>
                                    <option value="KWD">KWD (د.ك)</option>
                                    <option value="AED">AED (د.إ)</option>
                                </select>
                            </div>

                            <div class="form-actions">
                                <button class="action-btn primary" onclick={saveTheme} disabled={saving}>
                                    {saving ? 'Saving...' : 'Save Theme'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Live Preview -->
                    <div class="glass-card dashboard preview-card">
                        <div class="tab-header">
                            <h3>Live Preview</h3>
                        </div>
                        <div class="preview-content" style="
                            background: {theme.backgroundColor};
                            color: {theme.textColor};
                            font-family: {theme.fontFamily};
                        ">
                            <div class="preview-box" style="background: {theme.surfaceColor}; border: 1px solid {theme.borderColor}; border-radius: {theme.borderRadius};">
                                <h4 style="color: {theme.textColor};">Sample Product</h4>
                                <p style="color: {theme.textSecondaryColor};">This is how your content will look</p>
                            </div>
                            <div class="preview-buttons">
                                <button style="background: linear-gradient(135deg, {theme.primaryColor}, {theme.secondaryColor}); border-radius: {theme.borderRadius};">
                                    Primary
                                </button>
                                <button style="background: {theme.surfaceColor}; color: {theme.textColor}; border: 1px solid {theme.borderColor}; border-radius: {theme.borderRadius};">
                                    Secondary
                                </button>
                            </div>
                            <span style="color: {theme.accentColor};">Accent Color</span>
                        </div>
                        <div class="store-id-section">
                            <span class="store-id-label">Store ID</span>
                            <code class="store-id-code">
                                <span>{storeId}</span>
                                <button onclick={() => copyToClipboard(storeId)} aria-label="Copy Store ID">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                    </svg>
                                </button>
                            </code>
                        </div>
                    </div>
                </div>
            {/if}

            <!-- Hero Tab -->
            {#if activeTab === 'hero'}
                <div class="content-grid" style="grid-template-columns: 1fr 400px;">
                    <div class="glass-card dashboard">
                        <div class="tab-header">
                            <h3>Hero Section</h3>
                            <p style="color: var(--text-secondary);">Customize your store homepage hero banner</p>
                        </div>

                        <div class="tab-body">
                            {#if heroSuccessMessage}
                                <div class="alert success">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M20 6L9 17l-5-5"/>
                                    </svg>
                                    {heroSuccessMessage}
                                </div>
                            {/if}

                            {#if heroErrorMessage}
                                <div class="alert error">
                                    {heroErrorMessage}
                                </div>
                            {/if}

                            {#if showImageEditor}
                                <ImageEditor imageUrl={hero.heroImage} onSave={handleImageSave} onCancel={() => showImageEditor = false} />
                            {:else}
                                <!-- Enable Toggle -->
                                <div class="form-section">
                                    <label class="toggle-label">
                                        <input type="checkbox" bind:checked={hero.heroEnabled} />
                                        <span>Show Hero Section on Homepage</span>
                                    </label>
                                </div>

                                <!-- Hero Image -->
                                <div class="form-section">
                                    <label class="form-label">Hero Image</label>
                                    {#if hero.heroImage}
                                        <div class="image-preview">
                                            <img src={hero.heroImage} alt="Hero" />
                                            <button class="remove-btn" onclick={() => hero.heroImage = ''}>Remove</button>
                                        </div>
                                    {/if}
                                    <button class="action-btn" onclick={() => showImageEditor = true}>
                                        {hero.heroImage ? 'Change Image' : 'Add Hero Image'}
                                    </button>
                                </div>

                                <!-- Hero Text -->
                                <div class="form-section">
                                    <label class="form-label">Hero Title</label>
                                    <input type="text" bind:value={hero.heroTitle} placeholder="Welcome to Our Store" />
                                </div>

                                <div class="form-section">
                                    <label class="form-label">Hero Subtitle</label>
                                    <textarea bind:value={hero.heroSubtitle} placeholder="Discover amazing products at great prices" rows="2"></textarea>
                                </div>

                                <div class="form-section">
                                    <label class="form-label">CTA Button Text</label>
                                    <input type="text" bind:value={hero.heroCtaText} placeholder="Explore Collection" />
                                </div>

                                <div class="form-section">
                                    <label class="form-label">CTA Link</label>
                                    <input type="text" bind:value={hero.heroCtaLink} placeholder="#products" />
                                </div>

                                <div class="form-actions">
                                    <button class="action-btn primary" onclick={saveHero} disabled={heroSaving}>
                                        {heroSaving ? 'Saving...' : 'Save Hero Section'}
                                    </button>
                                </div>
                            {/if}
                        </div>
                    </div>

                    <!-- Hero Preview -->
                    <div class="glass-card dashboard preview-card">
                        <div class="tab-header">
                            <h3>Preview</h3>
                        </div>
                        <div class="hero-preview" style="background: linear-gradient(135deg, {theme.primaryColor}33, {theme.secondaryColor}33); border-radius: {theme.borderRadius};">
                            {#if hero.heroImage}
                                <img src={hero.heroImage} alt="Hero" />
                            {/if}
                            <div class="hero-overlay" style="border-radius: {theme.borderRadius};">
                                <h4 style="color: {theme.textColor};">{hero.heroTitle}</h4>
                                <p style="color: {theme.textSecondaryColor};">{hero.heroSubtitle}</p>
                                {#if hero.heroEnabled}
                                    <button style="background: linear-gradient(135deg, {theme.primaryColor}, {theme.secondaryColor}); border-radius: {theme.borderRadius};">
                                        {hero.heroCtaText}
                                    </button>
                                {/if}
                            </div>
                        </div>
                    </div>
                </div>
            {/if}
        {/if}
    </div>
</div>

<!-- Password Change Modal -->
{#if showPasswordModal}
    <div class="modal-overlay" onclick={closePasswordModal}>
        <div class="modal" onclick={(e) => e.stopPropagation()}>
            <div class="modal-header">
                <h3>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    Change Password
                </h3>
                <button class="close-btn" onclick={closePasswordModal}>×</button>
            </div>

            <div class="modal-body">
                {#if passwordError}
                    <div class="alert error">{passwordError}</div>
                {/if}

                {#if passwordSuccess}
                    <div class="alert success">{passwordSuccess}</div>
                {/if}

                <div class="form-group">
                    <label>Current Password</label>
                    <input type="password" bind:value={passwordForm.currentPassword} placeholder="Enter your current password" />
                </div>

                <div class="form-group">
                    <label>New Password</label>
                    <input type="password" bind:value={passwordForm.newPassword} placeholder="Min 8 characters" />
                </div>

                <div class="form-group">
                    <label>Confirm New Password</label>
                    <input type="password" bind:value={passwordForm.confirmPassword} placeholder="Re-enter new password" />
                </div>
            </div>

            <div class="modal-footer">
                <button class="action-btn secondary" onclick={closePasswordModal} disabled={passwordLoading}>Cancel</button>
                <button class="action-btn primary" onclick={changePassword} disabled={passwordLoading}>
                    {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    /* Tabs */
    .settings-tabs {
        display: flex;
        gap: 8px;
        border-bottom: 1px solid var(--glass-border);
        padding-bottom: 1px;
    }

    .tab-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 20px;
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        color: var(--text-secondary);
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }

    .tab-btn:hover {
        color: var(--text-primary);
        background: rgba(255, 255, 255, 0.05);
    }

    .tab-btn.active {
        color: var(--accent-color);
        border-bottom-color: var(--accent-color);
        background: rgba(14, 165, 233, 0.1);
    }

    .tab-btn svg {
        opacity: 0.7;
    }

    .tab-btn.active svg {
        opacity: 1;
    }

    /* Tab Content */
    .tab-content {
        animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .tab-header {
        padding: 24px 24px 16px;
        border-bottom: 1px solid var(--glass-border);
    }

    .tab-header h3 {
        margin: 0 0 4px 0;
    }

    .tab-body {
        padding: 24px;
    }

    /* Form Sections */
    .form-section {
        margin-bottom: 28px;
    }

    .form-section:last-child {
        margin-bottom: 0;
    }

    .form-label {
        display: block;
        margin-bottom: 10px;
        font-weight: 500;
        color: var(--text-primary);
    }

    .form-hint {
        margin-top: 8px;
        font-size: 0.85rem;
        color: var(--text-secondary);
    }

    /* URL Display */
    .url-display {
        display: flex;
        gap: 12px;
        align-items: stretch;
    }

    .url-box {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 4px;
        background: var(--input-bg);
        padding: 14px 16px;
        border-radius: 12px;
        border: 1px solid var(--border-color);
    }

    .url-protocol {
        color: var(--accent-color);
        font-weight: 500;
    }

    .url-domain {
        color: var(--text-primary);
        font-family: var(--font-mono);
    }

    /* Info Grid */
    .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 16px;
    }

    .info-item {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 16px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 12px;
    }

    .info-label {
        font-size: 0.8rem;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .info-value {
        font-size: 1rem;
        color: var(--text-primary);
        font-weight: 500;
    }

    /* Presets */
    .preset-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 12px;
    }

    .preset-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 12px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .preset-btn:hover {
        border-color: var(--accent-color);
        transform: translateY(-2px);
    }

    .preset-colors {
        display: flex;
        gap: 4px;
    }

    .preset-colors span {
        width: 24px;
        height: 24px;
        border-radius: 6px;
        border: 2px solid rgba(255, 255, 255, 0.2);
    }

    .preset-name {
        font-size: 0.8rem;
        color: var(--text-secondary);
    }

    /* Color Grid */
    .color-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 16px;
    }

    .color-picker label {
        display: block;
        margin-bottom: 6px;
        font-size: 0.85rem;
        color: var(--text-secondary);
    }

    .color-input {
        display: flex;
        gap: 8px;
        align-items: center;
    }

    .color-input input[type="color"] {
        width: 44px;
        height: 44px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
    }

    .color-input input[type="text"] {
        flex: 1;
    }

    /* Slider */
    .slider-group {
        display: flex;
        align-items: center;
        gap: 16px;
    }

    .slider-group input[type="range"] {
        flex: 1;
        height: 6px;
        border-radius: 3px;
        background: var(--surface-bg);
        outline: none;
        -webkit-appearance: none;
    }

    .slider-group input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--accent-color);
        cursor: pointer;
    }

    .slider-group span {
        width: 60px;
        text-align: right;
        font-family: var(--font-mono);
        color: var(--text-secondary);
    }

    /* Form Actions */
    .form-actions {
        display: flex;
        gap: 12px;
        padding-top: 16px;
        border-top: 1px solid var(--glass-border);
    }

    /* Preview Card */
    .preview-card {
        position: sticky;
        top: 20px;
    }

    .preview-content {
        padding: 24px;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        align-items: center;
        text-align: center;
    }

    .preview-box {
        padding: 16px;
        width: 100%;
    }

    .preview-buttons {
        display: flex;
        gap: 12px;
        width: 100%;
    }

    .preview-buttons button {
        flex: 1;
        padding: 10px 16px;
        border: none;
        color: white;
        font-weight: 500;
        cursor: pointer;
    }

    /* Store ID Section */
    .store-id-section {
        padding: 20px 24px;
        border-top: 1px solid var(--glass-border);
    }

    .store-id-label {
        display: block;
        margin-bottom: 8px;
        font-size: 0.8rem;
        color: var(--text-secondary);
    }

    .store-id-code {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        background: var(--input-bg);
        padding: 12px 16px;
        border-radius: 8px;
        font-family: var(--font-mono);
        font-size: 0.85rem;
        color: var(--accent-color);
    }

    .store-id-code button {
        background: transparent;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 4px;
    }

    .store-id-code button:hover {
        color: var(--text-primary);
    }

    /* Toggle Label */
    .toggle-label {
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        font-weight: 500;
    }

    .toggle-label input[type="checkbox"] {
        width: 20px;
        height: 20px;
        accent-color: var(--accent-color);
    }

    /* Image Preview */
    .image-preview {
        position: relative;
        margin-bottom: 16px;
    }

    .image-preview img {
        width: 100%;
        height: 180px;
        object-fit: cover;
        border-radius: 12px;
    }

    .remove-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        padding: 6px 12px;
        background: rgba(239, 68, 68, 0.9);
        border: none;
        border-radius: 6px;
        color: white;
        font-size: 0.8rem;
        cursor: pointer;
    }

    /* Hero Preview */
    .hero-preview {
        position: relative;
        height: 280px;
        overflow: hidden;
    }

    .hero-preview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0.8;
    }

    .hero-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 24px;
        text-align: center;
        background: rgba(0, 0, 0, 0.3);
    }

    .hero-overlay h4 {
        margin: 0 0 8px 0;
        font-size: 1.4rem;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    }

    .hero-overlay p {
        margin: 0 0 16px 0;
        font-size: 0.9rem;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    }

    .hero-overlay button {
        padding: 10px 24px;
        border: none;
        color: white;
        font-weight: 500;
        cursor: pointer;
    }

    /* Alerts */
    .alert {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 20px;
    }

    .alert.success {
        background: rgba(34, 197, 94, 0.1);
        border: 1px solid rgba(34, 197, 94, 0.3);
        color: #22c55e;
    }

    .alert.error {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        color: #ef4444;
    }

    /* Modal */
    .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
    }

    .modal {
        background: var(--bg-secondary);
        border: 1px solid var(--glass-border);
        border-radius: 16px;
        width: 100%;
        max-width: 420px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        overflow: hidden;
    }

    .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px;
        border-bottom: 1px solid var(--glass-border);
    }

    .modal-header h3 {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0;
    }

    .close-btn {
        background: transparent;
        border: none;
        color: var(--text-secondary);
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
    }

    .close-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: var(--text-primary);
    }

    .modal-body {
        padding: 24px;
    }

    .modal-footer {
        display: flex;
        gap: 12px;
        padding: 0 24px 24px;
    }

    .modal-footer button {
        flex: 1;
    }

    /* Form Group */
    .form-group {
        margin-bottom: 20px;
    }

    .form-group:last-child {
        margin-bottom: 0;
    }

    .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
    }

    /* Inputs */
    input[type="text"],
    input[type="password"],
    input[type="email"],
    textarea,
    select {
        width: 100%;
        padding: 12px 16px;
        background: var(--input-bg);
        border: 1px solid var(--border-color);
        border-radius: 10px;
        color: var(--text-primary);
        font-size: 0.95rem;
        transition: all 0.2s;
    }

    input:focus,
    textarea:focus,
    select:focus {
        outline: none;
        border-color: var(--accent-color);
        box-shadow: 0 0 0 3px var(--accent-glow);
    }

    textarea {
        resize: vertical;
        min-height: 80px;
    }

    /* Content Grid */
    .content-grid {
        display: grid;
        gap: 24px;
    }

    @media (max-width: 1024px) {
        .content-grid {
            grid-template-columns: 1fr !important;
        }

        .preview-card {
            position: static;
        }
    }

    /* Action Buttons */
    .action-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 10px 20px;
        border-radius: 10px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
    }

    .action-btn.primary {
        background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
        color: white;
    }

    .action-btn.secondary {
        background: var(--surface-bg);
        color: var(--text-secondary);
        border: 1px solid var(--border-color);
    }

    .action-btn:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .action-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    /* Glass Card */
    .glass-card {
        background: var(--glass-bg);
        backdrop-filter: blur(10px);
        border: 1px solid var(--glass-border);
        border-radius: 16px;
    }

    .glass-card.dashboard {
        background: var(--bg-secondary);
    }

    /* Dashboard Header */
    .dashboard-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--glass-border);
    }

    .dashboard-header h2 {
        margin: 0;
    }

    .header-actions {
        display: flex;
        gap: 12px;
    }

    /* Fade In Animation */
    .fade-in {
        animation: fadeIn 0.3s ease;
    }

    /* Skeleton */
    .skeleton {
        background: linear-gradient(90deg, var(--surface-bg) 25%, var(--bg-tertiary) 50%, var(--surface-bg) 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 8px;
    }

    @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
    }
</style>