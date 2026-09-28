import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { setUnauthorizedHandler } from '../../api/client';
import { AuthContext, type AuthContextValue } from './authContext';
import { clearSession, readSession, saveSession, type Session } from './session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => readSession());
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const signIn = useCallback((newSession: Session) => {
    saveSession(newSession);
    setSession(newSession);
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setSession(null);
    queryClient.clear();
    navigate('/login', { replace: true });
  }, [navigate, queryClient]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      toast.error('Sua sessão expirou. Faça login novamente.');
      signOut();
    });
  }, [signOut]);

  const value = useMemo<AuthContextValue>(
    () => ({ user: session?.user ?? null, signIn, signOut }),
    [session, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
