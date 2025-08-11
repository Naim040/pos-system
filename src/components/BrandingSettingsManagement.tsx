"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth'
import { Settings, Save, RotateCcw, Shield } from 'lucide-react'

interface AppSettingsData {
  contactPhone: string
  developerCredit: string
  developerUrl?: string | null
  updatedAt?: string
  updatedByUserId?: string
}

export default function BrandingSettingsManagement() {
  const { user, hasRole } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<AppSettingsData>({
    contactPhone: '01938264923',
    developerCredit: 'Developed by Halalzi',
    developerUrl: null
  })

  useEffect(() => {
    if (hasRole('SUPER_ADMIN')) {
      loadSettings()
    }
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings({
          contactPhone: data.contactPhone,
          developerCredit: data.developerCredit,
          developerUrl: data.developerUrl,
          updatedAt: data.updatedAt,
          updatedByUserId: data.updatedByUserId
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!hasRole('SUPER_ADMIN')) {
      toast({
        title: "Access Denied",
        description: "Only SUPER_ADMIN can update settings",
        variant: "destructive"
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactPhone: settings.contactPhone,
          developerCredit: settings.developerCredit,
          developerUrl: settings.developerUrl
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: "Settings updated successfully"
        })
        // Update local state with new data
        setSettings(prev => ({
          ...prev,
          updatedAt: data.settings.updatedAt
        }))
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update settings",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setSettings({
      contactPhone: '01938264923',
      developerCredit: 'Developed by Halalzi',
      developerUrl: null
    })
  }

  if (!hasRole('SUPER_ADMIN')) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
              <p className="text-muted-foreground">
                Only SUPER_ADMIN users can access branding and info settings.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Branding & Info Settings</h2>
          <p className="text-muted-foreground">
            Manage contact information and developer credits displayed throughout the application
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Global Information Block
          </CardTitle>
          <CardDescription>
            These settings control the contact information and developer credits that appear on the login page, signup page, and global footer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                value={settings.contactPhone}
                onChange={(e) => setSettings(prev => ({ ...prev, contactPhone: e.target.value }))}
                placeholder="Enter contact phone number"
              />
              <p className="text-sm text-muted-foreground">
                This phone number will be displayed with a phone icon in the info block.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="developerCredit">Developer Credit</Label>
              <Input
                id="developerCredit"
                value={settings.developerCredit}
                onChange={(e) => setSettings(prev => ({ ...prev, developerCredit: e.target.value }))}
                placeholder="Enter developer credit text"
              />
              <p className="text-sm text-muted-foreground">
                This text will be displayed as the developer attribution.
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="developerUrl">Developer URL (Optional)</Label>
              <Input
                id="developerUrl"
                value={settings.developerUrl || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, developerUrl: e.target.value || null }))}
                placeholder="https://example.com"
                type="url"
              />
              <p className="text-sm text-muted-foreground">
                If provided, the developer credit will be linked to this URL. Leave empty for plain text.
              </p>
            </div>
          </div>

          {/* Preview Section */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <h4 className="font-medium mb-3">Preview</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>Contact: {settings.contactPhone}</span>
              </div>
              <div>
                {settings.developerUrl ? (
                  <a 
                    href={settings.developerUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    {settings.developerCredit}
                    <svg className="h-3 w-3 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ) : (
                  <span>{settings.developerCredit}</span>
                )}
              </div>
            </div>
          </div>

          {/* Last Updated Info */}
          {settings.updatedAt && (
            <div className="text-sm text-muted-foreground">
              Last updated: {new Date(settings.updatedAt).toLocaleString()}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleReset}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}