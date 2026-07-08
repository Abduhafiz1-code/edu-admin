export type Role = 'manager' | 'teacher'

export interface Profile {
  id: string
  full_name: string
  role: Role
  phone: string | null
  created_at: string
}

export interface Subject {
  id: string
  name: string
  created_at: string
}

export interface Group {
  id: string
  name: string
  subject_id: string
  teacher_id: string
  monthly_price: number
  created_at: string
  // joinlar orqali qo'shiladigan qo'shimcha maydonlar (UI uchun)
  subject_name?: string
  teacher_name?: string
  student_count?: number
}

export type StudentStatus = 'active' | 'inactive'

export interface Student {
  id: string
  full_name: string
  phone: string | null
  parent_phone: string | null
  teacher_id: string
  group_id: string | null
  status: StudentStatus
  created_at: string
  // UI uchun qo'shimcha
  teacher_name?: string
  group_name?: string
}

export type PaymentStatus = 'paid' | 'unpaid'

export interface Payment {
  id: string
  student_id: string
  amount: number
  month: string // 'YYYY-MM-01' formatida
  paid_at: string | null
  status: PaymentStatus
  created_at: string
  // UI uchun qo'shimcha
  student_name?: string
}
