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
        { path: '/memo/:id', component: () => import('../views/memo/detail.vue') },
        { path: '/memo/edit/:id', component: () => import('../views/memo/edit.vue') },
        { path: '/schedule', component: () => import('../views/ScheduleView.vue') }
      ]
    }
  ]
})

export default router
