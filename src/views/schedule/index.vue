<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { db, type Task } from '@/db';
import { formatDate, getDaysInMonth, getFirstDayOfMonth, addMonths, parseDate, isDateBetween } from '@/utils/date';
import { getTaskColor, getTaskTextColor } from '@/utils/color';

const WEEK_DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const MAX_ROWS = 4;

const currentDate = ref(new Date());
const tasks = ref<Task[]>([]);
const showModal = ref(false);
const editingTask = ref<Task | null>(null);
const calendarWrapper = ref<HTMLElement | null>(null);
const cellWidth = ref(100);
const cellHeight = ref(120);

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

function prevMonth() {
  currentDate.value = addMonths(currentDate.value, -1);
}

function nextMonth() {
  currentDate.value = addMonths(currentDate.value, 1);
}

function goToToday() {
  currentDate.value = new Date();
}

async function loadTasks() {
  tasks.value = await db.tasks.toArray();
}

async function toggleComplete(id: string) {
  const task = tasks.value.find(t => t.id === id)
  if (task) {
    // 创建一个纯对象副本，避免将 Vue 响应式内部属性存入数据库
    const updatedTask = {
      ...task,
      completed: !task.completed
    }
    await db.tasks.put(updatedTask)
    // 更新本地响应式数据
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
    alert('请输入任务标题');
    return;
  }
  if (newTask.value.startDate > newTask.value.endDate) {
    alert('结束日期不能早于开始日期');
    return;
  }
  // 创建一个纯对象，确保不包含 Vue 响应式属性
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

function calculateSize() {
  nextTick(() => {
    if (calendarWrapper.value) {
      const wrapperRect = calendarWrapper.value.getBoundingClientRect();
      // 减去padding和边框
      const availableWidth = wrapperRect.width - 48;
      const availableHeight = wrapperRect.height - 44 - 16; // 减去header高度和间距
      
      cellWidth.value = Math.max(80, Math.floor(availableWidth / 7));
      cellHeight.value = Math.max(80, Math.floor(availableHeight / 6));
    }
  });
}

let resizeTimer: number | null = null;
function handleResize() {
  if (resizeTimer) {
    clearTimeout(resizeTimer);
  }
  resizeTimer = window.setTimeout(() => {
    calculateSize();
  }, 100);
}

onMounted(() => {
  loadTasks();
  console.log(tasks.value);
  calculateSize();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<template>
  <div class="schedule-container">
    <div class="header">
      <div class="header-left">
        <button class="icon-btn" @click="openCreateModal()">新建工作排期</button>
      </div>
      <div class="header-center">
        <h1>{{ monthName }}</h1>
      </div>
      <div class="header-right">
        <button class="icon-btn" @click="prevMonth">&lt;</button>
        <button class="today-btn" @click="goToToday">今天</button>
        <button class="icon-btn" @click="nextMonth">&gt;</button>
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
            {{ day }}
          </div>
        </div>

        <div class="calendar-body">
          <div class="calendar-grid">
            <div
              v-for="(day, dayIndex) in calendarDays"
              :key="dayIndex"
              class="calendar-cell"
              :style="{ height: `${cellHeight}px` }"
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

          <div class="form-row">
            <div class="form-group">
              <label>开始日期 *</label>
              <input
                v-model="newTask.startDate"
                type="date"
              />
            </div>
            <div class="form-group">
              <label>结束日期 *</label>
              <input
                v-model="newTask.endDate"
                type="date"
              />
            </div>
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
.schedule-container {
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

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.calendar-icon {
  font-size: 24px;
}

.header-left h1 {
  font-size: 24px;
  color: #1a1a1a;
  font-weight: 600;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
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

.text-btn {
  padding: 8px 16px;
  border: none;
  background-color: white;
  border-radius: 6px;
  font-size: 14px;
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

.calendar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.calendar-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.week-header {
  display: flex;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.week-day {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 500;
  color: #666;
  flex-shrink: 0;
}

.calendar-body {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.calendar-grid {
  display: flex;
  flex-wrap: wrap;
}

.calendar-cell {
  overflow: visible;
  width: 14%;
  border: 1px solid #e8e8e8;
  position: relative;
  flex-shrink: 0;
  background-color: white;
  display: flex;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;
  box-sizing: border-box;

  &:hover {
    background-color: #f8f9fa;
  }

  &.other-month {
    background-color: #fafafa;

    .day-number {
      color: #ccc;
    }
  }

  &.today {
    background-color: #eff6ff;
  }
}

.day-number {
  font-size: 10px;
  color: #1a1a1a;
  font-weight: 500;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;

  &.today-number {
    background-color: #3b82f6;
    color: white;
  }
}

.task-item-wrapper {
  gap: 1px;
  margin: 0 -1px;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: repeat(4, 1fr);
}

.task-item {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 100%;
  font-size: 11px;
  cursor: pointer;
  transition: opacity 0.2s;
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-sizing: border-box;

  &:hover {
    opacity: 0.9;
  }

  &.task-completed {
    opacity: 0.5;
    text-decoration: line-through;
  }

  &.task-item-start {
    
    border-radius: 4px 0 0 4px;
    padding-left: 6px;
    padding-right: 2px;
    flex-shrink: 0;
    width: calc(100% + 2px);
  }

  &.task-item-middle {
    border-radius: 0;
    padding: 0;
    width: calc(100% + 2px);

  }

  &.task-item-end {
    border-radius: 0 4px 4px 0;
    padding-left: 2px;
    padding-right: 6px;
    width: 100%;
    margin-right: -4px;
  }

  &.task-item-one-day {
    border-radius: 4px;
    padding-left: 6px;
    padding-right: 6px;
    flex-shrink: 0;
    width: calc(100% + 2px);
  }
}

.task-checkbox {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  appearance: none;
  border: 2px solid rgba(255, 255, 255, 0.8);
  cursor: pointer;
  position: relative;
  background: rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
  transition: all 0.2s;

  &:checked {
    background-color: rgba(255, 255, 255, 0.9);
    border-color: rgba(255, 255, 255, 0.9);

    &::after {
      content: '✓';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 9px;
      font-weight: bold;
      color: #333;
    }
  }
}

.task-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
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
