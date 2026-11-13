import { useEffect, useState } from 'react'
import { Alert } from '@mui/material'
import {
  taskPageSize,
  type CreateTaskInput,
  type TaskFilter,
  type TaskStatus,
} from '../../../api/types'
import { useNotification } from '../../../shared/notifications/useNotification'
import { requestErrorMessage } from '../../../api/requestError'
import { readTaskFilter, writeTaskFilter } from '../taskFilterStorage'
import { useTasks } from '../useTasks'
import TaskFilterControl from './TaskFilter'
import TaskForm from './TaskForm'
import TaskList from './TaskList'

export default function TaskDashboard() {
  const [filter, setFilter] = useState(readTaskFilter)
  const [page, setPage] = useState(1)
  const [fallbackNotice, setFallbackNotice] = useState('')
  const notify = useNotification()
  const tasks = useTasks(filter, page, setPage)

  async function addTask(input: CreateTaskInput) {
    const success = await tasks.addTask(input)
    if (success) {
      const message = 'La tarea se creó correctamente.'
      if (notify) notify(message, 'success')
      else setFallbackNotice(message)
    }
    return success
  }

  async function changeStatus(id: string, status: TaskStatus) {
    const success = await tasks.changeStatus(id, status)
    if (success) {
      const message = 'El estado de la tarea se actualizó.'
      if (notify) notify(message, 'success')
      else setFallbackNotice(message)
    }
    return success
  }

  function changeFilter(nextFilter: TaskFilter) {
    setFilter(nextFilter)
    setPage(1)
  }

  useEffect(() => {
    writeTaskFilter(filter)
  }, [filter])

  return (
    <main className="min-h-screen px-4 py-7 sm:px-7 sm:py-10 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col justify-between gap-5 sm:mb-10 sm:flex-row sm:items-end">
          <div>
            <h1 className="page-title">Tablero de tareas</h1>
            <p className="page-description">
              Un lugar claro para coordinar el trabajo de tu equipo.
            </p>
          </div>
        </header>
        <div className="dashboard-grid">
          <TaskForm addTask={addTask} />
          <div className="min-w-0 space-y-4">
            {tasks.writeError && (
              <Alert severity="error" role="alert">
                {tasks.writeError}
              </Alert>
            )}
            {fallbackNotice && (
              <div role="status" aria-live="polite" aria-atomic="true">
                {fallbackNotice}
              </div>
            )}
            <TaskList
              errorMessage={requestErrorMessage(
                tasks.readError,
                'Comprueba tu conexión e inténtalo de nuevo.',
              )}
              filterControl={
                <TaskFilterControl value={filter} onChange={changeFilter} />
              }
              tasks={tasks.tasks}
              total={tasks.total}
              page={page}
              pageCount={Math.ceil(tasks.total / taskPageSize)}
              state={tasks.state}
              onRefresh={() => void tasks.refresh()}
              onPageChange={setPage}
              onStatusChange={changeStatus}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
