<script setup lang="ts">
import type { Task } from '@/db'
import { getTaskColor } from '@/utils/color'

const props = defineProps<{
  task: Task
  dayWidth: number
  startOffset: number
  rowHeight: number
  trackIndex: number
}>()

const emit = defineEmits<{
  toggleComplete: [id: string]
  edit: [id: string]
}>()

const color = getTaskColor(props.task.id, props.task.completed)

const startDate = new Date(props.task.startDate)
const endDate = new Date(props.task.endDate)
const width = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) + 1
const taskWidth = width * props.dayWidth

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
    :style="{
      left: `${startOffset * dayWidth}px`,
      width: `${taskWidth}px`,
      top: `${trackIndex * rowHeight}px`,
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
  </div>
</template>

<style lang="scss" scoped>
.task-bar {
  position: absolute;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    opacity: 0.9;
  }
}

.checkbox-label {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
}

.checkbox {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  appearance: none;
  border: 2px solid rgba(255, 255, 255, 0.8);
  cursor: pointer;
  position: relative;
  background: transparent;

  &:checked {
    border-color: white;

    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 8px;
      height: 8px;
      background-color: white;
      border-radius: 50%;
    }
  }
}

.task-title {
  font-size: 13px;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}
</style>
