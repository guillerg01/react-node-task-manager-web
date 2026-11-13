import { isAxiosError, isCancel } from 'axios'

type FailureKind = 'timeout' | 'network' | 'response'

export class RequestError extends Error {
  constructor(
    readonly kind: FailureKind,
    readonly status: number | undefined,
    cause: unknown,
  ) {
    super('HTTP request failed', { cause })
    this.name = 'RequestError'
  }
}

export function normalizeRequestError(error: unknown): unknown {
  if (isCancel(error) || !isAxiosError(error)) return error
  if (error.response)
    return new RequestError('response', error.response.status, error)
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new RequestError('timeout', undefined, error)
  }
  return new RequestError('network', undefined, error)
}

export function requestErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof RequestError)) return fallback
  if (error.status === 429)
    return 'Demasiadas solicitudes. Espera un momento y vuelve a intentarlo.'
  if (error.status === 400)
    return 'Revisa los datos enviados e inténtalo de nuevo.'
  if (error.status === 404)
    return 'La tarea ya no está disponible. Actualiza la lista.'
  if (error.status === 409)
    return 'Otra persona actualizó esta tarea. La lista se actualizó; revisa su estado antes de intentarlo de nuevo.'
  if (error.status && error.status >= 500)
    return 'El servidor no pudo completar la operación. Inténtalo de nuevo.'
  if (error.kind === 'timeout')
    return 'La solicitud tardó demasiado. Vuelve a intentarlo.'
  return fallback
}
