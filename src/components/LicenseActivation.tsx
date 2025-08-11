"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { Key, Shield, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'

interface LicenseInfo {
  licenseKey: string
  type: string
  status: string
  clientName: string
  clientEmail: string
  maxUsers: number
  maxStores: number
  expiresAt?: string
  lastVerifiedAt: string
}

interface LicenseActivationProps {
  onActivationSuccess: (licenseInfo: LicenseInfo) => void
  onSkip?: () => void
}

export default function LicenseActivation({ onActivationSuccess, onSkip }: LicenseActivationProps) {
  const [licenseKey, setLicenseKey] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle')
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null)
  const [error, setError] = useState('')
  const { toast } = useToast()

  // Auto-format license key as user types
  const formatLicenseKey = (value: string) => {
    // Remove all non-alphanumeric characters
    const cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase()
    
    // Add hyphens every 4 characters
    const formatted = cleaned.match(/.{1,4}/g)?.join('-') || cleaned
    
    // Limit to 19 characters (16 chars + 3 hyphens)
    return formatted.substring(0, 19)
  }

  const handleLicenseKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatLicenseKey(e.target.value)
    setLicenseKey(formatted)
  }

  // Check if already activated on component mount
  useEffect(() => {
    checkExistingLicense()
  }, [])

  const checkExistingLicense = async () => {
    try {
      const response = await fetch('/api/license/check')
      if (response.ok) {
        const data = await response.json()
        if (data.activated) {
          setLicenseInfo(data.license)
          setVerificationStatus('success')
          onActivationSuccess(data.license)
        }
      }
    } catch (error) {
      console.log('No existing license found')
    }
  }

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Enhanced validation
    if (!licenseKey.trim()) {
      setError('License key is required')
      return
    }

    // Validate license key format (XXXX-XXXX-XXXX-XXXX)
    const licenseKeyPattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i
    if (!licenseKeyPattern.test(licenseKey.trim())) {
      setError('Invalid license key format. Please use the format: XXXX-XXXX-XXXX-XXXX')
      return
    }

    if (!clientEmail.trim()) {
      setError('Client email is required')
      return
    }

    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(clientEmail.trim())) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError('')
    setVerificationStatus('verifying')

    try {
      // Get system information for hardware binding
      const systemInfo = await getSystemInfo()
      
      const response = await fetch('/api/license/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          licenseKey: licenseKey.trim(),
          clientEmail: clientEmail.trim(),
          systemInfo
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setLicenseInfo(data.license)
        setVerificationStatus('success')
        toast({
          title: "License Activated Successfully",
          description: `Welcome ${data.license.clientName}! Your POS system is now licensed.`,
        })
        onActivationSuccess(data.license)
      } else {
        const errorMessage = data.error || 'Failed to activate license'
        
        // Enhanced error messages based on common scenarios
        let userFriendlyError = errorMessage
        if (errorMessage.includes('not found')) {
          userFriendlyError = 'License key not found. Please check your license key and try again.'
        } else if (errorMessage.includes('expired')) {
          userFriendlyError = 'This license has expired. Please contact support to renew your license.'
        } else if (errorMessage.includes('domain')) {
          userFriendlyError = 'This license is not valid for the current domain. Please use the correct license for your deployment.'
        } else if (errorMessage.includes('already activated')) {
          userFriendlyError = 'This license is already activated on another device. Please contact support to transfer the license.'
        } else if (errorMessage.includes('invalid')) {
          userFriendlyError = 'Invalid license key. Please verify your license key and try again.'
        } else if (errorMessage.includes('suspended')) {
          userFriendlyError = 'This license has been suspended. Please contact support for assistance.'
        }
        
        setError(userFriendlyError)
        setVerificationStatus('error')
        toast({
          title: "Activation Failed",
          description: userFriendlyError,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('License activation error:', error)
      
      let networkError = 'Network error. Please check your internet connection and try again.'
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          networkError = 'Request timed out. Please try again.'
        } else if (error.message.includes('fetch')) {
          networkError = 'Unable to connect to the license server. Please check your connection.'
        }
      }
      
      setError(networkError)
      setVerificationStatus('error')
      toast({
        title: "Connection Error",
        description: networkError,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getSystemInfo = async () => {
    // Collect system information for hardware binding
    const info = {
      domain: window.location.hostname,
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      // Generate a unique hardware ID based on available information
      hardwareId: await generateHardwareId()
    }
    return info
  }

  const generateHardwareId = async (): Promise<string> => {
    // Create a simple hardware fingerprint
    const components = [
      navigator.userAgent,
      navigator.platform,
      navigator.language,
      screen.width,
      screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      // Add some browser-specific features
      !!(window as any).webkitConvertPointFromNodeToPage,
      !!(window as any).HTMLElement.prototype.animate,
      !!(window as any).WebGLRenderingContext
    ]
    
    // Create a hash from the components
    const data = components.join('|')
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    
    return hashHex.substring(0, 32) // Use first 32 characters as hardware ID
  }

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'verifying':
        return <Clock className="h-5 w-5 text-blue-600 animate-spin" />
      default:
        return <Shield className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusText = () => {
    switch (verificationStatus) {
      case 'success':
        return 'License Activated'
      case 'error':
        return 'Activation Failed'
      case 'verifying':
        return 'Verifying License...'
      default:
        return 'Enter License Key'
    }
  }

  const getStatusColor = () => {
    switch (verificationStatus) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'verifying':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  if (verificationStatus === 'success' && licenseInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">License Activated!</CardTitle>
            <CardDescription>
              Your POS system is now licensed and ready to use
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">License Type:</span>
                <Badge variant="outline" className="capitalize">
                  {licenseInfo.type}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Client:</span>
                <span className="text-sm font-medium">{licenseInfo.clientName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Email:</span>
                <span className="text-sm">{licenseInfo.clientEmail}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Max Users:</span>
                <span className="text-sm">{licenseInfo.maxUsers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Max Stores:</span>
                <span className="text-sm">{licenseInfo.maxStores}</span>
              </div>
              {licenseInfo.expiresAt && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Expires:</span>
                  <span className="text-sm">
                    {new Date(licenseInfo.expiresAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
            <Separator />
            <Button 
              className="w-full" 
              onClick={() => onActivationSuccess(licenseInfo)}
            >
              Continue to POS System
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Key className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Activate Your License</CardTitle>
          <CardDescription>
            Enter your license key to activate your POS system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleActivate} className="space-y-4">
            <div className={`p-3 rounded-lg border ${getStatusColor()}`}>
              <div className="flex items-center space-x-2">
                {getStatusIcon()}
                <span className="text-sm font-medium">{getStatusText()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="licenseKey">License Key</Label>
              <Input
                id="licenseKey"
                type="text"
                placeholder="XXXX-XXXX-XXXX-XXXX"
                value={licenseKey}
                onChange={handleLicenseKeyChange}
                className="font-mono tracking-wider"
                disabled={loading}
                maxLength={19}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientEmail">Client Email</Label>
              <Input
                id="clientEmail"
                type="email"
                placeholder="your@email.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-red-800 mb-1">Activation Failed</h4>
                    <p className="text-sm text-red-700">{error}</p>
                    {error.includes('not found') && (
                      <p className="text-xs text-red-600 mt-2">
                        Please check your license key and try again. If the problem persists, 
                        contact support with your license information.
                      </p>
                    )}
                    {error.includes('domain') && (
                      <p className="text-xs text-red-600 mt-2">
                        This license is not valid for the current domain. Please ensure 
                        you're using the correct license for your deployment.
                      </p>
                    )}
                    {error.includes('expired') && (
                      <p className="text-xs text-red-600 mt-2">
                        This license has expired. Please renew your license to continue using the system.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !licenseKey.trim() || !clientEmail.trim()}
            >
              {loading ? 'Activating...' : 'Activate License'}
            </Button>

            {onSkip && (
              <>
                <Separator />
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={onSkip}
                >
                  Skip for Now (Demo Mode)
                </Button>
              </>
            )}
          </form>

          <div className="mt-6 text-center text-xs text-gray-500">
            <p>
              This system will be bound to your current hardware and domain
              for security purposes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}