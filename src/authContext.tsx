import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import { UserRole } from './App';

// Set to true to enable demo mode with a mock user
const DEMO_MODE = true;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
  switchUserRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const switchUserRole = (role: UserRole) => {
    if (DEMO_MODE && user) {
      const mockUser: User = {
        ...user,
        id: `demo-${role}-id`,
        user_metadata: { ...user.user_metadata, role: role },
      };
      setUser(mockUser);
    }
  };
  
  useEffect(() => {
    if (DEMO_MODE) {
      const initialRole: UserRole = 'student';
      const mockUser: User = {
        id: `demo-${initialRole}-id`,
        app_metadata: { provider: 'email' },
        user_metadata: { role: initialRole },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      };
      const mockSession: Session = {
        access_token: 'demo-access-token',
        refresh_token: 'demo-refresh-token',
        user: mockUser,
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      };
      setSession(mockSession);
      setUser(mockUser);
      setLoading(false);
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user || null);
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setSession(session);
          setUser(session?.user || null);
          setLoading(false);
        }
      );

      return () => subscription.unsubscribe();
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    if (DEMO_MODE) return Promise.resolve({ user: session?.user, session });
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) throw error;
    return data;
  };

  const signUp = async (email: string, password: string) => {
    if (DEMO_MODE) return Promise.resolve({ user: session?.user, session });
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'unapproved',
        },
      },
    });
    setLoading(false);
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    if (DEMO_MODE) {
      return Promise.resolve();
    }
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signIn, signUp, signOut, switchUserRole }}>
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
