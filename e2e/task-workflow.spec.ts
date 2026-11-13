import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'

test('creates a task, changes its status, and restores the filter after reload', async ({
  page,
}) => {
  const title = `Browser check ${randomUUID()}`
  await page.goto('/')

  const submit = page.getByRole('button', { name: 'Agregar tarea' })
  await submit.click()
  await expect(page.getByText('Escribe un nombre para la tarea.')).toBeVisible()
  await expect(
    page.getByText('Escribe quién realizará esta tarea.'),
  ).toBeVisible()

  await page.getByRole('textbox', { name: 'Nombre de la tarea' }).fill(title)
  await page
    .getByRole('textbox', { name: 'Persona asignada' })
    .fill('Browser Test')
  await submit.click()

  const status = page.getByRole('combobox', {
    name: `Cambiar estado de ${title}`,
  })
  await expect(status).toHaveText('Pendiente')
  await expect(page.getByText('La tarea se creó correctamente.')).toBeVisible()
  await page.getByRole('button', { name: 'Cerrar notificación' }).click()
  await expect(page.getByText('La tarea se creó correctamente.')).toHaveCount(0)
  await status.click()
  await page.getByRole('option', { name: 'En curso', exact: true }).click()
  await expect(status).toHaveText('En curso')

  const filter = page.getByRole('combobox', { name: 'Filtrar tareas' })
  await filter.click()
  await page.getByRole('option', { name: 'Pendientes', exact: true }).click()
  await expect(status).toHaveCount(0)
  await filter.click()
  await page.getByRole('option', { name: 'En curso', exact: true }).click()
  await expect(status).toBeVisible()

  await page.reload()
  await expect(filter).toHaveText('En curso')
  await expect(status).toHaveText('En curso')
})

test('retries a failed read and retains a rejected draft', async ({ page }) => {
  let failRead = true
  await page.route('**/api/tasks?*', async (route) => {
    if (failRead) {
      failRead = false
      await route.fulfill({ status: 503, json: { message: 'Unavailable' } })
    } else {
      await route.continue()
    }
  })
  await page.goto('/')
  await expect(page.getByText('No pudimos cargar las tareas')).toBeVisible()
  await page.getByRole('button', { name: 'Reintentar' }).click()
  await expect(page.getByText('No pudimos cargar las tareas')).toHaveCount(0)
  await expect(
    page.getByRole('status').filter({ hasText: 'Cargando tareas' }),
  ).toHaveCount(0)

  await page.route('**/api/tasks', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 500, json: { message: 'Unavailable' } })
    } else {
      await route.continue()
    }
  })
  const title = page.getByRole('textbox', { name: 'Nombre de la tarea' })
  const assignee = page.getByRole('textbox', { name: 'Persona asignada' })
  await title.fill('Conservar borrador')
  await assignee.fill('Ana')
  await page.getByRole('button', { name: 'Agregar tarea' }).click()
  await expect(page.getByRole('alert')).toContainText(
    'El servidor no pudo completar la operación',
  )
  await expect(title).toHaveValue('Conservar borrador')
  await expect(assignee).toHaveValue('Ana')
})

test('uses database pages and resets the page after changing the filter', async ({
  page,
  request,
}) => {
  const apiOrigin = process.env.E2E_API_URL ?? 'http://localhost:3001'
  const prefix = randomUUID()
  for (let index = 0; index < 11; index += 1) {
    const response = await request.post(`${apiOrigin}/api/tasks`, {
      data: { title: `Page ${prefix} ${index}`, assignee: 'Browser Test' },
    })
    expect(response.status()).toBe(201)
  }

  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: `Page ${prefix} 10`, exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Página siguiente' }).click()
  await expect(
    page.getByRole('heading', { name: `Page ${prefix} 0`, exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Página anterior' }).click()
  await expect(
    page.getByRole('heading', { name: `Page ${prefix} 10`, exact: true }),
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Ir a la página 2', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { name: `Page ${prefix} 0`, exact: true }),
  ).toBeVisible()
  await page.getByRole('combobox', { name: 'Filtrar tareas' }).click()
  await page.getByRole('option', { name: 'Pendientes', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: `Page ${prefix} 10`, exact: true }),
  ).toBeVisible()
})
