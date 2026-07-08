<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useStudentsStore } from '@/stores/students'
import { useGroupsStore } from '@/stores/groups'
import { useTeachersStore } from '@/stores/teachers'
import { useAuthStore } from '@/stores/auth'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import type { Student } from '@/types'

const studentsStore = useStudentsStore()
const groupsStore = useGroupsStore()
const teachersStore = useTeachersStore()
const auth = useAuthStore()

const showModal = ref(false)
const editingStudent = ref<Student | null>(null)
const toDelete = ref<Student | null>(null)
const transferTarget = ref<Student | null>(null)
const transferTeacherId = ref('')
const teacherFilter = ref('')
const search = ref('')

const form = ref({
  full_name: '',
  phone: '',
  parent_phone: '',
  teacher_id: '',
  group_id: '',
})

onMounted(async () => {
  await Promise.all([studentsStore.fetchAll(), groupsStore.fetchAll(), teachersStore.fetchAll()])
  if (auth.isTeacher && auth.profile) {
    form.value.teacher_id = auth.profile.id
  }
})

const filteredStudents = computed(() => {
  let list = studentsStore.items
  if (auth.isManager && teacherFilter.value) {
    list = list.filter((s) => s.teacher_id === teacherFilter.value)
  }
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase()
    list = list.filter((s) => s.full_name.toLowerCase().includes(q))
  }
  return list
})

const groupsForSelectedTeacher = computed(() => {
  const teacherId = form.value.teacher_id
  return groupsStore.items.filter((g) => g.teacher_id === teacherId)
})

function openCreate() {
  editingStudent.value = null
  form.value = {
    full_name: '',
    phone: '',
    parent_phone: '',
    teacher_id: auth.isTeacher ? auth.profile?.id ?? '' : '',
    group_id: '',
  }
  showModal.value = true
}

function openEdit(s: Student) {
  editingStudent.value = s
  form.value = {
    full_name: s.full_name,
    phone: s.phone ?? '',
    parent_phone: s.parent_phone ?? '',
    teacher_id: s.teacher_id,
    group_id: s.group_id ?? '',
  }
  showModal.value = true
}

async function save() {
  if (!form.value.full_name || !form.value.teacher_id) return
  const payload = {
    full_name: form.value.full_name,
    phone: form.value.phone || null,
    parent_phone: form.value.parent_phone || null,
    teacher_id: form.value.teacher_id,
    group_id: form.value.group_id || null,
  }
  if (editingStudent.value) {
    await studentsStore.update(editingStudent.value.id, payload)
  } else {
    await studentsStore.create(payload as any)
  }
  showModal.value = false
}

async function confirmDelete() {
  if (!toDelete.value) return
  await studentsStore.remove(toDelete.value.id)
  toDelete.value = null
}

function openTransfer(s: Student) {
  transferTarget.value = s
  transferTeacherId.value = ''
}

async function confirmTransfer() {
  if (!transferTarget.value || !transferTeacherId.value) return
  await studentsStore.transferToTeacher(transferTarget.value.id, transferTeacherId.value)
  transferTarget.value = null
}

