'use client'

import { useState, useEffect } from 'react'
import { 
  FiCheckCircle, FiAlertTriangle, FiClock, FiBook, 
  FiTarget, FiTrendingUp, FiX, FiBell
} from 'react-icons/fi'

interface TaskNotification {
  id: string
  type: 'success' | 'warning' | 'info'
  title: string
  message: string
  action?: {
    label: string
    onClick: () => void
  }
  autoHide?: boolean
  duration?: number
}

interface TaskNotificationSystemProps {
  notifications: TaskNotification[]
  onRemove: (id: string) => void
}

export default function TaskNotificationSystem({ notifications, onRemove }: TaskNotificationSystemProps) {
  const [visibleNotifications, setVisibleNotifications] = useState<TaskNotification[]>([])

  useEffect(() => {
    setVisibleNotifications(notifications)
    
    // Auto-hide notifications
    notifications.forEach(notification => {
      if (notification.autoHide !== false) {
        const duration = notification.duration || 8000
        setTimeout(() => {
          onRemove(notification.id)
        }, duration)
      }
    })
  }, [notifications, onRemove])

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <FiCheckCircle className="text-green-500" size={24} />
      case 'warning':
        return <FiAlertTriangle className="text-orange-500" size={24} />
      case 'info':
        return <FiBell className="text-blue-500" size={24} />
      default:
        return <FiBell className="text-gray-500" size={24} />
    }
  }

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'warning':
        return 'bg-orange-50 border-orange-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  if (visibleNotifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      {visibleNotifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            ${getBackgroundColor(notification.type)}
            border rounded-lg shadow-lg p-4 animate-slide-in-right
            transition-all duration-300 transform hover:scale-105
          `}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(notification.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 text-sm">
                {notification.title}
              </h4>
              <p className="text-gray-700 text-sm mt-1 leading-relaxed">
                {notification.message}
              </p>
              
              {notification.action && (
                <button
                  onClick={notification.action.onClick}
                  className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-800 
                           underline underline-offset-2 hover:underline-offset-4 transition-all"
                >
                  {notification.action.label}
                </button>
              )}
            </div>
            
            <button
              onClick={() => onRemove(notification.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors
                       p-1 hover:bg-white rounded-full"
            >
              <FiX size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// Hook to manage notifications
export function useTaskNotifications() {
  const [notifications, setNotifications] = useState<TaskNotification[]>([])

  const addNotification = (notification: Omit<TaskNotification, 'id'>) => {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newNotification = { ...notification, id }
    
    setNotifications(prev => [...prev, newNotification])
    return id
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const addTaskAssignmentNotification = (subjectName: string, studyTime: number) => {
    return addNotification({
      type: 'warning',
      title: '📚 Improvement Task Assigned',
      message: `You've been assigned a ${studyTime}-minute study task for ${subjectName} due to performance below 50%. Complete the generated MCQs and study materials to improve your CO scores.`,
      action: {
        label: 'View Task Details',
        onClick: () => {
          // Navigate to tasks page or open modal
          console.log('Navigate to task details')
        }
      },
      autoHide: false // Keep visible until user dismisses
    })
  }

  const addSuccessNotification = (message: string) => {
    return addNotification({
      type: 'success',
      title: '✅ Success',
      message,
      autoHide: true,
      duration: 5000
    })
  }

  const addErrorNotification = (message: string) => {
    return addNotification({
      type: 'warning',
      title: '⚠️ Attention Required',
      message,
      autoHide: true,
      duration: 8000
    })
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    addTaskAssignmentNotification,
    addSuccessNotification,
    addErrorNotification
  }
}