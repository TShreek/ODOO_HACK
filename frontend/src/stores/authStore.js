import { create } from 'zustand'
import { api, tokenManager } from '../lib/api'

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
          const response = await api.auth.login(credentials)
          
          // Store tokens
          tokenManager.setToken(response.access_token)
          if (response.refresh_token) {
            tokenManager.setRefreshToken(response.refresh_token)
          }

          // Decode user info from token (basic implementation)
          const user = {
            login_id: credentials.login_id,
            // You could decode JWT here to get more user info
          }

          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false, 
            error: null 
          })

          return response
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error.message || 'Login failed',
            isAuthenticated: false,
            user: null
          })
          throw error
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.auth.register(userData)
          
          // Store tokens
          tokenManager.setToken(response.access_token)
          if (response.refresh_token) {
            tokenManager.setRefreshToken(response.refresh_token)
          }

          const user = {
            login_id: userData.login_id,
            name: userData.name,
            email_id: userData.email_id
          }

          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false, 
            error: null 
          })

          return response
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error.message || 'Registration failed',
            isAuthenticated: false,
            user: null
          })
          throw error
        }
      },

      logout: async () => {
        try {
          await api.auth.logout()
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          tokenManager.clearTokens()
          set({ 
            user: null, 
            isAuthenticated: false, 
            error: null 
          })
        }
      },

      // Initialize auth state from stored tokens
      initialize: () => {
        const token = tokenManager.getToken()
        if (token) {
          // In a real app, you might want to validate the token here
          set({ 
            isAuthenticated: true,
            // You could decode the JWT to get user info
            user: { login_id: 'user' } // Placeholder
          })
        }
      },

      clearError: () => set({ error: null })
    }))

export default useAuthStore