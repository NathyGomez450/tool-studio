import * as React from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type ActiveProject = {
  id: string;
  name: string;
  slug: string;
};

type AuthContextValue = {
  loading: boolean;
  accessLoading: boolean;
  authorized: boolean;
  accessError: string;
  session: Session | null;
  user: User | null;
  activeProject: ActiveProject | null;
  canInvite: boolean;
  mustSetPassword: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  completePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const PROJECT_SLUG = 'origem-studio';
const AuthContext = React.createContext<AuthContextValue | null>(null);

// Convite/recuperação chegam com token no hash da URL (#...type=invite|recovery).
const INITIAL_HASH = typeof window !== 'undefined' ? window.location.hash : '';
const IS_INVITE_FLOW = /type=(invite|recovery)/.test(INITIAL_HASH);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = React.useState(true);
  const [accessLoading, setAccessLoading] = React.useState(false);
  const [session, setSession] = React.useState<Session | null>(null);
  const [activeProject, setActiveProject] = React.useState<ActiveProject | null>(null);
  const [canInvite, setCanInvite] = React.useState(false);
  const [mustSetPassword, setMustSetPassword] = React.useState(IS_INVITE_FLOW);
  const [accessError, setAccessError] = React.useState('');

  async function loadProjectAccess(nextSession: Session | null) {
    setActiveProject(null);
    setCanInvite(false);
    setAccessError('');

    if (!nextSession) return;

    setAccessLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, slug')
      .eq('slug', PROJECT_SLUG)
      .maybeSingle();

    if (error) {
      setAccessError('Nao foi possivel validar seu acesso ao projeto. Confira o schema e as politicas RLS no Supabase.');
    } else if (!data) {
      setAccessError('Seu usuario ainda nao esta vinculado ao projeto Origem Studio.');
    } else {
      setActiveProject(data);
      const { data: membership } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', data.id)
        .eq('user_id', nextSession.user.id)
        .maybeSingle();
      setCanInvite(membership?.role === 'owner' || membership?.role === 'admin');
    }

    setAccessLoading(false);
  }

  React.useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
      await loadProjectAccess(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
      void loadProjectAccess(nextSession);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      loading,
      accessLoading,
      authorized: Boolean(session && activeProject),
      accessError,
      session,
      user: session?.user ?? null,
      activeProject,
      canInvite,
      mustSetPassword,
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      async completePassword(password) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setMustSetPassword(false);
        if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', window.location.pathname);
        }
      },
      async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        setSession(null);
        setActiveProject(null);
        setCanInvite(false);
        setAccessError('');
      },
    }),
    [accessError, accessLoading, activeProject, canInvite, mustSetPassword, loading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth precisa estar dentro de AuthProvider.');
  return context;
}
