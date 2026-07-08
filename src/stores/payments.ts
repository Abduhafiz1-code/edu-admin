import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import type { Payment } from '@/types'

export const usePaymentsStore = defineStore('payments', {
  state: () => ({
    items: [] as Payment[],
    loading: false,
  }),
  actions: {
    async fetchByMonth(month: string) {
      // month format: 'YYYY-MM-01'
      this.loading = true
      const { data, error } = await supabase
        .from('payments')
        .select('*, students(full_name)')
        .eq('month', month)
        .order('created_at', { ascending: false })
      if (!error && data) {
        this.items = data.map((p: any) => ({ ...p, student_name: p.students?.full_name }))
      }
      this.loading = false
    },
    async markPaid(studentId: string, amount: number, month: string) {
      // agar shu oy uchun yozuv mavjud bo'lsa — yangilaymiz, bo'lmasa yaratamiz
      const { data: existing } = await supabase
        .from('payments')
        .select('id')
        .eq('student_id', studentId)
        .eq('month', month)
        .maybeSingle()

      if (existing) {
        const { error } = await supabase
          .from('payments')
          .update({ amount, status: 'paid', paid_at: new Date().toISOString() })
          .eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('payments').insert({
          student_id: studentId,
          amount,
          month,
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        if (error) throw error
      }
      await this.fetchByMonth(month)
    },
    async markUnpaid(paymentId: string) {
      const { error } = await supabase
        .from('payments')
        .update({ status: 'unpaid', paid_at: null })
        .eq('id', paymentId)
      if (error) throw error
    },
  },
})
