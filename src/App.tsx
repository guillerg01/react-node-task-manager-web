import TaskDashboard from './features/tasks/components/TaskDashboard'
import { NotificationProvider } from './shared/notifications/NotificationProvider'
import { QueryProvider } from './app/QueryProvider'

export default function App() {
  return (
    <QueryProvider>
      <NotificationProvider>
        <TaskDashboard />
      </NotificationProvider>
    </QueryProvider>
  )
}
