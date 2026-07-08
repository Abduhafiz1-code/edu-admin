<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useGroupsStore } from '@/stores/groups'
import { useSubjectsStore } from '@/stores/subjects'
import { useTeachersStore } from '@/stores/teachers'
import { useAuthStore } from '@/stores/auth'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import type { Group } from '@/types'

const groupsStore = useGroupsStore()
const subjectsStore = useSubjectsStore()
const teachersStore = useTeachersStore()
const auth = useAuthStore()

const showModal = ref(false)
const editingGroup = ref<Group | null>(null)
const toDelete = ref<Group | null>(null)

const form = ref({ name: '', subject_id: '', teacher_id: '', monthly_price: 0 })

onMounted(async () => {
  await Promise.all([groupsStore.fetchAll(), subjectsStore.fetchAll(), teachersStore.fetchAll()])
})

const visibleGroups = computed(() => {
  if (auth.isManager) return groupsStore.items
  return groupsStore.items.filter((g) => g.teacher_id === auth.profile?.id)
})

function openCreate() {
  editingGroup.value = null
  form.value = {
    name: '',
    subject_id: '',
    teacher_id: auth.isTeacher ? auth.profile?.id ?? '' : '',
    monthly_price: 0,
  }
  showModal.value = true
}

function canManage(g: Group) {
  return auth.isManager || g.teacher_id === auth.profile?.id
}

function openEdit(g: Group) {
  editingGroup.value = g
  form.value = {
    name: g.name,
    subject_id: g.subject_id,
    teacher_id: g.teacher_id,
    monthly_price: g.monthly_price,
  }
  showModal.value = true
}

async function save() {
  if (!form.value.name || !form.value.subject_id || !form.value.teacher_id) return
  if (editingGroup.value) {
    await groupsStore.update(editingGroup.value.id, form.value)
  } else {
    await groupsStore.create(form.value)
  }
  showModal.value = false
}

async function confirmDelete() {
  if (!toDelete.value) return
  await groupsStore.remove(toDelete.value.id)
  toDelete.value = null
}

function formatPrice(p: number) {
  return new Intl.NumberFormat('uz-UZ').format(p) + " so'm"
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="font-display font-bold text-2xl">Guruhlar</h1>
      <button class="btn btn-primary btn-sm" @click="openCreate">+ Yangi guruh</button>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="g in visibleGroups" :key="g.id" class="card bg-base-100 border border-base-300">
        <div class="card-body">
          <div class="flex items-start justify-between">
            <h2 class="font-display font-bold text-lg">{{ g.name }}</h2>
            <div class="badge badge-accent badge-outline">{{ g.subject_name }}</div>
          </div>
          <div class="text-sm opacity-70 mt-1">O'qituvchi: {{ g.teacher_name }}</div>
          <div class="text-sm opacity-70">O'quvchilar: {{ g.student_count }}</div>
          <div class="font-semibold text-primary mt-2">{{ formatPrice(g.monthly_price) }} / oy</div>
          <div v-if="canManage(g)" class="card-actions justify-end mt-3">
            <button class="btn btn-sm btn-ghost" @click="openEdit(g)">Tahrirlash</button>
            <button class="btn btn-sm btn-ghost text-error" @click="toDelete = g">O'chirish</button>
          </div>
        </div>
      </div>

      <div v-if="!groupsStore.loading && visibleGroups.length === 0"
        class="col-span-full text-center opacity-60 text-sm py-10">
        Hozircha guruhlar yo'q
      </div>
    </div>

    <dialog class="modal" :class="{ 'modal-open': showModal }">
      <div class="modal-box">
        <h3 class="font-display font-bold text-lg mb-4">
          {{ editingGroup ? 'Guruhni tahrirlash' : 'Yangi guruh' }}
        </h3>
        <form class="flex flex-col gap-3" @submit.prevent="save">
          <label class="form-control">
            <span class="label-text mb-1">Guruh nomi</span>
            <input v-model="form.name" class="input input-bordered" required />
          </label>
          <label class="form-control">
            <span class="label-text mb-1">Fan</span>
            <select v-model="form.subject_id" class="select select-bordered" required>
              <option value="" disabled>Tanlang</option>
              <option v-for="s in subjectsStore.items" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </label>
          <label v-if="auth.isManager" class="form-control">
            <span class="label-text mb-1">O'qituvchi</span>
            <select v-model="form.teacher_id" class="select select-bordered" required>
              <option value="" disabled>Tanlang</option>
              <option v-for="t in teachersStore.items" :key="t.id" :value="t.id">{{ t.full_name }}</option>
            </select>
          </label>
          <p v-else class="text-sm opacity-60 -mt-1">
            Bu guruh sizga (<strong>{{ auth.profile?.full_name }}</strong>) biriktiriladi.
          </p>
          <label class="form-control">
            <span class="label-text mb-1">Oylik narx (so'm)</span>
            <input v-model.number="form.monthly_price" type="number" min="0" class="input input-bordered" required />
          </label>
          <div class="modal-action">
            <button type="button" class="btn btn-ghost" @click="showModal = false">Bekor qilish</button>
            <button type="submit" class="btn btn-primary">Saqlash</button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop"><button @click="showModal = false">yopish</button></form>
    </dialog>

    <ConfirmDialog :open="!!toDelete" title="Guruhni o'chirish"
      :message="`«${toDelete?.name}» guruhini o'chirishni tasdiqlaysizmi? Bu guruhdagi o'quvchilarning guruh maydoni bo'shab qoladi.`"
      @confirm="confirmDelete" @cancel="toDelete = null" />
  </div>
</template>