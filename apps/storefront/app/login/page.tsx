'use client';

import { useState } from 'react';
import { useCustomerAuth } from '@/lib/customer-auth';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Mail, User, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { login, register, loading, error: authError } = useCustomerAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/account';

  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (isRegistering) {
        await register({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
        });
      } else {
        await login(formData.email, formData.password);
      }
      router.push(redirect);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>
            Store
          </Link>
          <p className="mt-2 opacity-60">
            {isRegistering ? 'Create your account' : 'Welcome back! Sign in to continue'}
          </p>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-[var(--border)] p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegistering && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">First Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--border)] bg-white/5 focus:outline-none focus:border-[var(--primary)]"
                        placeholder="John"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Last Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--border)] bg-white/5 focus:outline-none focus:border-[var(--primary)]"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Phone (optional)</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-white/5 focus:outline-none focus:border-[var(--primary)]"
                    placeholder="+1 234 567 890"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--border)] bg-white/5 focus:outline-none focus:border-[var(--primary)]"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium">Password</label>
                {!isRegistering && (
                  <Link
                    href="/forgot-password"
                    className="text-sm hover:underline"
                    style={{ color: 'var(--primary)' }}
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-2.5 rounded-lg border border-[var(--border)] bg-white/5 focus:outline-none focus:border-[var(--primary)]"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:opacity-70"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 opacity-40" />
                  ) : (
                    <Eye className="w-4 h-4 opacity-40" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--primary)', color: 'white' }}
            >
              {loading ? (
                <>Processing...</>
              ) : (
                <>
                  {isRegistering ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm opacity-60">
              {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError(null);
                }}
                className="font-medium hover:underline"
                style={{ color: 'var(--primary)' }}
              >
                {isRegistering ? 'Sign In' : 'Create Account'}
              </button>
            </p>
          </div>
        </div>

        {/* Back to Store */}
        <div className="text-center mt-6">
          <Link href="/" className="text-sm opacity-60 hover:opacity-100">
            ← Back to store
          </Link>
        </div>
      </div>
    </div>
  );
}
