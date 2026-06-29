import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
  loginAsPreview: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  preview?: boolean;
}

export const AuthProvider = ({ children, preview = false }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [forcePreview, setForcePreview] = useState(false);

  const activePreview = preview || !isSupabaseConfigured || forcePreview;

  useEffect(() => {
    if (activePreview) {
      // Mock user for preview mode
      setUser({
        id: 'preview-user',
        email: 'preview@example.com',
        user_metadata: { name: 'Preview User' },
        app_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      } as User);
      setSession({
        access_token: 'mock-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh',
        user: {
          id: 'preview-user',
          email: 'preview@example.com',
          user_metadata: { name: 'Preview User' },
          app_metadata: {},
          aud: 'authenticated',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        } as User
      } as Session);
      setIsLoading(false);
      return;
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [activePreview]);

  const loginAsPreview = () => {
    setForcePreview(true);
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setForcePreview(false);
    setUser(null);
    setSession(null);
  };

  const value = {
    user,
    session,
    isAuthenticated: !!user && !!session,
    isLoading,
    logout,
    loginAsPreview,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};