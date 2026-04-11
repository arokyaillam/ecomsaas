'use client';

import { useCustomerAuth } from '@/lib/customer-auth';
import { useState } from 'react';
import { User, Mail, Phone, Camera } from 'lucide-react';

export default function AccountProfilePage() {
  const { customer, updateProfile, loading } = useCustomerAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: customer?.firstName || '',
    lastName: customer?.lastName || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
  });
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    try {
      await updateProfile(formData);
      setMessage('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setMessage('Failed to update profile');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Profile Information</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 rounded-lg font-medium transition-all hover:opacity-90 text-sm"
            style={{ backgroundColor: 'var(--primary)', color: 'white' }}
          >
            Edit Profile
          </button>
        )}
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.includes('success') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
          {message}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">First Name</label>
              <input
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-white/5 focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Last Name</label>
              <input
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-white/5 focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-white/5 opacity-50 cursor-not-allowed"
            />
            <p className="text-xs opacity-60 mt-1">Email cannot be changed</p>
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

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
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
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-2xl border border-[var(--border)] p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-sm opacity-60 mb-1 block">First Name</label>
              <p className="font-medium">{customer?.firstName || 'Not set'}</p>
            </div>
            <div>
              <label className="text-sm opacity-60 mb-1 block">Last Name</label>
              <p className="font-medium">{customer?.lastName || 'Not set'}</p>
            </div>
          </div>

          <div>
            <label className="text-sm opacity-60 mb-1 block">Email</label>
            <p className="font-medium">{customer?.email}</p>
          </div>

          <div>
            <label className="text-sm opacity-60 mb-1 block">Phone</label>
            <p className="font-medium">{customer?.phone || 'Not set'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
