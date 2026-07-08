import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { public: true } },
    { path: '/', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },
    { path: '/students', name: 'students', component: () => import('@/views/StudentsView.vue') },
    { path: '/groups', name: 'groups', component: () => import('@/views/GroupsView.vue') },
    { path: '/subjects', name: 'subjects', component: () => import('@/views/SubjectsView.vue') },
    { path: '/payments', name: 'payments', component: () => import('@/views/PaymentsView.vue') },
    {
      path: '/teachers',
      name: 'teachers',
      component: () => import('@/views/TeachersView.vue'),
      meta: { managerOnly: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.init()

  if (!to.meta.public && !auth.isLoggedIn) {
    return { name: 'login' }
  }
  if (to.name === 'login' && auth.isLoggedIn) {
    return { name: 'dashboard' }
  }
  if (to.meta.managerOnly && !auth.isManager) {
    return { name: 'dashboard' }
  }
  return true
})

export default router
