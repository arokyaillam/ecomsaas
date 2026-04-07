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
    
    // Subcategories state
    let subcategories = $state([] as any[]);
    let newSubNameEn = $state('');
    let newSubNameAr = $state('');
    let subLoading = $state(false);
    let subError = $state('');
    
    // We get the id directly from the Svelte page store
    let categoryId = $derived($page.params.id);

    onMount(async () => {
        const token = localStorage.getItem('merchant_token');
        if (!token) {
            goto('/login');
            return;
        }
        
        try {
            const [catRes, subcatRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/categories/${categoryId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${API_BASE_URL}/api/categories/${categoryId}/subcategories`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);
            
            if (catRes.ok) {
                const data = await catRes.json();
                nameEn = data.data.nameEn || '';
                nameAr = data.data.nameAr || '';
            } else if (catRes.status === 401) {
                localStorage.removeItem('merchant_token');
                goto('/login');
                return;
            } else {
                error = 'Failed to load category';
            }

            if (subcatRes.ok) {
                const subData = await subcatRes.json();
                subcategories = subData.data || [];
            }
        } catch (err) {
            console.error(err);
            error = 'Network error while fetching data';
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
                error = ''; // success
                alert('Category updated successfully');
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

    async function handleAddSubcategory(e: Event) {
        e.preventDefault();
        if (!newSubNameEn.trim()) {
            subError = 'English name is required for subcategory';
            return;
        }

        subLoading = true;
        subError = '';
        const token = localStorage.getItem('merchant_token');

        try {
            const res = await fetch(`${API_BASE_URL}/api/categories/${categoryId}/subcategories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    nameEn: newSubNameEn,
                    nameAr: newSubNameAr ? newSubNameAr : undefined
                })
            });

            if (res.ok) {
                const data = await res.json();
                subcategories = [...subcategories, data.data];
                newSubNameEn = '';
                newSubNameAr = '';
            } else if (res.status === 401) {
                localStorage.removeItem('merchant_token');
                goto('/login');
            } else {
                const data = await res.json();
                subError = data.error || 'Failed to add subcategory';
            }
        } catch (err) {
            console.error(err);
            subError = 'Network error while adding subcategory';
        } finally {
            subLoading = false;
        }
    }

    async function handleDeleteSubcategory(subId: string) {
        if (!confirm('Are you sure you want to delete this subcategory?')) return;

        const token = localStorage.getItem('merchant_token');
        try {
            const res = await fetch(`${API_BASE_URL}/api/categories/${categoryId}/subcategories/${subId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                subcategories = subcategories.filter(s => s.id !== subId);
            } else if (res.status === 401) {
                localStorage.removeItem('merchant_token');
                goto('/login');
            } else {
                alert('Failed to delete subcategory');
            }
        } catch (err) {
            console.error(err);
            alert('Network error while deleting subcategory');
        }
    }
</script>

<div class="fade-in" style="max-width: 600px; margin: 0 auto; padding-bottom: 60px;">
    <div class="dashboard-header" style="margin-bottom: 24px;">
        <div>
            <h2>Edit Category</h2>
            <p style="color: var(--text-secondary); margin-top: 4px;">Update category details and subcategories</p>
        </div>
        
        <button class="action-btn secondary" onclick={() => goto('/dashboard/categories')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
                <path d="M19 12H5M12 19l-7-7 7-7"></path>
            </svg>
            Back
        </button>
    </div>

    <!-- Main Category Update Form -->
    <div class="glass-card dashboard" style="margin-bottom: 32px;">
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

    <!-- Subcategories Section -->
    {#if !fetchLoading}
    <div>
        <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 16px;">Subcategories</h3>
        
        <div class="glass-card dashboard">
            {#if subcategories.length > 0}
                <ul style="list-style: none; padding: 0; margin-bottom: 24px; display: flex; flex-direction: column; gap: 8px;">
                    {#each subcategories as sub}
                        <li style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 8px;">
                            <div>
                                <strong style="font-weight: 500;">{sub.nameEn}</strong>
                                {#if sub.nameAr}
                                    <span style="margin-left: 8px; color: var(--text-secondary); font-size: 0.9rem;" dir="rtl">({sub.nameAr})</span>
                                {/if}
                            </div>
                            <button class="action-btn secondary" style="padding: 6px; color: #ef4444; border-color: rgba(239,68,68,0.2); background: rgba(239,68,68,0.1);" aria-label="Delete" onclick={() => handleDeleteSubcategory(sub.id)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 6h18"></path>
                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                </svg>
                            </button>
                        </li>
                    {/each}
                </ul>
            {:else}
                <div style="display: flex; flex-direction: column; gap: 8px; align-items: center; justify-content: center; padding: 32px 16px; text-align: center; color: var(--text-secondary); background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px dashed var(--border-color); margin-bottom: 24px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.5;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="16"></line>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                    </svg>
                    <p style="font-size: 0.95rem;">No subcategories added yet.</p>
                </div>
            {/if}

            <h4 style="font-size: 1rem; font-weight: 500; margin-bottom: 12px; color: var(--text-secondary);">Add New Subcategory</h4>
            
            {#if subError}
                <div class="error-msg" style="margin-bottom: 16px; color: #ef4444; font-size: 0.9rem; padding: 8px 12px; background: rgba(239, 68, 68, 0.1); border-radius: 4px;">
                    {subError}
                </div>
            {/if}

            <form onsubmit={handleAddSubcategory} style="display: flex; flex-direction: column; gap: 16px;">
                <div style="display: flex; gap: 16px;">
                    <div style="flex: 1;">
                        <label for="newSubNameEn" style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px; display: block;">Name (English) *</label>
                        <input 
                            type="text" 
                            id="newSubNameEn" 
                            bind:value={newSubNameEn} 
                            placeholder="e.g. Smartphones"
                            required
                            style="width: 100%; border: 1px solid var(--border-color); background: var(--input-bg); padding: 10px 12px; border-radius: 8px; color: var(--text-color);"
                        />
                    </div>
                    <div style="flex: 1;">
                        <label for="newSubNameAr" style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px; display: block;">Name (Arabic)</label>
                        <input 
                            type="text" 
                            id="newSubNameAr" 
                            bind:value={newSubNameAr} 
                            placeholder="e.g. هواتف ذكية"
                            dir="rtl"
                            style="width: 100%; border: 1px solid var(--border-color); background: var(--input-bg); padding: 10px 12px; border-radius: 8px; color: var(--text-color);"
                        />
                    </div>
                </div>
                <div style="display: flex; justify-content: flex-end;">
                    <button type="submit" class="action-btn secondary" disabled={subLoading} style="min-width: 100px;">
                        {#if subLoading}
                            <div class="spinner" style="width: 16px; height: 16px; border-width: 2px;"></div>
                        {:else}
                            Add
                        {/if}
                    </button>
                </div>
            </form>
        </div>
    </div>
    {/if}
</div>
