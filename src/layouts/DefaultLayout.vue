<script setup lang="ts">
import Sidebar from '@/components/Sidebar.vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const navItems = [
  { name: '排期表', icon: 'schedule', path: '/schedule' },
  { name: '备忘录', icon: 'memo', path: '/memo' }
]

const handleNavClick = (path: string) => {
  router.push(path)
}
</script>

<template>
  <div class="layout-container">
    <Sidebar :nav-items="navItems" @nav-click="handleNavClick" />
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
  margin-left: 200px;
  background-color: #f5f5f5;
  overflow: auto;
}
</style>
