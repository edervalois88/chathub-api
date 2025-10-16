'use client';

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from 'react';

interface Organization {
  _id: string;
  name: string;
  slug: string;
  primaryColor?: string;
  secondaryColor?: string;
}

interface AuthenticatedUser {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  role: 'owner' | 'admin' | 'agent';
  avatarColor?: string;
  organization: Organization;
}

interface AuthContextType {
  token: string | null;
  user: AuthenticatedUser | null;
  setToken: (token: string | null, userPayload?: AuthenticatedUser | null) => void;
  refreshProfile: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);

  const clearSession = useCallback(() => {
    setTokenState(null);
    setUser(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  }, []);

  const fetchProfile = useCallback(
    async (currentToken: string) => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        });
        if (!response.ok) {
          clearSession();
          return;
        }
        const userData: AuthenticatedUser = await response.json();
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch profile', error);
        clearSession();
      }
    },
    [clearSession],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setTokenState(storedToken);
      fetchProfile(storedToken);
    }
  }, [fetchProfile]);

  const setToken = (
    newToken: string | null,
    userPayload?: AuthenticatedUser | null,
  ) => {
    if (!newToken) {
      clearSession();
      return;
    }

    setTokenState(newToken);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('authToken', newToken);
    }

    if (userPayload) {
      setUser(userPayload);
    } else {
      fetchProfile(newToken);
    }
  };

  const refreshProfile = async () => {
    if (!token) return;
    await fetchProfile(token);
  };

  const logout = () => {
    clearSession();
  };

  return (
    <AuthContext.Provider
      value={{ token, user, setToken, refreshProfile, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
