import { createRouter, createWebHistory } from 'vue-router'

import Overview from './pages/Overview.vue'
import Playground from './pages/Playground.vue'

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
  ],
})

export default router
