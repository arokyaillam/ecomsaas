import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
  const token = cookies.get('merchant_token');

  // Server-side check — client will still do its own check,
  // but this prevents the flash of dashboard content for unauthenticated users
  if (!token) {
    throw redirect(302, '/login');
  }

  return {
    isAuthenticated: true
  };
};