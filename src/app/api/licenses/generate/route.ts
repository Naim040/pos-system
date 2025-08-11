import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper function to generate license keys
function generateLicenseKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) result += '-'
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Helper function to generate activation key
function generateActivationKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    if (i > 0 && i % 8 === 0) result += '-'
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Helper function to validate license key format
function isValidLicenseKey(key: string): boolean {
  const regex = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/
  return regex.test(key)
}

// Helper function to generate bulk license keys
function generateBulkLicenseKeys(count: number): string[] {
  const keys = new Set<string>()
  
  while (keys.size < count) {
    const key = generateLicenseKey()
    keys.add(key)
  }
  
  return Array.from(keys)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    if (action === 'generate-single') {
      const { type, clientName, clientEmail, maxUsers = 1, maxStores = 1 } = data
      
      if (!type || !clientName || !clientEmail) {
        return NextResponse.json(
          { error: 'Type, client name, and client email are required' },
          { status: 400 }
        )
      }

      const licenseKey = generateLicenseKey()
      
      // Calculate expiration date for non-lifetime licenses
      let expiresAt = null
      if (type === 'monthly') {
        expiresAt = new Date()
        expiresAt.setMonth(expiresAt.getMonth() + 1)
      } else if (type === 'yearly') {
        expiresAt = new Date()
        expiresAt.setFullYear(expiresAt.getFullYear() + 1)
      }

      const license = await db.license.create({
        data: {
          licenseKey,
          type,
          clientName,
          clientEmail,
          maxUsers,
          maxStores,
          expiresAt
        }
      })

      return NextResponse.json({ license, licenseKey })

    } else if (action === 'generate-bulk') {
      const { count = 1, type, clientName, clientEmail, maxUsers = 1, maxStores = 1 } = data
      
      if (!type || !clientName || !clientEmail || count < 1) {
        return NextResponse.json(
          { error: 'Type, client name, client email, and valid count are required' },
          { status: 400 }
        )
      }

      if (count > 100) {
        return NextResponse.json(
          { error: 'Maximum 100 licenses can be generated at once' },
          { status: 400 }
        )
      }

      const licenseKeys = generateBulkLicenseKeys(count)
      const licenses = []

      for (let i = 0; i < licenseKeys.length; i++) {
        const licenseKey = licenseKeys[i]
        
        // Calculate expiration date for non-lifetime licenses
        let expiresAt = null
        if (type === 'monthly') {
          expiresAt = new Date()
          expiresAt.setMonth(expiresAt.getMonth() + 1)
        } else if (type === 'yearly') {
          expiresAt = new Date()
          expiresAt.setFullYear(expiresAt.getFullYear() + 1)
        }

        const license = await db.license.create({
          data: {
            licenseKey,
            type,
            clientName: `${clientName} #${i + 1}`,
            clientEmail,
            maxUsers,
            maxStores,
            expiresAt
          }
        })

        licenses.push(license)
      }

      return NextResponse.json({ 
        licenses, 
        licenseKeys, 
        count: licenses.length,
        message: `Generated ${licenses.length} licenses successfully`
      })

    } else if (action === 'validate-key') {
      const { licenseKey } = data
      
      if (!licenseKey) {
        return NextResponse.json(
          { error: 'License key is required' },
          { status: 400 }
        )
      }

      const isValid = isValidLicenseKey(licenseKey)
      
      // Check if key already exists
      const existingLicense = await db.license.findUnique({
        where: { licenseKey }
      })

      return NextResponse.json({
        isValid,
        isUnique: !existingLicense,
        exists: !!existingLicense,
        licenseKey,
        format: isValid ? 'valid' : 'invalid'
      })

    } else if (action === 'generate-preview') {
      const { count = 1, format = 'json' } = data
      
      if (count < 1 || count > 50) {
        return NextResponse.json(
          { error: 'Count must be between 1 and 50' },
          { status: 400 }
        )
      }

      const licenseKeys = generateBulkLicenseKeys(count)
      
      if (format === 'csv') {
        const csvContent = ['License Key', ...licenseKeys].join('\n')
        return NextResponse.json({ 
          preview: csvContent, 
          count,
          format: 'csv'
        })
      }

      return NextResponse.json({ 
        preview: licenseKeys, 
        count,
        format: 'json'
      })

    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('License generation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate licenses',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'stats') {
      // Get license generation statistics
      const stats = await db.license.groupBy({
        by: ['type', 'status'],
        _count: {
          type: true,
          status: true
        },
        _sum: {
          activationCount: true
        }
      })

      const totalLicenses = await db.license.count()
      const activeLicenses = await db.license.count({ where: { status: 'active' } })
      const expiredLicenses = await db.license.count({ where: { status: 'expired' } })

      return NextResponse.json({
        totalLicenses,
        activeLicenses,
        expiredLicenses,
        breakdown: stats
      })
    }

    if (action === 'formats') {
      // Return supported license formats and examples
      const formats = {
        standard: {
          pattern: 'XXXX-XXXX-XXXX-XXXX',
          example: 'ABCD-1234-EFGH-5678',
          description: 'Standard 16-character license key with dashes'
        },
        activation: {
          pattern: 'XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX',
          example: 'ABCDEF12-34567890-GHIJKLMN-OPQRSTUV',
          description: '32-character activation key for license verification'
        }
      }

      return NextResponse.json({ formats })
    }

    return NextResponse.json(
      { error: 'Invalid action parameter' },
      { status: 400 }
    )

  } catch (error) {
    console.error('License generation info error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get license generation info',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}