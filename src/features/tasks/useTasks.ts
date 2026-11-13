import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type {
  CreateTaskInput,
  TaskFilter,
  TaskPage,
  TaskStatus,
} from '../../api/types'
import { taskPageSize } from '../../api/types'
import { requestErrorMessage } from '../../api/requestError'
import { createTask, listTasks, updateTaskStatus } from './tasksApi'

export function useTasks(
  filter: TaskFilter,
  page: number,
  onPageChange: (page: number) => void,
) {
  const client = useQueryClient()
  const queryKey = ['tasks', filter, page, taskPageSize] as const
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) =>
      listTasks(
        filter === 'all' ? undefined : filter,
        page,
        taskPageSize,
        signal,
      ),
  })
  const [writeError, setWriteError] = useState('')
  const currentQuery = useRef({ filter, page })
  const creating = useRef(false)
  const changing = useRef(new Set<string>())

  useLayoutEffect(() => {
    currentQuery.current = { filter, page }
  }, [filter, page])

  useEffect(() => {
    if (!query.data) return
    const lastPage = Math.max(1, Math.ceil(query.data.total / taskPageSize))
    if (page > lastPage) onPageChange(lastPage)
  }, [query.data, page, onPageChange])

  async function addTask(input: CreateTaskInput) {
    if (creating.current) return false
    creating.current = true
    setWriteError('')
    try {
      await createTask(input)
      await client.invalidateQueries({ queryKey: ['tasks'] })
      return true
    } catch (error) {
      setWriteError(
        requestErrorMessage(
          error,
          'No se pudo crear la tarea. Revisa tu conexión e inténtalo de nuevo.',
        ),
      )
      return false
    } finally {
      creating.current = false
    }
  }

  async function changeStatus(id: string, status: TaskStatus) {
    if (changing.current.has(id)) return false
    changing.current.add(id)
    setWriteError('')
    try {
      const view = currentQuery.current
      const snapshot = client
        .getQueryData<TaskPage>(['tasks', view.filter, view.page, taskPageSize])
        ?.items.find((task) => task.id === id)
      if (!snapshot) return false
      const saved = await updateTaskStatus(id, status, snapshot.version)
      const current = currentQuery.current
      const activeKey = ['tasks', current.filter, current.page, taskPageSize]
      const data = client.getQueryData<TaskPage>(activeKey)
      if (
        data?.items.some((task) => task.id === saved.id) &&
        (current.filter === 'all' || current.filter === saved.status)
      ) {
        await client.cancelQueries({ queryKey: activeKey, exact: true })
        client.setQueryData<TaskPage>(activeKey, {
          ...data,
          items: data.items.map((task) =>
            task.id === saved.id ? saved : task,
          ),
        })
        const activeHash = client
          .getQueryCache()
          .find({ queryKey: activeKey, exact: true })?.queryHash
        await client.invalidateQueries({
          queryKey: ['tasks'],
          predicate: (cached) => cached.queryHash !== activeHash,
        })
      } else {
        await client.invalidateQueries({ queryKey: ['tasks'] })
      }
      return true
    } catch (error) {
      await client.invalidateQueries({ queryKey: ['tasks'] })
      setWriteError(
        requestErrorMessage(
          error,
          'No se pudo actualizar el estado. Inténtalo de nuevo.',
        ),
      )
      return false
    } finally {
      changing.current.delete(id)
    }
  }

  const state: 'error' | 'loading' | 'ready' = query.isError
    ? 'error'
    : query.isPending
      ? 'loading'
      : 'ready'
  return {
    tasks: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    state,
    writeError,
    refresh: () => query.refetch(),
    addTask,
    changeStatus,
    readError: query.error,
  }
}
