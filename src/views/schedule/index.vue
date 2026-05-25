<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { db, type Task } from '@/db';
import { formatDate, getDaysInMonth, getFirstDayOfMonth, addMonths, parseDate, isDateBetween } from '@/utils/date';
import { getTaskColor, getTaskTextColor } from '@/utils/color';

const WEEK_DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const WEEK_EMOJIS = ['☀️', '🌸', '🌿', '🌺', '🍀', '🌻', '🌙'];
const MAX_ROWS = 4;

const currentDate = ref(new Date());
const tasks = ref<Task[]>([]);
const showModal = ref(false);
const editingTask = ref<Task | null>(null);
const calendarWrapper = ref<HTMLElement | null>(null);
const calendarBodyRef = ref<HTMLElement | null>(null);

const newTask = ref({
  title: '',
  content: '',
  startDate: '',
  endDate: ''
});

const year = computed(() => currentDate.value.getFullYear());
const month = computed(() => currentDate.value.getMonth());
const monthName = computed(() => `${year.value}年${month.value + 1}月`);
const daysInMonth = computed(() => getDaysInMonth(year.value, month.value));
const firstDayOfMonth = computed(() => getFirstDayOfMonth(year.value, month.value));

const firstDayOffset = computed(() => firstDayOfMonth.value.getDay());

const taskRowMap = ref<Map<string, number>>(new Map());

function calculateTaskRows() {
  const rowMap = new Map<string, number>();
  const dateTasksMap = new Map<string, Task[]>();
  
  tasks.value.forEach(task => {
    const start = parseDate(task.startDate);
    const end = parseDate(task.endDate);
    const current = new Date(start);
    
    while (current <= end) {
      const dateStr = formatDate(current);
      if (!dateTasksMap.has(dateStr)) {
        dateTasksMap.set(dateStr, []);
      }
      dateTasksMap.get(dateStr)!.push(task);
      current.setDate(current.getDate() + 1);
    }
  });
  
  const sortedDates = Array.from(dateTasksMap.keys()).sort();
  
  sortedDates.forEach(dateStr => {
    const dateTaskList = dateTasksMap.get(dateStr)!;
    const usedRows = new Set<number>();
    
    dateTaskList.forEach(task => {
      if (rowMap.has(task.id)) {
        usedRows.add(rowMap.get(task.id)!);
      }
    });
    
    dateTaskList.forEach(task => {
      if (!rowMap.has(task.id)) {
        for (let row = 1; row <= MAX_ROWS; row++) {
          if (!usedRows.has(row)) {
            rowMap.set(task.id, row);
            usedRows.add(row);
            break;
          }
        }
      }
    });
  });
  
  taskRowMap.value = rowMap;
}

const calendarDays = computed(() => {
  calculateTaskRows();
  
  const days: {
    date: string;
    isCurrentMonth: boolean;
    isToday: boolean;
    dayOfMonth: number;
    tasks: Task[];
  }[] = [];

  const prevMonthLastDay = new Date(year.value, month.value, 0).getDate();
  for (let i = firstDayOffset.value - 1; i >= 0; i--) {
    const date = new Date(year.value, month.value - 1, prevMonthLastDay - i);
    const dateStr = formatDate(date);
    days.push({
      date: dateStr,
      isCurrentMonth: false,
      isToday: isSameDay(date, new Date()),
      dayOfMonth: date.getDate(),
      tasks: getTasksForDate(dateStr)
    });
  }

  for (let i = 1; i <= daysInMonth.value; i++) {
    const date = new Date(year.value, month.value, i);
    const dateStr = formatDate(date);
    days.push({
      date: dateStr,
      isCurrentMonth: true,
      isToday: isSameDay(date, new Date()),
      dayOfMonth: i,
      tasks: getTasksForDate(dateStr)
    });
  }

  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year.value, month.value + 1, i);
    const dateStr = formatDate(date);
    days.push({
      date: dateStr,
      isCurrentMonth: false,
      isToday: isSameDay(date, new Date()),
      dayOfMonth: i,
      tasks: getTasksForDate(dateStr)
    });
  }
  return days;
});

