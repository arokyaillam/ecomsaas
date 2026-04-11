'use client';

import { useCustomerAuth } from '@/lib/customer-auth';
import { useState } from 'react';
import { MapPin, Plus, Star, Trash2, Edit3, X } from 'lucide-react';

interface AddressForm {
  name: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
  isDefault: boolean;
}

const initialForm: AddressForm = {
  name: '',
  firstName: '',
  lastName: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  country: 'US',
  postalCode: '',
  phone: '',
  isDefault: false,
};

export default function AccountAddressesPage() {
  const { addresses, addAddress, updateAddress, deleteAddress, loading } = useCustomerAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AddressForm>(initialForm);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await addAddress(formData);
    setIsAdding(false);
    setFormData(initialForm);
  };

  const handleEdit = (address: any) => {
    setEditingId(address.id);
    setFormData({
      name: address.name,
      firstName: address.firstName,
      lastName: address.lastName,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      state: address.state || '',
      country: address.country,
      postalCode: address.postalCode,
      phone: address.phone || '',
      isDefault: address.isDefault,
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateAddress(editingId, formData);
      setEditingId(null);
      setFormData(initialForm);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this address?')) {
      await deleteAddress(id);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData(initialForm);
  };

  const AddressForm = ({ onSubmit, submitLabel }: { onSubmit: (e: React.FormEvent) => void; submitLabel: string }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1.5">Address Name</label>
        <input
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Home, Work, etc."
          className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-white/5 focus:outline-none focus:border-[var(--primary)]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">First Name</label>
          <input
            required
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-white/5 focus:outline-none focus:border-[var(--primary)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Last Name</label>
          <input
            required
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-white/5 focus:outline-none focus:border-[var(--primary)]"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Street Address</label>
        <input
          required
          value={formData.addressLine1}
          onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
          placeholder="Street address"
          className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-white/5 focus:outline-none focus:border-[var(--primary)]"
        />
        <input
          value={formData.addressLine2}
          onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
          placeholder="Apartment, suite, etc. (optional)"
          className="w-full mt-2 px-4 py-2.5 rounded-lg border border-[var(--border)] bg-white/5 focus:outline-none focus:border-[var(--primary)]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">City</label>
          <input
            required
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-white/5 focus:outline-none focus:border-[var(--primary)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Postal Code</label>
          <input
            required
            value={formData.postalCode}
            onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-white/5 focus:outline-none focus:border-[var(--primary)]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">State/Province</label>
          <input
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-white/5 focus:outline-none focus:border-[var(--primary)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Country</label>
          <select
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-white/5 focus:outline-none focus:border-[var(--primary)]"
          >
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="GB">United Kingdom</option>
            <option value="AU">Australia</option>
            <option value="DE">Germany</option>
            <option value="FR">France</option>
            <option value="IN">India</option>
            <option value="JP">Japan</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Phone</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-white/5 focus:outline-none focus:border-[var(--primary)]"
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.isDefault}
          onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
          className="w-4 h-4 rounded border-[var(--border)]"
        />
        <span className="text-sm">Set as default address</span>
      </label>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={handleCancel}
          className="px-6 py-2.5 rounded-lg font-medium border border-[var(--border)] hover:bg-white/5"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: 'var(--primary)', color: 'white' }}
        >
          {loading ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">My Addresses</h2>
        {!isAdding && !editingId && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:opacity-90 text-sm"
            style={{ backgroundColor: 'var(--primary)', color: 'white' }}
          >
            <Plus className="w-4 h-4" />
            Add Address
          </button>
        )}
      </div>

      {isAdding && (
        <div className="rounded-2xl border border-[var(--border)] p-6">
          <h3 className="font-medium mb-4">Add New Address</h3>
          <AddressForm onSubmit={handleAdd} submitLabel="Add Address" />
        </div>
      )}

      {editingId && (
        <div className="rounded-2xl border border-[var(--border)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Edit Address</h3>
            <button onClick={handleCancel} className="p-1 hover:bg-white/5 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
          <AddressForm onSubmit={handleUpdate} submitLabel="Update Address" />
        </div>
      )}

      <div className="grid gap-4">
        {addresses.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-[var(--border)] border-dashed">
            <MapPin className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="opacity-60">No addresses saved yet</p>
          </div>
        ) : (
          addresses.map((address) => (
            <div
              key={address.id}
              className={`rounded-2xl border p-6 transition-all ${
                address.isDefault ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-[var(--border)]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 mt-1" style={{ color: 'var(--primary)' }} />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{address.name}</p>
                      {address.isDefault && (
                        <span className="text-xs px-2 py-0.5 rounded bg-[var(--primary)]/20" style={{ color: 'var(--primary)' }}>
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm opacity-80 mt-1">
                      {address.firstName} {address.lastName}
                    </p>
                    <p className="text-sm opacity-80">{address.addressLine1}</p>
                    {address.addressLine2 && <p className="text-sm opacity-80">{address.addressLine2}</p>}
                    <p className="text-sm opacity-80">
                      {address.city}, {address.state} {address.postalCode}
                    </p>
                    <p className="text-sm opacity-80">{address.country}</p>
                    {address.phone && <p className="text-sm opacity-60 mt-2">{address.phone}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(address)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4 opacity-60" />
                  </button>
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
