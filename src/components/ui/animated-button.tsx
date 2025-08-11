'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AnimatedButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'danger' | 'warning' | 'ghost'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  animated?: boolean
  loading?: boolean
  disabled?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  className?: string
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

const variants = {
  primary: {
    solid: 'bg-blue-500 hover:bg-blue-600 text-white',
    gradient: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white',
    outline: 'border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white',
    ghost: 'text-blue-500 hover:bg-blue-500/10'
  },
  secondary: {
    solid: 'bg-green-500 hover:bg-green-600 text-white',
    gradient: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white',
    outline: 'border-2 border-green-500 text-green-500 hover:bg-green-500 hover:text-white',
    ghost: 'text-green-500 hover:bg-green-500/10'
  },
  accent: {
    solid: 'bg-orange-500 hover:bg-orange-600 text-white',
    gradient: 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white',
    outline: 'border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white',
    ghost: 'text-orange-500 hover:bg-orange-500/10'
  },
  success: {
    solid: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    gradient: 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white',
    outline: 'border-2 border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-white',
    ghost: 'text-emerald-500 hover:bg-emerald-500/10'
  },
  danger: {
    solid: 'bg-red-500 hover:bg-red-600 text-white',
    gradient: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white',
    outline: 'border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white',
    ghost: 'text-red-500 hover:bg-red-500/10'
  },
  warning: {
    solid: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    gradient: 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white',
    outline: 'border-2 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white',
    ghost: 'text-yellow-500 hover:bg-yellow-500/10'
  },
  ghost: {
    solid: 'bg-gray-500 hover:bg-gray-600 text-white',
    gradient: 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white',
    outline: 'border-2 border-gray-500 text-gray-500 hover:bg-gray-500 hover:text-white',
    ghost: 'text-gray-500 hover:bg-gray-500/10'
  }
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl'
}

export function AnimatedButton({
  children,
  variant = 'primary',
  size = 'md',
  animated = true,
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  className,
  onClick,
  type = 'button'
}: AnimatedButtonProps) {
  const MotionButton = animated ? motion.button : 'button'

  const buttonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  }

  const loadingVariants = {
    initial: { rotate: 0 },
    animate: { rotate: 360 }
  }

  return (
    <MotionButton
      type={type}
      disabled={disabled || loading}
      className={cn(
        'relative inline-flex items-center justify-center font-medium rounded-lg transition-all duration-300',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizes[size],
        variants[variant].gradient,
        className
      )}
      variants={animated ? buttonVariants : undefined}
      initial={animated ? 'initial' : undefined}
      whileHover={animated && !disabled && !loading ? 'hover' : undefined}
      whileTap={animated && !disabled && !loading ? 'tap' : undefined}
      onClick={onClick}
    >
      {/* Loading Spinner */}
      {loading && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          variants={loadingVariants}
          animate="animate"
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </motion.div>
      )}

      {/* Icon */}
      {icon && !loading && (
        <span className={cn(
          'flex items-center',
          iconPosition === 'left' ? 'mr-2' : 'ml-2'
        )}>
          {icon}
        </span>
      )}

      {/* Text */}
      <span className={loading ? 'invisible' : 'visible'}>
        {children}
      </span>

      {/* Ripple Effect */}
      {animated && (
        <motion.div
          className="absolute inset-0 rounded-lg bg-white/20"
          initial={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1, opacity: 0.1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </MotionButton>
  )
}