function getTasksForDate(dateStr: string): Task[] {
  return tasks.value.filter(task => 
    isDateBetween(parseDate(dateStr), parseDate(task.startDate), parseDate(task.endDate))
  );
}

function getTaskRow(taskId: string): number {
  return taskRowMap.value.get(taskId) || 1;
}

function isMiddleDay(task: Task, dateStr: string): boolean {
  const start = parseDate(task.startDate);
  const end = parseDate(task.endDate);
  const current = parseDate(dateStr);
  return current > start && current < end;
}


function isSameDay(date1: Date, date2: Date): boolean {
  return formatDate(date1) === formatDate(date2);
}



function scrollToToday() {
  nextTick(() => {
    if (!calendarBodyRef.value) return;
    
    const todayCell = calendarBodyRef.value.querySelector('.today');
    if (todayCell) {
      todayCell.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
}

function prevMonth() {
  currentDate.value = addMonths(currentDate.value, -1);
}

function nextMonth() {
  currentDate.value = addMonths(currentDate.value, 1);
}

function goToToday() {
  currentDate.value = new Date();
  scrollToToday();
}

async function loadTasks() {
  tasks.value = await db.tasks.toArray();
}

async function toggleComplete(id: string) {
  const task = tasks.value.find(t => t.id === id)
  if (task) {
    const updatedTask = {
      ...task,
      completed: !task.completed
    }
    await db.tasks.put(updatedTask)
    task.completed = updatedTask.completed
  }
}

function openEditModal(id: string) {
  const task = tasks.value.find(t => t.id === id);
  if (!task) return;
  editingTask.value = task;
  newTask.value = {
    title: task.title,
    content: task.content,
    startDate: task.startDate,
    endDate: task.endDate
  };
  showModal.value = true;
}

function openCreateModal(dateStr?: string) {
  const today = dateStr || formatDate(new Date());
  editingTask.value = null;
  newTask.value = {
    title: '',
    content: '',
    startDate: today,
    endDate: today
  };
  showModal.value = true;
}

async function saveTask() {
  if (!newTask.value.title.trim()) {
    alert('请输入任务标题~');
    return;
  }
  if (newTask.value.startDate > newTask.value.endDate) {
    alert('结束日期不能早于开始日期哦~');
    return;
  }
  const task = {
    id: editingTask.value?.id || Date.now().toString(),
    title: newTask.value.title.trim(),
    content: newTask.value.content,
    startDate: newTask.value.startDate,
    endDate: newTask.value.endDate,
    completed: editingTask.value?.completed || false
  };
  await db.tasks.put(task);
  await loadTasks();
  showModal.value = false;
}

async function deleteTask() {
  if (!editingTask.value) return;
  await db.tasks.delete(editingTask.value.id);
  await loadTasks();
  showModal.value = false;
}

function closeModal() {
  showModal.value = false;
  editingTask.value = null;
}

onMounted(() => {
  loadTasks();
  scrollToToday();
});
</script>

<template>
  <div class="schedule-container">
    <div class="header">
      <div class="header-left">
        <button class="icon-btn" @click="openCreateModal()">
          <span class="btn-emoji">📅</span>
          新建工作排期
        </button>
      </div>
      <div class="header-center">
        <h1>{{ monthName }}</h1>
      </div>
      <div class="header-right">
        <button class="nav-btn" @click="prevMonth">◀</button>
        <button class="today-btn" @click="goToToday">
          <span class="btn-star">⭐</span>
          今天
        </button>
        <button class="nav-btn" @click="nextMonth">▶</button>
      </div>
    </div>

    <div class="calendar-wrapper" ref="calendarWrapper">
      <div class="calendar-container">
        <div class="week-header">
          <div
            v-for="(day, index) in WEEK_DAYS"
            :key="index"
            class="week-day"
            style="width: 14%"
          >
            <span class="week-emoji">{{ WEEK_EMOJIS[index] }}</span>
            {{ day }}
          </div>
        </div>

        <div class="calendar-body" ref="calendarBodyRef">
          <div class="calendar-grid">
            <div
              v-for="(day, dayIndex) in calendarDays"
              :key="dayIndex"
              class="calendar-cell"
              :class="{
                'other-month': !day.isCurrentMonth,
                'today': day.isToday
              }"
              @click="openCreateModal(day.date)"
            >
              <span class="day-number" :class="{ 'today-number': day.isToday }">
                {{ day.dayOfMonth }}
              </span>
              
              <div class="task-item-wrapper">
                  <template v-for="task in day.tasks" :key="task.id + '-' + day.date">
                    <div
                      v-if="task.startDate === day.date && task.endDate === day.date"
                      class="task-item task-item-one-day"
                      :style="{
                        backgroundColor: getTaskColor(task.id, task.completed),
                        gridRow: getTaskRow(task.id)
                      }"
                      :class="{ 'task-completed': task.completed }"
                      @click.stop="openEditModal(task.id)"
                      :title="task.title"
                    >
                      <input
                        type="checkbox"
                        :checked="task.completed"
                        @click.stop="toggleComplete(task.id)"
                        class="task-checkbox"
                      />
                      <span class="task-title" :style="{ color: getTaskTextColor(getTaskColor(task.id, task.completed)) }">{{ task.title }}</span>
                    </div>
                    <div
                      v-else-if="task.startDate === day.date"
                      class="task-item task-item-start"
                      :style="{
                        backgroundColor: getTaskColor(task.id, task.completed),
                        gridRow: getTaskRow(task.id)
                      }"
                      :class="{ 'task-completed': task.completed }"
                      @click.stop="openEditModal(task.id)"
                      :title="task.title"
                    >
                      <input
                        type="checkbox"
                        :checked="task.completed"
                        @click.stop="toggleComplete(task.id)"
                        class="task-checkbox"
                      />
                      <span class="task-title" :style="{ color: getTaskTextColor(getTaskColor(task.id, task.completed)) }">{{ task.title }}</span>
                    </div>
                    <div
                      v-else-if="isMiddleDay(task, day.date)"
                      class="task-item task-item-middle"
                      :style="{
                        backgroundColor: getTaskColor(task.id, task.completed),
                        gridRow: getTaskRow(task.id)
                      }"
                      @click.stop="openEditModal(task.id)"
                      :title="task.title"
                    ></div>
                    <div
                      v-else-if="task.endDate === day.date"
                      class="task-item task-item-end"
                      :style="{ 
                        backgroundColor: getTaskColor(task.id, task.completed),
                        gridRow: getTaskRow(task.id)
                      }"
                      :class="{ 'task-completed': task.completed }"
                      @click.stop="openEditModal(task.id)"
                      :title="task.title"
                    ></div>
                  </template>
                </div>
            </div>
          </div>
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
              placeholder="要做什么呢~"
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

          <div class="form-row">
            <div class="form-group">
              <label>🚀 开始日期 *</label>
              <input
                v-model="newTask.startDate"
                type="date"
                class="cute-input"
              />
            </div>
            <div class="form-group">
              <label>🏁 结束日期 *</label>
              <input
                v-model="newTask.endDate"
                type="date"
                class="cute-input"
              />
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button v-if="editingTask" class="delete-btn" @click="deleteTask">
            <span class="btn-emoji">🗑️</span>
            删除
          </button>
          <button class="cancel-btn" @click="closeModal">
            <span class="btn-emoji">✖️</span>
            取消
          </button>
          <button class="save-btn" @click="saveTask">
            <span class="btn-emoji">💾</span>
            保存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.schedule-container {
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
  gap: 12px;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
}

