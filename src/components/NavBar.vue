<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter, RouterLink } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

async function logout() {
  await auth.signOut()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="drawer lg:drawer-open min-h-screen bg-base-200">
    <input id="main-drawer" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content flex flex-col">
      <!-- Top bar (mobil uchun) -->
      <div class="navbar bg-base-100 border-b border-base-300 lg:hidden">
        <div class="flex-none">
          <label for="main-drawer" class="btn btn-square btn-ghost">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </label>
        </div>
        <div class="flex-1 font-display font-bold text-lg">EduAdmin</div>
      </div>

      <main class="flex-1 p-4 md:p-8">
        <slot />
      </main>
    </div>

    <div class="drawer-side z-20">
      <label for="main-drawer" class="drawer-overlay"></label>
      <aside class="min-h-full w-72 bg-neutral text-neutral-content flex flex-col">
        <div class="p-6 border-b border-white/10">
          <div class="font-display font-extrabold text-xl">EduAdmin</div>
          <div class="text-xs opacity-60 mt-1">O'quv markazi boshqaruvi</div>
        </div>

        <ul class="menu p-4 flex-1 gap-1">
          <li>
            <RouterLink :to="{ name: 'dashboard' }" active-class="active">
              📊 Bosh sahifa
            </RouterLink>
          </li>
          <li>
            <RouterLink :to="{ name: 'students' }" active-class="active">
              🎓 O'quvchilar
            </RouterLink>
          </li>
          <li>
            <RouterLink :to="{ name: 'groups' }" active-class="active">
              👥 Guruhlar
            </RouterLink>
          </li>
          <li>
            <RouterLink :to="{ name: 'subjects' }" active-class="active">
              📚 Fanlar
            </RouterLink>
          </li>
          <li>
            <RouterLink :to="{ name: 'payments' }" active-class="active">
              💳 To'lovlar
            </RouterLink>
          </li>
          <li v-if="auth.isManager">
            <RouterLink :to="{ name: 'teachers' }" active-class="active">
              🧑‍🏫 O'qituvchilar
            </RouterLink>
          </li>
        </ul>

        <div class="p-4 border-t border-white/10">
          <div class="text-sm font-medium">{{ auth.profile?.full_name }}</div>
          <div class="text-xs opacity-60 mb-3">
            {{ auth.isManager ? 'Menejer' : "O'qituvchi" }}
          </div>
          <button class="btn btn-sm btn-outline btn-block" @click="logout">Chiqish</button>
        </div>
      </aside>
    </div>
  </div>
</template>
