import { SUPABASE_URL, SUPABASE_KEY } from '../config.js';

export const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  db: { schema: 'career' },
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'career-admin-auth' }
});
