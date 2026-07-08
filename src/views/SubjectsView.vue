<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useSubjectsStore } from '@/stores/subjects'
import { useAuthStore } from '@/stores/auth'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import type { Subject } from '@/types'

const store = useSubjectsStore()
const auth = useAuthStore()

const newName = ref('')
const editing = ref<Subject | null>(null)
const editName = ref('')
const toDelete = ref<Subject | null>(null)

onMounted(() => store.fetchAll())

async function addSubject() {
  if (!newName.value.trim()) return
  await store.create(newName.value.trim())
  newName.value = ''
}

function startEdit(s: Subject) {
  editing.value = s
  editName.value = s.name
}

async function saveEdit() {
  if (!editing.value) return
  await store.update(editing.value.id, editName.value.trim())
  editing.value = null
}

async function confirmDelete() {
  if (!toDelete.value) return
  await store.remove(toDelete.value.id)
  toDelete.value = null
}
</script>

<template>
  <div class="max-w-2xl">
    <h1 class="font-display font-bold text-2xl mb-6">Fanlar</h1>

    <div v-if="auth.isManager" class="card bg-base-100 border border-base-300 mb-6">
      <div class="card-body">
        <form class="flex gap-2" @submit.prevent="addSubject">
          <input v-model="newName" class="input input-bordered flex-1" placeholder="Masalan: Matematika" />
          <button class="btn btn-primary" type="submit">Qo'shish</button>
        </form>
      </div>
    </div>

    <div class="card bg-base-100 border border-base-300">
      <div class="card-body p-0">
        <ul class="divide-y divide-base-300">
          <li v-for="s in store.items" :key="s.id" class="flex items-center justify-between p-4">
            <template v-if="editing?.id === s.id">
              <input v-model="editName" class="input input-bordered input-sm flex-1 mr-2" @keyup.enter="saveEdit" />
              <div class="flex gap-2">
                <button class="btn btn-sm btn-primary" @click="saveEdit">Saqlash</button>
                <button class="btn btn-sm btn-ghost" @click="editing = null">Bekor</button>
              </div>
            </template>
            <template v-else>
              <span>{{ s.name }}</span>
              <div v-if="auth.isManager" class="flex gap-2">
                <button class="btn btn-sm btn-ghost" @click="startEdit(s)">Tahrirlash</button>
                <button class="btn btn-sm btn-ghost text-error" @click="toDelete = s">O'chirish</button>
              </div>
            </template>
          </li>
          <li v-if="!store.loading && store.items.length === 0" class="p-6 text-center opacity-60 text-sm">
            Hozircha fanlar yo'q
          </li>
        </ul>
      </div>
    </div>

    <ConfirmDialog
      :open="!!toDelete"
      title="Fanni o'chirish"
      :message="`«${toDelete?.name}» fanini o'chirishni tasdiqlaysizmi?`"
      @confirm="confirmDelete"
      @cancel="toDelete = null"
    />
  </div>
</template>
