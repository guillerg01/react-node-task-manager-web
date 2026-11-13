import { useState } from 'react'
import { FormControl, MenuItem, Select } from '@mui/material'
import type { SelectChangeEvent } from '@mui/material/Select'
import type { Task, TaskStatus } from '../types'
import { statusLabels, taskStatuses } from '../types'

type Props = {
  task: Task
  onStatusChange: (id: string, status: TaskStatus) => Promise<boolean>
}

export default function TaskItem({ task, onStatusChange }: Props) {
  const [saving, setSaving] = useState(false)

  async function changeStatus(event: SelectChangeEvent<TaskStatus>) {
    const nextStatus = event.target.value as TaskStatus
    if (nextStatus === task.status || saving) return
    setSaving(true)
    await onStatusChange(task.id, nextStatus)
    setSaving(false)
  }

  return (
    <li className="task-row">
      <div className="min-w-0 flex-1">
        <h3 className="task-title">{task.title}</h3>
        <p className="task-assignee">
          <span aria-hidden="true" className="avatar-mark">
            {task.assignee.trim().charAt(0).toLocaleUpperCase()}
          </span>
          Asignada a <strong>{task.assignee}</strong>
        </p>
      </div>
      <FormControl size="small" className="status-control">
        <Select
          value={task.status}
          onChange={changeStatus}
          disabled={saving}
          inputProps={{ 'aria-label': `Cambiar estado de ${task.title}` }}
          className={`status-select status-${task.status}`}
        >
          {taskStatuses.map((status) => (
            <MenuItem key={status} value={status}>
              {statusLabels[status]}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <span className="sr-only" aria-live="polite">
        {saving ? 'Actualizando estado' : ''}
      </span>
    </li>
  )
}
