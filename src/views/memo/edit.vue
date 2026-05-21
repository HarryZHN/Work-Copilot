<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '@/db'

const route = useRoute()
const router = useRouter()
const title = ref('')
const content = ref('')
const isNew = ref(false)

const loadMemo = async () => {
  const id = route.params.id as string
  if (id === 'new') {
    isNew.value = true
    return
  }
  const memo = await db.memos.get(id)
  if (memo) {
    title.value = memo.title
    content.value = memo.content
  }
}

const saveMemo = async () => {
  if (!title.value.trim()) {
    alert('请输入标题')
    return
  }
  
  const id = isNew.value ? Date.now().toString() : (route.params.id as string)
  
  await db.memos.put({
    id,
    title: title.value.trim(),
    content: content.value
  })
  
  router.push('/memo')
}

const goBack = () => {
  router.push('/memo')
}

onMounted(loadMemo)
</script>

<template>
  <div class="memo-edit-container">
    <div class="page-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <button class="save-btn" @click="saveMemo">保存</button>
    </div>
    
    <div class="memo-form">
      <div class="form-group">
        <label class="form-label">标题 *</label>
        <input
          v-model="title"
          type="text"
          placeholder="请输入标题"
          class="form-input"
        />
      </div>
      
      <div class="form-group">
        <label class="form-label">内容</label>
        <textarea
          v-model="content"
          placeholder="请输入内容（可选）"
          class="form-textarea"
        ></textarea>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.memo-edit-container {
  padding: 24px;
  min-height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.back-btn,
.save-btn {
  padding: 8px 20px;
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

.save-btn {
  background-color: #3498db;
  color: white;

  &:hover {
    background-color: #2980b9;
  }
}

.memo-form {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  max-width: 600px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #3498db;
  }
}

.form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  min-height: 200px;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #3498db;
  }
}
</style>
