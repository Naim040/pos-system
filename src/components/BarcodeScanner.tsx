"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useBarcodeScanner, useProductBarcodeScanner } from '@/hooks/useBarcodeScanner'
import { 
  Barcode, 
  Search, 
  Keyboard, 
  Wifi, 
  WifiOff, 
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'

interface BarcodeScannerProps {
  onProductFound?: (product: any) => void
  onBarcodeDetected?: (barcode: string) => void
  enabled?: boolean
  showManualInput?: boolean
  showStatus?: boolean
  compact?: boolean
  className?: string
}

export default function BarcodeScanner({
  onProductFound,
  onBarcodeDetected,
  enabled = true,
  showManualInput = true,
  showStatus = true,
  compact = false,
  className = ""
}: BarcodeScannerProps) {
  const [localBarcode, setLocalBarcode] = useState('')
  const { handleBarcodeScanned, isLoading, foundProduct } = useProductBarcodeScanner()
  
  const {
    isScanning,
    lastScannedBarcode,
    scanError,
    startScanning,
    stopScanning,
    resetScanner,
    manualBarcodeInput,
    setManualBarcodeInput,
    submitManualBarcode
  } = useBarcodeScanner({
    enabled,
    minLength: 3,
    maxLength: 20,
    onBarcodeScanned: async (barcode) => {
      setLocalBarcode(barcode)
      
      if (onBarcodeDetected) {
        onBarcodeDetected(barcode)
      }

      // Auto-lookup product
      const product = await handleBarcodeScanned(barcode)
      if (product && onProductFound) {
        onProductFound(product)
      }
    }
  })

  const handleManualSubmit = () => {
    if (manualBarcodeInput.trim()) {
      submitManualBarcode()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualSubmit()
    }
  }

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Button
          variant={isScanning ? "default" : "outline"}
          size="sm"
          onClick={isScanning ? stopScanning : startScanning}
          className="flex items-center space-x-1"
        >
          {isScanning ? (
            <>
              <Wifi className="h-4 w-4" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4" />
              <span>Scan</span>
            </>
          )}
        </Button>
        
        {showManualInput && (
          <div className="flex items-center space-x-1">
            <Input
              placeholder="Enter barcode"
              value={manualBarcodeInput}
              onChange={(e) => setManualBarcodeInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-32"
              disabled={!isScanning}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualSubmit}
              disabled={!isScanning || !manualBarcodeInput.trim()}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {showStatus && lastScannedBarcode && (
          <Badge variant="secondary" className="text-xs">
            {lastScannedBarcode}
          </Badge>
        )}
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          <Barcode className="h-5 w-5" />
          <span>Barcode Scanner</span>
          {isScanning ? (
            <Badge variant="default" className="ml-auto">
              <Wifi className="h-3 w-3 mr-1" />
              Active
            </Badge>
          ) : (
            <Badge variant="outline" className="ml-auto">
              <WifiOff className="h-3 w-3 mr-1" />
              Inactive
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Scan barcodes using a barcode scanner or enter manually
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Scanner Controls */}
        <div className="flex items-center space-x-2">
          <Button
            variant={isScanning ? "default" : "outline"}
            onClick={isScanning ? stopScanning : startScanning}
            className="flex items-center space-x-2"
          >
            {isScanning ? (
              <>
                <Wifi className="h-4 w-4" />
                <span>Stop Scanner</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4" />
                <span>Start Scanner</span>
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={resetScanner}
            disabled={!lastScannedBarcode && !scanError}
          >
            Clear
          </Button>
        </div>

        {/* Manual Input */}
        {showManualInput && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Manual Entry</label>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Enter barcode manually..."
                value={manualBarcodeInput}
                onChange={(e) => setManualBarcodeInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={!isScanning}
              />
              <Button
                variant="outline"
                onClick={handleManualSubmit}
                disabled={!isScanning || !manualBarcodeInput.trim()}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Status Display */}
        {showStatus && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Scanner Status</label>
            
            {isLoading && (
              <div className="flex items-center space-x-2 text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Looking up product...</span>
              </div>
            )}
            
            {lastScannedBarcode && !isLoading && (
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Last scanned: {lastScannedBarcode}</span>
              </div>
            )}
            
            {foundProduct && (
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Found: {foundProduct.name}</span>
              </div>
            )}
            
            {scanError && (
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-600">{scanError}</span>
              </div>
            )}
            
            {!isScanning && !lastScannedBarcode && !scanError && (
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-gray-600">Scanner is disabled</span>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex items-center space-x-2">
            <Keyboard className="h-3 w-3" />
            <span>Scanner acts as keyboard input</span>
          </div>
          <div className="flex items-center space-x-2">
            <Barcode className="h-3 w-3" />
            <span>Ends with Enter key</span>
          </div>
          <div className="flex items-center space-x-2">
            <Search className="h-3 w-3" />
            <span>Supports barcode and SKU lookup</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}