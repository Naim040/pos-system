"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface LoadingContextType {
  isLoading: boolean
  setLoading: (loading: boolean) => void
  startLoading: () => void
  stopLoading: () => void
  withLoading: (fn: () => Promise<any>) => Promise<any>
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

interface LoadingProviderProps {
  children: ReactNode
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingCount, setLoadingCount] = useState(0)

  const setLoading = (loading: boolean) => {
    setIsLoading(loading)
  }

  const startLoading = () => {
    setLoadingCount(prev => prev + 1)
    setIsLoading(true)
  }

  const stopLoading = () => {
    setLoadingCount(prev => Math.max(0, prev - 1))
    if (loadingCount <= 1) {
      setIsLoading(false)
    }
  }

  const withLoading = async (fn: () => Promise<any>) => {
    startLoading()
    try {
      const result = await fn()
      return result
    } finally {
      stopLoading()
    }
  }

  return (
    <LoadingContext.Provider value={{
      isLoading,
      setLoading,
      startLoading,
      stopLoading,
      withLoading
    }}>
      {children}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}

// Loading overlay component
interface LoadingOverlayProps {
  isLoading: boolean
  message?: string
  children: ReactNode
}

export function LoadingOverlay({ isLoading, message = 'Loading...', children }: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6 flex items-center space-x-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-sm font-medium">{message}</span>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// Skeleton loading components
interface SkeletonProps {
  className?: string
  lines?: number
}

export function Skeleton({ className = '', lines = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-gray-200 rounded ${className}`}
          style={{
            height: lines === 1 ? '1rem' : '0.75rem',
            marginBottom: i < lines - 1 ? '0.5rem' : '0'
          }}
        />
      ))}
    </>
  )
}

export function ProductCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-4">
        <div className="space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-12" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="flex-1 h-4" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex space-x-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )
}

// Higher-order component for loading states
export function withLoading<P extends object>(
  Component: React.ComponentType<P>,
  loadingComponent?: React.ComponentType
) {
  return function WithLoading(props: P) {
    const { isLoading, ...rest } = props as any
    const LoadingComponent = loadingComponent || DefaultLoadingComponent

    if (isLoading) {
      return <LoadingComponent />
    }

    return <Component {...rest} />
  }
}

function DefaultLoadingComponent() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  )
}

// Hook for managing multiple loading states
export function useMultiLoading() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})

  const setLoading = (key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading
    }))
  }

  const isLoading = (key: string) => loadingStates[key] || false
  const isAnyLoading = Object.values(loadingStates).some(Boolean)

  return {
    setLoading,
    isLoading,
    isAnyLoading,
    loadingStates
  }
}