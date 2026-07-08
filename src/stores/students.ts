import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import type { Student } from '@/types'

export const useStudentsStore = defineStore('students', {
  state: () => ({
    items: [] as Student[],
    loading: false,
  }),
  actions: {
    // RLS avtomatik ravishda: teacher faqat o'zinikini, manager hammasini ko'radi.
    async fetchAll() {
      this.loading = true
      const { data, error } = await supabase
        .from('students')
        .select('*, profiles(full_name), groups(name)')
        .order('full_name')
      if (!error && data) {
        this.items = data.map((s: any) => ({
          ...s,
          teacher_name: s.profiles?.full_name,
          group_name: s.groups?.name,
        }))
      }
      this.loading = false
    },
    async create(payload: {
      full_name: string
      phone?: string
      parent_phone?: string
      teacher_id: string
      group_id?: string | null
    }) {
      const { error } = await supabase.from('students').insert(payload)
      if (error) throw error
      await this.fetchAll()
    },
    async update(id: string, payload: Partial<Student>) {
      const { error } = await supabase.from('students').update(payload).eq('id', id)
      if (error) throw error
      await this.fetchAll()
    },
    // Studentni boshqa o'qituvchiga o'tkazish (faqat manager)
    async transferToTeacher(id: string, newTeacherId: string) {
      const { error } = await supabase
        .from('students')
        .update({ teacher_id: newTeacherId })
        .eq('id', id)
      if (error) throw error
      await this.fetchAll()
    },
    async setStatus(id: string, status: 'active' | 'inactive') {
      const { error } = await supabase.from('students').update({ status }).eq('id', id)
      if (error) throw error
      await this.fetchAll()
    },
    async remove(id: string) {
      const { error } = await supabase.from('students').delete().eq('id', id)
      if (error) throw error
      this.items = this.items.filter((s) => s.id !== id)
    },
  },
})
