<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { API_BASE_URL } from '$lib/api';

    interface OrderItem {
        id: string;
        productId: string;
        productTitle: string;
        productImage: string | null;
        quantity: number;
        price: string;
        total: string;
        variantName: string | null;
    }

    interface Customer {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
    }

    interface Order {
        id: string;
        orderNumber: string;
        status: string;
        paymentStatus: string;
        fulfillmentStatus: string;
        email: string;
        phone: string | null;
        currency: string;
        subtotal: string;
        tax: string;
        shipping: string;
        discount: string;
        total: string;
        shippingFirstName: string;
        shippingLastName: string;
        shippingAddressLine1: string;
        shippingAddressLine2: string | null;
        shippingCity: string;
        shippingState: string | null;
        shippingCountry: string;
        shippingPostalCode: string;
        shippingMethod: string | null;
        shippingCarrier: string | null;
        trackingNumber: string | null;
        paymentMethod: string | null;
        couponCode: string | null;
        notes: string | null;
        adminNotes: string | null;
        createdAt: string;
        items: OrderItem[];
        customer: Customer | null;
    }

    let order = $state<Order | null>(null);
    let loading = $state(true);
    let error = $state('');
    let updatingStatus = $state(false);
    let trackingCarrier = $state('');
    let trackingNumber = $state('');
    let adminNotes = $state('');
    let showTrackingModal = $state(false);

    const orderId = $page.params.id;

    const statusColors: Record<string, string> = {
        pending: 'warning',
        confirmed: 'info',
        processing: 'info',
        shipped: 'success',
        delivered: 'success',
        cancelled: 'error',
    };

    const paymentColors: Record<string, string> = {
        pending: 'warning',
        paid: 'success',
        failed: 'error',
        refunded: 'neutral',
        partially_refunded: 'neutral',
    };

    const fulfillmentColors: Record<string, string> = {
        unfulfilled: 'warning',
        partial: 'neutral',
        fulfilled: 'success',
    };

    onMount(() => {
        fetchOrder();
    });

    async function fetchOrder() {
        loading = true;
        error = '';
        try {
            const token = localStorage.getItem('merchant_token');
            if (!token) { goto('/login'); return; }

            const res = await fetch(`${API_BASE_URL}/api/orders/admin/${orderId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(data.error || 'Failed to fetch order');
            }

            const data = await res.json();
            order = data.data;
            adminNotes = order?.adminNotes || '';
        } catch (err: any) {
            error = err.message || 'Failed to fetch order';
        } finally {
            loading = false;
        }
    }

    async function updateStatus(newStatus: string) {
        updatingStatus = true;
        try {
            const token = localStorage.getItem('merchant_token');
            if (!token) { goto('/login'); return; }

            const res = await fetch(`${API_BASE_URL}/api/orders/admin/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                await fetchOrder();
            } else {
                const data = await res.json().catch(() => ({ error: 'Failed' }));
                error = data.error || 'Failed to update status';
            }
        } catch (err: any) {
            error = err.message || 'Failed to update status';
        } finally {
            updatingStatus = false;
        }
    }

    async function updatePaymentStatus(newStatus: string) {
        updatingStatus = true;
        try {
            const token = localStorage.getItem('merchant_token');
            if (!token) { goto('/login'); return; }

            const res = await fetch(`${API_BASE_URL}/api/orders/admin/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ paymentStatus: newStatus }),
            });

            if (res.ok) {
                await fetchOrder();
            } else {
                const data = await res.json().catch(() => ({ error: 'Failed' }));
                error = data.error || 'Failed to update payment status';
            }
        } catch (err: any) {
            error = err.message || 'Failed to update payment status';
        } finally {
            updatingStatus = false;
        }
    }

    async function updateTracking() {
        updatingStatus = true;
        try {
            const token = localStorage.getItem('merchant_token');
            if (!token) { goto('/login'); return; }

            const res = await fetch(`${API_BASE_URL}/api/orders/admin/${orderId}/tracking`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ carrier: trackingCarrier, trackingNumber }),
            });

            if (res.ok) {
                showTrackingModal = false;
                await fetchOrder();
            } else {
                const data = await res.json().catch(() => ({ error: 'Failed' }));
                error = data.error || 'Failed to update tracking';
            }
        } catch (err: any) {
            error = err.message || 'Failed to update tracking';
        } finally {
            updatingStatus = false;
        }
    }

    async function saveAdminNotes() {
        try {
            const token = localStorage.getItem('merchant_token');
            if (!token) { goto('/login'); return; }

            const res = await fetch(`${API_BASE_URL}/api/orders/admin/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ adminNotes }),
            });

            if (res.ok) {
                await fetchOrder();
            }
        } catch (err: any) {
            error = err.message || 'Failed to save notes';
        }
    }

    function formatCurrency(value: string | number): string {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num || 0);
    }

    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
        });
    }
