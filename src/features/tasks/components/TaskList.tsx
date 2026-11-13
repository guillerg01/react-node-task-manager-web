import RefreshRounded from '@mui/icons-material/RefreshRounded'
import TaskAltRounded from '@mui/icons-material/TaskAltRounded'
import { Button, CircularProgress } from '@mui/material'
import type { ReactNode } from 'react'
import type { Task, TaskStatus } from '../../../api/types'
import PaginationControl from '../../../shared/components/PaginationControl'
import TaskItem from './TaskItem'

type Props = {
  errorMessage: string
  filterControl: ReactNode
  tasks: Task[]
  total: number
  page: number
  pageCount: number
  state: 'loading' | 'ready' | 'error'
  onRefresh: () => void
  onPageChange: (page: number) => void
  onStatusChange: (id: string, status: TaskStatus) => Promise<boolean>
}

export default function TaskList({
  errorMessage,
  filterControl,
  tasks,
  total,
  page,
  pageCount,
  state,
  onRefresh,
  onPageChange,
  onStatusChange,
}: Props) {
  return (
    <section
      aria-labelledby="task-list-heading"
      className="panel-card flex h-full flex-col overflow-hidden"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5ebe6] px-5 py-5 sm:px-6">
        <div>
          <h2 id="task-list-heading" className="section-title">
            Tareas del equipo
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="count-badge"
            aria-label={
              state === 'ready' ? `${total} tareas` : 'Cargando tareas'
            }
          >
            {state === 'ready' ? total : '—'}
          </span>
          {filterControl}
        </div>
      </div>
      {state === 'loading' ? (
        <div role="status" className="panel-state">
          <CircularProgress size={20} />
          <span>Cargando tareas…</span>
        </div>
      ) : state === 'error' ? (
        <div className="panel-state panel-state-error" role="alert">
          <div>
            <strong>No pudimos cargar las tareas</strong>
            <p>{errorMessage}</p>
          </div>
          <Button
            variant="outlined"
            startIcon={<RefreshRounded />}
            onClick={onRefresh}
          >
            Reintentar
          </Button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state flex-1">
          <TaskAltRounded className="empty-mark" aria-hidden="true" />
          <h3>No hay tareas por aquí</h3>
          <p>Cuando agregues una tarea aparecerá en esta lista.</p>
        </div>
      ) : (
        <ul className="m-0 list-none p-0">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onStatusChange={onStatusChange}
            />
          ))}
        </ul>
      )}
      {state === 'ready' && (
        <PaginationControl
          page={page}
          pageCount={pageCount}
          onChange={onPageChange}
        />
      )}
    </section>
  )
}
