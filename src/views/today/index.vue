<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { db, type TodayTask } from '@/db'
import { formatDate, parseDate } from '@/utils/date'
import { getTaskColor, getTaskTextColor } from '@/utils/color'

type ViewMode = 'day' | 'week'

const viewMode = ref<ViewMode>('day')
const currentDate = ref(new Date())
const todayTasks = ref<TodayTask[]>([])
const showModal = ref(false)
const editingTask = ref<TodayTask | null>(null)
const newTask = ref({
  title: '',
  content: '',
  date: ''
})

const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六']

const displayDates = computed(() => {
  if (viewMode.value === 'day') {
    return [formatDate(currentDate.value)]
  } else {
    const dates: string[] = []
    const day = currentDate.value.getDay()
    const start = new Date(currentDate.value)
    start.setDate(start.getDate() - day)
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      dates.push(formatDate(d))
    }
    return dates
  }
})

const displayTitle = computed(() => {
  if (viewMode.value === 'day') {
    const d = currentDate.value
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 周${WEEK_DAYS[d.getDay()]}`
  } else {
    const start = parseDate(displayDates.value[0])
    const end = parseDate(displayDates.value[6])
    return `${start.getMonth() + 1}月${start.getDate()}日 - ${end.getMonth() + 1}月${end.getDate()}日`
  }
})

const tasksByDate = computed(() => {
  const map: Record<string, TodayTask[]> = {}
  displayDates.value.forEach(date => {
    map[date] = todayTasks.value.filter(task => task.date === date)
  })
  return map
})

const loadTasks = async () => {
  todayTasks.value = await db.todayTasks.toArray()
}

const toggleComplete = async (id: string) => {
  const task = todayTasks.value.find(t => t.id === id)
  if (task) {
    const updatedTask = {
      ...task,
      completed: !task.completed
    }
    await db.todayTasks.put(updatedTask)
    task.completed = updatedTask.completed
  }
}

const openEditModal = (id: string) => {
  const task = todayTasks.value.find(t => t.id === id)
  if (!task) return
  editingTask.value = task
  newTask.value = {
    title: task.title,
    content: task.content,
    date: task.date
  }
  showModal.value = true
}

const openCreateModal = (dateStr?: string) => {
  const today = dateStr || formatDate(currentDate.value)
  editingTask.value = null
  newTask.value = {
    title: '',
    content: '',
    date: today
  }
  showModal.value = true
}

const saveTask = async () => {
  if (!newTask.value.title.trim()) {
    alert('请输入任务标题')
    return
  }
  const task = {
    id: editingTask.value?.id || Date.now().toString(),
    title: newTask.value.title.trim(),
    content: newTask.value.content,
    date: newTask.value.date,
    completed: editingTask.value?.completed || false
  }
  await db.todayTasks.put(task)
  await loadTasks()
  showModal.value = false
}

const deleteTask = async () => {
  if (!editingTask.value) return
  await db.todayTasks.delete(editingTask.value.id)
  await loadTasks()
  showModal.value = false
}

const closeModal = () => {
  showModal.value = false
  editingTask.value = null
}

const prev = () => {
  if (viewMode.value === 'day') {
    currentDate.value.setDate(currentDate.value.getDate() - 1)
  } else {
    currentDate.value.setDate(currentDate.value.getDate() - 7)
  }
  currentDate.value = new Date(currentDate.value)
}

const next = () => {
  if (viewMode.value === 'day') {
    currentDate.value.setDate(currentDate.value.getDate() + 1)
  } else {
    currentDate.value.setDate(currentDate.value.getDate() + 7)
  }
  currentDate.value = new Date(currentDate.value)
}

const goToToday = () => {
  currentDate.value = new Date()
}

const isToday = (dateStr: string) => {
  return dateStr === formatDate(new Date())
}

const getDayOfWeek = (dateStr: string) => {
  return WEEK_DAYS[parseDate(dateStr).getDay()]
}

const getDateLabel = (dateStr: string) => {
  const d = parseDate(dateStr)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

onMounted(loadTasks)
</script>

<template>
  <div class="today-container">
    <div class="header">
      <div class="header-left">

      </div>
      <div class="header-center">
        <button class="mode-btn" :class="{ active: viewMode === 'day' }" @click="viewMode = 'day'">日视图</button>
        <button class="mode-btn" :class="{ active: viewMode === 'week' }" @click="viewMode = 'week'">周视图</button>
      </div>
      <div class="header-right">
        <button class="icon-btn" @click="prev">&lt;</button>
        <button class="today-btn" @click="goToToday">今天</button>
        <button class="icon-btn" @click="next">&gt;</button>
      </div>
    </div>

    <div class="content">
      

      <div class="tasks-grid">
        <div
          v-for="date in displayDates"
          :key="date"
          class="day-column"
          :class="{ 'today-column': isToday(date) }"
        >
          <div class="day-header" :class="{ 'today-header': isToday(date) }">
            <span class="day-of-week">周{{ getDayOfWeek(date) }}</span>
            <span class="date-label">{{ getDateLabel(date) }}</span>
          </div>
          
          <div class="task-list">
            <div
              v-for="task in tasksByDate[date]"
              :key="task.id"
              class="task-item"
              :class="{ 'task-completed': task.completed }"
              :style="{ backgroundColor: getTaskColor(task.id, task.completed) }"
              @click="openEditModal(task.id)"
            >
              <label class="checkbox-wrapper">
                <input
                  type="checkbox"
                  :checked="task.completed"
                  @click.stop="toggleComplete(task.id)"
                  class="task-checkbox"
                />
              </label>
              <div class="task-info">
                <div class="task-title" :style="{ color: getTaskTextColor(getTaskColor(task.id, task.completed)) }">
                  {{ task.title }}
                </div>
                <div v-if="task.content" class="task-content" :style="{ color: getTaskTextColor(getTaskColor(task.id, task.completed)) }">
                  {{ task.content }}
                </div>
              </div>
            </div>
            
            <div v-if="tasksByDate[date].length === 0" class="empty-state">
              <span>暂无任务</span>
            </div>
          </div>
          
          <button class="add-task-btn" @click="openCreateModal(date)">+ 添加任务</button>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ editingTask ? '编辑任务' : '新建任务' }}</h2>
          <button class="close-btn" @click="closeModal">×</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>任务标题 *</label>
            <input
              v-model="newTask.title"
              type="text"
              placeholder="请输入任务标题"
            />
          </div>

          <div class="form-group">
            <label>详细内容</label>
            <textarea
              v-model="newTask.content"
              placeholder="请输入详细内容（可选）"
            ></textarea>
          </div>

          <div class="form-group">
            <label>日期 *</label>
            <input
              v-model="newTask.date"
              type="date"
            />
          </div>
        </div>

        <div class="modal-footer">
          <button v-if="editingTask" class="delete-btn" @click="deleteTask">删除</button>
          <button class="cancel-btn" @click="closeModal">取消</button>
          <button class="save-btn" @click="saveTask">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.today-container {
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
  box-sizing: border-box;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.header-left h1 {
  font-size: 24px;
  color: #1a1a1a;
  font-weight: 600;
  margin: 0;
}

.header-center {
  display: flex;
  gap: 8px;
  background-color: #e8e8e8;
  padding: 4px;
  border-radius: 8px;
}

.mode-btn {
  padding: 6px 16px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;

  &.active {
    background-color: #3498db;
    color: white;
  }

  &:hover:not(.active) {
    background-color: #d8d8d8;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border: none;
  background-color: white;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f0f0f0;
  }
}

.today-btn {
  padding: 8px 16px;
  border: none;
  background-color: #3b82f6;
  color: white;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #2563eb;
  }
}

.content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.date-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-shrink: 0;

  h2 {
    font-size: 20px;
    color: #1a1a1a;
    margin: 0;
    font-weight: 600;
  }
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

.tasks-grid {
  display: flex;
  gap: 16px;
  flex: 1;
  overflow-x: auto;
  padding-bottom: 8px;
}

.day-column {
  flex: 1;
  min-width: 280px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &.today-column {
    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.2);
  }
}

.day-header {
  padding: 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  gap: 4px;

  &.today-header {
    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
    
    .day-of-week,
    .date-label {
      color: white;
    }
  }
}

.day-of-week {
  font-size: 14px;
  font-weight: 600;
  color: #666;
}

.date-label {
  font-size: 12px;
  color: #999;
}

.task-list {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-item {
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: flex-start;
  gap: 10px;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &.task-completed {
    opacity: 0.7;
  }
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding-top: 2px;
}

.task-checkbox {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  appearance: none;
  border: 2px solid rgba(255, 255, 255, 0.9);
  cursor: pointer;
  position: relative;
  background: rgba(255, 255, 255, 0.2);
  transition: all 0.2s;
  flex-shrink: 0;

  &:checked {
    background-color: rgba(255, 255, 255, 0.9);
    border-color: rgba(255, 255, 255, 0.9);

    &::after {
      content: '✓';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 12px;
      font-weight: bold;
      color: #333;
    }
  }

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}

.task-info {
  flex: 1;
  min-width: 0;
}

.task-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.task-content {
  font-size: 12px;
  opacity: 0.9;
}

.empty-state {
  text-align: center;
  padding: 24px 16px;
  color: #999;
  font-size: 14px;
}

.add-task-btn {
  margin: 0 12px 12px 12px;
  padding: 10px 16px;
  background: #f8f9fa;
  border: 1px dashed #d8d8d8;
  border-radius: 8px;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f0f0f0;
    border-color: #bbb;
  }
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
  color: #1a1a1a;
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
  color: #1a1a1a;
  margin-bottom: 6px;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;

  &:focus {
    border-color: #3b82f6;
  }
}

.form-group textarea {
  min-height: 100px;
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
  background-color: #f0f0f0;
  color: #1a1a1a;

  &:hover {
    background-color: #e8e8e8;
  }
}

.save-btn {
  background-color: #3b82f6;
  color: white;

  &:hover {
    background-color: #2563eb;
  }
}

.delete-btn {
  background-color: #ef4444;
  color: white;
  margin-right: auto;

  &:hover {
    background-color: #dc2626;
  }
}
</style>
