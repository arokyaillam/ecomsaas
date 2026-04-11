<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { ArrowLeft, Save, Percent, DollarSign, Loader2 } from 'lucide-svelte';
  import { API_BASE_URL } from '$lib/api';

  let loading = false;
  let saving = false;
  let error = '';

  let form = {
    code: '',
    type: 'percentage' as 'percentage' | 'fixed_amount',
    value: 10,
    description: '',
    minOrderAmount: 0,
    maxDiscountAmount: 0,
    usageLimit: 0,
    isActive: true,
    startsAt: '',
    expiresAt: '',
  };

  const couponId = $page.params.id;

  onMount(async () => {
    await fetchCoupon();
  });

  async function fetchCoupon() {
    try {
      const token = localStorage.getItem('merchant_token');
      const res = await fetch(`${API_BASE_URL}/api/coupons/admin/${couponId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const coupon = data.data;
        form = {
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          description: coupon.description || '',
          minOrderAmount: coupon.minOrderAmount || 0,
          maxDiscountAmount: coupon.maxDiscountAmount || 0,
          usageLimit: coupon.usageLimit || 0,
          isActive: coupon.isActive,
          startsAt: coupon.startsAt ? new Date(coupon.startsAt).toISOString().slice(0, 16) : '',
          expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 16) : '',
        };
      } else {
        error = 'Failed to load coupon';
      }
    } catch (err) {
      error = 'Failed to load coupon';
    } finally {
      loading = false;
    }
  }

  async function updateCoupon() {
    if (!form.code.trim()) {
      error = 'Coupon code is required';
      return;
    }

    if (form.value <= 0) {
      error = 'Value must be greater than 0';
      return;
    }

    saving = true;
    error = '';

    try {
      const token = localStorage.getItem('merchant_token');
      const res = await fetch(`${API_BASE_URL}/api/coupons/admin/${couponId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          code: form.code.toUpperCase(),
          minOrderAmount: form.minOrderAmount || null,
          maxDiscountAmount: form.maxDiscountAmount || null,
          usageLimit: form.usageLimit || null,
          startsAt: form.startsAt || null,
          expiresAt: form.expiresAt || null,
        }),
      });

      if (res.ok) {
        goto('/dashboard/coupons');
      } else {
        const data = await res.json();
        error = data.error || 'Failed to update coupon';
      }
    } catch (err) {
      error = 'Failed to update coupon';
    } finally {
      saving = false;
    }
  }
</script>

<div class="p-6 max-w-4xl mx-auto">
  <div class="flex items-center gap-4 mb-6">
    <button
      on:click={() => goto('/dashboard/coupons')}
      class="p-2 hover:bg-gray-100 rounded-lg"
    >
      <ArrowLeft class="w-5 h-5" />
    </button>
    <div>
      <h1 class="text-2xl font-bold">Edit Coupon</h1>
      <p class="text-gray-500 mt-1">Update discount code settings</p>
    </div>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-12">
      <Loader2 class="w-8 h-8 animate-spin text-blue-600" />
    </div>
  {:else}
    {#if error}
      <div class="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>
    {/if}

    <div class="bg-white rounded-lg border p-6">
      <form on:submit|preventDefault={updateCoupon} class="space-y-6">
        <!-- Code -->
        <div>
          <label class="block text-sm font-medium mb-2">Coupon Code *</label>
          <input
            type="text"
            bind:value={form.code}
            placeholder="e.g., SUMMER20"
            class="w-full px-4 py-2 border rounded-lg uppercase"
            maxlength={20}
            disabled
          />
          <p class="text-sm text-gray-500 mt-1">Coupon code cannot be changed</p>
        </div>

        <!-- Type and Value -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Discount Type *</label>
            <div class="flex rounded-lg border overflow-hidden">
              <button
                type="button"
                on:click={() => form.type = 'percentage'}
                class="flex-1 py-2 px-4 flex items-center justify-center gap-2 transition-colors {form.type === 'percentage' ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}"
              >
                <Percent class="w-4 h-4" />
                Percentage
              </button>
              <button
                type="button"
                on:click={() => form.type = 'fixed_amount'}
                class="flex-1 py-2 px-4 flex items-center justify-center gap-2 transition-colors {form.type === 'fixed_amount' ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}"
              >
                <DollarSign class="w-4 h-4" />
                Fixed Amount
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Value *</label>
            <div class="relative">
              <input
                type="number"
                bind:value={form.value}
                min="0"
                step={form.type === 'percentage' ? '1' : '0.01'}
                class="w-full px-4 py-2 border rounded-lg pl-10"
              />
              <span class="absolute left-3 top-1/2 -translate-y-1/2">
                {#if form.type === 'percentage'}
                  %
                {:else}
                  $
                {/if}
              </span>
            </div>
          </div>
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium mb-2">Description</label>
          <input
            type="text"
            bind:value={form.description}
            placeholder="e.g., Summer Sale 2024"
            class="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <!-- Restrictions -->
        <div class="border-t pt-6">
          <h3 class="font-medium mb-4">Restrictions</h3>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">Minimum Order Amount</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                <input
                  type="number"
                  bind:value={form.minOrderAmount}
                  min="0"
                  step="0.01"
                  placeholder="0"
                  class="w-full px-4 py-2 border rounded-lg pl-7"
                />
              </div>
            </div>

            {#if form.type === 'percentage'}
              <div>
                <label class="block text-sm font-medium mb-2">Maximum Discount Amount</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                  <input
                    type="number"
                    bind:value={form.maxDiscountAmount}
                    min="0"
                    step="0.01"
                    placeholder="No limit"
                    class="w-full px-4 py-2 border rounded-lg pl-7"
                  />
                </div>
              </div>
            {/if}

            <div>
              <label class="block text-sm font-medium mb-2">Usage Limit</label>
              <input
                type="number"
                bind:value={form.usageLimit}
                min="0"
                placeholder="Unlimited"
                class="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>

        <!-- Validity Period -->
        <div class="border-t pt-6">
          <h3 class="font-medium mb-4">Validity Period</h3>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">Start Date</label>
              <input
                type="datetime-local"
                bind:value={form.startsAt}
                class="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">End Date</label>
              <input
                type="datetime-local"
                bind:value={form.expiresAt}
                class="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>

        <!-- Active Status -->
        <div class="border-t pt-6">
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              bind:checked={form.isActive}
              class="w-5 h-5 rounded border-gray-300"
            />
            <div>
              <span class="font-medium">Active</span>
              <p class="text-sm text-gray-500">Enable this coupon</p>
            </div>
          </label>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 pt-6 border-t">
          <button
            type="submit"
            disabled={saving}
            class="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50"
          >
            <Save class="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            on:click={() => goto('/dashboard/coupons')}
            class="px-6 py-2 border rounded-lg font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  {/if}
</div>
