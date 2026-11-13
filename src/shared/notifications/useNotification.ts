import { createContext, useContext } from 'react'

export type Severity = 'success' | 'error' | 'warning' | 'info'
export type Notify = (message: string, severity?: Severity) => void

export const NotificationContext = createContext<Notify | null>(null)

export function useNotification() {
  return useContext(NotificationContext)
}
