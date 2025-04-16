// AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api } from '../api/api';

interface User {
  id: string;
  name: string;
  nickname: string;
}

interface AuthContextData {
  user: User | null;
  signed: boolean;
  loading: boolean;
  signIn: (nickname: string, password: string) => Promise<void>;
  signUp: (name: string, document: string, nickname: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStorageData() {
      const storedToken = await SecureStore.getItemAsync('token');
      const storedUser = await SecureStore.getItemAsync('user');

      if (storedToken && storedUser) {
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        setUser(JSON.parse(storedUser));
      }

      setLoading(false);
    }

    loadStorageData();
  }, []);

  async function signIn(nickname: string, password: string) {
    try {
      setLoading(true);
      const response = await api.post('/auth/login', {
        nickname,
        password
      });

      console.log('🔐 Resposta da API de login:', response.data);

      let token = response.data?.token || response.data?.accessToken || response.data?.access?.token;
      const user = response.data?.user;

      if (!token || typeof token !== 'string') {
        console.error('⚠️ Token inválido:', token);
        throw new Error('Token inválido: esperado tipo string.');
      }

      await SecureStore.setItemAsync('token', token);
      await SecureStore.setItemAsync('user', JSON.stringify(user));

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
    } catch (error: any) {
      console.error('❌ Erro no signIn:', error.response?.data || error.message || error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function signUp(name: string, document: string, nickname: string, password: string) {
    try {
      setLoading(true);
      await api.post('/users', {
        name,
        document,
        nickname,
        password
      });

      await signIn(nickname, password);
    } catch (error: any) {
      console.error('❌ Erro no signUp:', error.response?.data || error.message || error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    setUser(null);
    api.defaults.headers.common['Authorization'] = '';
  }

  return (
    <AuthContext.Provider value={{ signed: !!user, user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
}
