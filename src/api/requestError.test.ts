import { AxiosError, CanceledError } from 'axios'
import { describe, expect, it } from 'vitest'
import {
  normalizeRequestError,
  RequestError,
  requestErrorMessage,
} from './requestError'

describe('normalizeRequestError', () => {
  it.each([
    ['ECONNABORTED', 'timeout'],
    ['ERR_NETWORK', 'network'],
  ])('classifies %s as %s', (code, kind) => {
    const cause = new AxiosError('Request failed', code)
    expect(normalizeRequestError(cause)).toMatchObject({ kind, cause })
  })

  it('preserves cancellation', () => {
    const cancellation = new CanceledError()
    expect(normalizeRequestError(cancellation)).toBe(cancellation)
  })

  it.each([
    [400, 'Revisa los datos'],
    [404, 'ya no está disponible'],
    [429, 'Demasiadas solicitudes'],
    [500, 'El servidor no pudo completar'],
  ])('provides an actionable message for HTTP %s', (status, expected) => {
    expect(
      requestErrorMessage(
        new RequestError('response', status, undefined),
        'Fallback',
      ),
    ).toContain(expected)
  })
})
