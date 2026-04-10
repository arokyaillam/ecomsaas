<script lang="ts">
    import { onMount } from 'svelte';
    import { API_BASE_URL } from '$lib/api';

    interface ModifierOption {
        id?: string;
        nameEn: string;
        nameAr?: string;
        priceAdjustment: number;
        imageUrl?: string;
        sortOrder: number;
        isAvailable: boolean;
    }

    interface ModifierGroup {
        id?: string;
        name: string;
        isRequired: boolean;
        minSelections: number;
        maxSelections: number;
        sortOrder: number;
        options: ModifierOption[];
    }

    interface Props {
        productId: string;
        readOnly?: boolean;
    }

    let { productId, readOnly = false }: Props = $props();

    let groups = $state<ModifierGroup[]>([]);
    let loading = $state(true);
    let saving = $state(false);
    let error = $state('');

    // New group form
    let showNewGroupForm = $state(false);
    let newGroup = $state<Partial<ModifierGroup>>({
        name: '',
        isRequired: false,
        minSelections: 1,
        maxSelections: 1,
        sortOrder: 0,
        options: []
    });

    // New option form (per group)
    let activeGroupForOption = $state<string | null>(null);
    let newOption = $state<Partial<ModifierOption>>({
        nameEn: '',
        nameAr: '',
        priceAdjustment: 0,
        sortOrder: 0,
        isAvailable: true
    });

    onMount(async () => {
        await fetchModifiers();
    });

    async function fetchModifiers() {
        const token = localStorage.getItem('merchant_token');
        if (!token) return;

        try {
            loading = true;
            const res = await fetch(`${API_BASE_URL}/api/modifiers/product/${productId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                groups = data.data || [];
            }
        } catch (err) {
            console.error('Failed to fetch modifiers:', err);
        } finally {
            loading = false;
        }
    }

    async function createGroup() {
        if (!newGroup.name?.trim()) return;

        const token = localStorage.getItem('merchant_token');
        if (!token) return;

        saving = true;
        error = '';

        try {
            const res = await fetch(`${API_BASE_URL}/api/modifiers/groups`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...newGroup,
                    productId,
                    minSelections: Number(newGroup.minSelections),
                    maxSelections: Number(newGroup.maxSelections),
                    sortOrder: Number(newGroup.sortOrder)
                })
            });

            if (res.ok) {
                const data = await res.json();
                groups = [...groups, data.data];
                showNewGroupForm = false;
                newGroup = {
                    name: '',
                    isRequired: false,
                    minSelections: 1,
                    maxSelections: 1,
                    sortOrder: 0,
                    options: []
                };
            } else {
                const err = await res.json();
                error = err.error?.general || 'Failed to create group';
            }
        } catch (err) {
            error = 'Network error. Please try again.';
        } finally {
            saving = false;
        }
    }

    async function deleteGroup(groupId: string) {
        if (!confirm('Are you sure you want to delete this modifier group?')) return;

        const token = localStorage.getItem('merchant_token');
        if (!token) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/modifiers/groups/${groupId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                groups = groups.filter(g => g.id !== groupId);
            }
        } catch (err) {
            console.error('Failed to delete group:', err);
        }
    }

    async function createOption(groupId: string) {
        if (!newOption.nameEn?.trim()) return;

        const token = localStorage.getItem('merchant_token');
        if (!token) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/modifiers/options`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    modifierGroupId: groupId,
                    nameEn: newOption.nameEn,
                    nameAr: newOption.nameAr,
                    priceAdjustment: Number(newOption.priceAdjustment) || 0,
                    sortOrder: Number(newOption.sortOrder) || 0,
                    isAvailable: newOption.isAvailable
                })
            });

            if (res.ok) {
                const data = await res.json();
                const groupIndex = groups.findIndex(g => g.id === groupId);
                if (groupIndex !== -1) {
                    groups[groupIndex].options = [...groups[groupIndex].options, data.data];
                }
                activeGroupForOption = null;
                newOption = {
                    nameEn: '',
                    nameAr: '',
                    priceAdjustment: 0,
                    sortOrder: 0,
                    isAvailable: true
                };
            }
        } catch (err) {
            console.error('Failed to create option:', err);
        }
    }

    async function deleteOption(groupId: string, optionId: string) {
        if (!confirm('Are you sure you want to delete this option?')) return;

        const token = localStorage.getItem('merchant_token');
        if (!token) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/modifiers/options/${optionId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const groupIndex = groups.findIndex(g => g.id === groupId);
                if (groupIndex !== -1) {
                    groups[groupIndex].options = groups[groupIndex].options.filter(o => o.id !== optionId);
                }
            }
        } catch (err) {
            console.error('Failed to delete option:', err);
        }
    }

    function moveGroup(index: number, direction: 'up' | 'down') {
        if (direction === 'up' && index > 0) {
            const newGroups = [...groups];
            [newGroups[index - 1], newGroups[index]] = [newGroups[index], newGroups[index - 1]];
            groups = newGroups;
        } else if (direction === 'down' && index < groups.length - 1) {
            const newGroups = [...groups];
            [newGroups[index], newGroups[index + 1]] = [newGroups[index + 1], newGroups[index]];
            groups = newGroups;
        }
    }

    function formatPriceAdjustment(price: number): string {
        if (price === 0) return 'Free';
        if (price > 0) return `+${price.toFixed(2)}`;
        return price.toFixed(2);
    }
