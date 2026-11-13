import { http } from '../../api/http'
import type {
  CreateTaskInput,
  Task,
  TaskPage,
  TaskStatus,
} from '../../api/types'

export async function listTasks(
  status: TaskStatus | undefined,
  page: number,
  pageSize: number,
  signal: AbortSignal,
): Promise<TaskPage> {
  const response = await http.get<TaskPage>('/tasks', {
    params: { page, pageSize, ...(status ? { status } : {}) },
    signal,
  })
  return response.data
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const response = await http.post<Task>('/tasks', input)
  return response.data
}

export async function updateTaskStatus(
  id: string,
  status: TaskStatus,
  version: number,
): Promise<Task> {
  const response = await http.patch<Task>(
    `/tasks/${encodeURIComponent(id)}/status`,
    { status, version },
  )
  return response.data
}
