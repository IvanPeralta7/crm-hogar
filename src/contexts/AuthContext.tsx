import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { isDemoMode } from '../lib/demoMode';
import { mockProfile } from '../data/mockData';
import type { Profile } from '../types';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured && !isDemoMode);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await getSupabase()
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    setProfile(data);
  }, []);

  useEffect(() => {
    if (isDemoMode) {
      setProfile(mockProfile);
      setSession({ user: { id: mockProfile.id, email: 'demo@sanctuary.local' } } as Session);
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const client = getSupabase();

    void client.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        void fetchProfile(data.session.user.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        void fetchProfile(nextSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await getSupabase().auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      return { error: error?.message ?? null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error de conexion';
      if (message.includes('ISO-8859-1')) {
        return {
          error:
            'Credenciales de Supabase invalidas en el servidor. Revisá VITE_SUPABASE_ANON_KEY en Vercel y volvé a desplegar.',
        };
      }
      return { error: message };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await getSupabase().auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() },
        },
      });
      return { error: error?.message ?? null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error de conexion';
      if (message.includes('ISO-8859-1')) {
        return {
          error:
            'Credenciales de Supabase invalidas en el servidor. Revisá VITE_SUPABASE_ANON_KEY en Vercel y volvé a desplegar.',
        };
      }
      return { error: message };
    }
  }, []);

  const signOut = useCallback(async () => {
    if (isDemoMode) return;
    await getSupabase().auth.signOut();
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
    }),
    [session, profile, loading, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
