<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { db, type Memo } from '@/db'

const router = useRouter()
const memos = ref<Memo[]>([])
const searchQuery = ref('')

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

const goToDetail = (id: string) => {
  router.push(`/memo/${id}`)
}

const goToCreate = () => {
  router.push('/memo/edit/new')
}

const deleteMemo = async (id: string) => {
  await db.memos.delete(id)
  await loadMemos()
}

onMounted(loadMemos)
</script>

<template>
  <div class="memo-container">
    <div class="page-header">
      <h1>备忘录</h1>
      <button class="create-btn" @click="goToCreate">新建备忘录</button>
    </div>
    
    <div class="search-bar">
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
        @click="goToDetail(memo.id)"
      >
        <h3 class="memo-title">{{ memo.title }}</h3>
        <button class="delete-btn" @click.stop="deleteMemo(memo.id)">删除</button>
      </div>
      
      <div v-if="filteredMemos.length === 0" class="empty-state">
        <p>{{ searchQuery ? '未找到匹配的备忘录' : '暂无备忘录，点击上方按钮添加' }}</p>
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
</style>
