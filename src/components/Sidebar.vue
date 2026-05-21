<script setup lang="ts">
const props = defineProps<{
  collapsed: boolean
  navItems: Array<{
    name: string
    icon: string
    path: string
  }>
}>()

const emit = defineEmits<{
  'update:collapsed': [value: boolean]
  navClick: [path: string]
}>()

const toggleSidebar = () => {
  emit('update:collapsed', !props.collapsed)
}
</script>

<template>
  <aside class="sidebar" :class="{ collapsed: collapsed }">
    <div class="sidebar-header">
      <div class="logo" v-if="!collapsed">
        <span class="logo-text">Work Copilot</span>
      </div>
    </div>
    
    <nav class="sidebar-nav">
      <button
        v-for="item in navItems"
        :key="item.path"
        class="nav-item"
        :title="collapsed ? item.name : ''"
        @click="emit('navClick', item.path)"
      >
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect v-if="item.icon === 'memo'" x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line v-if="item.icon === 'memo'" x1="9" y1="3" x2="9" y2="21"/>
          <line v-if="item.icon === 'memo'" x1="15" y1="3" x2="15" y2="21"/>
          <path v-else-if="item.icon === 'schedule'" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          <polyline v-else-if="item.icon === 'schedule'" points="16 3 21 3 21 8"/>
          <line v-else-if="item.icon === 'schedule'" x1="8" y1="21" x2="12" y2="17"/>
        </svg>
        <span v-if="!collapsed" class="nav-text">{{ item.name }}</span>
      </button>
    </nav>
    
    <div class="sidebar-footer">
      <button class="collapse-btn" @click="toggleSidebar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path v-if="!collapsed" d="M15 19l-7-7 7-7"/>
          <path v-else d="M9 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
  </aside>
</template>

<style lang="scss" scoped>
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  height: 100%;
  width: 200px;
  background-color: #2c3e50;
  color: #ecf0f1;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  z-index: 100;

  &.collapsed {
    width: 56px;
  }
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #34495e;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #3498db;
}

.sidebar-nav {
  flex: 1;
  padding: 10px 0;
}

.nav-item {
  width: 100%;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: none;
  border: none;
  color: #bdc3c7;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #34495e;
    color: #ecf0f1;
  }
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.nav-text {
  font-size: 14px;
}

.sidebar-footer {
  padding: 10px;
  border-top: 1px solid #34495e;
}

.collapse-btn {
  width: 100%;
  padding: 10px;
  background: none;
  border: none;
  color: #bdc3c7;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #34495e;
    color: #ecf0f1;
  }

  svg {
    width: 18px;
    height: 18px;
  }
}
</style>
