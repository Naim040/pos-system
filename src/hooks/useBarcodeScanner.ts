import { useState, useEffect, useCallback, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'

interface BarcodeScannerOptions {
  enabled?: boolean
  onBarcodeScanned?: (barcode: string) => void
  minLength?: number
  maxLength?: number
  timeout?: number
}

interface UseBarcodeScannerReturn {
  isScanning: boolean
  lastScannedBarcode: string | null
  scanError: string | null
  startScanning: () => void
  stopScanning: () => void
  resetScanner: () => void
  manualBarcodeInput: string
  setManualBarcodeInput: (value: string) => void
  submitManualBarcode: () => void
}

export function useBarcodeScanner(
  options: BarcodeScannerOptions = {}
): UseBarcodeScannerReturn {
  const {
    enabled = true,
    onBarcodeScanned,
    minLength = 3,
    maxLength = 20,
    timeout = 100
  } = options

  const [isScanning, setIsScanning] = useState(enabled)
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [manualBarcodeInput, setManualBarcodeInput] = useState('')
  const [buffer, setBuffer] = useState('')
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  const bufferRef = useRef(buffer)
  bufferRef.current = buffer

  const processBarcode = useCallback((barcode: string) => {
    // Validate barcode
    if (barcode.length < minLength) {
      setScanError(`Barcode too short. Minimum length: ${minLength}`)
      return
    }

    if (barcode.length > maxLength) {
      setScanError(`Barcode too long. Maximum length: ${maxLength}`)
      return
    }

    // Clear any previous errors
    setScanError(null)
    setLastScannedBarcode(barcode)
    setManualBarcodeInput('')

    // Call the callback if provided
    if (onBarcodeScanned) {
      onBarcodeScanned(barcode)
    }

    // Show success toast
    toast({
      title: "Barcode Scanned",
      description: `Barcode: ${barcode}`,
      duration: 2000
    })
  }, [minLength, maxLength, onBarcodeScanned, toast])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isScanning) return

    // Ignore if the user is typing in an input field
    if ((event.target as HTMLElement).tagName === 'INPUT' || 
        (event.target as HTMLElement).tagName === 'TEXTAREA') {
      return
    }

    // Clear any existing timer
    if (timer) {
      clearTimeout(timer)
    }

    if (event.key === 'Enter') {
      // Process the buffered barcode
      if (bufferRef.current.length > 0) {
        processBarcode(bufferRef.current)
        setBuffer('')
      }
    } else if (event.key.length === 1) {
      // Add character to buffer
      const newBuffer = bufferRef.current + event.key
      setBuffer(newBuffer)

      // Set a new timer to clear the buffer
      const newTimer = setTimeout(() => {
        setBuffer('')
      }, timeout)
      setTimer(newTimer)
    }
  }, [isScanning, timer, timeout, processBarcode])

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [enabled, handleKeyDown, timer])

  const startScanning = useCallback(() => {
    setIsScanning(true)
    setScanError(null)
    toast({
      title: "Scanner Enabled",
      description: "Barcode scanner is now active. Scan a barcode to proceed.",
      duration: 3000
    })
  }, [toast])

  const stopScanning = useCallback(() => {
    setIsScanning(false)
    setBuffer('')
    if (timer) {
      clearTimeout(timer)
      setTimer(null)
    }
    toast({
      title: "Scanner Disabled",
      description: "Barcode scanner has been disabled.",
      duration: 2000
    })
  }, [timer, toast])

  const resetScanner = useCallback(() => {
    setLastScannedBarcode(null)
    setScanError(null)
    setManualBarcodeInput('')
    setBuffer('')
    if (timer) {
      clearTimeout(timer)
      setTimer(null)
    }
  }, [timer])

  const submitManualBarcode = useCallback(() => {
    if (manualBarcodeInput.trim()) {
      processBarcode(manualBarcodeInput.trim())
    }
  }, [manualBarcodeInput, processBarcode])

  return {
    isScanning,
    lastScannedBarcode,
    scanError,
    startScanning,
    stopScanning,
    resetScanner,
    manualBarcodeInput,
    setManualBarcodeInput,
    submitManualBarcode
  }
}

// Specialized hook for product lookup
export function useProductBarcodeScanner() {
  const [isLoading, setIsLoading] = useState(false)
  const [foundProduct, setFoundProduct] = useState<any>(null)
  const { toast } = useToast()

  const handleBarcodeScanned = useCallback(async (barcode: string) => {
    setIsLoading(true)
    
    try {
      // Try to find product by barcode first
      let response = await fetch(`/api/products?barcode=${encodeURIComponent(barcode)}`)
      
      if (!response.ok) {
        // Try by SKU if barcode not found
        response = await fetch(`/api/products?sku=${encodeURIComponent(barcode)}`)
      }

      if (response.ok) {
        const products = await response.json()
        if (products.length > 0) {
          const product = products[0]
          setFoundProduct(product)
          toast({
            title: "Product Found",
            description: `${product.name} - $${product.price}`,
            duration: 3000
          })
          return product
        } else {
          toast({
            title: "Product Not Found",
            description: `No product found for barcode: ${barcode}`,
            variant: "destructive",
            duration: 3000
          })
          setFoundProduct(null)
          return null
        }
      } else {
        throw new Error('Failed to search for product')
      }
    } catch (error) {
      console.error('Error looking up product by barcode:', error)
      toast({
        title: "Lookup Error",
        description: "Failed to lookup product. Please try again.",
        variant: "destructive",
        duration: 3000
      })
      setFoundProduct(null)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  return {
    isLoading,
    foundProduct,
    handleBarcodeScanned,
    setFoundProduct
  }
}