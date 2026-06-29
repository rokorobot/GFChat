const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Clean helpers to check if env values are real values and not default templates
const isUrlValid = (url: string): boolean => {
  if (!url) return false;
  const u = url.trim().toLowerCase();
  return u !== '' && u !== 'https://your-supabase-project.supabase.co' && !u.includes('placeholder');
};

const isKeyValid = (key: string): boolean => {
  if (!key) return false;
  const k = key.trim().toLowerCase();
  return k !== '' && k !== 'your-supabase-anon-key' && k !== 'your-supabase-publishable-key' && !k.includes('placeholder');
};

export const hasSupabaseUrl = isUrlValid(supabaseUrl);
export const hasSupabaseAnonKey = isKeyValid(supabaseKey);

export const hasCompleteSupabaseConfig = hasSupabaseUrl && hasSupabaseAnonKey;

export const hasPartialSupabaseConfig = (hasSupabaseUrl && !hasSupabaseAnonKey) || (!hasSupabaseUrl && hasSupabaseAnonKey);

export type RuntimeMode = 'local-preview' | 'remote-supabase' | 'config-error';

export const runtimeMode: RuntimeMode = (() => {
  if (hasCompleteSupabaseConfig) {
    return 'remote-supabase';
  }
  if (hasPartialSupabaseConfig) {
    return 'config-error';
  }
  return 'local-preview';
})();

export const getConfigErrorDetails = (): string => {
  if (!hasSupabaseUrl && hasSupabaseAnonKey) {
    return 'VITE_SUPABASE_URL is missing or set to placeholder, but VITE_SUPABASE_PUBLISHABLE_KEY is configured.';
  }
  if (hasSupabaseUrl && !hasSupabaseAnonKey) {
    return 'VITE_SUPABASE_URL is configured, but VITE_SUPABASE_PUBLISHABLE_KEY is missing or set to placeholder.';
  }
  return '';
};
