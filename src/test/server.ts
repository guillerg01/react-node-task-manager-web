import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

export const apiUrl = 'http://localhost:3000/api'

export const server = setupServer(
  http.get(`${apiUrl}/tasks`, () =>
    HttpResponse.json({ items: [], page: 1, pageSize: 10, total: 0 }),
  ),
  http.post(`${apiUrl}/tasks`, async ({ request }) => {
    const task = await request.json()
    return HttpResponse.json(
      {
        id: crypto.randomUUID(),
        ...(task as object),
        status: 'pending',
        version: 1,
      },
      { status: 201 },
    )
  }),
  http.patch(`${apiUrl}/tasks/:id/status`, async ({ request, params }) => {
    const body = (await request.json()) as { status: string }
    return HttpResponse.json({
      id: params.id,
      title: 'Tarea de prueba',
      assignee: 'Ana',
      status: body.status,
      version: 2,
    })
  }),
)
