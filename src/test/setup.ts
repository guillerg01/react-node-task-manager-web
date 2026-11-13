import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { http as apiHttp } from '../api/http'
import { server } from './server'

apiHttp.defaults.adapter = 'fetch'

beforeAll(() => server.listen())
afterEach(() => {
  cleanup()
  server.resetHandlers()
  localStorage.clear()
})
afterAll(() => server.close())
