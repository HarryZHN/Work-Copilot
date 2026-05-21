<script setup lang="ts">import { ref, computed, onMounted } from 'vue';
import TaskBar from '@/components/TaskBar.vue';
import { db, type Task } from '@/db';
import { formatDate, getDaysInMonth, getFirstDayOfMonth, getLastDayOfMonth, addMonths, getMonthName, generateDaysInMonth } from '@/utils/date';
const DAY_WIDTH = 40;
const ROW_HEIGHT = 40;
const currentDate = ref(new Date());
const tasks = ref<Task[]>([]);
const showModal = ref(false);
const editingTask = ref<Task | null>(null);
const newTask = ref({
 title: '',
 content: '',
 startDate: '',
 endDate: ''
});
const year = computed(() => currentDate.value.getFullYear());
const month = computed(() => currentDate.value.getMonth());
const monthName = computed(() => getMonthName(year.value, month.value));
const daysInMonth = computed(() => getDaysInMonth(year.value, month.value));
const days = computed(() => generateDaysInMonth(year.value, month.value));
const containerWidth = computed(() => daysInMonth.value * DAY_WIDTH);
const firstDay = computed(() => getFirstDayOfMonth(year.value, month.value));
const lastDay = computed(() => getLastDayOfMonth(year.value, month.value));
const filteredTasks = computed(() => {
 return tasks.value.filter(task => {
 const taskStart = new Date(task.startDate);
 const taskEnd = new Date(task.endDate);
 return taskEnd >= firstDay.value && taskStart <= lastDay.value;
 });
});
interface TrackedTask extends Task {
 trackIndex: number;
 startOffset: number;
}
const trackedTasks = computed((): TrackedTask[] => {
 const sorted = [...filteredTasks.value].sort((a, b) => {
 const dateCompare = a.startDate.localeCompare(b.startDate);
 if (dateCompare !== 0)
 return dateCompare;
 return a.id.localeCompare(b.id);
 });
 const tracks: Date[] = [];
 const result: TrackedTask[] = [];
 for (const task of sorted) {
 const taskStart = new Date(task.startDate);
 let assigned = false;
 for (let i = 0; i < tracks.length; i++) {
 if (tracks[i] < taskStart) {
 tracks[i] = new Date(task.endDate);
 result.push({
 ...task,
 trackIndex: i,
 startOffset: getDayOffset(task.startDate)
 });
 assigned = true;
 break;
 }
 }
 if (!assigned) {
 tracks.push(new Date(task.endDate));
 result.push({
 ...task,
 trackIndex: tracks.length - 1,
 startOffset: getDayOffset(task.startDate)
 });
 }
 }
 return result;
});
const containerHeight = computed(() => {
 const maxTrack = trackedTasks.value.reduce((max, t) => Math.max(max, t.trackIndex), -1);
 return (maxTrack + 1) * ROW_HEIGHT;
});
function getDayOffset(dateStr: string): number {
 const date = new Date(dateStr);
 const first = firstDay.value;
 return Math.floor((date.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));
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
 const task = tasks.value.find(t => t.id === id);
 if (task) {
 task.completed = !task.completed;
 await db.tasks.put(task);
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
function openCreateModal() {
 const today = formatDate(new Date());
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
 const task: Task = {
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
 if (!editingTask.value)
 return;
 await db.tasks.delete(editingTask.value.id);
 await loadTasks();
 showModal.value = false;
}
function closeModal() {
 showModal.value = false;
 editingTask.value = null;
}
onMounted(loadTasks);
</script>

<template>
  <div class="schedule-container">
    <div class="page-header">
      <h1>排期表</h1>
      <button class="create-btn" @click="openCreateModal">新建任务</button>
    </div>

    <div class="calendar-header">
      <button class="nav-btn" @click="prevMonth">←</button>
      <button class="today-btn" @click="goToToday">今天</button>
      <span class="month-title">{{ monthName }}</span>
      <button class="nav-btn" @click="nextMonth">→</button>
    </div>

    <div class="calendar-container">
      <div class="days-header">
        <div
          v-for="(day, index) in days"
          :key="index"
          class="day-cell"
        >
          {{ new Date(day).getDate() }}
        </div>
      </div>
      
      <div
        class="tasks-container"
        :style="{
          width: `${containerWidth}px`,
          height: `${containerHeight}px`
        }"
      >
        <div class="track-lines">
          <div
            v-for="i in Math.max(1, containerHeight / ROW_HEIGHT)"
            :key="i"
            class="track-line"
            :style="{ top: `${i * ROW_HEIGHT - 1}px` }"
          ></div>
        </div>
        
        <TaskBar
          v-for="task in trackedTasks"
          :key="task.id"
          :task="task"
          :day-width="DAY_WIDTH"
          :start-offset="task.startOffset"
          :row-height="ROW_HEIGHT"
          :track-index="task.trackIndex"
          @toggle-complete="toggleComplete"
          @edit="openEditModal"
        />
        
        <div v-if="trackedTasks.length === 0" class="empty-state">
          <p>本月暂无任务，点击上方按钮添加</p>
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

.calendar-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.nav-btn,
.today-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn {
  background-color: #f5f5f5;
  color: #333;

  &:hover {
    background-color: #e8e8e8;
  }
}

.today-btn {
  background-color: #f0f0f0;
  color: #666;
  font-size: 13px;

  &:hover {
    background-color: #e8e8e8;
  }
}

.month-title {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  min-width: 120px;
  text-align: center;
}

.calendar-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.days-header {
  display: flex;
  border-bottom: 1px solid #eee;
}

.day-cell {
  width: 40px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.tasks-container {
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: #fafafa;
}

.track-lines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.track-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background-color: #eee;
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
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

.form-group input,
.form-group textarea {
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

.delete-btn {
  background-color: #e74c3c;
  color: white;

  &:hover {
    background-color: #c0392b;
  }
}
</style>
