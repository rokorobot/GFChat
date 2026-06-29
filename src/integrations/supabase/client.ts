import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { runtimeMode } from '@/lib/runtimeConfig';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://lfhmzgqkgxidmsaqpqim.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = 
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmaG16Z3FrZ3hpZG1zYXFwcWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDQyMzQsImV4cCI6MjA3Mzc4MDIzNH0.g9aJQSWieV0dvTfXzKeOAd6dfxOUKXcaMxV_x74NgVU";

export const isSupabaseConfigured = runtimeMode === 'remote-supabase';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});