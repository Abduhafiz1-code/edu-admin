<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useTeachersStore } from '@/stores/teachers'
import { useStudentsStore } from '@/stores/students'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import type { Profile } from '@/types'

const teachersStore = useTeachersStore()
const studentsStore = useStudentsStore()

const showModal = ref(false)
const toDelete = ref<Profile | null>(null)
const error = ref('')
const saving = ref(false)

const form = ref({ full_name: '', email: '', password: '', phone: '' })

onMounted(async () => {
  await Promise.all([teachersStore.fetchAll(), studentsStore.fetchAll()])
})

function studentCount(teacherId: string) {
  return studentsStore.items.filter((s) => s.teacher_id === teacherId).length
}

function openCreate() {
  form.value = { full_name: '', email: '', password: '', phone: '' }
  error.value = ''
  showModal.value = true
}

async function save() {
  error.value = ''
  saving.value = true
  try {
    await teachersStore.createTeacher(form.value)
    showModal.value = false
  } catch (e: any) {
    error.value = e.message ?? "O'qituvchi qo'shishda xatolik"
  } finally {
    saving.value = false
  }
}

async function confirmDelete() {
  if (!toDelete.value) return
  await teachersStore.removeTeacher(toDelete.value.id)
  toDelete.value = null
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="font-display font-bold text-2xl">O'qituvchilar</h1>
      <button class="btn btn-primary btn-sm" @click="openCreate">+ Yangi o'qituvchi</button>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="t in teachersStore.items" :key="t.id" class="card bg-base-100 border border-base-300">
        <div class="card-body">
          <h2 class="font-display font-bold text-lg">{{ t.full_name }}</h2>
          <div class="text-sm opacity-70">{{ t.phone || 'Telefon kiritilmagan' }}</div>
          <div class="text-sm opacity-70">O'quvchilar soni: {{ studentCount(t.id) }}</div>
          <div class="card-actions justify-end mt-3">
            <button class="btn btn-sm btn-ghost text-error" @click="toDelete = t">O'chirish</button>
          </div>
        </div>
      </div>
      <div v-if="!teachersStore.loading && teachersStore.items.length === 0" class="col-span-full text-center opacity-60 text-sm py-10">
        Hozircha o'qituvchilar yo'q
      </div>
    </div>

    <dialog class="modal" :class="{ 'modal-open': showModal }">
      <div class="modal-box">
        <h3 class="font-display font-bold text-lg mb-1">Yangi o'qituvchi</h3>
        <p class="text-xs opacity-60 mb-4">
          Bu amal <code>create-teacher</code> Edge Function orqali yangi hisob yaratadi (pastdagi README'ga qarang).
        </p>
        <form class="flex flex-col gap-3" @submit.prevent="save">
          <label class="form-control">
            <span class="label-text mb-1">Ism familiya</span>
            <input v-model="form.full_name" class="input input-bordered" required />
          </label>
          <label class="form-control">
            <span class="label-text mb-1">Email</span>
            <input v-model="form.email" type="email" class="input input-bordered" required />
          </label>
          <label class="form-control">
            <span class="label-text mb-1">Vaqtinchalik parol</span>
            <input v-model="form.password" type="text" class="input input-bordered" required minlength="6" />
          </label>
          <label class="form-control">
            <span class="label-text mb-1">Telefon</span>
            <input v-model="form.phone" class="input input-bordered" placeholder="+998 90 123 45 67" />
          </label>
          <p v-if="error" class="text-error text-sm">{{ error }}</p>
          <div class="modal-action">
            <button type="button" class="btn btn-ghost" @click="showModal = false">Bekor qilish</button>
            <button type="submit" class="btn btn-primary" :class="{ loading: saving }" :disabled="saving">Yaratish</button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop"><button @click="showModal = false">yopish</button></form>
    </dialog>

    <ConfirmDialog
      :open="!!toDelete"
      title="O'qituvchini o'chirish"
      :message="`«${toDelete?.full_name}»ni o'chirishdan oldin uning o'quvchilarini boshqa o'qituvchiga o'tkazganingizga ishonch hosil qiling.`"
      @confirm="confirmDelete"
      @cancel="toDelete = null"
    />
  </div>
</template>
