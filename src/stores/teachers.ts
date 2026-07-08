import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

export const useTeachersStore = defineStore('teachers', {
  state: () => ({
    items: [] as Profile[], // faqat role = teacher bo'lganlar
    loading: false,
  }),
  actions: {
    async fetchAll() {
      this.loading = true
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'teacher')
        .order('full_name')
      if (!error) this.items = data as Profile[]
      this.loading = false
    },
    // Yangi o'qituvchi yaratish uchun Supabase Edge Function chaqiriladi
    // (service_role kaliti frontendda ishlatilmasligi kerak).
    async createTeacher(payload: { email: string; password: string; full_name: string; phone?: string }) {
      const { data, error } = await supabase.functions.invoke('create-teacher', {
        body: payload,
      })
      if (error) throw error
      await this.fetchAll()
      return data
    },
    async updateTeacher(id: string, payload: Partial<Pick<Profile, 'full_name' | 'phone'>>) {
      const { error } = await supabase.from('profiles').update(payload).eq('id', id)
      if (error) throw error
      await this.fetchAll()
    },
    async removeTeacher(id: string) {
      // Eslatma: o'quvchilari bor bo'lsa avval ularni boshqa o'qituvchiga o'tkazing.
      const { error } = await supabase.from('profiles').delete().eq('id', id)
      if (error) throw error
      this.items = this.items.filter((t) => t.id !== id)
    },
  },
})
