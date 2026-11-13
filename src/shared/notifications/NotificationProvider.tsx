import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { NotificationContext } from './useNotification'
import type { Notify, Severity } from './useNotification'

type Notification = { message: string; severity: Severity }

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Notification[]>([])
  const [displayId, setDisplayId] = useState(0)
  const current = queue[0]

  const notify: Notify = (message, severity = 'info') => {
    setQueue((items) => [...items, { message, severity }])
  }

  function dismiss() {
    setQueue((items) => items.slice(1))
    setDisplayId((id) => id + 1)
  }

  return (
    <NotificationContext.Provider value={notify}>
      {children}
      {current && (
        <Snackbar
          key={displayId}
          open
          autoHideDuration={5000}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          onClose={(_, reason) => {
            if (reason !== 'clickaway') dismiss()
          }}
        >
          <Alert
            severity={current.severity}
            role={current.severity === 'error' ? 'alert' : 'status'}
            onClose={dismiss}
            closeText="Cerrar notificación"
          >
            {current.message}
          </Alert>
        </Snackbar>
      )}
    </NotificationContext.Provider>
  )
}
