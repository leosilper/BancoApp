// src/api/api.ts
import axios from 'axios';

export const api = axios.create({
  // IMPORTANTE: Use um endereço IP válido e porta correta
  baseURL: 'http://192.168.0.132:8080', // Substitua pelo endereço do seu servidor backend
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Adicione isso para verificar o que está acontecendo com suas requisições
api.interceptors.request.use(request => {
  console.log('🔄 Fazendo requisição para:', request.url);
  console.log('🔄 Com dados:', request.data);
  return request;
});