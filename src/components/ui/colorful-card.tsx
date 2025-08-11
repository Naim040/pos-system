'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ColorfulCardProps {
  children: React.ReactNode
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'danger' | 'warning'
  variant?: 'solid' | 'gradient' | 'outline' | 'glass'
  animated?: boolean
  hoverEffect?: 'lift' | 'scale' | 'glow' | 'none'
  className?: string
  onClick?: () => void
}

const colorVariants = {
  primary: {
    solid: 'bg-blue-500 text-white',
    gradient: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white',
    outline: 'border-2 border-blue-500 text-blue-500',
    glass: 'bg-blue-500/10 backdrop-blur-sm border border-blue-500/20 text-blue-500'
  },
  secondary: {
    solid: 'bg-green-500 text-white',
    gradient: 'bg-gradient-to-br from-green-500 to-green-600 text-white',
    outline: 'border-2 border-green-500 text-green-500',
    glass: 'bg-green-500/10 backdrop-blur-sm border border-green-500/20 text-green-500'
  },
  accent: {
    solid: 'bg-orange-500 text-white',
    gradient: 'bg-gradient-to-br from-orange-500 to-orange-600 text-white',
    outline: 'border-2 border-orange-500 text-orange-500',
    glass: 'bg-orange-500/10 backdrop-blur-sm border border-orange-500/20 text-orange-500'
  },
  success: {
    solid: 'bg-emerald-500 text-white',
    gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white',
    outline: 'border-2 border-emerald-500 text-emerald-500',
    glass: 'bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20 text-emerald-500'
  },
  danger: {
    solid: 'bg-red-500 text-white',
    gradient: 'bg-gradient-to-br from-red-500 to-red-600 text-white',
    outline: 'border-2 border-red-500 text-red-500',
    glass: 'bg-red-500/10 backdrop-blur-sm border border-red-500/20 text-red-500'
  },
  warning: {
    solid: 'bg-yellow-500 text-white',
    gradient: 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white',
    outline: 'border-2 border-yellow-500 text-yellow-500',
    glass: 'bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/20 text-yellow-500'
  }
}

const hoverEffects = {
  lift: {
    whileHover: { y: -8, scale: 1.02 },
    transition: { type: "spring", stiffness: 300 }
  },
  scale: {
    whileHover: { scale: 1.05 },
    transition: { type: "spring", stiffness: 300 }
  },
  glow: {
    whileHover: { 
      boxShadow: "0 0 30px rgba(59, 130, 246, 0.5)",
      transition: { duration: 0.3 }
    }
  },
  none: {}
}

export function ColorfulCard({
  children,
  color = 'primary',
  variant = 'solid',
  animated = true,
  hoverEffect = 'lift',
  className,
  onClick
}: ColorfulCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const MotionDiv = animated ? motion.div : 'div'
  const hoverProps = animated ? hoverEffects[hoverEffect] : {}

  return (
    <MotionDiv
      className={cn(
        'relative overflow-hidden rounded-2xl p-6 cursor-pointer transition-all duration-300',
        colorVariants[color][variant],
        className
      )}
      {...hoverProps}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated Background Pattern */}
      {variant === 'glass' && (
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-y-12 animate-pulse"></div>
        </div>
      )}

      {/* Glow Effect */}
      {isHovered && hoverEffect === 'glow' && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm"></div>
      <div className="absolute bottom-2 left-2 w-4 h-4 rounded-full bg-white/20 backdrop-blur-sm"></div>
    </MotionDiv>
  )
}