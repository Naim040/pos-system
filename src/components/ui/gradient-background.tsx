'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GradientBackgroundProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'accent' | 'sunset' | 'ocean' | 'forest' | 'custom'
  customColors?: string[]
  animated?: boolean
  intensity?: 'low' | 'medium' | 'high'
  className?: string
}

const gradientVariants = {
  primary: ['from-blue-500', 'via-blue-600', 'to-blue-700'],
  secondary: ['from-green-500', 'via-green-600', 'to-green-700'],
  accent: ['from-orange-500', 'via-orange-600', 'to-orange-700'],
  sunset: ['from-pink-500', 'via-orange-500', 'to-yellow-500'],
  ocean: ['from-blue-600', 'via-cyan-500', 'to-teal-500'],
  forest: ['from-green-600', 'via-emerald-500', 'to-teal-600'],
  custom: []
}

const intensityMap = {
  low: 'opacity-20',
  medium: 'opacity-40',
  high: 'opacity-60'
}

export function GradientBackground({
  children,
  variant = 'primary',
  customColors,
  animated = true,
  intensity = 'medium',
  className
}: GradientBackgroundProps) {
  const colors = customColors || gradientVariants[variant]
  
  const gradientClass = customColors 
    ? `bg-gradient-to-br ${customColors.join(' ')}`
    : `bg-gradient-to-br ${colors.join(' ')}`

  const MotionDiv = animated ? motion.div : 'div'

  const animationVariants = {
    initial: { backgroundPosition: '0% 50%' },
    animate: { 
      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
      transition: {
        duration: 15,
        repeat: Infinity,
        ease: 'linear'
      }
    }
  }

  return (
    <div className={cn('relative min-h-screen', className)}>
      {/* Main Gradient Background */}
      <MotionDiv
        className={cn(
          'absolute inset-0',
          gradientClass,
          intensityMap[intensity],
          'bg-[length:200%_200%]'
        )}
        variants={animated ? animationVariants : undefined}
        initial={animated ? 'initial' : undefined}
        animate={animated ? 'animate' : undefined}
      />

      {/* Animated Orbs */}
      {animated && (
        <>
          <motion.div
            className="absolute top-20 left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          <motion.div
            className="absolute bottom-20 right-20 w-96 h-96 bg-green-500/20 rounded-full blur-3xl"
            animate={{
              x: [0, -100, 0],
              y: [0, 50, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl"
            animate={{
              x: [0, 50, -50, 0],
              y: [0, 30, -30, 0],
              scale: [1, 0.8, 1.2, 1]
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        </>
      )}

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Floating Elements */}
      {animated && (
        <>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/30 rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100, 0],
                opacity: [0, 1, 0],
                scale: [0, 1, 0]
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: 'easeInOut'
              }}
            />
          ))}
        </>
      )}
    </div>
  )
}