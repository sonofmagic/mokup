import { createRouter, createWebHistory } from 'vue-router'

import NoAccess from './pages/NoAccess.vue'
import Overview from './pages/Overview.vue'
import Playground from './pages/Playground.vue'

const whitelist = new Set([
  '/',
  '/playground',
  '/no-access',
])

function normalizePath(path: string) {
  if (path !== '/' && path.endsWith('/')) {
    return path.slice(0, -1)
  }
  return path
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'overview',
      component: Overview,
    },
    {
      path: '/playground',
      name: 'playground',
      component: Playground,
    },
    {
      path: '/no-access',
      name: 'no-access',
      component: NoAccess,
    },
  ],
})

router.beforeEach((to) => {
  const normalized = normalizePath(to.path)
  if (whitelist.has(normalized)) {
    return true
  }
  return { path: '/no-access', replace: true }
})

export default router
