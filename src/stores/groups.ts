import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import type { Group } from '@/types'

export const useGroupsStore = defineStore('groups', {
  state: () => ({
    items: [] as Group[],
    loading: false,
  }),
  actions: {
    async fetchAll() {
      this.loading = true
      const { data, error } = await supabase
        .from('groups')
        .select('*, subjects(name), profiles(full_name), students(count)')
        .order('name')
      if (!error && data) {
        this.items = data.map((g: any) => ({
          ...g,
          subject_name: g.subjects?.name,
          teacher_name: g.profiles?.full_name,
          student_count: g.students?.[0]?.count ?? 0,
        }))
      }
      this.loading = false
    },
    async create(payload: { name: string; subject_id: string; teacher_id: string; monthly_price: number }) {
      const { error } = await supabase.from('groups').insert(payload)
      if (error) throw error
      await this.fetchAll()
    },
    async update(id: string, payload: Partial<{ name: string; subject_id: string; teacher_id: string; monthly_price: number }>) {
      const { error } = await supabase.from('groups').update(payload).eq('id', id)
      if (error) throw error
      await this.fetchAll()
    },
    async remove(id: string) {
      const { error } = await supabase.from('groups').delete().eq('id', id)
      if (error) throw error
      this.items = this.items.filter((g) => g.id !== id)
    },
  },
})
