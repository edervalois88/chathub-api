'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Define a user interface for type safety
interface User {
  _id: string;
  username: string;
  // Add other user properties as needed
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  setToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const fetchProfile = async (currentToken: string) => {
    try {
      const response = await fetch('http://localhost:3000/auth/profile', {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
        },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // If the token is invalid, clear it
        setToken(null);
      }
    } catch (error) {
      console.error('Failed to fetch profile', error);
      setToken(null); // Clear token on error
    }
  };

  useEffect(() => {
    // On initial load, try to read the token from localStorage
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setTokenState(storedToken);
      fetchProfile(storedToken);
    }
  }, []);

  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem('authToken', newToken);
      fetchProfile(newToken);
    } else {
      localStorage.removeItem('authToken');
      setUser(null); // Clear user on logout
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, setToken }}>
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