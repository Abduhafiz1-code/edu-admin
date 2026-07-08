<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.signIn(email.value, password.value)
    router.push({ name: 'dashboard' })
  } catch (e: any) {
    error.value = e.message === 'Invalid login credentials'
      ? 'Email yoki parol noto\'g\'ri'
      : e.message ?? 'Kirishda xatolik yuz berdi'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen grid place-items-center bg-base-200 px-4" data-theme="eduverse">
    <div class="card w-full max-w-sm bg-base-100 shadow-xl border border-base-300">
      <div class="card-body">
        <h1 class="font-display font-extrabold text-2xl text-primary mb-1">EduAdmin</h1>
        <p class="text-sm opacity-70 mb-6">O'quv markazi boshqaruv paneliga kirish</p>

        <form class="flex flex-col gap-3" @submit.prevent="submit">
          <label class="form-control">
            <span class="label-text mb-1">Email</span>
            <input v-model="email" type="email" required class="input input-bordered" placeholder="email@misol.uz" />
          </label>
          <label class="form-control">
            <span class="label-text mb-1">Parol</span>
            <input v-model="password" type="password" required class="input input-bordered" placeholder="••••••••" />
          </label>

          <p v-if="error" class="text-error text-sm">{{ error }}</p>

          <button class="btn btn-primary mt-2" :class="{ loading }" type="submit" :disabled="loading">
            Kirish
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
