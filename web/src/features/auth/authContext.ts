import { createContext, useContext } from 'react';
import type { User } from '../../api/types';
import type { Session } from './session';

export interface AuthContextValue {
  user: User | null;
  signIn: (session: Session) => void;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}

export function homePathFor(user: User): string {
  return user.role === 'Admin' ? '/dashboard' : '/vacations';
}
