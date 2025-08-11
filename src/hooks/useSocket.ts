"use client"

import { useEffect, useRef, useState } from 'react'

interface UseSocketProps {
  rooms?: string[]
  onConnect?: () => void
  onDisconnect?: () => void
  onInventoryUpdate?: (data: any) => void
  onSaleCreated?: (data: any) => void
  onCustomerUpdated?: (data: any) => void
  onProductUpdated?: (data: any) => void
  onLowStockAlert?: (data: any) => void
  onError?: (error: any) => void
}

export const useSocket = ({
  rooms = [],
  onConnect,
  onDisconnect,
  onInventoryUpdate,
  onSaleCreated,
  onCustomerUpdated,
  onProductUpdated,
  onLowStockAlert,
  onError
}: UseSocketProps = {}) => {
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<any>(null)

  useEffect(() => {
    // Initialize socket connection
    const initSocket = async () => {
      try {
        const { io } = await import('socket.io-client')
        
        socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
          transports: ['websocket', 'polling']
        })

        const socket = socketRef.current

        // Connection events
        socket.on('connect', () => {
          setIsConnected(true)
          console.log('Socket connected')
          
          // Join specified rooms
          rooms.forEach(room => {
            socket.emit('join-room', room)
          })
          
          onConnect?.()
        })

        socket.on('disconnect', () => {
          setIsConnected(false)
          console.log('Socket disconnected')
          onDisconnect?.()
        })

        // Real-time events
        socket.on('inventory-updated', (data: any) => {
          console.log('Inventory updated:', data)
          onInventoryUpdate?.(data)
        })

        socket.on('sale-created', (data: any) => {
          console.log('New sale created:', data)
          onSaleCreated?.(data)
        })

        socket.on('customer-updated', (data: any) => {
          console.log('Customer updated:', data)
          onCustomerUpdated?.(data)
        })

        socket.on('product-updated', (data: any) => {
          console.log('Product updated:', data)
          onProductUpdated?.(data)
        })

        socket.on('low-stock-alert', (data: any) => {
          console.log('Low stock alert:', data)
          onLowStockAlert?.(data)
        })

        socket.on('error', (error: any) => {
          console.error('Socket error:', error)
          onError?.(error)
        })

        socket.on('connected', (data: any) => {
          console.log('Socket connection info:', data)
        })

      } catch (error) {
        console.error('Failed to initialize socket:', error)
        onError?.(error)
      }
    }

    initSocket()

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        rooms.forEach(room => {
          socketRef.current.emit('leave-room', room)
        })
        socketRef.current.disconnect()
      }
    }
  }, [rooms])

  // Utility functions
  const joinRoom = (room: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join-room', room)
    }
  }

  const leaveRoom = (room: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave-room', room)
    }
  }

  const emitInventoryUpdate = (data: { productId: string; quantity: number }) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('inventory-update', data)
    }
  }

  const emitNewSale = (saleData: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('new-sale', saleData)
    }
  }

  const emitCustomerUpdate = (data: { customerId: string; updates: any }) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('customer-update', data)
    }
  }

  const emitProductUpdate = (data: { productId: string; updates: any }) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('product-update', data)
    }
  }

  const checkLowStock = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('check-low-stock')
    }
  }

  return {
    isConnected,
    joinRoom,
    leaveRoom,
    emitInventoryUpdate,
    emitNewSale,
    emitCustomerUpdate,
    emitProductUpdate,
    checkLowStock
  }
}