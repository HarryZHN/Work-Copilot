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
        <span class="logo-icon"></span>
        <span class="logo-text">Work Copilot</span>
      </div>
      <div class="subtitle">让每一天都充满元气！</div>
    </div>
    
    <nav class="sidebar-nav">
      <button
        v-for="item in navItems"
        :key="item.path"
        class="nav-item"
        @click="$emit('navClick', item.path)"
      >
        <div class="nav-icon-wrapper">
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
        </div>
        <span class="nav-text">{{ item.name }}</span>
      </button>
    </nav>
    
    <!-- 可爱的分隔装饰 -->
    <div class="divider-decoration">
      <span class="flower">✿</span>
      <span class="flower">✿</span>
      <span class="flower">✿</span>
    </div>
    
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
        <div class="footer-divider">⭐</div>
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
  width: 220px;
  background: linear-gradient(180deg, #FFF8E1 0%, #FFECB3 50%, #FFE082 100%);
  color: #5D4037;
  display: flex;
  flex-direction: column;
  z-index: 100;
  border-right: 5px solid #8D6E63;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

/* 装饰性叶子 */
.decoration-leaf {
  position: absolute;
  font-size: 28px;
  animation: float 4s ease-in-out infinite;
  opacity: 0.7;
  z-index: 1;
  
  &.leaf-1 {
    top: 20px;
    left: 15px;
    animation-delay: 0s;
  }
  
  &.leaf-2 {
    top: 60px;
    right: 15px;
    animation-delay: 1s;
  }
  
  &.leaf-3 {
    top: 100px;
    left: 25px;
    animation-delay: 2s;
  }
}

.sidebar-header {
  padding: 30px 20px 20px;
  border-bottom: 3px dashed #A1887F;
  position: relative;
  z-index: 2;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.logo-icon {
  font-size: 32px;
  height: 32px;
  width: 32px;
  background-image: url('/src/assets/logo.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: #5D4037;
  text-shadow: 2px 2px 0 rgba(255, 255, 255, 0.5);
}

.subtitle {
  font-size: 12px;
  color: #8D6E63;
  text-align: center;
}

.sidebar-nav {
  flex: 1;
  padding: 15px 10px;
  position: relative;
  z-index: 2;
}

.nav-item {
  width: 100%;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  background: linear-gradient(145deg, #FFFFFF 0%, #FFF9C4 100%);
  border: 3px solid #A1887F;
  border-radius: 18px;
  color: #5D4037;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 10px;
  box-shadow: 0 4px 0 #8D6E63;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 0 #8D6E63;
    background: linear-gradient(145deg, #FFEB3B 0%, #FFC107 100%);
    border-color: #FF8F00;
  }
  
  &:active {
    transform: translateY(1px);
    box-shadow: 0 2px 0 #8D6E63;
  }
}

.nav-icon-wrapper {
  width: 40px;
  height: 40px;
  background: linear-gradient(145deg, #81C784 0%, #4CAF50 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #2E7D32;
  flex-shrink: 0;
}

.nav-icon {
  width: 22px;
  height: 22px;
  color: white;
  flex-shrink: 0;
}

.nav-text {
  font-size: 15px;
  font-weight: 600;
}

/* 分隔装饰 */
.divider-decoration {
  display: flex;
  justify-content: center;
  gap: 10px;
  padding: 5px 0;
  
  .flower {
    font-size: 16px;
    color: #FF7043;
    animation: sparkle 2s ease-in-out infinite;
    
    &:nth-child(2) {
      animation-delay: 0.3s;
    }
    
    &:nth-child(3) {
      animation-delay: 0.6s;
    }
  }
}

.sidebar-footer {
  padding: 18px 15px;
  border-top: 3px dashed #A1887F;
  background: linear-gradient(180deg, transparent 0%, rgba(255, 235, 59, 0.3) 100%);
}

.footer-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
}

.footer-divider {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FF9800;
  font-size: 18px;
}

.footer-btn {
  width: 46px;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #FFF8E1 0%, #FFE082 100%);
  border: 3px solid #8D6E63;
  color: #5D4037;
  cursor: pointer;
  border-radius: 14px;
  transition: all 0.2s ease;
  box-shadow: 0 3px 0 #6D4C41;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 0 #6D4C41;
    background: linear-gradient(145deg, #FFD54F 0%, #FFC107 100%);
  }
  
  &:active {
    transform: translateY(1px);
    box-shadow: 0 2px 0 #6D4C41;
  }
  
  .nav-icon {
    width: 24px;
    height: 24px;
  }
}

</style>
