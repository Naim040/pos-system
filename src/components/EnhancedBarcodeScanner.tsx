"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatPrice, getCurrencySymbol } from '@/lib/currency'
import { useToast } from '@/hooks/use-toast'
import { 
  Barcode, 
  Camera, 
  CameraOff, 
  Scan, 
  Search, 
  Plus, 
  Minus,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Settings,
  Zap,
  Package,
  Tag
} from 'lucide-react'

interface Product {
  id: string
  name: string
  description?: string
  price: number
  sku?: string
  barcode?: string
  imageUrl?: string
  category?: {
    id: string
    name: string
  }
  stock?: number
}

interface BarcodeScannerProps {
  onProductFound: (product: Product) => void
  enabled?: boolean
  compact?: boolean
  className?: string
  onSettingsChange?: (settings: ScannerSettings) => void
}

interface ScannerSettings {
  autoAddToCart: boolean
  soundEnabled: boolean
  vibrationEnabled: boolean
  continuousScan: boolean
  showProductDetails: boolean
  duplicateDetection: boolean
  scannerType: 'camera' | 'usb'
  defaultTaxRate: number
}

export default function BarcodeScanner({ 
  onProductFound, 
  enabled = true, 
  compact = false, 
  className = "",
  onSettingsChange
}: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [lastScanned, setLastScanned] = useState<Product | null>(null)
  const [scanHistory, setScanHistory] = useState<Product[]>([])
  const [manualBarcode, setManualBarcode] = useState('')
  const [scannerSettings, setScannerSettings] = useState<ScannerSettings>({
    autoAddToCart: true,
    soundEnabled: true,
    vibrationEnabled: true,
    continuousScan: false,
    showProductDetails: true,
    duplicateDetection: true,
    scannerType: 'camera',
    defaultTaxRate: 8
  })
  const [showSettings, setShowSettings] = useState(false)
  const [scanCount, setScanCount] = useState(0)
  const [scanError, setScanError] = useState<string | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const { toast } = useToast()

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('barcodeScannerSettings')
    if (savedSettings) {
      setScannerSettings({ ...scannerSettings, ...JSON.parse(savedSettings) })
    }
  }, [])

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('barcodeScannerSettings', JSON.stringify(scannerSettings))
  }, [scannerSettings])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsScanning(true)
        setScanError(null)
        
        // Start barcode detection
        startBarcodeDetection()
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      setScanError('Camera access denied or not available')
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive"
      })
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
  }

  const startBarcodeDetection = () => {
    // Simulate barcode detection for demo
    // In a real implementation, you would use a barcode detection library
    // like QuaggaJS, ZXing, or Dynamsoft Barcode Reader
    
    const detectBarcode = () => {
      if (!isScanning) return
      
      // Simulate finding a barcode
      const mockProducts: Product[] = [
        {
          id: '1',
          name: 'Premium Coffee',
          description: 'Freshly ground premium coffee beans',
          price: 12.99,
          sku: 'COF001',
          barcode: '1234567890123',
          category: { id: '1', name: 'Beverages' },
          stock: 45
        },
        {
          id: '2',
          name: 'Organic Green Tea',
          description: 'Premium organic green tea leaves',
          price: 8.50,
          sku: 'TEA001',
          barcode: '1234567890124',
          category: { id: '1', name: 'Beverages' },
          stock: 32
        },
        {
          id: '3',
          name: 'Artisan Sandwich',
          description: 'Freshly made artisan sandwich',
          price: 9.99,
          sku: 'SND001',
          barcode: '1234567890125',
          category: { id: '2', name: 'Food' },
          stock: 15
        }
      ]
      
      // Randomly "detect" a barcode for demo
      if (Math.random() > 0.7) {
        const randomProduct = mockProducts[Math.floor(Math.random() * mockProducts.length)]
        handleBarcodeDetected(randomProduct.barcode || '', randomProduct)
      }
      
      if (scannerSettings.continuousScan) {
        setTimeout(detectBarcode, 2000) // Continue scanning
      }
    }
    
    setTimeout(detectBarcode, 1000)
  }

  const handleBarcodeDetected = (barcode: string, product: Product) => {
    setScanCount(prev => prev + 1)
    
    // Check for duplicates if enabled
    if (scannerSettings.duplicateDetection) {
      const recentScan = scanHistory.find(p => p.barcode === barcode)
      if (recentScan) {
        toast({
          title: "Duplicate Scanned",
          description: `${product.name} was scanned recently`,
          variant: "default"
        })
        return
      }
    }
    
    // Add to scan history
    setScanHistory(prev => [product, ...prev.slice(0, 9)]) // Keep last 10 scans
    
    // Set last scanned
    setLastScanned(product)
    
    // Auto-add to cart if enabled
    if (scannerSettings.autoAddToCart) {
      onProductFound(product)
      toast({
        title: "Product Added",
        description: `${product.name} added to cart`,
      })
    } else {
      toast({
        title: "Product Found",
        description: `${product.name} scanned successfully`,
      })
    }
    
    // Provide feedback
    if (scannerSettings.soundEnabled) {
      playScanSound()
    }
    
    if (scannerSettings.vibrationEnabled) {
      vibrateDevice()
    }
    
    // Stop scanning if not continuous mode
    if (!scannerSettings.continuousScan) {
      stopCamera()
    }
  }

  const playScanSound = () => {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 1000
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.1)
  }

  const vibrateDevice = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(200)
    }
  }

  const handleManualScan = async () => {
    if (!manualBarcode.trim()) {
      toast({
        title: "Barcode Required",
        description: "Please enter a barcode number",
        variant: "destructive"
      })
      return
    }
    
    try {
      // Simulate API call to find product by barcode
      const response = await fetch(`/api/products/barcode/${manualBarcode}`)
      
      if (response.ok) {
        const product = await response.json()
        handleBarcodeDetected(manualBarcode, product)
        setManualBarcode('')
      } else {
        // Fallback to mock data for demo
        const mockProduct: Product = {
          id: Date.now().toString(),
          name: 'Unknown Product',
          description: 'Product not found in database',
          price: 0,
          sku: 'UNKNOWN',
          barcode: manualBarcode,
          category: { id: '0', name: 'Unknown' }
        }
        
        setScanError('Product not found in database')
        toast({
          title: "Product Not Found",
          description: `No product found with barcode: ${manualBarcode}`,
          variant: "destructive"
        })
      }
    } catch (error) {
      setScanError('Failed to lookup barcode')
      toast({
        title: "Scan Error",
        description: "Failed to lookup barcode in database",
        variant: "destructive"
      })
    }
  }

  const toggleScanning = () => {
    if (isScanning) {
      stopCamera()
    } else {
      startCamera()
    }
  }

  const updateSetting = (key: keyof ScannerSettings, value: any) => {
    const newSettings = { ...scannerSettings, [key]: value }
    setScannerSettings(newSettings)
    onSettingsChange?.(newSettings)
  }

  const clearHistory = () => {
    setScanHistory([])
    setLastScanned(null)
    setScanCount(0)
    toast({
      title: "History Cleared",
      description: "Scan history has been cleared",
    })
  }

  if (compact) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Button
              onClick={toggleScanning}
              variant={isScanning ? "destructive" : "default"}
              size="sm"
              disabled={!enabled}
            >
              {isScanning ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
            </Button>
            
            <div className="flex-1">
              <Input
                placeholder="Enter barcode manually..."
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
                className="text-sm"
              />
            </div>
            
            <Button onClick={handleManualScan} size="sm" disabled={!enabled}>
              <Search className="h-4 w-4" />
            </Button>
            
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Scanner Settings
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Scanner Type</Label>
                    <Select value={scannerSettings.scannerType} onValueChange={(value: 'camera' | 'usb') => updateSetting('scannerType', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="camera">Camera Scanner</SelectItem>
                        <SelectItem value="usb">USB Scanner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      min="0"
                      max="50"
                      step="0.1"
                      value={scannerSettings.defaultTaxRate}
                      onChange={(e) => updateSetting('defaultTaxRate', parseFloat(e.target.value) || 0)}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sound">Sound Effects</Label>
                    <Switch
                      id="sound"
                      checked={scannerSettings.soundEnabled}
                      onCheckedChange={(checked) => updateSetting('soundEnabled', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="autoAdd">Auto-add to cart</Label>
                    <Switch
                      id="autoAdd"
                      checked={scannerSettings.autoAddToCart}
                      onCheckedChange={(checked) => updateSetting('autoAddToCart', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="vibration">Vibration feedback</Label>
                    <Switch
                      id="vibration"
                      checked={scannerSettings.vibrationEnabled}
                      onCheckedChange={(checked) => updateSetting('vibrationEnabled', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="continuous">Continuous scanning</Label>
                    <Switch
                      id="continuous"
                      checked={scannerSettings.continuousScan}
                      onCheckedChange={(checked) => updateSetting('continuousScan', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showDetails">Show product details</Label>
                    <Switch
                      id="showDetails"
                      checked={scannerSettings.showProductDetails}
                      onCheckedChange={(checked) => updateSetting('showProductDetails', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="duplicate">Duplicate detection</Label>
                    <Switch
                      id="duplicate"
                      checked={scannerSettings.duplicateDetection}
                      onCheckedChange={(checked) => updateSetting('duplicateDetection', checked)}
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {scanError && (
            <div className="mt-2 text-sm text-red-600 flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {scanError}
            </div>
          )}
          
          {lastScanned && scannerSettings.showProductDetails && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium">{lastScanned.name}</span>
                <Badge variant="outline">{formatPrice(lastScanned.price)}</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Scanner Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Barcode className="h-5 w-5 mr-2" />
              Barcode Scanner
              <Badge variant="outline" className="ml-2">
                {scanCount} scans
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={toggleScanning}
                variant={isScanning ? "destructive" : "default"}
                disabled={!enabled}
              >
                {isScanning ? (
                  <>
                    <CameraOff className="h-4 w-4 mr-2" />
                    Stop Scanning
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Start Scanning
                  </>
                )}
              </Button>
              
              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center">
                      <Settings className="h-5 w-5 mr-2" />
                      Scanner Settings
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Scanner Type</Label>
                      <Select value={scannerSettings.scannerType} onValueChange={(value: 'camera' | 'usb') => updateSetting('scannerType', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="camera">Camera Scanner</SelectItem>
                          <SelectItem value="usb">USB Scanner</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                      <Input
                        id="taxRate"
                        type="number"
                        min="0"
                        max="50"
                        step="0.1"
                        value={scannerSettings.defaultTaxRate}
                        onChange={(e) => updateSetting('defaultTaxRate', parseFloat(e.target.value) || 0)}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sound">Sound Effects</Label>
                      <Switch
                        id="sound"
                        checked={scannerSettings.soundEnabled}
                        onCheckedChange={(checked) => updateSetting('soundEnabled', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="autoAdd">Auto-add to cart</Label>
                      <Switch
                        id="autoAdd"
                        checked={scannerSettings.autoAddToCart}
                        onCheckedChange={(checked) => updateSetting('autoAddToCart', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="vibration">Vibration feedback</Label>
                      <Switch
                        id="vibration"
                        checked={scannerSettings.vibrationEnabled}
                        onCheckedChange={(checked) => updateSetting('vibrationEnabled', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="continuous">Continuous scanning</Label>
                      <Switch
                        id="continuous"
                        checked={scannerSettings.continuousScan}
                        onCheckedChange={(checked) => updateSetting('continuousScan', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="showDetails">Show product details</Label>
                      <Switch
                        id="showDetails"
                        checked={scannerSettings.showProductDetails}
                        onCheckedChange={(checked) => updateSetting('showProductDetails', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="duplicate">Duplicate detection</Label>
                      <Switch
                        id="duplicate"
                        checked={scannerSettings.duplicateDetection}
                        onCheckedChange={(checked) => updateSetting('duplicateDetection', checked)}
                      />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button onClick={clearHistory} variant="outline">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Camera View */}
          <div className="relative mb-4">
            {isScanning ? (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-64 bg-black rounded-lg object-cover"
                />
                <div className="absolute inset-0 border-2 border-green-400 rounded-lg m-4 pointer-events-none">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-green-400 animate-pulse"></div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-400 animate-pulse"></div>
                  <div className="absolute top-0 bottom-0 left-0 w-1 bg-green-400 animate-pulse"></div>
                  <div className="absolute top-0 bottom-0 right-0 w-1 bg-green-400 animate-pulse"></div>
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-center">
                  <Badge className="bg-green-500 text-white">
                    <Scan className="h-3 w-3 mr-1" />
                    Scanning...
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Camera className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">Camera is off</p>
                  <p className="text-sm text-gray-400">Click "Start Scanning" to begin</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Manual Entry */}
          <div className="flex space-x-2">
            <Input
              placeholder="Enter barcode manually..."
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
            />
            <Button onClick={handleManualScan} disabled={!enabled}>
              <Search className="h-4 w-4 mr-2" />
              Lookup
            </Button>
          </div>
          
          {scanError && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center text-red-800">
                <AlertTriangle className="h-4 w-4 mr-2" />
                {scanError}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Last Scanned Product */}
      {lastScanned && scannerSettings.showProductDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              Last Scanned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{lastScanned.name}</h3>
                <p className="text-sm text-gray-600">{lastScanned.description}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge variant="outline">
                    <Tag className="h-3 w-3 mr-1" />
                    {lastScanned.sku}
                  </Badge>
                  <Badge variant="outline">
                    <Package className="h-3 w-3 mr-1" />
                    {lastScanned.stock || 'N/A'} in stock
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{formatPrice(lastScanned.price)}</p>
                {scannerSettings.autoAddToCart && (
                  <Badge className="bg-green-100 text-green-800 mt-1">
                    <Plus className="h-3 w-3 mr-1" />
                    Added to cart
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Scan History */}
      {scanHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Scans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {scanHistory.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-3">
                    <Scan className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.barcode}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{formatPrice(product.price)}</p>
                    <Badge variant="outline" className="text-xs">
                      {product.category?.name}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}