.header-decoration {
  font-size: 20px;
  animation: float 3s ease-in-out infinite;
}

.header-center h1 {
  font-size: 18px;
  color: #5D4037;
  font-weight: 700;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon-btn {
  padding: 8px 14px;
  background: linear-gradient(135deg, #81C784 0%, #4CAF50 100%);
  color: white;
  border: 2px solid #2E7D32;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 0 #2E7D32;
  display: flex;
  align-items: center;
  gap: 6px;

  .btn-emoji {
    font-size: 16px;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 0 #2E7D32;
    background: linear-gradient(135deg, #66BB6A 0%, #43A047 100%);
  }

  &:active {
    transform: translateY(1px);
    box-shadow: 0 1px 0 #2E7D32;
  }
}

.nav-btn {
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
  padding: 8px 14px;
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

.calendar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.calendar-container {
  background: linear-gradient(145deg, #FFFFFF 0%, #FFFDE7 100%);
  border-radius: 20px;
  border: 4px solid #8D6E63;
  box-shadow: 0 5px 0 #6D4C41, 0 10px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.week-header {
  display: flex;
  background: linear-gradient(135deg, #FFF8E1 0%, #FFE082 100%);
  border-bottom: 4px dashed #A1887F;
  flex-shrink: 0;
}

.week-day {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #5D4037;
  flex-shrink: 0;
}

.week-emoji {
  font-size: 16px;
}

.calendar-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
}

.calendar-grid {
  display: flex;
  flex-wrap: wrap;
}

.calendar-cell {
  overflow: visible;
  width: 14.28%;
  min-height: 220px;
  height: 220px;
  border: 2px solid #FFE082;
  position: relative;
  flex-shrink: 0;
  background-color: white;
  display: flex;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;
  box-sizing: border-box;
  transition: all 0.2s;

  &:hover {
    background-color: #FFFDE7;
    border-color: #FFCA28;
  }

  &.other-month {
    background-color: #F5F5F5;

    .day-number {
      color: #BDBDBD;
    }
  }

  &.today {
    background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%);
    border-color: #FF8A65;
  }
}

.day-number {
  font-size: 16px;
  color: #5D4037;
  font-weight: 700;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
  margin: 8px;
  background: linear-gradient(145deg, #FFF8E1 0%, #FFE082 100%);
  border: 2px solid #8D6E63;

  &.today-number {
    background: linear-gradient(135deg, #FFB74D 0%, #FF8A65 100%);
    color: white;
    border-color: #E64A19;
    box-shadow: 0 2px 0 #E64A19;
    animation: sparkle 2s ease-in-out infinite;
  }
}

.task-item-wrapper {
  gap: 6px;
  margin: 0 -2px;
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1;
  display: grid;
  grid-template-rows: repeat(4, 1fr);
  padding: 4px 6px 8px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 100%;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-sizing: border-box;
  border: 2px solid rgba(255, 255, 255, 0.6);

  &:hover {
    opacity: 0.9;
    transform: scale(1.02);
    z-index: 10;
  }

  &.task-completed {
    opacity: 0.5;
    text-decoration: line-through;
  }

  &.task-item-start {
    border-radius: 10px 0 0 10px;
    padding-left: 8px;
    padding-right: 4px;
    flex-shrink: 0;
    width: calc(100% + 4px);
  }

  &.task-item-middle {
    border-radius: 0;
    padding: 0;
    width: calc(100% + 4px);
  }

  &.task-item-end {
    border-radius: 0 10px 10px 0;
    padding-left: 4px;
    padding-right: 8px;
    width: 100%;
    margin-right: -4px;
  }

  &.task-item-one-day {
    border-radius: 10px;
    padding-left: 8px;
    padding-right: 8px;
    flex-shrink: 0;
    width: calc(100% + 4px);
  }
}

.task-checkbox {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  appearance: none;
  border: 2px solid rgba(255, 255, 255, 0.9);
  cursor: pointer;
  position: relative;
  background: rgba(255, 255, 255, 0.3);
  flex-shrink: 0;
  transition: all 0.2s;

  &:checked {
    background-color: rgba(255, 255, 255, 0.95);
    border-color: rgba(255, 255, 255, 0.95);

    &::after {
      content: '✓';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 10px;
      font-weight: bold;
      color: #4CAF50;
    }
  }

  &:hover {
    transform: scale(1.1);
    background: rgba(255, 255, 255, 0.5);
  }
}

.task-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
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
  max-width: 540px;
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
    font-weight: 700;
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
    background: white;
  }
}

.cute-textarea {
  min-height: 120px;
  resize: vertical;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
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
