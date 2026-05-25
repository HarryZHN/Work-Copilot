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
    alert('请输入标题哦~ 📝')
    return
  }
  
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
  if (confirm('确定要删除这个备忘录吗？ 🥺')) {
    await db.memos.delete(id)
    await loadMemos()
  }
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
      <h1 class="page-title">
        <button class="create-btn" @click="openCreate">
          <span class="btn-emoji">➕</span> 新建备忘录
        </button>
      </h1>
      <div class="header-actions">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="🔍 搜索备忘录..."
          class="search-input"
        />
      </div>
    </div>
    
    <div class="memo-list">
      <div
        v-for="memo in filteredMemos"
        :key="memo.id"
        class="memo-card"
        @click="openDetail(memo)"
      >
        <div class="memo-content">
          <h3 class="memo-title">
            <span class="title-emoji">📝</span>
            {{ memo.title }}
          </h3>
          <p class="memo-preview" v-if="memo.content">{{ memo.content.slice(0, 80) }}{{ memo.content.length > 80 ? '...' : '' }}</p>
        </div>
        <button class="delete-btn" @click.stop="deleteMemo(memo.id)">
          <span>🗑️</span>
        </button>
      </div>
      
      <div v-if="filteredMemos.length === 0" class="empty-state">
        <div class="empty-emoji">📭</div>
        <p>{{ searchQuery ? '未找到匹配的备忘录呢~ 换个关键词试试？' : '暂无备忘录，点击上方按钮添加吧！' }}</p>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>
            <span class="header-emoji">{{ editingMemo ? '✏️' : '📝' }}</span>
            {{ editingMemo ? '编辑备忘录' : '新建备忘录' }}
          </h2>
          <button class="close-btn" @click="closeModal">✖️</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label>📌 标题 *</label>
            <input
              v-model="newMemo.title"
              type="text"
              placeholder="给备忘录起个名字吧~"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label>💭 内容</label>
            <textarea
              v-model="newMemo.content"
              placeholder="记录你的想法... (๑•̀ㅂ•́)و✧"
              class="form-textarea"
            ></textarea>
          </div>
        </div>
        
        <div class="modal-footer">
          <button v-if="editingMemo" class="delete-modal-btn" @click="deleteMemo(editingMemo.id); closeModal()">
            <span>🗑️</span> 删除
          </button>
          <button class="cancel-btn" @click="closeModal">
            <span>❌</span> 取消
          </button>
          <button class="save-btn" @click="saveMemo">
            <span>💾</span> 保存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.memo-container {
  padding: 24px;
  min-height: 100%;
  background: linear-gradient(135deg, #FFF8E1 0%, #FFFDE7 50%, #F1F8E9 100%);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title {
  font-size: 28px;
  color: #5D4037;
  margin: 0;
  text-shadow: 2px 2px 0px rgba(255, 255, 255, 0.8);
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.create-btn {
  padding: 12px 20px;
  background: linear-gradient(135deg, #FFB74D 0%, #FF9800 100%);
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 0px #F57C00, 0 6px 12px rgba(255, 152, 0, 0.3);
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 0px #F57C00, 0 8px 16px rgba(255, 152, 0, 0.4);
  }

  &:active {
    transform: translateY(2px);
    box-shadow: 0 2px 0px #F57C00, 0 3px 8px rgba(255, 152, 0, 0.3);
  }
}

.btn-emoji {
  margin-right: 6px;
}

.search-input {
  width: 280px;
  padding: 12px 18px;
  border: 3px dashed #FFCC80;
  border-radius: 20px;
  font-size: 14px;
  outline: none;
  background: rgba(255, 255, 255, 0.9);
  transition: all 0.3s;

  &:focus {
    border-color: #FF8A65;
    box-shadow: 0 0 0 4px rgba(255, 138, 101, 0.2);
  }
}

.memo-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.memo-card {
  background: linear-gradient(145deg, #FFFFFF 0%, #FFF8E1 100%);
  padding: 20px;
  border-radius: 20px;
  border: 3px dashed #FFCC80;
  box-shadow: 0 6px 0px #FFE0B2, 0 8px 20px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 160px;

  &:hover {
    transform: translateY(-4px) rotate(-1deg);
    box-shadow: 0 10px 0px #FFE0B2, 0 14px 24px rgba(0, 0, 0, 0.15);
  }
}

.memo-content {
  flex: 1;
}

.memo-title {
  font-size: 18px;
  font-weight: 600;
  color: #5D4037;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-emoji {
  animation: sparkle 2s ease-in-out infinite;
}

.memo-preview {
  font-size: 14px;
  color: #8D6E63;
  margin: 0;
  line-height: 1.6;
}

.delete-btn {
  margin-top: 12px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #EF9A9A 0%, #E57373 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 3px 0px #C62828;
  transition: all 0.2s;
  align-self: flex-end;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 0px #C62828;
  }

  &:active {
    transform: scale(0.95);
    box-shadow: 0 2px 0px #C62828;
  }
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 80px 20px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 24px;
  border: 3px dashed #C8E6C9;
}

.empty-emoji {
  font-size: 64px;
  margin-bottom: 16px;
  animation: float 3s ease-in-out infinite;
}

.empty-state p {
  font-size: 16px;
  color: #795548;
  margin: 0;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(93, 64, 55, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

.modal-content {
  background: linear-gradient(145deg, #FFFDF7 0%, #FFF8E1 100%);
  border-radius: 24px;
  width: 90%;
  max-width: 520px;
  overflow: hidden;
  border: 4px solid #FFCC80;
  box-shadow: 0 12px 0px #FFE0B2, 0 16px 40px rgba(0, 0, 0, 0.2);
  animation: bounce-soft 0.5s ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #FFE082 0%, #FFCC80 100%);
  border-bottom: 3px dashed #FFB74D;
}

.modal-header h2 {
  font-size: 20px;
  color: #5D4037;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.close-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 1);
    transform: scale(1.1);
  }
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #5D4037;
  margin-bottom: 10px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 14px 18px;
  border: 3px dashed #C8E6C9;
  border-radius: 16px;
  font-size: 15px;
  outline: none;
  background: rgba(255, 255, 255, 0.9);
  transition: all 0.3s;
  font-family: inherit;

  &:focus {
    border-color: #A5D6A7;
    box-shadow: 0 0 0 4px rgba(165, 214, 167, 0.3);
  }
}

.form-textarea {
  min-height: 180px;
  resize: vertical;
  line-height: 1.6;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 3px dashed #FFCC80;
}

.modal-footer button {
  padding: 12px 24px;
  border: none;
  border-radius: 16px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.cancel-btn {
  background: linear-gradient(135deg, #EEEEEE 0%, #E0E0E0 100%);
  color: #616161;
  box-shadow: 0 4px 0px #BDBDBD;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 0px #BDBDBD;
  }

  &:active {
    transform: translateY(2px);
    box-shadow: 0 2px 0px #BDBDBD;
  }
}

.save-btn {
  background: linear-gradient(135deg, #81C784 0%, #66BB6A 100%);
  color: white;
  box-shadow: 0 4px 0px #388E3C;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 0px #388E3C;
  }

  &:active {
    transform: translateY(2px);
    box-shadow: 0 2px 0px #388E3C;
  }
}

.delete-modal-btn {
  background: linear-gradient(135deg, #EF9A9A 0%, #E57373 100%);
  color: white;
  box-shadow: 0 4px 0px #C62828;
  margin-right: auto;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 0px #C62828;
  }

  &:active {
    transform: translateY(2px);
    box-shadow: 0 2px 0px #C62828;
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
}

@keyframes sparkle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}

@keyframes bounce-soft {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
</style>
