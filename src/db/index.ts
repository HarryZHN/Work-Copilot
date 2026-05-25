import Dexie, { type Table } from 'dexie'

export interface Memo {
  id: string
  title: string
  content: string
}

export interface Task {
  id: string
  title: string
  content: string
  startDate: string
  endDate: string
  completed: boolean
}

export interface TodayTask {
  id: string
  title: string
  content: string
  date: string
  completed: boolean
}

export class AppDB extends Dexie {
  memos!: Table<Memo, string>
  tasks!: Table<Task, string>
  todayTasks!: Table<TodayTask, string>

  constructor() {
    super('WorkCopilotDB')
    this.version(2).stores({
      memos: 'id',
      tasks: 'id',
      todayTasks: 'id, date'
    })
  }
}

export const db = new AppDB()
