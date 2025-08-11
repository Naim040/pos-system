import { useState, useEffect } from 'react'
import LicenseActivation from '@/components/LicenseActivation'
import NavigationLayout from '@/components/NavigationLayout'
import { useToast } from '@/hooks/use-toast'

interface LicenseInfo {
  licenseId: string
  licenseKey: string
  activationKey: string
  clientEmail: string
  clientName: string
  type: string
  maxUsers: number
  maxStores: number
  expiresAt?: string
  activatedAt: string
  domain?: string
  hardwareId?: string
}

interface LicenseWrapperProps {
  products: any[]
  cart: any[]
  customers: any[]
  selectedCustomer: any
  redeemPoints: number
  pointsDiscount: number
  searchTerm: string
  customerSearchTerm: string
  loading: boolean
  showReceipt: boolean
  lastSale: any
  autoPrintEnabled: boolean
  setAutoPrintEnabled: (enabled: boolean) => void
  socket: any
  cartTotal: number
  cartCount: number
  
  // Handlers
  addToCart: (product: any) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  setSelectedCustomer: (customer: any) => void
  setSearchTerm: (term: string) => void
  setCustomerSearchTerm: (term: string) => void
  handlePointsRedeem: (points: number) => void
  clearPointsRedemption: () => void
  handleCheckout: (method: string) => void
  setShowReceipt: (show: boolean) => void
  setLastSale: (sale: any) => void
  handleLogout: () => void
  fetchProducts: () => void
}

