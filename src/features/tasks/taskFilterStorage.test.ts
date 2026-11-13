import { afterEach, describe, expect, it, vi } from 'vitest'
import { readTaskFilter, writeTaskFilter } from './taskFilterStorage'

const storageKey = 'task-manager:filter:v1'

describe('task filter storage', () => {
  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('returns all when no preference is stored', () => {
    expect(readTaskFilter()).toBe('all')
  })

  it.each(['all', 'pending', 'in_progress', 'done'] as const)(
    'round trips the %s filter',
    (filter) => {
      writeTaskFilter(filter)
      expect(localStorage.getItem(storageKey)).toBe(filter)
      expect(readTaskFilter()).toBe(filter)
    },
  )

  it.each(['', 'invalid', 'ALL', 'complete'])(
    'falls back to all for an invalid stored value: %s',
    (value) => {
      localStorage.setItem(storageKey, value)
      expect(readTaskFilter()).toBe('all')
    },
  )

  it('falls back to all when reading local storage is denied', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError')
    })
    expect(readTaskFilter()).toBe('all')
  })

  it('does not throw when writing local storage is denied', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError')
    })
    expect(() => writeTaskFilter('done')).not.toThrow()
  })
})
