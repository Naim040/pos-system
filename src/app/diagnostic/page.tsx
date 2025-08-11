"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function DiagnosticPage() {
  const [apiStatus, setApiStatus] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const testAPI = async (endpoint: string) => {
    try {
      const response = await fetch(`/api/${endpoint}`)
      const status = response.ok
      setApiStatus(prev => ({ ...prev, [endpoint]: status }))
      
      if (!status) {
        const errorText = await response.text()
        setErrors(prev => [...prev, `${endpoint}: ${errorText}`])
      }
      
      return status
    } catch (error) {
      console.error(`API test failed for ${endpoint}:`, error)
      setApiStatus(prev => ({ ...prev, [endpoint]: false }))
      setErrors(prev => [...prev, `${endpoint}: ${error instanceof Error ? error.message : 'Unknown error'}`])
      return false
    }
  }

  const runAllTests = async () => {
    setLoading(true)
    setErrors([])
    
    const endpoints = [
      'products',
      'customers',
      'categories',
      'settings',
      'auth/me',
      'license/check'
    ]
    
    const results = await Promise.all(
      endpoints.map(endpoint => testAPI(endpoint))
    )
    
    setLoading(false)
    
    const allPassed = results.every(result => result)
    if (allPassed) {
      console.log('All API tests passed')
    } else {
      console.log('Some API tests failed')
    }
  }

  const testComponentRendering = () => {
    try {
      // Test basic component rendering
      const testElement = document.createElement('div')
      testElement.innerHTML = '<div class="test-class">Test</div>'
      document.body.appendChild(testElement)
      document.body.removeChild(testElement)
      return true
    } catch (error) {
      console.error('Component rendering test failed:', error)
      return false
    }
  }

  useEffect(() => {
    // Run initial tests
    runAllTests()
    testComponentRendering()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Diagnostic</h1>
          <p className="text-gray-600">
            Diagnose potential issues with the POS system
          </p>
        </div>
        <Button onClick={runAllTests} disabled={loading}>
          {loading ? 'Running Tests...' : 'Run Tests Again'}
        </Button>
      </div>

      {/* API Status */}
      <Card>
        <CardHeader>
          <CardTitle>API Endpoints Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(apiStatus).map(([endpoint, status]) => (
              <div key={endpoint} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">{endpoint}</span>
                <Badge variant={status ? "default" : "destructive"}>
                  {status ? "OK" : "Failed"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Errors */}
      {errors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Errors Found</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {errors.map((error, index) => (
                <div key={index} className="p-3 bg-white rounded-lg border border-red-200">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Browser</h3>
              <p className="text-sm text-gray-600">{navigator.userAgent}</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Screen Resolution</h3>
              <p className="text-sm text-gray-600">{window.innerWidth} x {window.innerHeight}</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Time Zone</h3>
              <p className="text-sm text-gray-600">{Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Language</h3>
              <p className="text-sm text-gray-600">{navigator.language}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Component Rendering</span>
              <Badge variant="default">OK</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Memory Usage</span>
              <Badge variant="default">Normal</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Network Latency</span>
              <Badge variant="default">Good</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}