async function toggleStatus(s: Student) {
  await studentsStore.setStatus(s.id, s.status === 'active' ? 'inactive' : 'active')
}
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
      <h1 class="font-display font-bold text-2xl">O'quvchilar</h1>
      <button class="btn btn-primary btn-sm" @click="openCreate">+ Yangi o'quvchi</button>
    </div>

    <div class="flex flex-wrap gap-3 mb-4">
      <input v-model="search" class="input input-bordered input-sm w-56" placeholder="Ism bo'yicha qidirish" />
      <select v-if="auth.isManager" v-model="teacherFilter" class="select select-bordered select-sm">
        <option value="">Barcha o'qituvchilar</option>
        <option v-for="t in teachersStore.items" :key="t.id" :value="t.id">{{ t.full_name }}</option>
      </select>
    </div>

    <div class="overflow-x-auto card bg-base-100 border border-base-300">
      <table class="table">
        <thead>
          <tr>
            <th>Ism familiya</th>
            <th>Telefon</th>
            <th>Guruh</th>
            <th v-if="auth.isManager">O'qituvchi</th>
            <th>Holat</th>
            <th class="text-right">Amallar</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in filteredStudents" :key="s.id">
            <td class="font-medium">{{ s.full_name }}</td>
            <td>{{ s.phone || '—' }}</td>
            <td>{{ s.group_name || '—' }}</td>
            <td v-if="auth.isManager">{{ s.teacher_name }}</td>
            <td>
              <button
                class="badge cursor-pointer"
                :class="s.status === 'active' ? 'badge-success' : 'badge-ghost'"
                @click="toggleStatus(s)"
              >
                {{ s.status === 'active' ? 'Faol' : 'Nofaol' }}
              </button>
            </td>
            <td class="text-right space-x-1">
              <button class="btn btn-xs btn-ghost" @click="openEdit(s)">Tahrirlash</button>
              <button v-if="auth.isManager" class="btn btn-xs btn-ghost" @click="openTransfer(s)">O'tkazish</button>
              <button class="btn btn-xs btn-ghost text-error" @click="toDelete = s">O'chirish</button>
            </td>
          </tr>
          <tr v-if="!studentsStore.loading && filteredStudents.length === 0">
            <td colspan="6" class="text-center opacity-60 py-8 text-sm">O'quvchilar topilmadi</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Yaratish / tahrirlash modali -->
    <dialog class="modal" :class="{ 'modal-open': showModal }">
      <div class="modal-box">
        <h3 class="font-display font-bold text-lg mb-4">
          {{ editingStudent ? "O'quvchini tahrirlash" : "Yangi o'quvchi" }}
        </h3>
        <form class="flex flex-col gap-3" @submit.prevent="save">
          <label class="form-control">
            <span class="label-text mb-1">Ism familiya</span>
            <input v-model="form.full_name" class="input input-bordered" required />
          </label>
          <label class="form-control">
            <span class="label-text mb-1">Telefon</span>
            <input v-model="form.phone" class="input input-bordered" placeholder="+998 90 123 45 67" />
          </label>
          <label class="form-control">
            <span class="label-text mb-1">Ota-ona telefoni</span>
            <input v-model="form.parent_phone" class="input input-bordered" placeholder="+998 90 123 45 67" />
          </label>
          <label v-if="auth.isManager" class="form-control">
            <span class="label-text mb-1">O'qituvchi</span>
            <select v-model="form.teacher_id" class="select select-bordered" required>
              <option value="" disabled>Tanlang</option>
              <option v-for="t in teachersStore.items" :key="t.id" :value="t.id">{{ t.full_name }}</option>
            </select>
          </label>
          <label class="form-control">
            <span class="label-text mb-1">Guruh</span>
            <select v-model="form.group_id" class="select select-bordered">
              <option value="">Guruhsiz</option>
              <option v-for="g in groupsForSelectedTeacher" :key="g.id" :value="g.id">{{ g.name }}</option>
            </select>
          </label>
          <div class="modal-action">
            <button type="button" class="btn btn-ghost" @click="showModal = false">Bekor qilish</button>
            <button type="submit" class="btn btn-primary">Saqlash</button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop"><button @click="showModal = false">yopish</button></form>
    </dialog>

    <!-- O'tkazish modali -->
    <dialog class="modal" :class="{ 'modal-open': !!transferTarget }">
      <div class="modal-box">
        <h3 class="font-display font-bold text-lg mb-2">Boshqa o'qituvchiga o'tkazish</h3>
        <p class="text-sm opacity-70 mb-4">
          «{{ transferTarget?.full_name }}» o'quvchisini qaysi o'qituvchiga o'tkazasiz?
        </p>
        <select v-model="transferTeacherId" class="select select-bordered w-full">
          <option value="" disabled>O'qituvchini tanlang</option>
          <option
            v-for="t in teachersStore.items.filter((t) => t.id !== transferTarget?.teacher_id)"
            :key="t.id"
            :value="t.id"
          >
            {{ t.full_name }}
          </option>
        </select>
        <div class="modal-action">
          <button class="btn btn-ghost" @click="transferTarget = null">Bekor qilish</button>
          <button class="btn btn-primary" :disabled="!transferTeacherId" @click="confirmTransfer">O'tkazish</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button @click="transferTarget = null">yopish</button></form>
    </dialog>

    <ConfirmDialog
      :open="!!toDelete"
      title="O'quvchini o'chirish"
      :message="`«${toDelete?.full_name}»ni o'chirishni tasdiqlaysizmi? Bu amalni ortga qaytarib bo'lmaydi.`"
      @confirm="confirmDelete"
      @cancel="toDelete = null"
    />
  </div>
</template>
