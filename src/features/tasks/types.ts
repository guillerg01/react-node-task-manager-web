export const taskStatuses = ['pending', 'in_progress', 'done'] as const

export type TaskStatus = (typeof taskStatuses)[number]
export type TaskFilter = 'all' | TaskStatus
export const taskPageSize = 10

export type TaskPage = {
  items: Task[]
  page: number
  pageSize: number
  total: number
}

export type Task = {
  id: string
  title: string
  assignee: string
  status: TaskStatus
  version: number
}

export type CreateTaskInput = {
  title: string
  assignee: string
}

export const statusLabels: Record<TaskStatus, string> = {
  pending: 'Pendiente',
  in_progress: 'En curso',
  done: 'Hecha',
}
