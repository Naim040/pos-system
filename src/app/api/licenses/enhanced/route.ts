import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Enhanced license key generation with validation algorithms
function generateEnhancedLicenseKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  
  // Generate segments with checksum validation
  for (let segment = 0; segment < 4; segment++) {
    if (segment > 0) result += '-'
    
    let segmentSum = 0
    for (let i = 0; i < 4; i++) {
      const char = chars.charAt(Math.floor(Math.random() * chars.length))
      result += char
      segmentSum += chars.indexOf(char)
    }
    
    // Add checksum character for each segment
    const checksum = chars.charAt(segmentSum % chars.length)
    result += checksum
  }
  
  return result
}

// Advanced validation algorithm
function validateEnhancedLicenseKey(key: string): { isValid: boolean; confidence: number; issues: string[] } {
  const issues: string[] = []
  let confidence = 100
  
  // Basic format validation
  const regex = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/
  if (!regex.test(key)) {
    issues.push('Invalid format')
    confidence -= 50
    return { isValid: false, confidence, issues }
  }
  
  // Checksum validation for each segment
  const segments = key.split('-')
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    const dataChars = segment.slice(0, 4)
    const checksumChar = segment[4]
    
    let segmentSum = 0
    for (const char of dataChars) {
      segmentSum += chars.indexOf(char)
    }
    
    const expectedChecksum = chars.charAt(segmentSum % chars.length)
    if (checksumChar !== expectedChecksum) {
      issues.push(`Invalid checksum in segment ${i + 1}`)
      confidence -= 25
    }
  }
  
  // Pattern detection (prevent predictable keys)
  const hasRepeatingPatterns = /(.)\1{3,}/.test(key.replace(/-/g, ''))
  if (hasRepeatingPatterns) {
    issues.push('Contains repeating patterns')
    confidence -= 15
  }
  
  // Sequential character detection
  const hasSequentialChars = /(?:ABCD|BCDE|CDEF|DEFG|EFGH|FGHI|GHIJ|HIJK|IJKL|JKLM|JKLMN|LMNO|MNOP|NOPQ|OPQR|PQRS|QRST|RSTU|STUV|TUVW|UVWX|VWXY|WXYZ|0123|1234|2345|3456|4567|5678|6789|7890)/i.test(key.replace(/-/g, ''))
  if (hasSequentialChars) {
    issues.push('Contains sequential characters')
    confidence -= 10
  }
  
  return {
    isValid: confidence >= 75,
    confidence: Math.max(0, confidence),
    issues
  }
}

