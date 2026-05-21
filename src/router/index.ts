import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: () => import('../layouts/DefaultLayout.vue'),
      children: [
        { path: '', redirect: '/memo' },
        { path: '/memo', component: () => import('../views/memo/index.vue') },
        { path: '/schedule', component: () => import('../views/schedule/index.vue') }
      ]
    }
  ]
})

export default router
