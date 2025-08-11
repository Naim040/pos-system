'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ColorfulChartProps {
  data: any[]
  type: 'bar' | 'pie' | 'line'
  title?: string
  colors?: string[]
  animated?: boolean
  className?: string
}

const defaultColors = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'
]

const chartColors = {
  primary: ['#3B82F6', '#60A5FA', '#93C5FD', '#DBEAFE'],
  secondary: ['#10B981', '#34D399', '#6EE7B7', '#D1FAE5'],
  accent: ['#F59E0B', '#FBBF24', '#FCD34D', '#FEF3C7'],
  success: ['#22C55E', '#4ADE80', '#86EFAC', '#DCFCE7'],
  danger: ['#EF4444', '#F87171', '#FCA5A5', '#FEE2E2'],
  warning: ['#F97316', '#FB923C', '#FDBA74', '#FED7AA'],
  rainbow: ['#EF4444', '#F59E0B', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899']
}

export function ColorfulChart({
  data,
  type,
  title,
  colors = defaultColors,
  animated = true,
  className
}: ColorfulChartProps) {
  const MotionDiv = animated ? motion.div : 'div'

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.7)" />
              <YAxis stroke="rgba(255,255,255,0.7)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Bar dataKey="value" fill={colors[0]} />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.7)" />
              <YAxis stroke="rgba(255,255,255,0.7)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={colors[0]}
                strokeWidth={3}
                dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: colors[1] }}
              />
            </LineChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  return (
    <MotionDiv
      className={cn(
        'bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6',
        className
      )}
      initial={animated ? { opacity: 0, y: 20 } : undefined}
      animate={animated ? { opacity: 1, y: 0 } : undefined}
      transition={animated ? { duration: 0.5 } : undefined}
    >
      {title && (
        <motion.h3
          className="text-lg font-semibold mb-4 text-white"
          initial={animated ? { opacity: 0 } : undefined}
          animate={animated ? { opacity: 1 } : undefined}
          transition={animated ? { delay: 0.2 } : undefined}
        >
          {title}
        </motion.h3>
      )}
      
      <motion.div
        initial={animated ? { opacity: 0, scale: 0.9 } : undefined}
        animate={animated ? { opacity: 1, scale: 1 } : undefined}
        transition={animated ? { delay: 0.3 } : undefined}
      >
        {renderChart()}
      </motion.div>

      {/* Animated Stats */}
      {data.length > 0 && (
        <motion.div
          className="grid grid-cols-2 gap-4 mt-6"
          initial={animated ? { opacity: 0 } : undefined}
          animate={animated ? { opacity: 1 } : undefined}
          transition={animated ? { delay: 0.5 } : undefined}
        >
          {data.slice(0, 4).map((item, index) => (
            <motion.div
              key={index}
              className="flex items-center gap-2"
              initial={animated ? { x: -20, opacity: 0 } : undefined}
              animate={animated ? { x: 0, opacity: 1 } : undefined}
              transition={animated ? { delay: 0.6 + index * 0.1 } : undefined}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-sm text-gray-300">{item.name}</span>
              <span className="text-sm font-semibold text-white ml-auto">
                {item.value}
              </span>
            </motion.div>
          ))}
        </motion.div>
      )}
    </MotionDiv>
  )
}

// Animated Stat Card Component
export function AnimatedStatCard({
  title,
  value,
  change,
  icon,
  color = 'primary',
  className
}: {
  title: string
  value: string | number
  change?: number
  icon?: React.ReactNode
  color?: string
  className?: string
}) {
  const colorMap = {
    primary: 'text-blue-500',
    secondary: 'text-green-500',
    accent: 'text-orange-500',
    success: 'text-emerald-500',
    danger: 'text-red-500',
    warning: 'text-yellow-500'
  }

  return (
    <motion.div
      className={cn(
        'bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6',
        'hover:bg-white/10 transition-all duration-300',
        className
      )}
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={cn('text-2xl', colorMap[color as keyof typeof colorMap])}>
          {icon}
        </div>
        {change && (
          <motion.span
            className={cn(
              'text-sm font-medium px-2 py-1 rounded-full',
              change > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            )}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            {change > 0 ? '+' : ''}{change}%
          </motion.span>
        )}
      </div>
      
      <motion.h3
        className="text-sm text-gray-400 mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {title}
      </motion.h3>
      
      <motion.div
        className="text-2xl font-bold text-white"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
      >
        {value}
      </motion.div>
    </motion.div>
  )
}