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

export class AppDB extends Dexie {
  memos!: Table<Memo, string>
  tasks!: Table<Task, string>

  constructor() {
    super('WorkCopilotDB')
    this.version(1).stores({
      memos: 'id',
      tasks: 'id'
    })
  }
}

export const db = new AppDB()
