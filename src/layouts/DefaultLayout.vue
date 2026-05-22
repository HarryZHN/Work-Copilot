<script setup lang="ts">
import Sidebar from '@/components/Sidebar.vue'
import { useRouter } from 'vue-router'
import { db } from '@/db'
import { ref, onMounted } from 'vue'

const router = useRouter()
const fileInput = ref<HTMLInputElement | null>(null)
const showHelpModal = ref(false)

const navItems = [
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
    
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      memos,
      tasks
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
    
    alert('数据导出成功！')
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
    
    // 导入新数据
    if (importData.memos.length > 0) {
      await db.memos.bulkPut(importData.memos)
    }
    if (importData.tasks.length > 0) {
      await db.tasks.bulkPut(importData.tasks)
    }
    
    alert(`导入成功！\n备忘录: ${importData.memos.length} 条\n排期任务: ${importData.tasks.length} 条`)
    
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
          <h2>👋 欢迎使用 Work Copilot</h2>
          <button class="close-btn" @click="closeHelpModal">×</button>
        </div>
        <div class="help-modal-body">
          <div class="help-section">
            <h3>🛡️ 数据安全</h3>
            <p>所有数据都存储在浏览器的本地数据库（IndexedDB）中，<strong>不会上传到任何服务器</strong>，请放心使用！</p>
          </div>
          <div class="help-section">
            <h3>📅 排期管理</h3>
            <p>在排期表中，你可以创建、编辑和删除任务，支持跨天任务展示。</p>
          </div>
          <div class="help-section">
            <h3>📝 备忘录</h3>
            <p>快速记录重要事项，支持搜索功能。</p>
          </div>
          <div class="help-section">
            <h3>💾 数据备份</h3>
            <p>使用侧边栏底部的导出/导入功能，可以备份和恢复你的数据。</p>
          </div>
        </div>
        <div class="help-modal-footer">
          <button class="confirm-btn" @click="closeHelpModal">我知道了</button>
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
}

.main-content {
  flex: 1;
  margin-left: 200px;
  background-color: #f5f5f5;
  overflow: auto;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.help-modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.help-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  
  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
  }
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 24px;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}

.help-modal-body {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.help-section {
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  h3 {
    font-size: 16px;
    color: #2c3e50;
    margin: 0 0 10px 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  p {
    font-size: 14px;
    color: #666;
    line-height: 1.6;
    margin: 0;
  }
}

.help-modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
}

.confirm-btn {
  padding: 10px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
}
</style>
