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
    alert('请输入任务标题~')
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
        <button class="mode-btn" :class="{ active: viewMode === 'day' }" @click="viewMode = 'day'">
          <span class="btn-emoji">📅</span>日视图
        </button>
        <button class="mode-btn" :class="{ active: viewMode === 'week' }" @click="viewMode = 'week'">
          <span class="btn-emoji">🗓️</span>周视图
        </button>
      </div>
      <div class="header-right">
        <button class="icon-btn" @click="prev">◀</button>
        <button class="today-btn" @click="goToToday">
          <span class="btn-star">⭐</span>今天
        </button>
        <button class="icon-btn" @click="next">▶</button>
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
            <span v-if="isToday(date)" class="today-badge">今天！</span>
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
              <span v-if="task.completed" class="complete-mark">✓</span>
            </div>
            
            <div v-if="tasksByDate[date].length === 0" class="empty-state">
              <span class="empty-emoji">🌱</span>
              <span>暂无任务~</span>
              <span class="empty-hint">来添加新任务吧！</span>
            </div>
          </div>
          
          <button class="add-task-btn" @click="openCreateModal(date)">
            <span class="plus-icon">➕</span>
            添加任务
          </button>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <span class="modal-decoration">✨</span>
          <h2>{{ editingTask ? '编辑任务' : '新建任务' }}</h2>
          <button class="close-btn" @click="closeModal">×</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>📝 任务标题 *</label>
            <input
              v-model="newTask.title"
              type="text"
              placeholder="要做什么呢？"
              class="cute-input"
            />
          </div>

          <div class="form-group">
            <label>💭 详细内容</label>
            <textarea
              v-model="newTask.content"
              placeholder="还有什么补充的吗~"
              class="cute-textarea"
            ></textarea>
          </div>

          <div class="form-group">
            <label>📆 日期 *</label>
            <input
              v-model="newTask.date"
              type="date"
              class="cute-input"
            />
          </div>
        </div>

        <div class="modal-footer">
          <button v-if="editingTask" class="delete-btn" @click="deleteTask">
            <span class="btn-emoji">🗑️</span>删除
          </button>
          <button class="cancel-btn" @click="closeModal">
            <span class="btn-emoji">✖️</span>取消
          </button>
          <button class="save-btn" @click="saveTask">
            <span class="btn-emoji">💾</span>保存
          </button>
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
  box-sizing: border-box;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 10px 18px;
  background: linear-gradient(145deg, #FFFFFF 0%, #FFFDE7 100%);
  border-radius: 16px;
  border: 3px solid #8D6E63;
  box-shadow: 0 4px 0 #6D4C41, 0 8px 16px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  
  .header-decoration {
    font-size: 24px;
    animation: bounce-soft 2s ease-in-out infinite;
  }
  
  h1 {
    font-size: 20px;
    color: #5D4037;
    font-weight: 700;
    margin: 0;
  }
}

.header-center {
  display: flex;
  gap: 8px;
  background: #FFF8E1;
  padding: 4px;
  border-radius: 12px;
  border: 2px solid #FFE082;
}

