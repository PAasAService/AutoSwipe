import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, BuyerPreferences } from '@/types'

interface AuthState {
  user: User | null
  preferences: BuyerPreferences | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setPreferences: (prefs: BuyerPreferences | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      preferences: null,
      isLoading: false,
      setUser: (user) => set({ user }),
      setPreferences: (preferences) => set({ preferences }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null, preferences: null }),
    }),
    {
      name: 'autoswipe-auth',
      // sessionStorage clears when the browser tab/window is closed,
      // reducing the window for XSS-based data theft vs localStorage
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? window.sessionStorage : ({} as Storage)
      ),
      partialize: (state) => ({ user: state.user, preferences: state.preferences }),
    }
  )
)
