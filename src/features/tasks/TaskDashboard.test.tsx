import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import type { Task, TaskStatus } from '../../api/types'
import { apiUrl, server } from '../../test/server'
import TaskDashboard from './components/TaskDashboard'
import { QueryProvider } from '../../app/QueryProvider'

const initialTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Preparar informe',
    assignee: 'Ana',
    status: 'pending',
    version: 1,
  },
  {
    id: 'task-2',
    title: 'Revisar presupuesto',
    assignee: 'Luis',
    status: 'done',
    version: 1,
  },
]

function paginatedTasks(
  items: Task[],
  page = 1,
  pageSize = 10,
  total = items.length,
) {
  return { items, page, pageSize, total }
}

function renderDashboard() {
  return render(
    <QueryProvider>
      <TaskDashboard />
    </QueryProvider>,
  )
}

async function chooseMuiOption(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  option: string,
) {
  await user.click(screen.getByRole('combobox', { name: label }))
  await user.click(await screen.findByRole('option', { name: option }))
}

describe('task dashboard', () => {
  it('shows a loading state and then renders tasks from the API', async () => {
    let completeLoad: (() => void) | undefined
    const load = new Promise<void>((resolve) => {
      completeLoad = resolve
    })
    server.use(
      http.get(`${apiUrl}/tasks`, async () => {
        await load
        return HttpResponse.json(paginatedTasks(initialTasks))
      }),
    )

    renderDashboard()

    expect(screen.getByRole('status')).toHaveTextContent('Cargando tareas')
    completeLoad?.()
    expect(await screen.findByText('Preparar informe')).toBeInTheDocument()
    expect(screen.getByText('Revisar presupuesto')).toBeInTheDocument()
  })

  it('shows an error and retries a failed task load', async () => {
    const user = userEvent.setup()
    let requests = 0
    server.use(
      http.get(`${apiUrl}/tasks`, () => {
        requests += 1
        return requests === 1
          ? new HttpResponse(null, { status: 503 })
          : HttpResponse.json(paginatedTasks(initialTasks))
      }),
    )

    renderDashboard()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos cargar las tareas',
    )
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Preparar informe')).toBeInTheDocument()
    expect(requests).toBe(2)
  })

  it('requests the selected status and filters the displayed tasks', async () => {
    const user = userEvent.setup()
    let requestedStatus: string | null = null
    server.use(
      http.get(`${apiUrl}/tasks`, ({ request }) => {
        requestedStatus = new URL(request.url).searchParams.get('status')
        return HttpResponse.json(
          paginatedTasks(
            requestedStatus === 'pending' ? [initialTasks[0]] : initialTasks,
          ),
        )
      }),
    )

    renderDashboard()
    expect(await screen.findByText('Revisar presupuesto')).toBeInTheDocument()

    await chooseMuiOption(user, 'Filtrar tareas', 'Pendientes')

    expect(await screen.findByText('Preparar informe')).toBeInTheDocument()
    await waitFor(() => expect(requestedStatus).toBe('pending'))
    expect(screen.queryByText('Revisar presupuesto')).not.toBeInTheDocument()
  })

  it('moves between API pages and resets to page one when the filter changes', async () => {
    const user = userEvent.setup()
    const tasks: Task[] = Array.from({ length: 21 }, (_, index) => ({
      id: `page-task-${index + 1}`,
      title: `Tarea ${index + 1}`,
      assignee: 'Ana',
      status: 'done' as const,
      version: 1,
    }))
    const requests: Array<{
      page: number
      pageSize: number
      status: string | null
    }> = []
    server.use(
      http.get(`${apiUrl}/tasks`, ({ request }) => {
        const url = new URL(request.url)
        const page = Number(url.searchParams.get('page'))
        const pageSize = Number(url.searchParams.get('pageSize'))
        const status = url.searchParams.get('status')
        requests.push({ page, pageSize, status })
        const filteredTasks = status
          ? tasks.filter((task) => task.status === status)
          : tasks
        const start = (page - 1) * pageSize
        return HttpResponse.json(
          paginatedTasks(
            filteredTasks.slice(start, start + pageSize),
            page,
            pageSize,
            filteredTasks.length,
          ),
        )
      }),
    )

    renderDashboard()
    expect(await screen.findByText('Tarea 1')).toBeInTheDocument()
    expect(screen.queryByText('Tarea 11')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Página siguiente' }))
    expect(await screen.findByText('Tarea 11')).toBeInTheDocument()
    await waitFor(() =>
      expect(requests.at(-1)).toEqual({ page: 2, pageSize: 10, status: null }),
    )

    await user.click(screen.getByRole('button', { name: 'Página anterior' }))
    expect(await screen.findByText('Tarea 1')).toBeInTheDocument()
    expect(requests).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: 'Página siguiente' }))
    expect(await screen.findByText('Tarea 11')).toBeInTheDocument()
    await chooseMuiOption(user, 'Filtrar tareas', 'Hechas')
    expect(await screen.findByText('Tarea 1')).toBeInTheDocument()
    await waitFor(() =>
      expect(requests.at(-1)).toEqual({
        page: 1,
        pageSize: 10,
        status: 'done',
      }),
    )
  })

  it('validates required fields without sending a request', async () => {
    const user = userEvent.setup()
    let creates = 0
    server.use(
      http.post(`${apiUrl}/tasks`, () => {
        creates += 1
        return HttpResponse.json(initialTasks[0], { status: 201 })
      }),
    )

    renderDashboard()
    await user.click(screen.getByRole('button', { name: 'Agregar tarea' }))

    expect(
      await screen.findByText('Escribe un nombre para la tarea.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Escribe quién realizará esta tarea.'),
    ).toBeInTheDocument()
    expect(creates).toBe(0)
  })

  it('submits trimmed task details and clears the form on success', async () => {
    const user = userEvent.setup()
    let submitted: unknown
    let tasks: Task[] = []
    server.use(
      http.post(`${apiUrl}/tasks`, async ({ request }) => {
        submitted = await request.json()
        const body = submitted as {
          title: string
          assignee: string
        }
        const created: Task = {
          id: 'created',
          ...body,
          status: 'pending',
          version: 1,
        }
        tasks = [created]
        return HttpResponse.json(created, { status: 201 })
      }),
      http.get(`${apiUrl}/tasks`, () =>
        HttpResponse.json(paginatedTasks(tasks)),
      ),
    )

    renderDashboard()
    await screen.findByRole('combobox', { name: 'Filtrar tareas' })
    await user.type(
      screen.getByRole('textbox', { name: 'Nombre de la tarea' }),
      '  Actualizar guía  ',
    )
    await user.type(
      screen.getByRole('textbox', { name: 'Persona asignada' }),
      '  María  ',
    )
    await user.click(screen.getByRole('button', { name: 'Agregar tarea' }))

    expect(await screen.findByText('Actualizar guía')).toBeInTheDocument()
    expect(submitted).toEqual({ title: 'Actualizar guía', assignee: 'María' })
    expect(
      screen.getByRole('textbox', { name: 'Nombre de la tarea' }),
    ).toHaveValue('')
    expect(
      screen.getByRole('textbox', { name: 'Persona asignada' }),
    ).toHaveValue('')
  })

  it('refreshes the selected filter after a task creation finishes', async () => {
    const user = userEvent.setup()
    let completeCreate: (() => void) | undefined
    const createResponse = new Promise<void>((resolve) => {
      completeCreate = resolve
    })
    const requestedStatuses: Array<string | null> = []
    let tasks = initialTasks
    server.use(
      http.get(`${apiUrl}/tasks`, ({ request }) => {
        const status = new URL(request.url).searchParams.get('status')
        requestedStatuses.push(status)
        const filteredTasks =
          status === 'pending'
            ? tasks.filter((task) => task.status === 'pending')
            : tasks
        return HttpResponse.json(paginatedTasks(filteredTasks))
      }),
      http.post(`${apiUrl}/tasks`, async ({ request }) => {
        await createResponse
        const body = (await request.json()) as {
          title: string
          assignee: string
        }
        const created: Task = {
          id: 'created-filtered',
          ...body,
          status: 'pending',
          version: 1,
        }
        tasks = [...tasks, created]
        return HttpResponse.json(created, { status: 201 })
      }),
    )

    renderDashboard()
    await screen.findByText('Preparar informe')
    await user.type(
      screen.getByRole('textbox', { name: 'Nombre de la tarea' }),
      'Nueva tarea',
    )
    await user.type(
      screen.getByRole('textbox', { name: 'Persona asignada' }),
      'Ana',
    )
    await user.click(screen.getByRole('button', { name: 'Agregar tarea' }))
    await chooseMuiOption(user, 'Filtrar tareas', 'Pendientes')
    await waitFor(() => expect(requestedStatuses).toContain('pending'))

    completeCreate?.()

    expect(await screen.findByText('Nueva tarea')).toBeInTheDocument()
    await waitFor(() =>
      expect(
        requestedStatuses.filter((status) => status === 'pending'),
      ).toHaveLength(2),
    )
  })

  it('keeps entered task details and shows a message when creation fails', async () => {
    const user = userEvent.setup()
    server.use(
      http.post(
        `${apiUrl}/tasks`,
        () => new HttpResponse(null, { status: 500 }),
      ),
    )

    renderDashboard()
    await user.type(
      screen.getByRole('textbox', { name: 'Nombre de la tarea' }),
      'Preparar presentación',
    )
    await user.type(
      screen.getByRole('textbox', { name: 'Persona asignada' }),
      'Sofía',
    )
    await user.click(screen.getByRole('button', { name: 'Agregar tarea' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El servidor no pudo completar la operación.',
    )
    expect(
      screen.getByRole('textbox', { name: 'Nombre de la tarea' }),
    ).toHaveValue('Preparar presentación')
    expect(
      screen.getByRole('textbox', { name: 'Persona asignada' }),
    ).toHaveValue('Sofía')
  })

  it('updates a task status through the API and renders the saved status', async () => {
    const user = userEvent.setup()
    let status: TaskStatus = 'pending'
    let reads = 0
    server.use(
      http.get(`${apiUrl}/tasks`, () => {
        reads += 1
        return HttpResponse.json(
          paginatedTasks([{ ...initialTasks[0], status }]),
        )
      }),
      http.patch(`${apiUrl}/tasks/:id/status`, async ({ request, params }) => {
        expect(params.id).toBe('task-1')
        const body = (await request.json()) as { status: TaskStatus }
        status = body.status
        return HttpResponse.json({ ...initialTasks[0], status })
      }),
    )

    renderDashboard()
    await screen.findByText('Preparar informe')
    await chooseMuiOption(
      user,
      'Cambiar estado de Preparar informe',
      'En curso',
    )

    await waitFor(() => expect(status).toBe('in_progress'))
    const task = screen.getByText('Preparar informe').closest('li')
    expect(task).not.toBeNull()
    await waitFor(() => {
      expect(
        within(task as HTMLElement).getByRole('combobox', {
          name: 'Cambiar estado de Preparar informe',
        }),
      ).toHaveTextContent('En curso')
    })
    expect(reads).toBe(1)
  })

  it('explains rate limiting and preserves a draft until manual retry', async () => {
    const user = userEvent.setup()
    server.use(
      http.post(
        `${apiUrl}/tasks`,
        () => new HttpResponse(null, { status: 429 }),
      ),
    )
    renderDashboard()
    await user.type(
      screen.getByRole('textbox', { name: 'Nombre de la tarea' }),
      'Rate limited draft',
    )
    await user.type(
      screen.getByRole('textbox', { name: 'Persona asignada' }),
      'Ana',
    )
    await user.click(screen.getByRole('button', { name: 'Agregar tarea' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Demasiadas solicitudes',
    )
    expect(
      screen.getByRole('textbox', { name: 'Nombre de la tarea' }),
    ).toHaveValue('Rate limited draft')
  })

  it('refreshes a task after a conflicting concurrent update', async () => {
    const user = userEvent.setup()
    let changed = false
    server.use(
      http.get(`${apiUrl}/tasks`, () =>
        HttpResponse.json(
          paginatedTasks([
            {
              ...initialTasks[0],
              status: changed ? 'done' : 'pending',
              version: changed ? 2 : 1,
            },
          ]),
        ),
      ),
      http.patch(`${apiUrl}/tasks/:id/status`, async ({ request }) => {
        expect(await request.json()).toEqual({
          status: 'in_progress',
          version: 1,
        })
        changed = true
        return new HttpResponse(null, { status: 409 })
      }),
    )
    renderDashboard()
    await screen.findByText('Preparar informe')
    await chooseMuiOption(
      user,
      'Cambiar estado de Preparar informe',
      'En curso',
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Otra persona actualizó esta tarea',
    )
    expect(
      screen.getByRole('combobox', {
        name: 'Cambiar estado de Preparar informe',
      }),
    ).toHaveTextContent('Hecha')
  })

  it('refreshes the selected filter after a status update finishes', async () => {
    const user = userEvent.setup()
    let completeUpdate: (() => void) | undefined
    const updateResponse = new Promise<void>((resolve) => {
      completeUpdate = resolve
    })
    const requestedStatuses: Array<string | null> = []
    let status: TaskStatus = 'pending'
    server.use(
      http.get(`${apiUrl}/tasks`, ({ request }) => {
        const filter = new URL(request.url).searchParams.get('status')
        requestedStatuses.push(filter)
        return HttpResponse.json(
          paginatedTasks(
            filter === 'pending' && status !== 'pending'
              ? []
              : [{ ...initialTasks[0], status }],
          ),
        )
      }),
      http.patch(`${apiUrl}/tasks/:id/status`, async ({ request }) => {
        await updateResponse
        const body = (await request.json()) as { status: TaskStatus }
        status = body.status
        return HttpResponse.json({ ...initialTasks[0], status })
      }),
    )

    renderDashboard()
    await screen.findByText('Preparar informe')
    await chooseMuiOption(
      user,
      'Cambiar estado de Preparar informe',
      'En curso',
    )
    await chooseMuiOption(user, 'Filtrar tareas', 'Pendientes')
    await waitFor(() => expect(requestedStatuses).toContain('pending'))

    completeUpdate?.()

    await waitFor(() => expect(status).toBe('in_progress'))
    await waitFor(() =>
      expect(
        requestedStatuses.filter((filter) => filter === 'pending'),
      ).toHaveLength(2),
    )
  })
})
