import { create } from 'zustand'
import axios from 'axios'

interface Operator {
  id: string
  name: string
  email: string
  phone?: string
}

interface AuthState {
  token: string | null
  operator: Operator | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>
  logout: () => void
  setAuth: (token: string, operator: Operator) => void
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  operator: JSON.parse(localStorage.getItem('operator') || 'null'),
  isAuthenticated: !!localStorage.getItem('token'),

  login: async (email: string, password: string) => {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email,
      password,
    })
    const { token, operator } = response.data
    localStorage.setItem('token', token)
    localStorage.setItem('operator', JSON.stringify(operator))
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    set({ token, operator, isAuthenticated: true })
  },

  register: async (name: string, email: string, password: string, phone?: string) => {
    const response = await axios.post(`${API_URL}/api/auth/register`, {
      name,
      email,
      password,
      phone,
    })
    const { token, operator } = response.data
    localStorage.setItem('token', token)
    localStorage.setItem('operator', JSON.stringify(operator))
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    set({ token, operator, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('operator')
    delete axios.defaults.headers.common['Authorization']
    set({ token: null, operator: null, isAuthenticated: false })
  },

  setAuth: (token: string, operator: Operator) => {
    localStorage.setItem('token', token)
    localStorage.setItem('operator', JSON.stringify(operator))
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    set({ token, operator, isAuthenticated: true })
  },
}))

// Set up axios interceptor
const token = localStorage.getItem('token')
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
}
