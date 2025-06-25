'use client'

import { useState, useEffect } from 'react'

export interface ToastState {
  show: boolean
  message: string
  type: 'success' | 'error' | 'info'
  isClosing: boolean
}

interface ToastProps {
  toast: ToastState
  onClose: () => void
}

export default function Toast({ toast, onClose }: ToastProps) {
  if (!toast.show) return null

  return (
    <div className={`fixed top-4 left-4 right-4 z-50 transition-all duration-300 ease-in-out transform ${
      toast.isClosing ? 'animate-fade-out-up' : 'animate-fade-in-down'
    }`}>
      <div className={`shadow-lg rounded-xl border ${
        toast.type === 'success' 
          ? 'bg-white text-green-600 border-green-200' 
          : toast.type === 'error'
          ? 'bg-white text-red-600 border-red-200'
          : 'bg-white text-blue-600 border-blue-200'
      } backdrop-blur-sm bg-opacity-95`}>
        <div className="flex items-center gap-3 p-4">
          <div className="text-lg">
            {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm leading-tight">{toast.message}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 h-6 w-6 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook สำหรับใช้ Toast
export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'info',
    isClosing: false
  })

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, message, type, isClosing: false })
    setTimeout(() => {
      // Start closing animation
      setToast(prev => ({ ...prev, isClosing: true }))
      // Hide after animation completes
      setTimeout(() => {
        setToast(prev => ({ ...prev, show: false, isClosing: false }))
      }, 300) // Animation duration
    }, 2000) // Show for 2 seconds
  }

  const hideToast = () => {
    setToast(prev => ({ ...prev, isClosing: true }))
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false, isClosing: false }))
    }, 300)
  }

  return { toast, showToast, hideToast }
}
