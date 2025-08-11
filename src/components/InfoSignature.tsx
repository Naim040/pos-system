"use client"

import { useState, useEffect } from 'react'
import { Phone, ExternalLink } from 'lucide-react'

interface AppSettings {
  contactPhone: string
  developerCredit: string
  developerUrl?: string | null
}

export default function InfoSignature() {
  const [settings, setSettings] = useState<AppSettings>({
    contactPhone: '01938264923',
    developerCredit: 'Developed by Halalzi',
    developerUrl: null
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings/public')
        if (response.ok) {
          const data = await response.json()
          setSettings(data)
        } else {
          // Fallback to environment variables or defaults
          setSettings({
            contactPhone: process.env.NEXT_PUBLIC_DEFAULT_CONTACT_PHONE || '01938264923',
            developerCredit: process.env.NEXT_PUBLIC_DEFAULT_DEVELOPER_CREDIT || 'Developed by Halalzi',
            developerUrl: process.env.NEXT_PUBLIC_DEFAULT_DEVELOPER_URL || null
          })
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
        setError(true)
        // Fallback to environment variables or defaults
        setSettings({
          contactPhone: process.env.NEXT_PUBLIC_DEFAULT_CONTACT_PHONE || '01938264923',
          developerCredit: process.env.NEXT_PUBLIC_DEFAULT_DEVELOPER_CREDIT || 'Developed by Halalzi',
          developerUrl: process.env.NEXT_PUBLIC_DEFAULT_DEVELOPER_URL || null
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  if (loading) {
    return (
      <div className="text-xs text-muted-foreground/80 text-center">
        <div className="animate-pulse">Loading contact info...</div>
      </div>
    )
  }

  if (error) {
    // Show fallback even if there was an error
    return (
      <div className="text-xs text-muted-foreground/80 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-center">
        <div className="flex items-center gap-1">
          <Phone className="h-3 w-3" />
          <span>Contact: {settings.contactPhone}</span>
        </div>
        <div className="hidden sm:inline text-muted-foreground/60">|</div>
        <div>
          {settings.developerUrl ? (
            <a 
              href={settings.developerUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              {settings.developerCredit}
              <ExternalLink className="h-3 w-3 ml-1 inline" />
            </a>
          ) : (
            <span>{settings.developerCredit}</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="text-xs text-muted-foreground/80 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-center">
      <div className="flex items-center gap-1">
        <Phone className="h-3 w-3" />
        <span>Contact: {settings.contactPhone}</span>
      </div>
      <div className="hidden sm:inline text-muted-foreground/60">|</div>
      <div>
        {settings.developerUrl ? (
          <a 
            href={settings.developerUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            {settings.developerCredit}
            <ExternalLink className="h-3 w-3 ml-1 inline" />
          </a>
        ) : (
          <span>{settings.developerCredit}</span>
        )}
      </div>
    </div>
  )
}