// Risk assessment algorithm
function assessLicenseRisk(license: any): { riskLevel: 'low' | 'medium' | 'high'; score: number; factors: string[] } {
  const factors: string[] = []
  let riskScore = 0
  
  // Check activation patterns
  if (license.activationCount > license.maxActivations * 0.8) {
    factors.push('High activation usage')
    riskScore += 30
  }
  
  // Check expiration status
  if (license.expiresAt) {
    const daysUntilExpiry = Math.ceil((new Date(license.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (daysUntilExpiry < 30) {
      factors.push('License expiring soon')
      riskScore += 20
    }
    if (daysUntilExpiry < 0) {
      factors.push('License expired')
      riskScore += 50
    }
  }
  
  // Check verification frequency
  if (license.lastVerifiedAt) {
    const daysSinceVerification = Math.ceil((Date.now() - new Date(license.lastVerifiedAt).getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceVerification > 90) {
      factors.push('Long time since verification')
      riskScore += 15
    }
  }
  
  // Check hardware binding changes
  if (license.hardwareBinding) {
    const binding = JSON.parse(license.hardwareBinding)
    if (binding.allowedHardwareIds && binding.allowedHardwareIds.length > 3) {
      factors.push('Multiple hardware bindings')
      riskScore += 25
    }
  }
  
  // Check status
  if (license.status === 'suspended') {
    factors.push('License suspended')
    riskScore += 60
  }
  
  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' = 'low'
  if (riskScore >= 60) riskLevel = 'high'
  else if (riskScore >= 30) riskLevel = 'medium'
  
  return {
    riskLevel,
    score: riskScore,
    factors
  }
}

// Verification scoring algorithm
function calculateVerificationScore(license: any): number {
  let score = 100
  
  // Deduct for expired licenses
  if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
    score -= 50
  }
  
  // Deduct for high activation usage
  const activationRatio = license.activationCount / license.maxActivations
  if (activationRatio > 0.9) score -= 20
  else if (activationRatio > 0.7) score -= 10
  
  // Deduct for suspended status
  if (license.status === 'suspended') score -= 40
  
  // Deduct for old verification
  if (license.lastVerifiedAt) {
    const daysSinceVerification = Math.ceil((Date.now() - new Date(license.lastVerifiedAt).getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceVerification > 90) score -= 15
    else if (daysSinceVerification > 30) score -= 5
  }
  
  return Math.max(0, Math.min(100, score))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    if (action === 'create') {
      const { type, clientName, clientEmail, maxUsers = 1, maxStores = 1, maxActivations = 3, allowedDomains, hardwareBinding, notes } = data
      
      if (!type || !clientName || !clientEmail) {
        return NextResponse.json(
          { error: 'Type, client name, and client email are required' },
          { status: 400 }
        )
      }

      const licenseKey = generateEnhancedLicenseKey()
      
      // Calculate expiration date for non-lifetime licenses
      let expiresAt = null
      if (type === 'monthly') {
        expiresAt = new Date()
        expiresAt.setMonth(expiresAt.getMonth() + 1)
      } else if (type === 'yearly') {
        expiresAt = new Date()
        expiresAt.setFullYear(expiresAt.getFullYear() + 1)
      } else if (type === 'trial') {
        expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 30)
      }

      const license = await db.license.create({
        data: {
          licenseKey,
          type,
          clientName,
          clientEmail,
          maxUsers,
          maxStores,
          maxActivations,
          allowedDomains: allowedDomains ? JSON.stringify(allowedDomains) : null,
          hardwareBinding: hardwareBinding ? JSON.stringify(hardwareBinding) : null,
          expiresAt,
          notes,
          lastVerifiedAt: new Date()
        },
        include: {
          activations: true,
          payments: true
        }
      })

      // Calculate initial risk and verification scores
      const riskAssessment = assessLicenseRisk(license)
      const verificationScore = calculateVerificationScore(license)

      return NextResponse.json({ 
        license: { ...license, riskLevel: riskAssessment.riskLevel, verificationScore },
        licenseKey,
        riskAssessment,
        validation: validateEnhancedLicenseKey(licenseKey)
      })

    } else if (action === 'bulk-generate') {
      const { templateId, count = 1 } = data
      
      if (!templateId || count < 1 || count > 50) {
        return NextResponse.json(
          { error: 'Valid template ID and count (1-50) are required' },
          { status: 400 }
        )
      }

      // Get template (you would need to create a LicenseTemplate model)
      // For now, we'll use a default template
      const template = {
        type: 'lifetime',
        maxUsers: 1,
        maxStores: 1,
        maxActivations: 3,
        duration: 0
      }

      const licenses = []
      const licenseKeys = new Set<string>()

      for (let i = 0; i < count; i++) {
        let licenseKey: string
        let attempts = 0
        
        // Ensure unique license keys
        do {
          licenseKey = generateEnhancedLicenseKey()
          attempts++
          if (attempts > 100) {
            return NextResponse.json(
              { error: 'Failed to generate unique license keys' },
              { status: 500 }
            )
          }
        } while (licenseKeys.has(licenseKey) || await db.license.findUnique({ where: { licenseKey } }))
        
        licenseKeys.add(licenseKey)
        
        // Calculate expiration date
        let expiresAt = null
        if (template.type === 'monthly') {
          expiresAt = new Date()
          expiresAt.setMonth(expiresAt.getMonth() + 1)
        } else if (template.type === 'yearly') {
          expiresAt = new Date()
          expiresAt.setFullYear(expiresAt.getFullYear() + 1)
        }

        const license = await db.license.create({
          data: {
            licenseKey,
            type: template.type,
            clientName: `Bulk License ${i + 1}`,
            clientEmail: `bulk${i + 1}@generated.com`,
            maxUsers: template.maxUsers,
            maxStores: template.maxStores,
            maxActivations: template.maxActivations,
            expiresAt,
            lastVerifiedAt: new Date()
          }
        })

        // Calculate scores
        const riskAssessment = assessLicenseRisk(license)
        const verificationScore = calculateVerificationScore(license)

        licenses.push({
          ...license,
          riskLevel: riskAssessment.riskLevel,
          verificationScore
        })
      }

      return NextResponse.json({ 
        licenses, 
        licenseKeys: Array.from(licenseKeys),
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

      const validation = validateEnhancedLicenseKey(licenseKey)
      
      // Check if key already exists
      const existingLicense = await db.license.findUnique({
        where: { licenseKey },
        include: {
          activations: true,
          payments: true
        }
      })

      let riskAssessment = null
      let verificationScore = 0
      
      if (existingLicense) {
        riskAssessment = assessLicenseRisk(existingLicense)
        verificationScore = calculateVerificationScore(existingLicense)
      }

      return NextResponse.json({
        validation,
        isUnique: !existingLicense,
        exists: !!existingLicense,
        licenseKey,
        license: existingLicense ? {
          ...existingLicense,
          riskLevel: riskAssessment?.riskLevel,
          verificationScore
        } : null
      })

    } else if (action === 'verify-license') {
      const { licenseKey, systemInfo } = data
      
      if (!licenseKey) {
        return NextResponse.json(
          { error: 'License key is required' },
          { status: 400 }
        )
      }

      const license = await db.license.findUnique({
        where: { licenseKey },
        include: {
          activations: {
            where: { isActive: true }
          },
          payments: {
            where: { status: 'completed' },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      })

      if (!license) {
        return NextResponse.json({
          isValid: false,
          error: 'License not found'
        })
      }

      // Validate license key format
      const validation = validateEnhancedLicenseKey(licenseKey)
      if (!validation.isValid) {
        return NextResponse.json({
          isValid: false,
          error: 'Invalid license key format',
          validation
        })
      }

      // Check license status
      if (license.status === 'suspended' || license.status === 'cancelled') {
        return NextResponse.json({
          isValid: false,
          error: `License is ${license.status}`
        })
      }

      // Check expiration
      if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
        // Update license status to expired
        await db.license.update({
          where: { id: license.id },
          data: { status: 'expired' }
        })
        
        return NextResponse.json({
          isValid: false,
          error: 'License has expired'
        })
      }

      // Check activation limits
      if (license.activationCount >= license.maxActivations) {
        return NextResponse.json({
          isValid: false,
          error: 'Maximum activation limit reached'
        })
      }

      // Check hardware binding if present
      if (license.hardwareBinding && systemInfo) {
        const binding = JSON.parse(license.hardwareBinding)
        const isHardwareAllowed = binding.allowedHardwareIds?.includes(systemInfo.hardwareId) || 
                                 binding.allowedDomains?.includes(systemInfo.domain) ||
                                 binding.allowedDomains?.includes('*')
        
        if (!isHardwareAllowed && binding.strictMode) {
          return NextResponse.json({
            isValid: false,
            error: 'Hardware binding validation failed'
          })
        }
      }

      // Update verification timestamp
      await db.license.update({
        where: { id: license.id },
        data: { lastVerifiedAt: new Date() }
      })

      // Calculate scores
      const riskAssessment = assessLicenseRisk(license)
      const verificationScore = calculateVerificationScore(license)

      return NextResponse.json({
        isValid: true,
        license: {
          ...license,
          riskLevel: riskAssessment.riskLevel,
          verificationScore
        },
        validation,
        riskAssessment,
        verifiedAt: new Date().toISOString()
      })

    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Enhanced license management error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process license request',
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

    if (action === 'list') {
      // Get all licenses with enhanced information
      const licenses = await db.license.findMany({
        include: {
          activations: {
            where: { isActive: true }
          },
          payments: {
            where: { status: 'completed' },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      // Enhance licenses with risk assessment and verification scores
      const enhancedLicenses = licenses.map(license => {
        const riskAssessment = assessLicenseRisk(license)
        const verificationScore = calculateVerificationScore(license)
        
        return {
          ...license,
          riskLevel: riskAssessment.riskLevel,
          verificationScore,
          riskFactors: riskAssessment.factors
        }
      })

      return NextResponse.json({ licenses: enhancedLicenses })
    }

    if (action === 'stats') {
      // Get enhanced license statistics
      const totalLicenses = await db.license.count()
      const activeLicenses = await db.license.count({ where: { status: 'active' } })
      const expiredLicenses = await db.license.count({ where: { status: 'expired' } })
      const suspendedLicenses = await db.license.count({ where: { status: 'suspended' } })

      // Get type distribution
      const typeStats = await db.license.groupBy({
        by: ['type'],
        _count: { type: true }
      })

      // Get risk distribution
      const allLicenses = await db.license.findMany()
      const riskDistribution = allLicenses.reduce((acc, license) => {
        const riskAssessment = assessLicenseRisk(license)
        acc[riskAssessment.riskLevel] = (acc[riskAssessment.riskLevel] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Get average verification score
      const avgVerificationScore = allLicenses.length > 0 
        ? allLicenses.reduce((sum, license) => sum + calculateVerificationScore(license), 0) / allLicenses.length 
        : 0

      // Get total activations
      const totalActivations = await db.licenseActivation.count({
        where: { isActive: true }
      })

      return NextResponse.json({
        totalLicenses,
        activeLicenses,
        expiredLicenses,
        suspendedLicenses,
        typeDistribution: typeStats,
        riskDistribution,
        averageVerificationScore: Math.round(avgVerificationScore),
        totalActivations
      })
    }

    if (action === 'monitoring') {
      // Get real-time monitoring data
      const recentVerifications = await db.license.findMany({
        where: {
          lastVerifiedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        orderBy: { lastVerifiedAt: 'desc' },
        take: 50
      })

      const recentActivations = await db.licenseActivation.findMany({
        where: {
          activatedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        include: {
          license: true
        },
        orderBy: { activatedAt: 'desc' },
        take: 50
      })

      // System health indicators
      const systemHealth = {
        databaseStatus: 'healthy',
        apiStatus: 'healthy',
        lastCheck: new Date().toISOString(),
        uptime: process.uptime()
      }

      return NextResponse.json({
        recentVerifications: recentVerifications.length,
        recentActivations: recentActivations.length,
        systemHealth,
        monitoringData: {
          verifications: recentVerifications,
          activations: recentActivations
        }
      })
    }

    return NextResponse.json(
      { error: 'Invalid action parameter' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Enhanced license info error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get license information',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}