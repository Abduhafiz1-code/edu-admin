import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

interface AuthState {
  userId: string | null
  profile: Profile | null
  loading: boolean
  initialized: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    userId: null,
    profile: null,
    loading: false,
    initialized: false,
  }),
  getters: {
    isManager: (state) => state.profile?.role === 'manager',
    isTeacher: (state) => state.profile?.role === 'teacher',
    isLoggedIn: (state) => !!state.userId,
  },
  actions: {
    async init() {
      if (this.initialized) return
      this.loading = true
      const { data } = await supabase.auth.getSession()
      if (data.session?.user) {
        this.userId = data.session.user.id
        await this.fetchProfile()
      }
      supabase.auth.onAuthStateChange(async (_event, session) => {
        this.userId = session?.user?.id ?? null
        if (this.userId) {
          await this.fetchProfile()
        } else {
          this.profile = null
        }
      })
      this.loading = false
      this.initialized = true
    },
    async fetchProfile() {
      if (!this.userId) return
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', this.userId)
        .single()
      if (!error) this.profile = data as Profile
    },
    async signIn(email: string, password: string) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      this.userId = data.user?.id ?? null
      await this.fetchProfile()
    },
    async signOut() {
      await supabase.auth.signOut()
      this.userId = null
      this.profile = null
    },
  },
})
