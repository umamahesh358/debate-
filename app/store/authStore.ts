import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/services/api';

interface User {
  id: string;
  email: string;
  username: string;
  profile?: {
    displayName: string;
    avatar?: string;
    level: number;
    experience: number;
    streak: number;
    totalDebates: number;
    wins: number;
    averageScore: number;
  };
}

interface AuthState {
  user: User | null;
  tokens: {
    accessToken: string | null;
    refreshToken: string | null;
  };
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: {
    email: string;
    username: string;
    password: string;
    displayName: string;
  }) => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (data: {
    displayName?: string;
    bio?: string;
    preferences?: any;
  }) => Promise<void>;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      tokens: {
        accessToken: null,
        refreshToken: null
      },
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await api.login({ email, password });

          if (response.success) {
            set({
              user: response.data.user,
              tokens: response.data.tokens,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
          } else {
            set({
              isLoading: false,
              error: response.error || 'Login failed'
            });
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Login failed'
          });
        }
      },

      logout: async () => {
        set({ isLoading: true });

        try {
          await api.logout();
          set({
            user: null,
            tokens: { accessToken: null, refreshToken: null },
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        } catch (error: any) {
          // Still logout even if API call fails
          set({
            user: null,
            tokens: { accessToken: null, refreshToken: null },
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });

        try {
          const response = await api.register(userData);

          if (response.success) {
            set({
              user: response.data.user,
              tokens: response.data.tokens,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
          } else {
            set({
              isLoading: false,
              error: response.error || 'Registration failed'
            });
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Registration failed'
          });
        }
      },

      refreshToken: async () => {
        const { tokens } = get();

        if (!tokens.refreshToken) {
          return;
        }

        try {
          const response = await api.login(tokens.refreshToken);

          if (response.success) {
            set({
              tokens: response.data.tokens,
              isAuthenticated: true,
              error: null
            });
          } else {
            // Token refresh failed, logout
            set({
              user: null,
              tokens: { accessToken: null, refreshToken: null },
              isAuthenticated: false,
              error: 'Session expired. Please login again.'
            });
          }
        } catch (error: any) {
          set({
            error: error.message || 'Token refresh failed'
          });
        }
      },

      updateProfile: async (profileData) => {
        set({ isLoading: true, error: null });

        try {
          const response = await api.updateProfile(profileData);

          if (response.success) {
            set(state => ({
              user: state.user ? { ...state.user, profile: { ...state.user.profile, ...profileData } } : null,
              isLoading: false,
              error: null
            }));
          } else {
            set({
              isLoading: false,
              error: response.error || 'Profile update failed'
            });
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Profile update failed'
          });
        }
      },

      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'auth-store',
      getStorage: () => {
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('auth-store');
          return stored ? JSON.parse(stored) : null;
        }
        return null;
      },
      setStorage: (state) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth-store', JSON.stringify(state));
        }
      },
      // Only persist these fields
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);