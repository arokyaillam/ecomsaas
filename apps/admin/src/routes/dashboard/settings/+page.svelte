<script lang="ts">
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { API_BASE_URL } from '$lib/api';
    import ImageEditor from '../../../components/ImageEditor.svelte';

    let storeId = $state('');
    let loading = $state(true);
    let saving = $state(false);
    let heroSaving = $state(false);
    let successMessage = $state('');
    let errorMessage = $state('');
    let heroSuccessMessage = $state('');
    let heroErrorMessage = $state('');
    let showImageEditor = $state(false);

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
                // Load hero data
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
                successMessage = 'Theme updated successfully! Changes will reflect in storefront immediately.';
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
    <div class="dashboard-header">
        <div>
            <h2>Store Settings</h2>
            <p style="color: var(--text-secondary); margin-top: 4px;">Customize your store theme and appearance</p>
        </div>
        <div class="header-actions">
            <button class="action-btn secondary" onclick={() => goto('/dashboard')}>Back</button>
        </div>
    </div>

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

    <div class="content-grid" style="grid-template-columns: 1fr 400px;">
        <div class="settings-content">
            <!-- Hero Section -->
            <div class="glass-card dashboard" style="margin-bottom: 24px;">
                <h3 style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--glass-border);">
                    Hero Section
                </h3>

                {#if heroSuccessMessage}
                    <div style="margin-bottom: 24px; padding: 12px 16px; background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 8px;">
                        <p style="color: #22c55e; display: flex; align-items: center; gap: 8px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 6L9 17l-5-5"/>
                            </svg>
                            {heroSuccessMessage}
                        </p>
                    </div>
                {/if}

                {#if heroErrorMessage}
                    <div style="margin-bottom: 24px; padding: 12px 16px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px;">
                        <p style="color: #ef4444;">{heroErrorMessage}</p>
                    </div>
                {/if}

                {#if loading}
                    <div style="display: flex; flex-direction: column; gap: 16px;">
                        {#each Array(4) as _}
                            <div class="skeleton" style="height: 60px;"></div>
                        {/each}
                    </div>
                {:else}
                    <!-- Hero Enable Toggle -->
                    <div class="input-group" style="margin-bottom: 24px;">
                        <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
                            <input
                                type="checkbox"
                                bind:checked={hero.heroEnabled}
                                style="width: 20px; height: 20px; accent-color: var(--primary-color);"
                            />
                            <span>Show Hero Section on Homepage</span>
                        </label>
                    </div>

                    {#if showImageEditor}
                        <ImageEditor
                            imageUrl={hero.heroImage}
                            onSave={handleImageSave}
                            onCancel={() => showImageEditor = false}
                        />
                    {:else}
                        <!-- Hero Image Preview -->
                        <div style="margin-bottom: 24px;">
                            <label style="display: block; margin-bottom: 12px; font-weight: 500;">Hero Image</label>
                            {#if hero.heroImage}
                                <div style="position: relative; margin-bottom: 16px;">
                                    <img
                                        src={hero.heroImage}
                                        alt="Hero"
                                        style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;"
                                    />
                                    <button
                                        class="action-btn secondary"
                                        style="position: absolute; top: 8px; right: 8px; padding: 6px 12px; font-size: 0.8rem;"
                                        onclick={() => hero.heroImage = ''}
                                    >
                                        Remove
                                    </button>
                                </div>
                            {/if}
                            <button class="action-btn" onclick={() => showImageEditor = true}>
                                {hero.heroImage ? 'Change Image' : 'Add Hero Image'}
                            </button>
                        </div>

                        <!-- Hero Text -->
                        <div class="input-group" style="margin-bottom: 16px;">
                            <label for="heroTitle">Hero Title</label>
                            <input
                                type="text"
                                id="heroTitle"
                                bind:value={hero.heroTitle}
                                placeholder="Welcome to Our Store"
                            />
                        </div>

                        <div class="input-group" style="margin-bottom: 16px;">
                            <label for="heroSubtitle">Hero Subtitle</label>
                            <textarea
                                id="heroSubtitle"
                                bind:value={hero.heroSubtitle}
                                placeholder="Discover amazing products at great prices"
                                rows="2"
                            ></textarea>
                        </div>

                        <div class="input-group" style="margin-bottom: 16px;">
                            <label for="heroCtaText">CTA Button Text</label>
                            <input
                                type="text"
                                id="heroCtaText"
                                bind:value={hero.heroCtaText}
                                placeholder="Explore Collection"
                            />
                        </div>

                        <div class="input-group" style="margin-bottom: 24px;">
                            <label for="heroCtaLink">CTA Link</label>
                            <input
                                type="text"
                                id="heroCtaLink"
                                bind:value={hero.heroCtaLink}
                                placeholder="#products"
                            />
                        </div>

                        <div style="display: flex; gap: 12px;">
                            <button class="action-btn primary" onclick={saveHero} disabled={heroSaving} style="flex: 1;">
                                {heroSaving ? 'Saving...' : 'Save Hero Section'}
                            </button>
                        </div>
                    {/if}
                {/if}
            </div>

            <!-- Theme Editor -->
            <div class="glass-card dashboard">
                <h3 style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--glass-border);">
                    Theme Customization
                </h3>

                {#if loading}
                    <div style="display: flex; flex-direction: column; gap: 16px;">
                        {#each Array(6) as _}
                            <div class="skeleton" style="height: 60px;"></div>
                        {/each}
                    </div>
                {:else}
                    <!-- Presets -->
                    <div style="margin-bottom: 32px;">
                        <span style="display: block; margin-bottom: 12px; font-weight: 500;">Quick Presets</span>
                        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                            {#each presets as preset}
                                <button
                                    type="button"
                                    class="action-btn"
                                    style="padding: 8px 16px; font-size: 0.9rem;"
                                    onclick={() => applyPreset(preset)}
                                >
                                    {preset.name}
                                </button>
                            {/each}
                        </div>
                    </div>

                    <!-- Color Settings -->
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px;">
                        <div class="input-group">
                            <label for="primaryColor">Primary Color</label>
                            <div style="display: flex; gap: 12px; align-items: center;">
                                <input
                                    type="color"
                                    id="primaryColor"
                                    bind:value={theme.primaryColor}
                                    style="width: 50px; height: 50px; border: none; border-radius: 8px; cursor: pointer;"
                                />
                                <input
                                    type="text"
                                    bind:value={theme.primaryColor}
                                    style="flex: 1;"
                                    placeholder="#0ea5e9"
                                />
                            </div>
                        </div>

                        <div class="input-group">
                            <label for="secondaryColor">Secondary Color</label>
                            <div style="display: flex; gap: 12px; align-items: center;">
                                <input
                                    type="color"
                                    id="secondaryColor"
                                    bind:value={theme.secondaryColor}
                                    style="width: 50px; height: 50px; border: none; border-radius: 8px; cursor: pointer;"
                                />
                                <input
                                    type="text"
                                    bind:value={theme.secondaryColor}
                                    style="flex: 1;"
                                    placeholder="#6366f1"
                                />
                            </div>
                        </div>

                        <div class="input-group">
                            <label for="accentColor">Accent Color</label>
                            <div style="display: flex; gap: 12px; align-items: center;">
                                <input
                                    type="color"
                                    id="accentColor"
                                    bind:value={theme.accentColor}
                                    style="width: 50px; height: 50px; border: none; border-radius: 8px; cursor: pointer;"
                                />
                                <input
                                    type="text"
                                    bind:value={theme.accentColor}
                                    style="flex: 1;"
                                    placeholder="#8b5cf6"
                                />
                            </div>
                        </div>

                        <div class="input-group">
                            <label for="backgroundColor">Background Color</label>
                            <div style="display: flex; gap: 12px; align-items: center;">
                                <input
                                    type="color"
                                    id="backgroundColor"
                                    bind:value={theme.backgroundColor}
                                    style="width: 50px; height: 50px; border: none; border-radius: 8px; cursor: pointer;"
                                />
                                <input
                                    type="text"
                                    bind:value={theme.backgroundColor}
                                    style="flex: 1;"
                                    placeholder="#0f172a"
                                />
                            </div>
                        </div>

                        <div class="input-group">
                            <label for="surfaceColor">Surface Color</label>
                            <div style="display: flex; gap: 12px; align-items: center;">
                                <input
                                    type="color"
                                    id="surfaceColor"
                                    bind:value={theme.surfaceColor}
                                    style="width: 50px; height: 50px; border: none; border-radius: 8px; cursor: pointer;"
                                />
                                <input
                                    type="text"
                                    bind:value={theme.surfaceColor}
                                    style="flex: 1;"
                                    placeholder="#1e293b"
                                />
                            </div>
                        </div>

                        <div class="input-group">
                            <label for="textColor">Text Color</label>
                            <div style="display: flex; gap: 12px; align-items: center;">
                                <input
                                    type="color"
                                    id="textColor"
                                    bind:value={theme.textColor}
                                    style="width: 50px; height: 50px; border: none; border-radius: 8px; cursor: pointer;"
                                />
                                <input
                                    type="text"
                                    bind:value={theme.textColor}
                                    style="flex: 1;"
                                    placeholder="#f8fafc"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Border Radius -->
                    <div style="margin-bottom: 24px;">
                        <label for="borderRadius" style="display: block; margin-bottom: 12px; font-weight: 500;">Border Radius</label>
                        <div style="display: flex; align-items: center; gap: 16px;">
                            <input
                                type="range"
                                id="borderRadius"
                                min="0"
                                max="32"
                                value={parseInt(theme.borderRadius)}
                                oninput={(e) => theme.borderRadius = `${e.currentTarget.value}px`}
                                style="flex: 1;"
                            />
                            <span style="width: 60px; text-align: right;">{theme.borderRadius}</span>
                        </div>
                    </div>

                    <!-- Store Info -->
                    <div style="border-top: 1px solid var(--glass-border); padding-top: 24px; margin-bottom: 24px;">
                        <div class="input-group">
                            <label for="currency">Currency</label>
                            <select id="currency" bind:value={theme.currency}>
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                                <option value="KWD">KWD (د.ك)</option>
                                <option value="AED">AED (د.إ)</option>
                            </select>
                        </div>
                    </div>

                    <div style="display: flex; gap: 12px;">
                        <button class="action-btn primary" onclick={saveTheme} disabled={saving} style="flex: 1;">
                            {saving ? 'Saving...' : 'Save Theme'}
                        </button>
                        <button class="action-btn secondary" onclick={() => goto('/dashboard')} style="flex: 1;">
                            Cancel
                        </button>
                    </div>
                {/if}
            </div>
        </div>

        <!-- Live Preview -->
        <div>
            <div class="glass-card dashboard" style="position: sticky; top: 20px;">
                <h3 style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--glass-border);">
                    Live Preview
                </h3>

                <div
                    style="
                        border-radius: 12px;
                        padding: 24px;
                        background: {theme.backgroundColor};
                        color: {theme.textColor};
                        border: 1px solid {theme.borderColor};
                        font-family: {theme.fontFamily};
                    "
                >
                    <!-- Hero Preview -->
                    {#if hero.heroEnabled && hero.heroImage}
                        <div style="margin-bottom: 16px; border-radius: {theme.borderRadius}; overflow: hidden;">
                            <div style="position: relative; height: 120px; background: linear-gradient(135deg, {theme.primaryColor}33, {theme.secondaryColor}33);">
                                <img src={hero.heroImage} alt="Hero" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.8;" />
                                <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 16px; text-align: center;">
                                    <h4 style="margin: 0 0 4px 0; color: {theme.textColor}; font-size: 1.1rem; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">{hero.heroTitle}</h4>
                                    <p style="margin: 0; color: {theme.textSecondaryColor}; font-size: 0.8rem; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">{hero.heroSubtitle}</p>
                                </div>
                            </div>
                        </div>
                    {/if}

                    <div
                        style="
                            padding: 16px;
                            border-radius: {theme.borderRadius};
                            background: {theme.surfaceColor};
                            margin-bottom: 16px;
                        "
                    >
                        <h4 style="margin: 0 0 8px 0; color: {theme.textColor};">Sample Product</h4>
                        <p style="margin: 0; color: {theme.textSecondaryColor}; font-size: 0.9rem;">
                            This is how your content will look
                        </p>
                    </div>

                    <div style="display: flex; gap: 12px;">
                        <button
                            style="
                                flex: 1;
                                padding: 12px 20px;
                                border-radius: {theme.borderRadius};
                                background: linear-gradient(135deg, {theme.primaryColor}, {theme.secondaryColor});
                                color: white;
                                border: none;
                                cursor: pointer;
                                font-weight: 500;
                            "
                        >
                            Primary
                        </button>
                        <button
                            style="
                                flex: 1;
                                padding: 12px 20px;
                                border-radius: {theme.borderRadius};
                                background: {theme.surfaceColor};
                                color: {theme.textColor};
                                border: 1px solid {theme.borderColor};
                                cursor: pointer;
                            "
                        >
                            Secondary
                        </button>
                    </div>

                    <div style="margin-top: 16px; text-align: center;">
                        <span style="color: {theme.accentColor};">
                            Accent Color Example
                        </span>
                    </div>
                </div>

                <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--glass-border);">
                    <span style="display: block; margin-bottom: 12px; font-weight: 500;">Store ID</span>
                    <code
                        style="
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            background: var(--input-bg);
                            padding: 14px 16px;
                            border-radius: 12px;
                            font-size: 0.85rem;
                            color: var(--accent-color);
                        "
                    >
                        <span>{storeId}</span>
                        <button
                            aria-label="Copy Store ID"
                            onclick={() => copyToClipboard(storeId)}
                            style="background: transparent; border: none; color: var(--text-secondary); cursor: pointer;"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                        </button>
                    </code>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .settings-content {
        display: flex;
        flex-direction: column;
    }

    input[type="color"] {
        -webkit-appearance: none;
        border: none;
        width: 50px;
        height: 50px;
        border-radius: 8px;
        overflow: hidden;
    }
    input[type="color"]::-webkit-color-swatch-wrapper {
        padding: 0;
    }
    input[type="color"]::-webkit-color-swatch {
        border: none;
    }
    input[type="range"] {
        -webkit-appearance: none;
        height: 8px;
        border-radius: 4px;
        background: var(--surface-bg);
        outline: none;
    }
    input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: var(--accent-color);
        cursor: pointer;
    }

    textarea {
        resize: vertical;
        min-height: 60px;
    }
</style>
