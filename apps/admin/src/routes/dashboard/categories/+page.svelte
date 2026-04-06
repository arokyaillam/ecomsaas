<script lang="ts">
    import { onMount } from 'svelte';
    import { API_BASE_URL } from '$lib/api';
    import { goto } from '$app/navigation';

    type Category = {
        id: string;
        nameEn: string;
        nameAr?: string;
        createdAt: string;
        [key: string]: any;
    };

    let categories = $state([] as Category[]);
    let loading = $state(true);
    let searchQuery = $state('');
    let showDeleteModal = $state(false);
    let categoryToDelete = $state(null as Category | null);
    let deleteLoading = $state(false);

    onMount(async () => {
        const token = localStorage.getItem('merchant_token');
        if (!token) {
            goto('/login');
            return;
        }
        await fetchCategories(token);
    });

    async function fetchCategories(token: string) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/categories`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                categories = data.data || [];
            } else if (res.status === 401) {
                localStorage.removeItem('merchant_token');
                goto('/login');
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        } finally {
            loading = false;
        }
    }

    function confirmDelete(category: Category) {
        categoryToDelete = category;
        showDeleteModal = true;
    }

    async function deleteCategory() {
        if (!categoryToDelete) return;
        
        deleteLoading = true;
        const token = localStorage.getItem('merchant_token');
        
        try {
            const res = await fetch(`${API_BASE_URL}/api/categories/${categoryToDelete.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                categories = categories.filter(c => c.id !== categoryToDelete?.id);
                showDeleteModal = false;
                categoryToDelete = null;
            } else if (res.status === 401) {
                localStorage.removeItem('merchant_token');
                goto('/login');
            }
        } catch (error) {
            console.error('Failed to delete category:', error);
        } finally {
            deleteLoading = false;
        }
    }

    function formatDate(dateStr: string) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    let filteredCategories = $derived(categories.filter(c => 
        c.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.nameAr && c.nameAr.toLowerCase().includes(searchQuery.toLowerCase()))
    ));
</script>

<div class="fade-in">
    <!-- Header -->
    <div class="dashboard-header">
        <div>
            <h2>Categories</h2>
            <p style="color: var(--text-secondary); margin-top: 4px;">Manage your product categories</p>
        </div>
        
        <div class="header-actions">
            <button class="action-btn secondary" onclick={() => goto('/dashboard')} style="margin-right: 8px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
                    <path d="M19 12H5M12 19l-7-7 7-7"></path>
                </svg>
                Back
            </button>
            <a href="/dashboard/categories/new" class="action-btn primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add Category
            </a>
        </div>
    </div>

    <!-- Search Bar -->
    <div class="glass-card dashboard" style="margin-bottom: 24px;">
        <div style="display: flex; gap: 16px; align-items: center;">
            <div style="flex: 1; position: relative;">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--text-secondary);">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input 
                    type="text" 
                    placeholder="Search categories by name (English or Arabic)..." 
                    bind:value={searchQuery}
                    style="padding-left: 48px;"
                />
            </div>
            <span style="color: var(--text-secondary); font-size: 0.9rem;">{filteredCategories.length} categories</span>
        </div>
    </div>

    <!-- Categories Table -->
    <div class="glass-card dashboard">
        {#if loading}
            <div style="display: flex; flex-direction: column; gap: 16px; padding: 24px;">
                {#each Array(3) as _}
                    <div class="skeleton" style="width: 100%; height: 60px;"></div>
                {/each}
            </div>
        {:else if filteredCategories.length === 0}
            <div style="text-align: center; padding: 60px 24px; color: var(--text-secondary);">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin-bottom: 16px; opacity: 0.5;">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                    <path d="M3 6h18"></path>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
                <p style="font-size: 1.1rem; margin-bottom: 8px;">{searchQuery ? 'No categories found' : 'No categories yet'}</p>
                <p style="margin-bottom: 24px;">{searchQuery ? 'Try adjusting your search' : 'Get started by adding your first category'}</p>
                
                {#if !searchQuery}
                    <a href="/dashboard/categories/new" class="action-btn primary">Add First Category</a>
                {/if}
            </div>
        {:else}
            <div style="overflow-x: auto;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Name (English)</th>
                            <th>Name (Arabic)</th>
                            <th>Created At</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each filteredCategories as category}
                            <tr>
                                <td>
                                    <strong>{category.nameEn}</strong>
                                </td>
                                <td>
                                    {#if category.nameAr}
                                        <span dir="rtl">{category.nameAr}</span>
                                    {:else}
                                        <span style="color: var(--text-muted); font-size: 0.85rem;">Not provided</span>
                                    {/if}
                                </td>
                                <td>
                                    <span style="color: var(--text-secondary); font-size: 0.9rem;">{formatDate(category.createdAt)}</span>
                                </td>
                                <td>
                                    <div style="display: flex; gap: 8px;">
                                        <a href="/dashboard/categories/{category.id}/edit" class="action-btn secondary" style="padding: 6px 12px;" aria-label="Edit category">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                                            </svg>
                                        </a>
                                        
                                        <button class="action-btn secondary" style="padding: 6px 12px; background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); color: #ef4444;" onclick={() => confirmDelete(category)} aria-label="Delete category">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M3 6h18"></path>
                                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    </div>
</div>

<!-- Delete Modal -->
{#if showDeleteModal}
    <div style="position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 200;">
        <div class="glass-card" style="width: 100%; max-width: 400px;">
            <h3 style="margin-bottom: 16px;">Delete Category?</h3>
            <p style="color: var(--text-secondary); margin-bottom: 24px;">
                Are you sure you want to delete "{categoryToDelete?.nameEn}"? This action cannot be undone.
            </p>
            
            <div style="display: flex; gap: 12px;">
                <button class="action-btn secondary" onclick={() => { showDeleteModal = false; categoryToDelete = null; }} style="flex: 1;">Cancel</button>
                <button class="action-btn" style="flex: 1; background: #ef4444; color: white;" onclick={deleteCategory} disabled={deleteLoading}>
                    {deleteLoading ? 'Deleting...' : 'Delete'}
                </button>
            </div>
        </div>
    </div>
{/if}
