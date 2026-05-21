<script setup lang="ts">
import type { Task } from '@/db'
import { getTaskColor } from '@/utils/color'

const props = defineProps<{
  task: Task
  dayWidth: number
  startOffset: number
  rowHeight: number
  trackIndex: number
  taskWidth: number
}>()

const emit = defineEmits<{
  toggleComplete: [id: string]
  edit: [id: string]
}>()

const color = getTaskColor(props.task.id, props.task.completed)
const topPosition = props.trackIndex * props.rowHeight + 4
const leftPosition = props.startOffset * props.dayWidth + 4

const toggleComplete = () => {
  emit('toggleComplete', props.task.id)
}

const handleClick = () => {
  emit('edit', props.task.id)
}
</script>

<template>
  <div
    class="task-bar"
    :class="{ completed: task.completed }"
    :style="{
      left: `${leftPosition}px`,
      width: `${taskWidth - 8}px`,
      top: `${topPosition}px`,
      backgroundColor: color
    }"
    @click="handleClick"
  >
    <label class="checkbox-label">
      <input
        type="checkbox"
        :checked="task.completed"
        @click.stop="toggleComplete"
        class="checkbox"
      />
    </label>
    <span class="task-title">{{ task.title }}</span>
    <span class="task-dates">{{ formatDateRange(task.startDate, task.endDate) }}</span>
  </div>
</template>

<script lang="ts">
function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  const startMonth = start.getMonth() + 1
  const startDay = start.getDate()
  const endMonth = end.getMonth() + 1
  const endDay = end.getDate()
  
  if (startMonth === endMonth) {
    return `${startDay}-${endDay}`
  }
  return `${startMonth}/${startDay}-${endMonth}/${endDay}`
}
</script>

<style lang="scss" scoped>
.task-bar {
  position: absolute;
  height: 42px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 10;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  &.completed {
    opacity: 0.6;
    text-decoration: line-through;
  }
}

.checkbox-label {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  flex-shrink: 0;
}

.checkbox {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  appearance: none;
  border: 2px solid rgba(255, 255, 255, 0.9);
  cursor: pointer;
  position: relative;
  background: rgba(255, 255, 255, 0.2);
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
      font-size: 12px;
      font-weight: bold;
      color: #333;
    }
  }

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}

.task-title {
  font-size: 13px;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  font-weight: 500;
}

.task-dates {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  margin-left: 8px;
  flex-shrink: 0;
  white-space: nowrap;
}
</style>