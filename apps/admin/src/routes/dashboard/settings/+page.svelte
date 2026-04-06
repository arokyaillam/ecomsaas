<script lang="ts">
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    let storeId = $state('');
    
    onMount(() => {
        storeId = localStorage.getItem('merchant_store_id') || '';
    });

    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text);
    }
</script>

<div class="fade-in">
    <div class="dashboard-header">
        <div>
            <h2>Settings</h2>
            <p style="color: var(--text-secondary); margin-top: 4px;">Manage your store settings</p>
        </div>
        
        <div class="header-actions">
            <button class="action-btn secondary" onclick={() => goto('/dashboard')}>Back</button>
        </div>
    </div>

    <div class="content-grid" style="grid-template-columns: 1fr 1fr;">
        <div class="glass-card dashboard">
            <h3 style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--glass-border);">Store Information</h3>
            
            <div class="input-group">
                <span style="font-size: 0.9rem; font-weight: 500; margin-bottom: 8px; display: block;">Store ID</span>
                <code style="display: flex; align-items: center; justify-content: space-between; background: var(--input-bg); padding: 14px 16px; border-radius: 12px; font-size: 0.85rem; color: var(--accent-color);">
                    <span>{storeId}</span>
                    <button aria-label="Copy Store ID" onclick={() => copyToClipboard(storeId)} style="background: transparent; border: none; color: var(--text-secondary); cursor: pointer;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    </button>
                </code>
            </div>
            
            <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 16px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 6px;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                Store ID is used for API integrations
            </p>
        </div>
        
        <div class="glass-card dashboard">
            <h3 style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--glass-border);">Account</h3>
            
            <button class="action-btn" style="width: 100%; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; justify-content: center; display: flex; gap: 8px;" onclick={() => {
                localStorage.removeItem('merchant_token');
                localStorage.removeItem('merchant_store_id');
                goto('/login');
            }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Logout
            </button>
        </div>
    </div>
</div>
