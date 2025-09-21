import { create } from 'zustand'
import { apiService, authStorage } from '../services/apiClient'

const useAuthStore = create((set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials) => {
        set({ isLoading: true, error: null })
        try {
          const response = await apiService.auth.login(credentials)
          
          // Store tokens
          authStorage.setAccessToken(response.accessToken)
          if (response.refreshToken) {
            authStorage.setRefreshToken(response.refreshToken)
          }

          // Store user info
          authStorage.setUser(response.user)

          set({ 
            user: response.user, 
            isAuthenticated: true, 
            isLoading: false, 
            error: null 
          })

          return response
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error.response?.data?.detail || error.message || 'Login failed',
            isAuthenticated: false,
            user: null
          })
          throw error
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null })
        try {
          const response = await apiService.auth.signup(userData)
          
          // Store tokens
          authStorage.setAccessToken(response.accessToken)
          if (response.refreshToken) {
            authStorage.setRefreshToken(response.refreshToken)
          }

          // Store user info
          authStorage.setUser(response.user)

          set({ 
            user: response.user, 
            isAuthenticated: true, 
            isLoading: false, 
            error: null 
          })

          return response
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error.response?.data?.detail || error.message || 'Registration failed',
            isAuthenticated: false,
            user: null
          })
          throw error
        }
      },

      logout: async () => {
        try {
          await apiService.auth.logout()
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          authStorage.clear()
          set({ 
            user: null, 
            isAuthenticated: false, 
            error: null 
          })
        }
      },

            // Initialize auth state from stored tokens
      initialize: async () => {
        const token = authStorage.getAccessToken()
        const user = authStorage.getUser()
        
        if (token && user) {
          set({ 
            isAuthenticated: true,
            user: user
          })
        } else {
          // For demo mode, let's automatically authenticate
          const demoUser = { login_id: 'demo-user', name: 'Demo User', email: 'demo@example.com' }
          authStorage.setAccessToken('demo-token')
          authStorage.setUser(demoUser)
          set({
            isAuthenticated: true,
            user: demoUser
          })
        }
        return Promise.resolve()
      },

      clearError: () => set({ error: null })
    }))

export default useAuthStore