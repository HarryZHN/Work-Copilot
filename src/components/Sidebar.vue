<script setup lang="ts">
defineProps<{
  navItems: Array<{
    name: string
    icon: string
    path: string
  }>
}>()

defineEmits<{
  navClick: [path: string]
  exportData: []
  importData: []
  openHelp: []
}>()

const openGitHub = () => {
  window.open('https://github.com/HarryZHN/Work-Copilot', '_blank')
}
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <div class="logo">
        <span class="logo-text">Work Copilot</span>
      </div>
    </div>
    
    <nav class="sidebar-nav">
      <button
        v-for="item in navItems"
        :key="item.path"
        class="nav-item"
        @click="$emit('navClick', item.path)"
      >
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect v-if="item.icon === 'memo'" x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line v-if="item.icon === 'memo'" x1="9" y1="3" x2="9" y2="21"/>
          <line v-if="item.icon === 'memo'" x1="15" y1="3" x2="15" y2="21"/>
          <path v-else-if="item.icon === 'schedule'" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          <polyline v-else-if="item.icon === 'schedule'" points="16 3 21 3 21 8"/>
          <line v-else-if="item.icon === 'schedule'" x1="8" y1="21" x2="12" y2="17"/>
          <circle v-else-if="item.icon === 'today'" cx="12" cy="12" r="10"/>
          <polyline v-else-if="item.icon === 'today'" points="12 6 12 12 16 14"/>
        </svg>
        <span class="nav-text">{{ item.name }}</span>
      </button>
    </nav>
    
    <div class="sidebar-footer">
      <div class="footer-buttons">
        <button class="footer-btn" @click="$emit('exportData')" title="导出数据">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </button>
        <button class="footer-btn" @click="$emit('importData')" title="导入数据">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </button>
        <div class="footer-divider"></div>
        <button class="footer-btn" @click="openGitHub" title="GitHub">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </button>
        <button class="footer-btn" @click="$emit('openHelp')" title="帮助说明">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12" y2="17"/>
          </svg>
        </button>
      </div>
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
  z-index: 100;
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

.sidebar-footer {
  padding: 15px 20px;
  border-top: 1px solid #34495e;
}

.footer-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  align-items: center;
}

.footer-divider {
  width: 1px;
  height: 24px;
  background-color: #34495e;
  margin: 0 4px;
}

.footer-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #bdc3c7;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
  
  &:hover {
    background-color: #34495e;
    color: #ecf0f1;
  }
  
  .nav-icon {
    width: 24px;
    height: 24px;
  }
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


</style>
