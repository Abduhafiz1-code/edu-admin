<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useStudentsStore } from '@/stores/students'
import { useGroupsStore } from '@/stores/groups'
import { usePaymentsStore } from '@/stores/payments'

const auth = useAuthStore()
const studentsStore = useStudentsStore()
const groupsStore = useGroupsStore()
const paymentsStore = usePaymentsStore()

function currentMonthDb() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

onMounted(async () => {
  await Promise.all([studentsStore.fetchAll(), groupsStore.fetchAll(), paymentsStore.fetchByMonth(currentMonthDb())])
})

const myStudents = computed(() => {
  if (auth.isManager) return studentsStore.items
  return studentsStore.items.filter((s) => s.teacher_id === auth.profile?.id)
})
const activeStudents = computed(() => myStudents.value.filter((s) => s.status === 'active'))
const myGroups = computed(() => {
  if (auth.isManager) return groupsStore.items
  return groupsStore.items.filter((g) => g.teacher_id === auth.profile?.id)
})
const paidThisMonth = computed(() => paymentsStore.items.filter((p) => p.status === 'paid').length)
const collectedThisMonth = computed(() =>
  paymentsStore.items.filter((p) => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0)
)

function formatPrice(p: number) {
  return new Intl.NumberFormat('uz-UZ').format(p) + " so'm"
}
</script>

<template>
  <div>
    <h1 class="font-display font-bold text-2xl mb-1">Xush kelibsiz, {{ auth.profile?.full_name }}</h1>
    <p class="opacity-60 mb-6 text-sm">{{ auth.isManager ? 'Menejer paneli' : "O'qituvchi paneli" }}</p>

    <div class="stats stats-vertical sm:stats-horizontal shadow w-full bg-base-100 border border-base-300">
      <div class="stat">
        <div class="stat-title">Faol o'quvchilar</div>
        <div class="stat-value text-primary">{{ activeStudents.length }}</div>
        <div class="stat-desc">Jami: {{ myStudents.length }}</div>
      </div>
      <div class="stat">
        <div class="stat-title">Guruhlar</div>
        <div class="stat-value text-accent">{{ myGroups.length }}</div>
      </div>
      <div class="stat">
        <div class="stat-title">Shu oy to'lagan</div>
        <div class="stat-value text-secondary">{{ paidThisMonth }}</div>
        <div class="stat-desc">{{ formatPrice(collectedThisMonth) }} yig'ildi</div>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 mt-6">
      <RouterLink :to="{ name: 'students' }" class="card bg-primary text-primary-content hover:brightness-95 transition">
        <div class="card-body">
          <h2 class="font-display font-bold">O'quvchilarni boshqarish →</h2>
          <p class="text-sm opacity-90">Qo'shish, tahrirlash, o'chirish va o'tkazish</p>
        </div>
      </RouterLink>
      <RouterLink :to="{ name: 'payments' }" class="card bg-secondary text-secondary-content hover:brightness-95 transition">
        <div class="card-body">
          <h2 class="font-display font-bold">Oylik to'lovlar →</h2>
          <p class="text-sm opacity-90">Shu oy uchun to'lovlarni belgilash</p>
        </div>
      </RouterLink>
    </div>
  </div>
</template>
