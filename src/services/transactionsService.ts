// transactionsService.ts
import { api } from '../api/api';

export interface Transaction {
  id: string;
  value: number;
  description: string;
  createdAt: string;
  type: 'INCOME' | 'OUTCOME';
  toUser?: {
    id: string;
    nickname: string;
  };
  fromUser?: {
    id: string;
    nickname: string;
  };
}

interface TransactionsResponse {
  transactions: Transaction[];
  hasMore: boolean;
}

export const TransactionsService = {
  getTransactions: async (page = 1, limit = 10): Promise<TransactionsResponse> => {
    const response = await api.get(`/transactions?page=${page}&limit=${limit}`);
    return response.data;
  },

  getTransactionById: async (id: string): Promise<Transaction> => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },

  sendMoney: async (receiverNickname: string, value: number, description: string): Promise<Transaction> => {
    const response = await api.post('/transactions', {
      to: receiverNickname,
      value,
      description
    });
    return response.data;
  },

  getBalance: async (): Promise<{ balance: number }> => {
    const response = await api.get('/balance');
    return response.data;
  }
};