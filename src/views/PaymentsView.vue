<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { usePaymentsStore } from '@/stores/payments'
import { useStudentsStore } from '@/stores/students'
import { useGroupsStore } from '@/stores/groups'
import { useAuthStore } from '@/stores/auth'

const paymentsStore = usePaymentsStore()
const studentsStore = useStudentsStore()
const groupsStore = useGroupsStore()
const auth = useAuthStore()

function currentMonthValue() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const monthInput = ref(currentMonthValue()) // 'YYYY-MM'
const monthDb = computed(() => `${monthInput.value}-01`)

onMounted(async () => {
  await Promise.all([studentsStore.fetchAll(), groupsStore.fetchAll()])
  await paymentsStore.fetchByMonth(monthDb.value)
})

watch(monthDb, (m) => paymentsStore.fetchByMonth(m))

const myStudents = computed(() => {
  let list = studentsStore.items.filter((s) => s.status === 'active')
  if (auth.isTeacher && auth.profile) {
    list = list.filter((s) => s.teacher_id === auth.profile!.id)
  }
  return list
})

function groupPrice(groupId: string | null) {
  if (!groupId) return 0
  return groupsStore.items.find((g) => g.id === groupId)?.monthly_price ?? 0
}

function paymentFor(studentId: string) {
  return paymentsStore.items.find((p) => p.student_id === studentId)
}

const editingAmount = ref<Record<string, number>>({})

function amountFor(studentId: string) {
  if (editingAmount.value[studentId] !== undefined) return editingAmount.value[studentId]
  const existing = paymentFor(studentId)
  const student = myStudents.value.find((s) => s.id === studentId)
  return existing?.amount ?? groupPrice(student?.group_id ?? null)
}

async function markPaid(studentId: string) {
  const amount = amountFor(studentId)
  await paymentsStore.markPaid(studentId, amount, monthDb.value)
}

async function markUnpaid(studentId: string) {
  const p = paymentFor(studentId)
  if (!p) return
  await paymentsStore.markUnpaid(p.id)
  await paymentsStore.fetchByMonth(monthDb.value)
}

function formatPrice(p: number) {
  return new Intl.NumberFormat('uz-UZ').format(p) + " so'm"
}

const totalCollected = computed(() =>
  paymentsStore.items.filter((p) => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0)
)
const paidCount = computed(() => paymentsStore.items.filter((p) => p.status === 'paid').length)
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
      <h1 class="font-display font-bold text-2xl">Oylik to'lovlar</h1>
      <input v-model="monthInput" type="month" class="input input-bordered input-sm" />
    </div>

    <div class="stats shadow mb-6 bg-base-100 border border-base-300">
      <div class="stat">
        <div class="stat-title">To'langan o'quvchilar</div>
        <div class="stat-value text-primary text-2xl">{{ paidCount }} / {{ myStudents.length }}</div>
      </div>
      <div class="stat">
        <div class="stat-title">Yig'ilgan summa</div>
        <div class="stat-value text-secondary text-2xl">{{ formatPrice(totalCollected) }}</div>
      </div>
    </div>

    <div class="overflow-x-auto card bg-base-100 border border-base-300">
      <table class="table">
        <thead>
          <tr>
            <th>O'quvchi</th>
            <th>Guruh</th>
            <th>Summa</th>
            <th>Holat</th>
            <th class="text-right">Amal</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in myStudents" :key="s.id">
            <td class="font-medium">{{ s.full_name }}</td>
            <td>{{ s.group_name || '—' }}</td>
            <td>
              <input
                type="number"
                class="input input-bordered input-xs w-28"
                :value="amountFor(s.id)"
                @input="editingAmount[s.id] = Number(($event.target as HTMLInputElement).value)"
              />
            </td>
            <td>
              <span
                class="badge"
                :class="paymentFor(s.id)?.status === 'paid' ? 'badge-success' : 'badge-warning badge-outline'"
              >
                {{ paymentFor(s.id)?.status === 'paid' ? "To'langan" : "To'lanmagan" }}
              </span>
            </td>
            <td class="text-right">
              <button
                v-if="paymentFor(s.id)?.status !== 'paid'"
                class="btn btn-xs btn-primary"
                @click="markPaid(s.id)"
              >
                To'landi deb belgilash
              </button>
              <button v-else class="btn btn-xs btn-ghost" @click="markUnpaid(s.id)">Bekor qilish</button>
            </td>
          </tr>
          <tr v-if="myStudents.length === 0">
            <td colspan="5" class="text-center opacity-60 py-8 text-sm">Faol o'quvchilar yo'q</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
