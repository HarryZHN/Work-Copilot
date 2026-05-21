<script setup lang="ts">
import { ref } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import { useRouter } from 'vue-router'

const collapsed = ref(false)
const router = useRouter()

const navItems = [
  { name: '备忘录', icon: 'memo', path: '/memo' },
  { name: '日程表', icon: 'schedule', path: '/schedule' }
]

const handleNavClick = (path: string) => {
  router.push(path)
}
</script>

<template>
  <div class="layout-container">
    <Sidebar v-model:collapsed="collapsed" :nav-items="navItems" @nav-click="handleNavClick" />
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style lang="scss" scoped>
.layout-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.main-content {
  flex: 1;
  transition: margin-left 0.3s ease;
  margin-left: 200px;
  background-color: #f5f5f5;
  overflow: auto;

  :deep(.sidebar-collapsed) & {
    margin-left: 56px;
  }
}
</style>
