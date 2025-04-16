// api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://192.168.0.132:8088/api', // <-- use a porta certa aqui
  headers: {
    'Content-Type': 'application/json',
  },
});
