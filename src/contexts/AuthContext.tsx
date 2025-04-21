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

// Melhorado para incluir token na interface da resposta
interface LoginResponse {
  token: string;
  user: User;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStorageData() {
      try {
        const storedToken = await SecureStore.getItemAsync('token');
        const storedUser = await SecureStore.getItemAsync('user');

        if (storedToken && storedUser) {
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Erro ao carregar dados do storage:', error);
      } finally {
        setLoading(false);
      }
    }

    loadStorageData();
  }, []);

  async function signIn(nickname: string, password: string) {
    try {
      setLoading(true);
      
      console.log('Tentando fazer login com:', { nickname });
      
      // Para desenvolvimento: use um token temporário se a API não estiver disponível
      // Remova este bloco quando sua API estiver corretamente configurada
      const useDummyAuth = true; // Mude para false quando a API estiver pronta
      
      if (useDummyAuth) {
        console.log('⚠️ Usando autenticação simulada para desenvolvimento');
        const tempToken = 'dev-token-for-testing';
        const tempUser = { id: '1', name: 'Usuário de Teste', nickname };
        
        await SecureStore.setItemAsync('token', tempToken);
        await SecureStore.setItemAsync('user', JSON.stringify(tempUser));
        api.defaults.headers.common['Authorization'] = `Bearer ${tempToken}`;
        setUser(tempUser);
        
        console.log('Login simulado bem-sucedido para:', nickname);
        return;
      }
      
      // Código real de autenticação usando a API
      const response = await api.post<LoginResponse>('/auth/login', {
        nickname,
        password
      });

      console.log('🔐 Resposta da API de login:', response.data);

      // Acessando a resposta com tipagem adequada
      const { token, user: userData } = response.data;

      // Validação do token
      if (!token || typeof token !== 'string') {
        console.error('⚠️ Token inválido ou não encontrado na resposta:', token);
        throw new Error('Token inválido ou não encontrado na resposta da API.');
      }

      // Validação do usuário
      if (!userData) {
        console.error('⚠️ Dados do usuário não encontrados na resposta');
        throw new Error('Dados do usuário não encontrados na resposta da API.');
      }

      // Salvar token e dados do usuário
      await SecureStore.setItemAsync('token', token);
      await SecureStore.setItemAsync('user', JSON.stringify(userData));

      // Configurar o header de autorização para futuras requisições
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      
      console.log('Login bem-sucedido para:', userData.nickname);
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
      console.log('Tentando registrar usuário:', { name, nickname });
      
      // Para desenvolvimento: use simulação se a API não estiver disponível
      const useDummyAuth = true; // Mude para false quando a API estiver pronta
      
      if (useDummyAuth) {
        console.log('⚠️ Usando registro simulado para desenvolvimento');
        // Simula um pequeno atraso como em uma API real
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Após "registro", faça login
        await signIn(nickname, password);
        return;
      }
      
      // Código real de registro usando a API
      const response = await api.post('/users', {
        name,
        document,
        nickname,
        password
      });

      console.log('✅ Resposta do registro:', response.data);
      
      // Após o registro bem-sucedido, faça login
      await signIn(nickname, password);
    } catch (error: any) {
      console.error('❌ Erro no signUp:', error.response?.data || error.message || error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    try {
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      console.log('Logout realizado com sucesso');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
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