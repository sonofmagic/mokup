import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.BASE_URL ?? '/',
  timeout: 8000,
  validateStatus: () => true,
  headers: {
    'Content-Type': 'application/json',
  },
})
