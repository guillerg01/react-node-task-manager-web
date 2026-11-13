import { FormControl, InputLabel, MenuItem, Select } from '@mui/material'
import type { SelectChangeEvent } from '@mui/material/Select'
import type { TaskFilter } from '../../../api/types'

type Props = { value: TaskFilter; onChange: (filter: TaskFilter) => void }

export default function TaskFilterControl({ value, onChange }: Props) {
  function handleChange(event: SelectChangeEvent<TaskFilter>) {
    onChange(event.target.value as TaskFilter)
  }

  return (
    <FormControl size="small" className="min-w-44">
      <InputLabel id="task-filter-label">Filtrar tareas</InputLabel>
      <Select
        labelId="task-filter-label"
        id="task-filter"
        value={value}
        label="Filtrar tareas"
        onChange={handleChange}
      >
        <MenuItem value="all">Todas</MenuItem>
        <MenuItem value="pending">Pendientes</MenuItem>
        <MenuItem value="in_progress">En curso</MenuItem>
        <MenuItem value="done">Hechas</MenuItem>
      </Select>
    </FormControl>
  )
}
