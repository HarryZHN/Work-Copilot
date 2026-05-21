<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db, type Memo } from '@/db'

const route = useRoute()
const router = useRouter()
const memo = ref<Memo | null>(null)
const showContent = ref(false)
const copied = ref(false)

const loadMemo = async () => {
  const id = route.params.id as string
  if (id === 'new') {
    router.push('/memo')
    return
  }
  const result = await db.memos.get(id)
  memo.value = result || null
}

const toggleContent = () => {
  showContent.value = !showContent.value
}

const copyAll = async () => {
  if (!memo.value) return
  const text = memo.value.title + '\n' + memo.value.content
  await navigator.clipboard.writeText(text)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

const goBack = () => {
  router.push('/memo')
}

const goToEdit = () => {
  if (memo.value) {
    router.push(`/memo/edit/${memo.value.id}`)
  }
}

onMounted(loadMemo)
</script>

<template>
  <div class="memo-detail-container">
    <div class="page-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <button class="edit-btn" @click="goToEdit">编辑</button>
    </div>
    
    <div v-if="memo" class="memo-detail">
      <h1 class="memo-title">{{ memo.title }}</h1>
      
      <div class="content-section">
        <div class="content-header">
          <span class="content-label">内容</span>
          <button class="toggle-btn" @click="toggleContent">
            {{ showContent ? '隐藏' : '显示' }}
          </button>
        </div>
        
        <div class="content-body">
          <p v-if="showContent" class="content-text">{{ memo.content || '无内容' }}</p>
          <p v-else class="content-hidden">••••••</p>
        </div>
        
        <button 
          class="copy-btn" 
          @click="copyAll"
          :class="{ copied: copied }"
        >
          {{ copied ? '已复制' : '复制全部内容' }}
        </button>
      </div>
    </div>
    
    <div v-else class="loading-state">
      <p>加载中...</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.memo-detail-container {
  padding: 24px;
  min-height: 100%;
}

.page-header {
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
}

.back-btn,
.edit-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn {
  background-color: #f5f5f5;
  color: #333;

  &:hover {
    background-color: #e8e8e8;
  }
}

.edit-btn {
  background-color: #3498db;
  color: white;

  &:hover {
    background-color: #2980b9;
  }
}

.memo-detail {
  background: white;
  padding: 32px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.memo-title {
  font-size: 22px;
  color: #2c3e50;
  margin: 0 0 24px 0;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.content-section {
  margin-top: 16px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.content-label {
  font-size: 14px;
  color: #7f8c8d;
  font-weight: 500;
}

.toggle-btn {
  padding: 4px 12px;
  background-color: #f5f5f5;
  color: #3498db;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #e8e8e8;
  }
}

.content-body {
  min-height: 100px;
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 16px;
}

.content-text {
  font-size: 14px;
  color: #333;
  line-height: 1.8;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.content-hidden {
  font-size: 18px;
  color: #999;
  text-align: center;
  line-height: 100px;
  margin: 0;
}

.copy-btn {
  padding: 8px 20px;
  background-color: #27ae60;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #2ecc71;
  }

  &.copied {
    background-color: #95a5a6;
  }
}

.loading-state {
  text-align: center;
  padding: 100px 20px;
  color: #999;
}
</style>
