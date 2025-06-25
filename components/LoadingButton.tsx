'use client'

import { ReactNode } from 'react'
import LoadingSpinner from './LoadingSpinner'

interface LoadingButtonProps {
  children: ReactNode
  isLoading: boolean
  loadingText?: string
  onClick?: () => void
  type?: 'button' | 'submit'
  className?: string
  style?: React.CSSProperties
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  icon?: ReactNode
}

const LoadingButton = ({
  children,
  isLoading,
  loadingText = 'กำลังโหลด...',
  onClick,
  type = 'button',
  className = '',
  style,
  disabled,
  size = 'md',
  variant = 'primary',
  icon
}: LoadingButtonProps) => {
  const sizeClasses = {
    sm: 'btn-sm px-3 py-1.5 text-sm',
    md: 'btn-md px-4 py-2',
    lg: 'btn-lg px-6 py-3 text-lg'
  }

  const variantClasses = {
    primary: 'btn text-white',
    secondary: 'btn btn-secondary',
    outline: 'btn btn-outline',
    ghost: 'btn btn-ghost'
  }

  // Determine spinner color and text style based on variant
  const getSpinnerColor = () => {
    if (variant === 'outline' || variant === 'ghost') {
      return 'primary'
    }
    return 'white'
  }

  const getLoadingTextStyle = () => {
    if (variant === 'outline' || variant === 'ghost') {
      return 'font-semibold text-gray-800 drop-shadow-sm'
    }
    return 'font-semibold text-white drop-shadow-sm'
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${variantClasses[variant]} ${sizeClasses[size]} shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${className}`}
      style={style}
      disabled={isLoading || disabled}
    >
      {isLoading ? (
        <div className="flex items-center gap-3">
          <LoadingSpinner size="sm" color={getSpinnerColor()} />
          <span className={getLoadingTextStyle()}>{loadingText}</span>
        </div>
      ) : (
        <span className="flex items-center gap-2">
          {icon && icon}
          {children}
        </span>
      )}
    </button>
  )
}

export default LoadingButton
