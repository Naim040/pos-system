// Simple API cache and request deduplication utility
import { useState, useEffect } from 'react'

interface CacheEntry<T> {
  data: T
  timestamp: number
  promise?: Promise<T>
}

interface PendingRequest {
  promise: Promise<any>
  timestamp: number
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>()
  private pendingRequests = new Map<string, PendingRequest>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > this.defaultTTL
  }

  private generateKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET'
    const body = options?.body ? JSON.stringify(options.body) : ''
    return `${method}:${url}:${body}`
  }

  async get<T>(url: string, options?: RequestInit): Promise<T> {
    const key = this.generateKey(url, options)

    // Check if there's a pending request for the same key
    if (this.pendingRequests.has(key)) {
      const pending = this.pendingRequests.get(key)!
      // If the request is too old, remove it
      if (Date.now() - pending.timestamp > 10000) { // 10 seconds timeout
        this.pendingRequests.delete(key)
      } else {
        return pending.promise as Promise<T>
      }
    }

    // Check cache
    const cached = this.cache.get(key)
    if (cached && !this.isExpired(cached)) {
      return cached.data
    }

    // Create new request
    const promise = fetch(url, options)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.json()
      })
      .then(data => {
        // Cache the result
        this.cache.set(key, {
          data,
          timestamp: Date.now()
        })
        
        // Clean up pending request
        this.pendingRequests.delete(key)
        
        return data
      })
      .catch(error => {
        // Clean up pending request on error
        this.pendingRequests.delete(key)
        throw error
      })

    // Store pending request
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now()
    })

    return promise
  }

  post<T>(url: string, data: any): Promise<T> {
    const options: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
    return this.get<T>(url, options)
  }

  put<T>(url: string, data: any): Promise<T> {
    const options: RequestInit = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
    return this.get<T>(url, options)
  }

  delete<T>(url: string): Promise<T> {
    const options: RequestInit = {
      method: 'DELETE',
    }
    return this.get<T>(url, options)
  }

  // Clear cache for a specific URL or all cache
  clear(url?: string): void {
    if (url) {
      const keysToDelete: string[] = []
      for (const [key] of this.cache) {
        if (key.includes(url)) {
          keysToDelete.push(key)
        }
      }
      keysToDelete.forEach(key => this.cache.delete(key))
    } else {
      this.cache.clear()
    }
  }

  // Clean up expired entries
  cleanup(): void {
    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry)) {
        this.cache.delete(key)
      }
    }
  }
}

// Create a singleton instance
export const apiCache = new APICache()

// React hook for using the cache
export function useAPICache<T>(url: string, options?: RequestInit) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await apiCache.get<T>(url, options)
        if (isMounted) {
          setData(result)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [url, JSON.stringify(options)])

  return { data, loading, error, refetch: () => apiCache.get<T>(url, options) }
}

// Periodic cleanup
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiCache.cleanup()
  }, 60000) // Clean up every minute
}