import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import type { Subject } from '@/types'

export const useSubjectsStore = defineStore('subjects', {
  state: () => ({
    items: [] as Subject[],
    loading: false,
  }),
  actions: {
    async fetchAll() {
      this.loading = true
      const { data, error } = await supabase.from('subjects').select('*').order('name')
      if (!error) this.items = data as Subject[]
      this.loading = false
    },
    async create(name: string) {
      const { data, error } = await supabase.from('subjects').insert({ name }).select().single()
      if (error) throw error
      this.items.push(data as Subject)
    },
    async update(id: string, name: string) {
      const { error } = await supabase.from('subjects').update({ name }).eq('id', id)
      if (error) throw error
      const idx = this.items.findIndex((s) => s.id === id)
      if (idx !== -1) this.items[idx].name = name
    },
    async remove(id: string) {
      const { error } = await supabase.from('subjects').delete().eq('id', id)
      if (error) throw error
      this.items = this.items.filter((s) => s.id !== id)
    },
  },
})