export default function LicenseWrapper({
  products,
  cart,
  customers,
  selectedCustomer,
  redeemPoints,
  pointsDiscount,
  searchTerm,
  customerSearchTerm,
  loading,
  showReceipt,
  lastSale,
  autoPrintEnabled,
  setAutoPrintEnabled,
  socket,
  cartTotal,
  cartCount,
  
  // Handlers
  addToCart,
  removeFromCart,
  updateQuantity,
  setSelectedCustomer,
  setSearchTerm,
  setCustomerSearchTerm,
  handlePointsRedeem,
  clearPointsRedemption,
  handleCheckout,
  setShowReceipt,
  setLastSale,
  handleLogout,
  fetchProducts
}: LicenseWrapperProps) {
  const [isActivated, setIsActivated] = useState(false)
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null)
  const [licenseLoading, setLicenseLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    checkLicenseStatus()
  }, [])

  const checkLicenseStatus = async () => {
    try {
      // Check localStorage for existing activation
      const storedActivation = localStorage.getItem('licenseActivation')
      
      if (storedActivation) {
        const activation = JSON.parse(storedActivation)
        
        // Verify with server
        const response = await fetch('/api/license/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-license-key': activation.licenseKey,
            'x-activation-key': activation.activationKey
          },
          body: JSON.stringify({
            activationKey: activation.activationKey,
            licenseKey: activation.licenseKey
          })
        })

        if (response.ok) {
          const data = await response.json()
          if (data.valid) {
            setLicenseInfo(activation)
            setIsActivated(true)
            
            // Set up global license headers for future requests
            setupLicenseHeaders(activation)
            
            toast({
              title: "License Verified",
              description: `Welcome back, ${activation.clientName}!`,
            })
            return
          }
        }
      }

      // If we get here, license is not valid or not found
      localStorage.removeItem('licenseActivation')
      setIsActivated(false)
    } catch (error) {
      console.error('License check error:', error)
      setIsActivated(false)
    } finally {
      setLicenseLoading(false)
    }
  }

  const setupLicenseHeaders = (activation: LicenseInfo) => {
    // Store license info for API requests
    // This will be used by the license middleware
    localStorage.setItem('licenseActivation', JSON.stringify(activation))
    
    // You can also set up global fetch interceptors if needed
    const originalFetch = window.fetch
    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
      const headers = new Headers(init?.headers)
      
      // Add license headers to all requests
      headers.set('x-license-key', activation.licenseKey)
      headers.set('x-activation-key', activation.activationKey)
      
      return originalFetch.call(this, input, {
        ...init,
        headers
      })
    }
  }

  const handleActivationSuccess = (activation: LicenseInfo) => {
    setLicenseInfo(activation)
    setIsActivated(true)
    setupLicenseHeaders(activation)
    
    // Store in localStorage
    localStorage.setItem('licenseActivation', JSON.stringify(activation))
    
    toast({
      title: "License Activated",
      description: `Welcome to POS System, ${activation.clientName}!`,
    })
  }

  const handleSkipActivation = () => {
    // Demo mode - limited functionality
    setIsActivated(true)
    toast({
      title: "Demo Mode",
      description: "Running in demo mode with limited functionality",
      variant: "default"
    })
  }

  const handleDeactivate = async () => {
    if (!licenseInfo) return

    try {
      const response = await fetch('/api/license/deactivate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-license-key': licenseInfo.licenseKey,
          'x-activation-key': licenseInfo.activationKey
        },
        body: JSON.stringify({
          activationKey: licenseInfo.activationKey,
          licenseKey: licenseInfo.licenseKey
        })
      })

      if (response.ok) {
        localStorage.removeItem('licenseActivation')
        setIsActivated(false)
        setLicenseInfo(null)
        
        // Restore original fetch
        if (window.fetch.toString().includes('license-key')) {
          // This is a simple check - in production, you'd want a more robust way
          location.reload()
        }
        
        toast({
          title: "License Deactivated",
          description: "License has been deactivated successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Deactivation Failed",
        description: "Failed to deactivate license",
        variant: "destructive"
      })
    }
  }

  if (licenseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center theme-transition">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--color-primary)' }}></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Checking license status...</p>
        </div>
      </div>
    )
  }

  if (!isActivated) {
    return (
      <LicenseActivation 
        onActivationSuccess={handleActivationSuccess}
        onSkip={handleSkipActivation}
      />
    )
  }

  return (
    <div className="min-h-screen theme-transition">
      {/* License Status Bar */}
      {licenseInfo && (
        <div className="theme-surface border-b px-4 py-2">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span className="text-sm" style={{ color: 'var(--color-text)' }}>
                Licensed to: <strong>{licenseInfo.clientName}</strong>
              </span>
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Type: <span className="capitalize">{licenseInfo.type}</span>
              </span>
              {licenseInfo.expiresAt && (
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Expires: {new Date(licenseInfo.expiresAt).toLocaleDateString()}
                </span>
              )}
            </div>
            <button
              onClick={handleDeactivate}
              className="text-sm hover:underline"
              style={{ color: 'var(--color-primary)' }}
            >
              Deactivate License
            </button>
          </div>
        </div>
      )}
      
      {/* Main Application */}
      <NavigationLayout
        products={products}
        cart={cart}
        customers={customers}
        selectedCustomer={selectedCustomer}
        redeemPoints={redeemPoints}
        pointsDiscount={pointsDiscount}
        searchTerm={searchTerm}
        customerSearchTerm={customerSearchTerm}
        loading={loading}
        showReceipt={showReceipt}
        lastSale={lastSale}
        autoPrintEnabled={autoPrintEnabled}
        setAutoPrintEnabled={setAutoPrintEnabled}
        socket={socket}
        cartTotal={cartTotal}
        cartCount={cartCount}
        
        // Handlers
        addToCart={addToCart}
        removeFromCart={removeFromCart}
        updateQuantity={updateQuantity}
        setSelectedCustomer={setSelectedCustomer}
        setSearchTerm={setSearchTerm}
        setCustomerSearchTerm={setCustomerSearchTerm}
        handlePointsRedeem={handlePointsRedeem}
        clearPointsRedemption={clearPointsRedemption}
        handleCheckout={handleCheckout}
        setShowReceipt={setShowReceipt}
        setLastSale={setLastSale}
        handleLogout={handleLogout}
        fetchProducts={fetchProducts}
      />
    </div>
  )
}