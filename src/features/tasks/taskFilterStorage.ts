import type { TaskFilter } from './types'

const filterStorageKey = 'task-manager:filter:v1'
const validFilters = new Set<TaskFilter>([
  'all',
  'pending',
  'in_progress',
  'done',
])

export function readTaskFilter(): TaskFilter {
  try {
    const storedValue = window.localStorage.getItem(filterStorageKey)
    return storedValue && validFilters.has(storedValue as TaskFilter)
      ? (storedValue as TaskFilter)
      : 'all'
  } catch {
    return 'all'
  }
}

export function writeTaskFilter(filter: TaskFilter): void {
  try {
    window.localStorage.setItem(filterStorageKey, filter)
  } catch {
    return
  }
}
