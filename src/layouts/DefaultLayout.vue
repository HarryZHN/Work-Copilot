<script setup lang="ts">
import Sidebar from '@/components/Sidebar.vue'
import { useRouter } from 'vue-router'
import { db } from '@/db'
import { ref, onMounted } from 'vue'

const router = useRouter()
const fileInput = ref<HTMLInputElement | null>(null)
const showHelpModal = ref(false)

const navItems = [
  { name: '今日待办', icon: 'today', path: '/today' },
  { name: '排期表', icon: 'schedule', path: '/schedule' },
  { name: '备忘录', icon: 'memo', path: '/memo' }
]

const handleNavClick = (path: string) => {
  router.push(path)
}

const handleOpenHelp = () => {
  showHelpModal.value = true
}

const closeHelpModal = () => {
  showHelpModal.value = false
}

// 页面加载时检查是否需要显示帮助弹窗
onMounted(() => {
  const hasSeenHelp = localStorage.getItem('workCopilot_hasSeenHelp')
  if (!hasSeenHelp) {
    showHelpModal.value = true
    localStorage.setItem('workCopilot_hasSeenHelp', 'true')
  }
})

// 导出数据
const handleExportData = async () => {
  try {
    const memos = await db.memos.toArray()
    const tasks = await db.tasks.toArray()
    const todayTasks = await db.todayTasks.toArray()
    
    const exportData = {
      version: '1.1',
      exportDate: new Date().toISOString(),
      memos,
      tasks,
      todayTasks
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    const dateStr = new Date().toISOString().split('T')[0]
    link.download = `work-copilot-backup-${dateStr}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    alert(`数据导出成功！✨\n备忘录: ${memos.length} 条\n排期任务: ${tasks.length} 条\n今日待办: ${todayTasks.length} 条`)
  } catch (error) {
    console.error('导出失败:', error)
    alert('导出失败，请查看控制台')
  }
}

// 导入数据
const handleImportClick = () => {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  if (!confirm('导入将覆盖现有数据，确定继续吗？')) {
    // 重置 file input
    target.value = ''
    return
  }
  
  try {
    const text = await file.text()
    const importData = JSON.parse(text)
    
    if (!importData.memos || !importData.tasks) {
      throw new Error('无效的数据格式')
    }
    
    // 清空现有数据
    await db.memos.clear()
    await db.tasks.clear()
    await db.todayTasks.clear()
    
    // 导入新数据
    if (importData.memos.length > 0) {
      await db.memos.bulkPut(importData.memos)
    }
    if (importData.tasks.length > 0) {
      await db.tasks.bulkPut(importData.tasks)
    }
    if (importData.todayTasks && importData.todayTasks.length > 0) {
      await db.todayTasks.bulkPut(importData.todayTasks)
    }
    
    const todayTasksCount = importData.todayTasks ? importData.todayTasks.length : 0
    alert(`导入成功！🎉\n备忘录: ${importData.memos.length} 条\n排期任务: ${importData.tasks.length} 条\n今日待办: ${todayTasksCount} 条`)
    
    // 刷新页面以更新数据
    window.location.reload()
  } catch (error) {
    console.error('导入失败:', error)
    alert('导入失败，请确保文件格式正确')
  }
  
  // 重置 file input
  target.value = ''
}
</script>

<template>
  <div class="layout-container">
    <!-- 可爱的背景装饰 -->
    <div class="bg-decoration">
      <span class="deco deco-1">🌻</span>
      <span class="deco deco-2">🌷</span>
      <span class="deco deco-3">🍎</span>
      <span class="deco deco-4">🎀</span>
      <span class="deco deco-5">⭐</span>
    </div>
    
    <Sidebar 
      :nav-items="navItems" 
      @nav-click="handleNavClick"
      @export-data="handleExportData"
      @import-data="handleImportClick"
      @open-help="handleOpenHelp"
    />
    <main class="main-content">
      <RouterView />
    </main>
    <input 
      ref="fileInput"
      type="file" 
      accept=".json"
      style="display: none"
      @change="handleFileChange"
    />
    
    <!-- 帮助弹窗 -->
    <div v-if="showHelpModal" class="modal-overlay" @click="closeHelpModal">
      <div class="help-modal" @click.stop>
        <div class="help-modal-header">
          <span class="header-decoration">🌺</span>
          <h2>👋 欢迎使用 Work Copilot</h2>
          <span class="header-decoration">🌸</span>
          <button class="close-btn" @click="closeHelpModal">×</button>
        </div>
        <div class="help-modal-body">
          <div class="help-section">
            <div class="section-icon">🛡️</div>
            <div class="section-content">
              <h3>数据安全</h3>
              <p>所有数据都存储在浏览器的本地数据库（IndexedDB）中，<strong>不会上传到任何服务器</strong>，请放心使用！</p>
            </div>
          </div>
          <div class="help-section">
            <div class="section-icon">📅</div>
            <div class="section-content">
              <h3>排期管理</h3>
              <p>在排期表中，你可以创建、编辑和删除任务，支持跨天任务展示。</p>
            </div>
          </div>
          <div class="help-section">
            <div class="section-icon">📝</div>
            <div class="section-content">
              <h3>备忘录</h3>
              <p>快速记录重要事项，支持搜索功能。</p>
            </div>
          </div>
          <div class="help-section">
            <div class="section-icon">💾</div>
            <div class="section-content">
              <h3>数据备份</h3>
              <p>使用侧边栏底部的导出/导入功能，可以备份和恢复你的数据。</p>
            </div>
          </div>
        </div>
        <div class="help-modal-footer">
          <button class="confirm-btn" @click="closeHelpModal">
            <span class="btn-icon">✓</span>
            我知道了
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.layout-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

/* 可爱的背景装饰 */
.bg-decoration {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
  
  .deco {
    position: absolute;
    font-size: 40px;
    opacity: 0.15;
    animation: float 6s ease-in-out infinite;
    
    &.deco-1 {
      top: 10%;
      right: 5%;
      animation-delay: 0s;
    }
    
    &.deco-2 {
      top: 30%;
      right: 15%;
      animation-delay: 1s;
    }
    
    &.deco-3 {
      top: 60%;
      right: 8%;
      animation-delay: 2s;
    }
    
    &.deco-4 {
      top: 80%;
      right: 20%;
      animation-delay: 3s;
    }
    
    &.deco-5 {
      top: 45%;
      right: 25%;
      animation-delay: 4s;
    }
  }
}

.main-content {
  flex: 1;
  margin-left: 220px;
  overflow: auto;
  position: relative;
  z-index: 1;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(93, 64, 55, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.help-modal {
  background: linear-gradient(145deg, #FFFFFF 0%, #FFFDE7 100%);
  border-radius: 24px;
  width: 90%;
  max-width: 520px;
  overflow: hidden;
  border: 5px solid #8D6E63;
  box-shadow: 0 8px 0 #6D4C41, 0 15px 30px rgba(0, 0, 0, 0.2);
}

.help-modal-header {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 22px 20px;
  border-bottom: 4px dashed #A1887F;
  background: linear-gradient(135deg, #FFB74D 0%, #FF8A65 100%);
  color: white;
  position: relative;
  
  .header-decoration {
    font-size: 24px;
  }
  
  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.1);
  }
}

.close-btn {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  width: 38px;
  height: 38px;
  border: 3px solid white;
  background: rgba(255, 255, 255, 0.3);
  color: white;
  font-size: 26px;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-weight: bold;
  line-height: 1;
  
  &:hover {
    background: white;
    color: #FF8A65;
    transform: translateY(-50%) scale(1.1);
  }
}

.help-modal-body {
  padding: 24px 20px;
  max-height: 55vh;
  overflow-y: auto;
}

.help-section {
  display: flex;
  gap: 16px;
  margin-bottom: 22px;
  background: #FFF8E1;
  padding: 16px;
  border-radius: 16px;
  border: 2px solid #FFE082;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  .section-icon {
    font-size: 32px;
    flex-shrink: 0;
  }
  
  .section-content {
    flex: 1;
    
    h3 {
      font-size: 17px;
      color: #5D4037;
      margin: 0 0 8px 0;
      font-weight: 700;
    }
    
    p {
      font-size: 14px;
      color: #795548;
      line-height: 1.7;
      margin: 0;
    }
  }
}

.help-modal-footer {
  padding: 18px 20px;
  border-top: 4px dashed #A1887F;
  display: flex;
  justify-content: center;
  background: linear-gradient(180deg, transparent 0%, rgba(255, 235, 59, 0.2) 100%);
}

.confirm-btn {
  padding: 14px 36px;
  background: linear-gradient(135deg, #81C784 0%, #4CAF50 100%);
  color: white;
  border: 3px solid #2E7D32;
  border-radius: 18px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 0 #2E7D32;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 0 #2E7D32;
    background: linear-gradient(135deg, #66BB6A 0%, #43A047 100%);
  }
  
  &:active {
    transform: translateY(2px);
    box-shadow: 0 2px 0 #2E7D32;
  }
  
  .btn-icon {
    font-size: 18px;
  }
}

/* 自定义滚动条 */
.help-modal-body::-webkit-scrollbar {
  width: 10px;
}

.help-modal-body::-webkit-scrollbar-track {
  background: rgba(255, 248, 225, 0.5);
  border-radius: 5px;
}

.help-modal-body::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #FFB74D 0%, #FF8A65 100%);
  border-radius: 5px;
  border: 2px solid rgba(255, 255, 255, 0.5);
}
</style>
