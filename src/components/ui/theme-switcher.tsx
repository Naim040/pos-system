'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

interface ThemeSwitcherProps {
  className?: string
}

const themes = [
  {
    name: 'light',
    label: 'Light',
    icon: '☀️',
    colors: {
      primary: '#3B82F6',
      secondary: '#10B981',
      accent: '#F59E0B'
    }
  },
  {
    name: 'dark',
    label: 'Dark',
    icon: '🌙',
    colors: {
      primary: '#60A5FA',
      secondary: '#34D399',
      accent: '#FBBF24'
    }
  },
  {
    name: 'colorful',
    label: 'Colorful',
    icon: '🌈',
    colors: {
      primary: '#8B5CF6',
      secondary: '#EC4899',
      accent: '#F59E0B'
    }
  },
  {
    name: 'ocean',
    label: 'Ocean',
    icon: '🌊',
    colors: {
      primary: '#06B6D4',
      secondary: '#3B82F6',
      accent: '#10B981'
    }
  },
  {
    name: 'sunset',
    label: 'Sunset',
    icon: '🌅',
    colors: {
      primary: '#F97316',
      secondary: '#EF4444',
      accent: '#F59E0B'
    }
  }
]

export function ThemeSwitcher({ className }: ThemeSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  const currentTheme = themes.find(t => t.name === theme) || themes[0]

  const handleThemeChange = (themeName: string) => {
    setTheme(themeName)
    setIsOpen(false)
  }

  return (
    <div className={cn('relative', className)}>
      {/* Current Theme Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg',
          'bg-white/10 backdrop-blur-sm border border-white/20',
          'hover:bg-white/20 transition-all duration-300'
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="text-xl">{currentTheme.icon}</span>
        <span className="text-sm font-medium">{currentTheme.label}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          ▼
        </motion.span>
      </motion.button>

      {/* Theme Options Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'absolute top-full mt-2 right-0',
              'bg-white/95 backdrop-blur-md border border-white/20',
              'rounded-xl shadow-2xl overflow-hidden',
              'min-w-[200px] z-50'
            )}
          >
            {themes.map((themeOption) => (
              <motion.button
                key={themeOption.name}
                onClick={() => handleThemeChange(themeOption.name)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3',
                  'hover:bg-gray-100/50 transition-colors duration-200',
                  'text-left'
                )}
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-xl">{themeOption.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{themeOption.label}</div>
                  <div className="flex gap-1 mt-1">
                    {Object.values(themeOption.colors).map((color, index) => (
                      <div
                        key={index}
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                {theme === themeOption.name && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-green-500"
                  >
                    ✓
                  </motion.span>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Colors */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex gap-1">
        {Object.values(currentTheme.colors).map((color, index) => (
          <div
            key={index}
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  )
}

// Custom Theme Provider Component
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  )
}