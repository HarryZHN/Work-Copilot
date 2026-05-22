<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { db, type Memo } from '@/db'

const memos = ref<Memo[]>([])
const searchQuery = ref('')
const showModal = ref(false)
const editingMemo = ref<Memo | null>(null)
const newMemo = ref({
  title: '',
  content: ''
})

const filteredMemos = computed(() => {
  if (!searchQuery.value.trim()) {
    return memos.value
  }
  const query = searchQuery.value.toLowerCase()
  return memos.value.filter(memo => 
    memo.title.toLowerCase().includes(query) || 
    memo.content.toLowerCase().includes(query)
  )
})

const loadMemos = async () => {
  memos.value = await db.memos.toArray()
  memos.value.reverse()
}

const openDetail = (memo: Memo) => {
  editingMemo.value = memo
  newMemo.value = {
    title: memo.title,
    content: memo.content
  }
  showModal.value = true
}

const openCreate = () => {
  editingMemo.value = null
  newMemo.value = {
    title: '',
    content: ''
  }
  showModal.value = true
}

const saveMemo = async () => {
  if (!newMemo.value.title.trim()) {
    alert('请输入标题')
    return
  }
  
  // 创建一个纯对象，确保不包含 Vue 响应式属性
  const memo = {
    id: editingMemo.value?.id || Date.now().toString(),
    title: newMemo.value.title.trim(),
    content: newMemo.value.content
  }
  
  await db.memos.put(memo)
  await loadMemos()
  showModal.value = false
}

const deleteMemo = async (id: string) => {
  await db.memos.delete(id)
  await loadMemos()
}

const closeModal = () => {
  showModal.value = false
  editingMemo.value = null
}

onMounted(loadMemos)
</script>

<template>
  <div class="memo-container">
    <div class="page-header">
      <button class="create-btn" @click="openCreate">新建备忘录</button>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索标题或内容..."
        class="search-input"
      />
    </div>
    
    
    <div class="memo-list">
      <div
        v-for="memo in filteredMemos"
        :key="memo.id"
        class="memo-card"
        @click="openDetail(memo)"
      >
        <h3 class="memo-title">{{ memo.title }}</h3>
        <button class="delete-btn" @click.stop="deleteMemo(memo.id)">删除</button>
      </div>
      
      <div v-if="filteredMemos.length === 0" class="empty-state">
        <p>{{ searchQuery ? '未找到匹配的备忘录' : '暂无备忘录，点击上方按钮添加' }}</p>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ editingMemo ? '编辑备忘录' : '新建备忘录' }}</h2>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label>标题 *</label>
            <input
              v-model="newMemo.title"
              type="text"
              placeholder="请输入标题"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label>内容</label>
            <textarea
              v-model="newMemo.content"
              placeholder="请输入内容（可选）"
              class="form-textarea"
            ></textarea>
          </div>
        </div>
        
        <div class="modal-footer">
          <button v-if="editingMemo" class="delete-btn" @click="deleteMemo(editingMemo.id); closeModal()">删除</button>
          <button class="cancel-btn" @click="closeModal">取消</button>
          <button class="save-btn" @click="saveMemo">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.memo-container {
  padding: 24px;
  min-height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  font-size: 24px;
  color: #2c3e50;
}

.create-btn {
  padding: 8px 16px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #2980b9;
  }
}

.search-bar {
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  max-width: 400px;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #3498db;
  }
}

.memo-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.memo-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }
}

.memo-title {
  font-size: 15px;
  font-weight: 500;
  color: #2c3e50;
  margin: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-btn {
  padding: 4px 10px;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-left: 12px;

  &:hover {
    background-color: #c0392b;
  }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
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

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  font-size: 18px;
  color: #2c3e50;
  margin: 0;
}

.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #666;
  }
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 6px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #3498db;
  }
}

.form-textarea {
  min-height: 150px;
  resize: vertical;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #eee;
}

.modal-footer button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #333;

  &:hover {
    background-color: #e8e8e8;
  }
}

.save-btn {
  background-color: #3498db;
  color: white;

  &:hover {
    background-color: #2980b9;
  }
}

.modal-footer .delete-btn {
  margin-left: 0;
}
</style>
