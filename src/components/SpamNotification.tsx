'use client'

import { useEffect } from 'react'

interface SpamNotificationProps {
  message: string
  show: boolean
  onClose: () => void
}

export default function SpamNotification({ message, show, onClose }: SpamNotificationProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose()
      }, 5000) // Auto hide after 5 seconds

      return () => clearTimeout(timer)
    }
  }, [show, onClose])

  if (!show) return null

  return (
    <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-[70] max-w-sm">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-red-500">⚠️</span>
        </div>
        <div className="ml-2 flex-1">
          <p className="text-sm font-medium">Tin nhắn bị từ chối</p>
          <p className="text-xs mt-1">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-2 flex-shrink-0 text-red-500 hover:text-red-700"
        >
          ×
        </button>
      </div>
    </div>
  )
}