.mode-btn {
  padding: 6px 14px;
  border: 2px solid transparent;
  background: transparent;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  color: #795548;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 5px;

  .btn-emoji {
    font-size: 14px;
  }

  &.active {
    background: linear-gradient(135deg, #81C784 0%, #4CAF50 100%);
    color: white;
    border-color: #2E7D32;
    box-shadow: 0 3px 0 #2E7D32;
  }

  &:hover:not(.active) {
    background: rgba(255, 224, 130, 0.4);
    transform: translateY(-2px);
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon-btn {
  width: 38px;
  height: 38px;
  border: 2px solid #8D6E63;
  background: linear-gradient(145deg, #FFF8E1 0%, #FFE082 100%);
  border-radius: 12px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  color: #5D4037;
  box-shadow: 0 2px 0 #6D4C41;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 0 #6D4C41;
    background: linear-gradient(145deg, #FFE082 0%, #FFCA28 100%);
  }
  
  &:active {
    transform: translateY(1px);
    box-shadow: 0 1px 0 #6D4C41;
  }
}

.today-btn {
  padding: 8px 16px;
  border: 2px solid #2E7D32;
  background: linear-gradient(135deg, #81C784 0%, #4CAF50 100%);
  color: white;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 0 #2E7D32;
  display: flex;
  align-items: center;
  gap: 5px;

  .btn-star {
    font-size: 16px;
    animation: sparkle 1.5s ease-in-out infinite;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 0 #2E7D32;
    background: linear-gradient(135deg, #66BB6A 0%, #43A047 100%);
  }
  
  &:active {
    transform: translateY(1px);
    box-shadow: 0 1px 0 #2E7D32;
  }
}

.content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.tasks-grid {
  display: flex;
  gap: 18px;
  flex: 1;
  overflow-x: auto;
  padding-bottom: 10px;
  
  &::-webkit-scrollbar {
    height: 12px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 6px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #FFB74D 0%, #FF8A65 100%);
    border-radius: 6px;
    border: 2px solid rgba(255, 255, 255, 0.5);
  }
}

.day-column {
  flex: 1;
  min-width: 300px;
  background: linear-gradient(145deg, #FFFFFF 0%, #FFFDE7 100%);
  border-radius: 20px;
  border: 4px solid #8D6E63;
  box-shadow: 0 5px 0 #6D4C41, 0 10px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &.today-column {
    border-color: #FF8A65;
    box-shadow: 0 5px 0 #E64A19, 0 10px 25px rgba(255, 138, 101, 0.3);
  }
}

.day-header {
  padding: 12px 16px;
  background: linear-gradient(135deg, #FFF8E1 0%, #FFE082 100%);
  border-bottom: 3px dashed #A1887F;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  position: relative;

  &.today-header {
    background: linear-gradient(135deg, #FFB74D 0%, #FF8A65 100%);
    
    .day-of-week,
    .date-label {
      color: white;
    }
    
    .today-badge {
      background: #FFEB3B;
      color: #5D4037;
      border: 2px solid #FFC107;
    }
  }
}

.day-emoji {
  font-size: 24px;
  animation: float 3s ease-in-out infinite;
}

.day-of-week {
  font-size: 15px;
  font-weight: 700;
  color: #5D4037;
}

.date-label {
  font-size: 12px;
  color: #795548;
}

.today-badge {
  position: absolute;
  top: 6px;
  right: 10px;
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
  background: #81C784;
  color: white;
  border: 2px solid #4CAF50;
  animation: sparkle 2s ease-in-out infinite;
}

.task-list {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-item {
  padding: 14px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  border: 3px solid rgba(255, 255, 255, 0.5);
  position: relative;

  &:hover {
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
  }

  &.task-completed {
    opacity: 0.7;
    
    .task-title {
      text-decoration: line-through;
    }
    
    .complete-mark {
      display: block;
    }
  }
}

.complete-mark {
  display: none;
  font-size: 24px;
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  animation: bounce-soft 0.5s ease-out;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding-top: 3px;
}

.task-checkbox {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  appearance: none;
  border: 3px solid rgba(255, 255, 255, 0.9);
  cursor: pointer;
  position: relative;
  background: rgba(255, 255, 255, 0.25);
  transition: all 0.2s;
  flex-shrink: 0;

  &:checked {
    background-color: rgba(255, 255, 255, 0.95);
    border-color: rgba(255, 255, 255, 0.95);

    &::after {
      content: '✓';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 16px;
      font-weight: bold;
      color: #4CAF50;
    }
  }

  &:hover {
    background: rgba(255, 255, 255, 0.4);
    transform: scale(1.1);
  }
}

.task-info {
  flex: 1;
  min-width: 0;
}

.task-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 5px;
}

.task-content {
  font-size: 13px;
  opacity: 0.9;
}

.empty-state {
  text-align: center;
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  
  .empty-emoji {
    font-size: 40px;
    animation: float 2s ease-in-out infinite;
  }
  
  span:nth-child(2) {
    color: #8D6E63;
    font-size: 15px;
    font-weight: 600;
  }
  
  .empty-hint {
    color: #A1887F;
    font-size: 13px;
  }
}

.add-task-btn {
  margin: 0 15px 15px 15px;
  padding: 14px 20px;
  background: linear-gradient(145deg, #FFF8E1 0%, #FFE082 100%);
  border: 3px dashed #8D6E63;
  border-radius: 16px;
  color: #5D4037;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  .plus-icon {
    font-size: 18px;
  }

  &:hover {
    background: linear-gradient(145deg, #FFE082 0%, #FFCA28 100%);
    transform: translateY(-2px);
    border-style: solid;
  }
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

.modal-content {
  background: linear-gradient(145deg, #FFFFFF 0%, #FFFDE7 100%);
  border-radius: 24px;
  width: 90%;
  max-width: 520px;
  overflow: hidden;
  border: 5px solid #8D6E63;
  box-shadow: 0 8px 0 #6D4C41, 0 15px 30px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-bottom: 4px dashed #A1887F;
  background: linear-gradient(135deg, #FFB74D 0%, #FF8A65 100%);
  color: white;
  position: relative;
  
  .modal-decoration {
    font-size: 26px;
    animation: sparkle 1.5s ease-in-out infinite;
  }

  h2 {
    font-size: 20px;
    font-weight: 700;
    margin: 0;
    text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.1);
  }
}

.close-btn {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
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

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;

  label {
    display: block;
    font-size: 15px;
    font-weight: 600;
    color: #5D4037;
    margin-bottom: 8px;
  }
}

.cute-input,
.cute-textarea {
  width: 100%;
  padding: 14px 16px;
  border: 3px solid #8D6E63;
  border-radius: 14px;
  font-size: 15px;
  font-family: inherit;
  outline: none;
  transition: all 0.2s;
  background: #FFF8E1;
  color: #5D4037;
  box-sizing: border-box;

  &::placeholder {
    color: #A1887F;
  }

  &:focus {
    border-color: #FF8A65;
    box-shadow: 0 0 0 5px rgba(255, 138, 101, 0.2);
    transform: scale(1.02);
    background: #FFFFFF;
  }
}

.cute-textarea {
  min-height: 120px;
  resize: vertical;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 18px 24px;
  border-top: 4px dashed #A1887F;
  background: linear-gradient(180deg, transparent 0%, rgba(255, 235, 59, 0.2) 100%);
}

.modal-footer button {
  padding: 12px 24px;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  border: 3px solid;
  
  .btn-emoji {
    font-size: 18px;
  }
}

.cancel-btn {
  background: linear-gradient(145deg, #FFF8E1 0%, #FFE082 100%);
  color: #5D4037;
  border-color: #8D6E63;
  box-shadow: 0 3px 0 #6D4C41;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 0 #6D4C41;
  }
  
  &:active {
    transform: translateY(1px);
    box-shadow: 0 1px 0 #6D4C41;
  }
}

.save-btn {
  background: linear-gradient(135deg, #81C784 0%, #4CAF50 100%);
  color: white;
  border-color: #2E7D32;
  box-shadow: 0 3px 0 #2E7D32;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 0 #2E7D32;
    background: linear-gradient(135deg, #66BB6A 0%, #43A047 100%);
  }
  
  &:active {
    transform: translateY(1px);
    box-shadow: 0 1px 0 #2E7D32;
  }
}

.delete-btn {
  background: linear-gradient(135deg, #EF9A9A 0%, #EF5350 100%);
  color: white;
  border-color: #C62828;
  box-shadow: 0 3px 0 #C62828;
  margin-right: auto;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 0 #C62828;
    background: linear-gradient(135deg, #E57373 0%, #F44336 100%);
  }
  
  &:active {
    transform: translateY(1px);
    box-shadow: 0 1px 0 #C62828;
  }
}
</style>
