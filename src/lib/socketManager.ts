// Optimized Socket.IO connection manager
import { useState, useEffect } from 'react'

type SocketEventHandler = (data: any) => void
type SocketErrorhandler = (error: any) => void

interface SocketConfig {
  url?: string
  reconnectAttempts?: number
  reconnectDelay?: number
  timeout?: number
}

interface SocketEventListeners {
  connect?: SocketEventHandler
  disconnect?: SocketEventHandler
  error?: SocketErrorhandler
  [key: string]: SocketEventHandler | SocketErrorhandler | undefined
}

class SocketManager {
  private socket: any = null
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000
  private timeout = 10000
  private eventListeners: Map<string, SocketEventHandler[]> = new Map()
  private connectionPromise: Promise<void> | null = null

  constructor(config: SocketConfig = {}) {
    this.maxReconnectAttempts = config.reconnectAttempts || 5
    this.reconnectDelay = config.reconnectDelay || 3000
    this.timeout = config.timeout || 10000
  }

  async connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise
    }

    this.connectionPromise = this.establishConnection()
    return this.connectionPromise
  }

  private async establishConnection(): Promise<void> {
    try {
      // Dynamic import to avoid SSR issues
      const { io } = await import('socket.io-client')
      
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000'
      
      this.socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        timeout: this.timeout,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      })

      // Set up event listeners
      this.socket.on('connect', () => {
        console.log('Socket connected')
        this.isConnected = true
        this.reconnectAttempts = 0
        this.emit('connect', { socketId: this.socket.id })
      })

      this.socket.on('disconnect', (reason: string) => {
        console.log('Socket disconnected:', reason)
        this.isConnected = false
        this.emit('disconnect', { reason })
      })

      this.socket.on('error', (error: any) => {
        console.error('Socket error:', error)
        this.emit('error', error)
      })

      // Set up a connection timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Socket connection timeout'))
        }, this.timeout)
      })

      // Wait for connection or timeout
      await Promise.race([
        new Promise<void>((resolve) => {
          this.socket.on('connect', resolve)
        }),
        timeoutPromise
      ])

    } catch (error) {
      console.error('Failed to establish socket connection:', error)
      this.connectionPromise = null
      throw error
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
      this.connectionPromise = null
    }
  }

  on(event: string, handler: SocketEventHandler): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(handler)

    // If socket is already connected, add the listener directly
    if (this.socket && this.isConnected) {
      this.socket.on(event, handler)
    }
  }

  off(event: string, handler?: SocketEventHandler): void {
    if (!this.eventListeners.has(event)) return

    const listeners = this.eventListeners.get(event)!
    if (handler) {
      const index = listeners.indexOf(handler)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    } else {
      listeners.length = 0
    }

    // Remove from socket if it exists
    if (this.socket) {
      this.socket.off(event, handler)
    }
  }

  emit(event: string, data?: any): void {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data)
    } else {
      console.warn('Socket not connected, cannot emit event:', event)
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error(`Error in socket event handler for ${event}:`, error)
        }
      })
    }
  }

  joinRoom(room: string): void {
    if (this.isConnected) {
      this.emit('join-room', room)
    }
  }

  leaveRoom(room: string): void {
    if (this.isConnected) {
      this.emit('leave-room', room)
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected
  }
}

// Create a singleton instance
export const socketManager = new SocketManager()

// React hook for using the socket manager
export function useSocketManager(eventListeners: SocketEventListeners = {}) {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Set up event listeners
    const listeners: { event: string; handler: SocketEventHandler }[] = []

    Object.entries(eventListeners).forEach(([event, handler]) => {
      if (handler) {
        const wrappedHandler: SocketEventHandler = (data) => {
          try {
            handler(data)
          } catch (error) {
            console.error(`Error in socket event handler for ${event}:`, error)
          }
        }
        
        socketManager.on(event, wrappedHandler)
        listeners.push({ event, handler: wrappedHandler })
      }
    })

    // Connection status listener
    const connectHandler = () => setIsConnected(true)
    const disconnectHandler = () => setIsConnected(false)

    socketManager.on('connect', connectHandler)
    socketManager.on('disconnect', disconnectHandler)

    // Connect to socket
    socketManager.connect().catch(error => {
      console.error('Failed to connect to socket:', error)
    })

    // Cleanup
    return () => {
      listeners.forEach(({ event, handler }) => {
        socketManager.off(event, handler)
      })
      socketManager.off('connect', connectHandler)
      socketManager.off('disconnect', disconnectHandler)
    }
  }, [JSON.stringify(eventListeners)])

  return {
    isConnected,
    socket: socketManager,
    joinRoom: socketManager.joinRoom.bind(socketManager),
    leaveRoom: socketManager.leaveRoom.bind(socketManager),
    emit: socketManager.emit.bind(socketManager),
    on: socketManager.on.bind(socketManager),
    off: socketManager.off.bind(socketManager)
  }
}