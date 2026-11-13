import { useRef, type FormEvent } from 'react'
import AddRounded from '@mui/icons-material/AddRounded'
import { Button } from '@mui/material'
import { useForm } from 'react-hook-form'
import type { CreateTaskInput } from '../../../api/types'
import ValidatedTextField from '../../../shared/components/ValidatedTextField'

type Props = { addTask: (input: CreateTaskInput) => Promise<boolean> }
type Values = CreateTaskInput

export default function TaskForm({ addTask }: Props) {
  const inFlight = useRef(false)
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<Values>({
    defaultValues: { title: '', assignee: '' },
  })

  async function submit(values: Values) {
    const success = await addTask({
      title: values.title.trim(),
      assignee: values.assignee.trim(),
    })
    if (success) reset()
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    if (inFlight.current) {
      event.preventDefault()
      return
    }
    inFlight.current = true
    void handleSubmit(submit)(event).finally(() => {
      inFlight.current = false
    })
  }

  return (
    <section
      aria-labelledby="new-task-heading"
      className="panel-card p-5 sm:p-6"
    >
      <div className="mb-5">
        <h2 id="new-task-heading" className="section-title">
          Nueva tarea
        </h2>
        <p className="section-description">
          Añade un pendiente para tu equipo.
        </p>
      </div>
      <form className="grid gap-4" onSubmit={handleFormSubmit} noValidate>
        <ValidatedTextField<Values>
          control={control}
          name="title"
          label="Nombre de la tarea"
          placeholder="Ej. Preparar informe semanal"
          helperText="Hasta 120 caracteres"
          maxLength={120}
          rules={{
            validate: (value) =>
              value.trim().length > 0 || 'Escribe un nombre para la tarea.',
            maxLength: {
              value: 120,
              message: 'El nombre no puede superar 120 caracteres.',
            },
          }}
        />
        <ValidatedTextField<Values>
          control={control}
          name="assignee"
          label="Persona asignada"
          placeholder="Ej. María González"
          helperText="Hasta 100 caracteres"
          maxLength={100}
          rules={{
            validate: (value) =>
              value.trim().length > 0 || 'Escribe quién realizará esta tarea.',
            maxLength: {
              value: 100,
              message: 'El nombre no puede superar 100 caracteres.',
            },
          }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          startIcon={<AddRounded />}
          className="!mt-1 !min-h-11 !w-full"
        >
          {isSubmitting ? 'Guardando…' : 'Agregar tarea'}
        </Button>
      </form>
    </section>
  )
}
