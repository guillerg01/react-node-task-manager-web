import axios from 'axios'
import { normalizeRequestError } from './requestError'

const configuredOrigin = import.meta.env.VITE_API_URL?.trim().replace(
  /\/+$/,
  '',
)
const apiOrigin =
  configuredOrigin || (import.meta.env.DEV ? 'http://localhost:3000' : '')

export const http = axios.create({
  baseURL: `${apiOrigin}/api`,
  timeout: 10_000,
})

http.interceptors.response.use(undefined, (error: unknown) =>
  Promise.reject(normalizeRequestError(error)),
)
