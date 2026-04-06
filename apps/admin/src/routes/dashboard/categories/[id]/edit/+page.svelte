<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { API_BASE_URL } from '$lib/api';

    let nameEn = $state('');
    let nameAr = $state('');
    let loading = $state(false);
    let fetchLoading = $state(true);
    let error = $state('');
    
    // We get the id directly from the Svelte page store
    let categoryId = $derived($page.params.id);

    onMount(async () => {
        const token = localStorage.getItem('merchant_token');
        if (!token) {
            goto('/login');
            return;
        }
        
        try {
            const res = await fetch(`${API_BASE_URL}/api/categories/${categoryId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                nameEn = data.data.nameEn || '';
                nameAr = data.data.nameAr || '';
            } else if (res.status === 401) {
                localStorage.removeItem('merchant_token');
                goto('/login');
            } else {
                error = 'Failed to load category';
            }
        } catch (err) {
            console.error(err);
            error = 'Network error while fetching category';
        } finally {
            fetchLoading = false;
        }
    });

    async function handleSubmit(e: Event) {
        e.preventDefault();
        
        if (!nameEn.trim()) {
            error = 'English name is required';
            return;
        }

        loading = true;
        error = '';
        const token = localStorage.getItem('merchant_token');

        try {
            const res = await fetch(`${API_BASE_URL}/api/categories/${categoryId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    nameEn,
                    nameAr: nameAr ? nameAr : undefined
                })
            });

            if (res.ok) {
                goto('/dashboard/categories');
            } else if (res.status === 401) {
                localStorage.removeItem('merchant_token');
                goto('/login');
            } else {
                const data = await res.json();
                error = data.error || 'Failed to update category';
            }
        } catch (err) {
            console.error(err);
            error = 'Network error while updating category';
        } finally {
            loading = false;
        }
    }
</script>

<div class="fade-in" style="max-width: 600px; margin: 0 auto;">
    <div class="dashboard-header" style="margin-bottom: 24px;">
        <div>
            <h2>Edit Category</h2>
            <p style="color: var(--text-secondary); margin-top: 4px;">Update category details</p>
        </div>
        
        <button class="action-btn secondary" onclick={() => goto('/dashboard/categories')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
                <path d="M19 12H5M12 19l-7-7 7-7"></path>
            </svg>
            Back
        </button>
    </div>

    <div class="glass-card dashboard">
        {#if fetchLoading}
            <div style="display: flex; justify-content: center; padding: 40px;">
                <div class="spinner" style="border-width: 3px; width: 24px; height: 24px;"></div>
            </div>
        {:else}
            {#if error}
                <div class="error-msg" style="margin-bottom: 24px; display: block; border-left: 4px solid #ef4444; background: rgba(239, 68, 68, 0.1); padding: 12px; border-radius: 4px; color: #ef4444;">
                    {error}
                </div>
            {/if}

            <form onsubmit={handleSubmit} style="display: flex; flex-direction: column; gap: 20px;">
                <div class="input-group">
                    <label for="nameEn">Category Name (English) *</label>
                    <input 
                        type="text" 
                        id="nameEn" 
                        bind:value={nameEn} 
                        placeholder="e.g. Electronics"
                        required
                        style="width: 100%; border: 1px solid var(--border-color); background: var(--input-bg); padding: 12px; border-radius: 8px; color: var(--text-color);"
                    />
                </div>

                <div class="input-group">
                    <label for="nameAr">Category Name (Arabic)</label>
                    <input 
                        type="text" 
                        id="nameAr" 
                        bind:value={nameAr} 
                        placeholder="e.g. إلكترونيات"
                        dir="rtl"
                        style="width: 100%; border: 1px solid var(--border-color); background: var(--input-bg); padding: 12px; border-radius: 8px; color: var(--text-color);"
                    />
                </div>

                <div style="display: flex; justify-content: flex-end; margin-top: 12px;">
                    <button type="submit" class="action-btn primary" disabled={loading} style="min-width: 120px;">
                        {#if loading}
                            <div class="spinner"></div>
                        {:else}
                            Save Changes
                        {/if}
                    </button>
                </div>
            </form>
        {/if}
    </div>
</div>