</script>

<div class="fade-in">
    <div class="dashboard-header">
        <div style="display: flex; align-items: center; gap: 12px;">
            <button class="action-btn secondary" onclick={() => goto('/dashboard/orders')}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg>
            </button>
            <div>
                <h2>Order {order?.orderNumber || orderId.slice(0, 8)}</h2>
                <p style="color: var(--text-secondary); margin-top: 4px;">{order ? formatDate(order.createdAt) : 'Loading...'}</p>
            </div>
        </div>
    </div>

    {#if error}
        <div class="error-message" style="padding: 20px; color: var(--error);">{error}</div>
    {/if}

    {#if loading}
        <div style="padding: 40px; text-align: center;"><div class="skeleton" style="width: 100%; height: 400px;"></div></div>
    {:else if order}
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
            <!-- Left Column -->
            <div style="display: flex; flex-direction: column; gap: 24px;">
                <!-- Status Card -->
                <div class="glass-card" style="padding: 24px;">
                    <h3 style="margin-bottom: 16px;">Order Status</h3>
                    <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px;">
                        <div>
                            <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 4px;">Status</label>
                            <span class="status-badge {statusColors[order.status] || 'neutral'}">{order.status}</span>
                        </div>
                        <div>
                            <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 4px;">Payment</label>
                            <span class="status-badge {paymentColors[order.paymentStatus] || 'neutral'}">{order.paymentStatus}</span>
                        </div>
                        <div>
                            <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 4px;">Fulfillment</label>
                            <span class="status-badge {fulfillColors[order.fulfillmentStatus] || 'neutral'}">{order.fulfillmentStatus}</span>
                        </div>
                    </div>

                    <!-- Status Actions -->
                    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;">
                        <select onchange={(e) => updateStatus((e.target as HTMLSelectElement).value)} disabled={updatingStatus}>
                            <option value="" disabled selected>Change Status</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <select onchange={(e) => updatePaymentStatus((e.target as HTMLSelectElement).value)} disabled={updatingStatus}>
                            <option value="" disabled selected>Change Payment</option>
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="failed">Failed</option>
                            <option value="refunded">Refunded</option>
                        </select>
                        <button class="action-btn secondary" onclick={() => { trackingCarrier = order.shippingCarrier || ''; trackingNumber = order.trackingNumber || ''; showTrackingModal = true; }}>
                            Add Tracking
                        </button>
                    </div>

                    <!-- Tracking Info -->
                    {#if order.trackingNumber}
                        <div style="padding: 12px; background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 8px;">
                            <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 4px;">Tracking</p>
                            <p><strong>{order.shippingCarrier || 'Carrier'}</strong>: {order.trackingNumber}</p>
                        </div>
                    {/if}
                </div>

                <!-- Items Card -->
                <div class="glass-card" style="padding: 24px;">
                    <h3 style="margin-bottom: 16px;">Items ({order.items?.length || 0})</h3>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Qty</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each order.items || [] as item}
                                <tr>
                                    <td>
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            {#if item.productImage}
                                                <img src={item.productImage} alt={item.productTitle} style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;" />
                                            {/if}
                                            <div>
                                                <p style="font-weight: 500;">{item.productTitle}</p>
                                                {#if item.variantName}
                                                    <p style="font-size: 0.75rem; color: var(--text-secondary);">{item.variantName}</p>
                                                {/if}
                                            </div>
                                        </div>
                                    </td>
                                    <td>{item.quantity}</td>
                                    <td>{formatCurrency(item.price)}</td>
                                    <td>{formatCurrency(item.total)}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Right Column -->
            <div style="display: flex; flex-direction: column; gap: 24px;">
                <!-- Order Summary -->
                <div class="glass-card" style="padding: 24px;">
                    <h3 style="margin-bottom: 16px;">Order Summary</h3>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: var(--text-secondary);">Subtotal</span>
                            <span>{formatCurrency(order.subtotal)}</span>
                        </div>
                        {#if parseFloat(order.discount) > 0}
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: var(--text-secondary);">Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                                <span style="color: #ef4444;">-{formatCurrency(order.discount)}</span>
                            </div>
                        {/if}
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: var(--text-secondary);">Shipping</span>
                            <span>{formatCurrency(order.shipping)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: var(--text-secondary);">Tax</span>
                            <span>{formatCurrency(order.tax)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid var(--border-color); font-weight: 600; font-size: 1.1rem;">
                            <span>Total</span>
                            <span>{formatCurrency(order.total)}</span>
                        </div>
                    </div>
                </div>

                <!-- Customer Info -->
                <div class="glass-card" style="padding: 24px;">
                    <h3 style="margin-bottom: 16px;">Customer</h3>
                    {#if order.customer}
                        <p style="font-weight: 500;">{order.customer.firstName} {order.customer.lastName}</p>
                        <p style="color: var(--text-secondary);">{order.customer.email}</p>
                    {:else}
                        <p style="color: var(--text-secondary);">Guest Checkout</p>
                    {/if}
                    <p style="color: var(--text-secondary); margin-top: 4px;">{order.email}</p>
                    {#if order.phone}
                        <p style="color: var(--text-secondary);">{order.phone}</p>
                    {/if}
                </div>

                <!-- Shipping Address -->
                <div class="glass-card" style="padding: 24px;">
                    <h3 style="margin-bottom: 16px;">Shipping Address</h3>
                    <p>{order.shippingFirstName} {order.shippingLastName}</p>
                    <p style="color: var(--text-secondary);">{order.shippingAddressLine1}</p>
                    {#if order.shippingAddressLine2}
                        <p style="color: var(--text-secondary);">{order.shippingAddressLine2}</p>
                    {/if}
                    <p style="color: var(--text-secondary);">{order.shippingCity}, {order.shippingState || ''} {order.shippingPostalCode}</p>
                    <p style="color: var(--text-secondary);">{order.shippingCountry}</p>
                </div>

                <!-- Admin Notes -->
                <div class="glass-card" style="padding: 24px;">
                    <h3 style="margin-bottom: 16px;">Internal Notes</h3>
                    <textarea bind:value={adminNotes} rows="3" style="width: 100%; padding: 8px; background: var(--bg-color); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px; resize: vertical;"></textarea>
                    <button class="action-btn secondary" onclick={saveAdminNotes} style="margin-top: 8px;">Save Notes</button>
                </div>

                <!-- Order Metadata -->
                <div class="glass-card" style="padding: 24px;">
                    <h3 style="margin-bottom: 16px;">Details</h3>
                    <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.875rem;">
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: var(--text-secondary);">Payment Method</span>
                            <span>{order.paymentMethod || 'N/A'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: var(--text-secondary);">Shipping Method</span>
                            <span>{order.shippingMethod || 'N/A'}</span>
                        </div>
                        {#if order.notes}
                            <div style="margin-top: 8px;">
                                <span style="color: var(--text-secondary);">Customer Notes</span>
                                <p style="margin-top: 4px; padding: 8px; background: var(--bg-color); border-radius: 4px;">{order.notes}</p>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    {/if}

    <!-- Tracking Modal -->
    {#if showTrackingModal}
        <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100;">
            <div class="glass-card" style="padding: 24px; width: 400px; max-width: 90%;">
                <h3 style="margin-bottom: 16px;">Add Tracking Info</h3>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <div>
                        <label style="font-size: 0.875rem; display: block; margin-bottom: 4px;">Carrier</label>
                        <input type="text" bind:value={trackingCarrier} placeholder="e.g., FedEx, UPS" style="width: 100%; padding: 8px; background: var(--bg-color); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px;" />
                    </div>
                    <div>
                        <label style="font-size: 0.875rem; display: block; margin-bottom: 4px;">Tracking Number</label>
                        <input type="text" bind:value={trackingNumber} placeholder="e.g., 1Z999AA10123456784" style="width: 100%; padding: 8px; background: var(--bg-color); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px;" />
                    </div>
                </div>
                <div style="display: flex; gap: 8px; margin-top: 16px; justify-content: flex-end;">
                    <button class="action-btn secondary" onclick={() => showTrackingModal = false}>Cancel</button>
                    <button class="action-btn primary" onclick={updateTracking} disabled={updatingStatus || !trackingCarrier || !trackingNumber}>
                        {updatingStatus ? 'Saving...' : 'Save Tracking'}
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .status-badge {
        display: inline-flex;
        align-items: center;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: capitalize;
    }

    .status-badge.success { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
    .status-badge.warning { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
    .status-badge.error { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
    .status-badge.info { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
    .status-badge.neutral { background: rgba(100, 116, 139, 0.1); color: #64748b; }

    select {
        padding: 8px 12px;
        background: var(--bg-color);
        border: 1px solid var(--border-color);
        color: var(--text-primary);
        border-radius: 6px;
        font-size: 0.875rem;
    }

    select:focus {
        outline: none;
        border-color: var(--accent-primary);
    }
</style>