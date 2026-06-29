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
    console.log("[GF.Chat] AuthProvider useEffect running", { activePreview });
    if (activePreview) {
      console.log("[GF.Chat] AuthProvider setting mock preview session");
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

    try {
      console.log("[GF.Chat] AuthProvider setting up remote Supabase listeners");
      // Set up auth state listener FIRST
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          console.log("[GF.Chat] Supabase onAuthStateChange triggered", event);
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(false);
        }
      );

      // THEN check for existing session
      supabase.auth.getSession().then(({ data: { session } }) => {
        console.log("[GF.Chat] Supabase getSession resolved");
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }).catch(err => {
        console.error("[GF.Chat] Supabase getSession failed:", err);
        setIsLoading(false);
      });

      return () => subscription.unsubscribe();
    } catch (err) {
      console.error("[GF.Chat] Supabase listener initialization failed, falling back to preview:", err);
      // Fallback
      setIsLoading(false);
    }
  }, [activePreview]);

  const loginAsPreview = () => {
    setForcePreview(true);
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error("Signout failed:", err);
      }
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

  try {
    console.log("[GF.Chat] AuthProvider rendering", { isLoading, user: user?.id });
    
    if (isLoading) {
      return (
        <div style={{ padding: 32, fontFamily: "sans-serif", color: "#ec4899", fontWeight: "bold" }}>
          GF.Chat auth loading...
        </div>
      );
    }

    return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    );
  } catch (error) {
    console.error("[GF.Chat] AuthProvider render crashed:", error);
    return (
      <div style={{ padding: 24, color: "red", fontFamily: "sans-serif" }}>
        <h3>GF.Chat AuthProvider Render Crash</h3>
        <pre style={{ fontSize: "12px", opacity: 0.8 }}>{String(error)}</pre>
      </div>
    );
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};