</script>

<div class="modifier-manager">
    {#if loading}
        <div class="loading-state">
            <div class="spinner"></div>
            <span>Loading modifiers...</span>
        </div>
    {:else}
        {#if error}
            <div class="error-banner">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {error}
            </div>
        {/if}

        {#if groups.length === 0}
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                    <path d="M2 17l10 5 10-5"></path>
                    <path d="M2 12l10 5 10-5"></path>
                </svg>
                <p>No modifier groups yet</p>
                <span>Add groups like "Size", "Color", "Toppings" to give customers more choices</span>
            </div>
        {:else}
            <div class="groups-list">
                {#each groups as group, groupIndex}
                    <div class="group-card">
                        <div class="group-header">
                            <div class="group-title">
                                <h4>{group.name}</h4>
                                <div class="group-badges">
                                    {#if group.isRequired}
                                        <span class="badge required">Required</span>
                                    {/if}
                                    <span class="badge">
                                        {group.minSelections === group.maxSelections
                                            ? `Select ${group.minSelections}`
                                            : `Select ${group.minSelections}-${group.maxSelections}`
                                        }
                                    </span>
                                </div>
                            </div>
                            {#if !readOnly}
                                <div class="group-actions">
                                    {#if groupIndex > 0}
                                        <button class="icon-btn" onclick={() => moveGroup(groupIndex, 'up')} title="Move up">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <polyline points="18 15 12 9 6 15"></polyline>
                                            </svg>
                                        </button>
                                    {/if}
                                    {#if groupIndex < groups.length - 1}
                                        <button class="icon-btn" onclick={() => moveGroup(groupIndex, 'down')} title="Move down">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <polyline points="6 9 12 15 18 9"></polyline>
                                            </svg>
                                        </button>
                                    {/if}
                                    <button class="icon-btn danger" onclick={() => deleteGroup(group.id!)} title="Delete group">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        </svg>
                                    </button>
                                </div>
                            {/if}
                        </div>

                        <div class="options-list">
                            {#if group.options.length === 0}
                                <p class="no-options">No options added yet</p>
                            {:else}
                                {#each group.options as option}
                                    <div class="option-item">
                                        <div class="option-info">
                                            <span class="option-name">{option.nameEn}</span>
                                            {#if option.nameAr}
                                                <span class="option-name-ar" dir="rtl">{option.nameAr}</span>
                                            {/if}
                                            {#if option.priceAdjustment !== 0}
                                                <span class="option-price {option.priceAdjustment > 0 ? 'positive' : 'negative'}">
                                                    {formatPriceAdjustment(Number(option.priceAdjustment))}
                                                </span>
                                            {/if}
                                        </div>
                                        {#if !readOnly}
                                            <button class="icon-btn small danger" onclick={() => deleteOption(group.id!, option.id!)} title="Delete option">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                                </svg>
                                            </button>
                                        {/if}
                                    </div>
                                {/each}
                            {/if}

                            {#if !readOnly && activeGroupForOption === group.id}
                                <div class="new-option-form">
                                    <div class="form-row">
                                        <input
                                            type="text"
                                            bind:value={newOption.nameEn}
                                            placeholder="Option name (English)"
                                            class="input-small"
                                        />
                                        <input
                                            type="text"
                                            bind:value={newOption.nameAr}
                                            placeholder="(Arabic)"
                                            dir="rtl"
                                            class="input-small"
                                        />
                                    </div>
                                    <div class="form-row">
                                        <div class="price-input">
                                            <span>Price adjustment</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                bind:value={newOption.priceAdjustment}
                                                placeholder="0.00"
                                                class="input-small"
                                            />
                                        </div>
                                        <label class="checkbox-label">
                                            <input type="checkbox" bind:checked={newOption.isAvailable} />
                                            Available
                                        </label>
                                    </div>
                                    <div class="form-actions">
                                        <button class="btn-small secondary" onclick={() => activeGroupForOption = null}>Cancel</button>
                                        <button class="btn-small primary" onclick={() => createOption(group.id!)}>Add Option</button>
                                    </div>
                                </div>
                            {:else if !readOnly}
                                <button class="add-option-btn" onclick={() => activeGroupForOption = group.id!}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                    </svg>
                                    Add Option
                                </button>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>
        {/if}

        {#if !readOnly}
            {#if showNewGroupForm}
                <div class="new-group-form">
                    <h4>Create New Modifier Group</h4>
                    <div class="form-grid">
                        <div class="form-field">
                            <label>Group Name *</label>
                            <input type="text" bind:value={newGroup.name} placeholder="e.g., Size, Color, Toppings" />
                        </div>
                        <div class="form-field">
                            <label>Required</label>
                            <label class="checkbox-label">
                                <input type="checkbox" bind:checked={newGroup.isRequired} />
                                Customer must select at least one option
                            </label>
                        </div>
                        <div class="form-row">
                            <div class="form-field">
                                <label>Min Selections</label>
                                <input type="number" min="1" bind:value={newGroup.minSelections} />
                            </div>
                            <div class="form-field">
                                <label>Max Selections</label>
                                <input type="number" min="1" bind:value={newGroup.maxSelections} />
                            </div>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button class="action-btn secondary" onclick={() => showNewGroupForm = false}>Cancel</button>
                        <button class="action-btn primary" onclick={createGroup} disabled={saving || !newGroup.name?.trim()}>
                            {saving ? 'Creating...' : 'Create Group'}
                        </button>
                    </div>
                </div>
            {:else}
                <button class="add-group-btn" onclick={() => showNewGroupForm = true}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add Modifier Group
                </button>
            {/if}
        {/if}
    {/if}
</div>

<style>
    .modifier-manager {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .loading-state {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 40px;
        color: var(--text-secondary);
    }

    .spinner {
        width: 20px;
        height: 20px;
        border: 2px solid var(--border-color);
        border-top-color: var(--accent-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .error-banner {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        color: #ef4444;
        font-size: 0.875rem;
    }

    .empty-state {
        text-align: center;
        padding: 40px 20px;
        color: var(--text-secondary);
    }

    .empty-state svg {
        margin-bottom: 16px;
        opacity: 0.5;
    }

    .empty-state p {
        font-size: 1rem;
        margin-bottom: 8px;
    }

    .empty-state span {
        font-size: 0.875rem;
        opacity: 0.7;
    }

    .groups-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .group-card {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        overflow: hidden;
    }

    .group-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
        background: var(--surface-elevated);
        border-bottom: 1px solid var(--border-color);
    }

    .group-title {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .group-title h4 {
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .group-badges {
        display: flex;
        gap: 6px;
    }

    .badge {
        padding: 2px 8px;
        background: var(--surface-color);
        border: 1px solid var(--border-color);
        font-size: 0.6875rem;
        color: var(--text-secondary);
        border-radius: 4px;
    }

    .badge.required {
        background: rgba(245, 158, 11, 0.1);
        border-color: rgba(245, 158, 11, 0.3);
        color: var(--accent-color);
    }

    .group-actions {
        display: flex;
        gap: 4px;
    }

    .icon-btn {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: 1px solid var(--border-color);
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .icon-btn:hover {
        border-color: var(--accent-color);
        color: var(--accent-color);
    }

    .icon-btn.danger:hover {
        border-color: var(--error);
        color: var(--error);
        background: rgba(239, 68, 68, 0.1);
    }

    .icon-btn.small {
        width: 24px;
        height: 24px;
    }

    .options-list {
        padding: 12px 16px;
    }

    .no-options {
        text-align: center;
        padding: 20px;
        color: var(--text-muted);
        font-size: 0.875rem;
        font-style: italic;
    }

    .option-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        background: var(--surface-color);
        border: 1px solid var(--border-color);
        margin-bottom: 8px;
        border-radius: 4px;
    }

    .option-item:last-child {
        margin-bottom: 0;
    }

    .option-info {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
    }

    .option-name {
        font-weight: 500;
        color: var(--text-primary);
    }

    .option-name-ar {
        color: var(--text-secondary);
        font-size: 0.875rem;
    }

    .option-price {
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 500;
    }

    .option-price.positive {
        background: rgba(34, 197, 94, 0.1);
        color: #22c55e;
    }

    .option-price.negative {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
    }

    .add-option-btn {
        width: 100%;
        padding: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: transparent;
        border: 1px dashed var(--border-color);
        color: var(--text-secondary);
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.15s ease;
        margin-top: 8px;
    }

    .add-option-btn:hover {
        border-color: var(--accent-color);
        color: var(--accent-color);
        background: rgba(245, 158, 11, 0.05);
    }

    .new-option-form {
        padding: 16px;
        background: var(--surface-color);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        margin-top: 8px;
    }

    .form-row {
        display: flex;
        gap: 12px;
        margin-bottom: 12px;
    }

    .form-row:last-child {
        margin-bottom: 0;
    }

    .input-small {
        flex: 1;
        padding: 8px 12px;
        background: var(--surface-elevated);
        border: 1px solid var(--border-color);
        color: var(--text-primary);
        font-size: 0.875rem;
    }

    .input-small:focus {
        outline: none;
        border-color: var(--accent-color);
    }

    .price-input {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
    }

    .price-input span {
        font-size: 0.75rem;
        color: var(--text-secondary);
        white-space: nowrap;
    }

    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.875rem;
        color: var(--text-secondary);
        cursor: pointer;
    }

    .checkbox-label input {
        width: 16px;
        height: 16px;
        accent-color: var(--accent-color);
    }

    .btn-small {
        padding: 8px 16px;
        font-size: 0.8125rem;
        border: none;
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .btn-small.secondary {
        background: var(--surface-elevated);
        border: 1px solid var(--border-color);
        color: var(--text-secondary);
    }

    .btn-small.secondary:hover {
        border-color: var(--text-primary);
        color: var(--text-primary);
    }

    .btn-small.primary {
        background: var(--accent-color);
        color: var(--bg-color);
        font-weight: 600;
    }

    .btn-small.primary:hover {
        background: #fbbf24;
    }

    .form-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
    }

    .add-group-btn {
        padding: 14px 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: transparent;
        border: 2px dashed var(--border-color);
        color: var(--text-secondary);
        font-size: 0.9375rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .add-group-btn:hover {
        border-color: var(--accent-color);
        color: var(--accent-color);
        background: rgba(245, 158, 11, 0.05);
    }

    .new-group-form {
        padding: 24px;
        background: var(--surface-color);
        border: 1px solid var(--border-color);
        border-radius: 8px;
    }

    .new-group-form h4 {
        margin-bottom: 20px;
        font-size: 1rem;
        font-weight: 600;
    }

    .form-grid {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-bottom: 20px;
    }

    .form-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .form-field label {
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--text-secondary);
    }

    .form-field input[type="text"],
    .form-field input[type="number"] {
        padding: 10px 12px;
        background: var(--surface-elevated);
        border: 1px solid var(--border-color);
        color: var(--text-primary);
        font-size: 0.875rem;
    }

    .form-field input:focus {
        outline: none;
        border-color: var(--accent-color);
    }

    .action-btn {
        padding: 10px 20px;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
        border: none;
    }

    .action-btn.secondary {
        background: var(--surface-elevated);
        border: 1px solid var(--border-color);
        color: var(--text-secondary);
    }

    .action-btn.secondary:hover {
        border-color: var(--text-primary);
        color: var(--text-primary);
    }

    .action-btn.primary {
        background: var(--accent-color);
        color: var(--bg-color);
    }

    .action-btn.primary:hover {
        background: #fbbf24;
    }

    .action-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>
