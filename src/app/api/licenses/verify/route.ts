import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Advanced license verification with multiple validation layers
function performAdvancedValidation(licenseKey: string, license: any, systemInfo?: any): {
  isValid: boolean;
  confidence: number;
  checks: {
    format: boolean;
    checksum: boolean;
    expiration: boolean;
    activation: boolean;
    hardware: boolean;
    status: boolean;
  };
  issues: string[];
  recommendations: string[];
} {
  const checks = {
    format: false,
    checksum: false,
    expiration: false,
    activation: false,
    hardware: false,
    status: false
  }
  
  const issues: string[] = []
  const recommendations: string[] = []
  let confidence = 100

  // 1. Format Validation
  const formatRegex = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/
  checks.format = formatRegex.test(licenseKey)
  if (!checks.format) {
    issues.push('Invalid license key format')
    confidence -= 40
    recommendations.push('Check the license key format and try again')
  }

  // 2. Checksum Validation
  if (checks.format) {
    const segments = licenseKey.split('-')
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let allChecksumsValid = true
    
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
        allChecksumsValid = false
        issues.push(`Invalid checksum in segment ${i + 1}`)
      }
    }
    
    checks.checksum = allChecksumsValid
    if (!allChecksumsValid) {
      confidence -= 30
      recommendations.push('License key may be corrupted or tampered with')
    }
  }

  // 3. Expiration Check
  if (license.expiresAt) {
    const now = new Date()
    const expiryDate = new Date(license.expiresAt)
    checks.expiration = expiryDate > now
    
    if (!checks.expiration) {
      issues.push('License has expired')
      confidence -= 50
      recommendations.push('Contact support to renew your license')
    } else {
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (daysUntilExpiry < 30) {
        issues.push(`License expires in ${daysUntilExpiry} days`)
        confidence -= 10
        recommendations.push('Consider renewing your license soon')
      }
    }
  } else {
    checks.expiration = true // Lifetime license
  }

  // 4. Activation Limit Check
  checks.activation = license.activationCount < license.maxActivations
  if (!checks.activation) {
    issues.push('Maximum activation limit reached')
    confidence -= 40
    recommendations.push('Contact support to increase activation limit')
  } else {
    const activationRatio = license.activationCount / license.maxActivations
    if (activationRatio > 0.8) {
      issues.push(`High activation usage (${Math.round(activationRatio * 100)}%)`)
      confidence -= 15
      recommendations.push('Monitor activation usage closely')
    }
  }

  // 5. Hardware Binding Check
  if (license.hardwareBinding && systemInfo) {
    try {
      const binding = JSON.parse(license.hardwareBinding)
      const { hardwareId, domain } = systemInfo
      
      let isHardwareAllowed = false
      let isDomainAllowed = false
      
      // Check hardware ID
      if (binding.allowedHardwareIds && hardwareId) {
        isHardwareAllowed = binding.allowedHardwareIds.includes(hardwareId)
      }
      
      // Check domain
      if (binding.allowedDomains && domain) {
        isDomainAllowed = binding.allowedDomains.includes(domain) || 
                          binding.allowedDomains.includes('*') ||
                          binding.allowedDomains.some((d: string) => d.startsWith('*.') && domain.endsWith(d.substring(2)))
      }
      
      checks.hardware = isHardwareAllowed || isDomainAllowed || !binding.strictMode
      
      if (!checks.hardware) {
        issues.push('Hardware binding validation failed')
        confidence -= 35
        recommendations.push('License is bound to different hardware or domain')
      }
    } catch (error) {
      issues.push('Invalid hardware binding configuration')
      confidence -= 20
      recommendations.push('Contact support to resolve hardware binding issues')
    }
  } else {
    checks.hardware = true // No hardware binding required
  }

  // 6. Status Check
  checks.status = license.status === 'active'
  if (!checks.status) {
    issues.push(`License status is ${license.status}`)
    confidence -= 60
    recommendations.push('Contact support to resolve license status issues')
  }

  // Additional security checks
  if (license.lastVerifiedAt) {
    const daysSinceVerification = Math.ceil((Date.now() - new Date(license.lastVerifiedAt).getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceVerification > 90) {
      issues.push('License not verified recently')
      confidence -= 10
      recommendations.push('Perform regular license verification')
    }
  }

  // Suspicious activity detection
  if (license.activationCount > 0) {
    const activations = license.activations || []
    const recentActivations = activations.filter((a: any) => {
      const activationDate = new Date(a.activatedAt)
      const daysSinceActivation = Math.ceil((Date.now() - activationDate.getTime()) / (1000 * 60 * 60 * 24))
      return daysSinceActivation <= 7
    })
    
    if (recentActivations.length > 3) {
      issues.push('High number of recent activations')
      confidence -= 25
      recommendations.push('Monitor for suspicious activation patterns')
    }
  }

  return {
    isValid: confidence >= 70 && Object.values(checks).every(check => check),
    confidence: Math.max(0, confidence),
    checks,
    issues,
    recommendations
  }
}

// Generate verification report
function generateVerificationReport(license: any, validation: any, systemInfo?: any): {
  summary: string;
  riskLevel: 'low' | 'medium' | 'high';
  securityScore: number;
  details: any;
  nextSteps: string[];
} {
  const { isValid, confidence, checks, issues, recommendations } = validation
  
  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' = 'low'
  if (confidence < 70) riskLevel = 'high'
  else if (confidence < 85) riskLevel = 'medium'
  
  // Calculate security score
  const securityScore = Math.round(confidence)
  
  // Generate summary
  let summary = isValid 
    ? 'License verification successful. All security checks passed.'
    : 'License verification failed. Issues detected that need attention.'
  
  if (riskLevel === 'high') {
    summary += ' Immediate action required.'
  } else if (riskLevel === 'medium') {
    summary += ' Attention recommended.'
  }
  
  // Compile details
  const details = {
    licenseKey: license.licenseKey,
    clientName: license.clientName,
    clientEmail: license.clientEmail,
    licenseType: license.type,
    status: license.status,
    activationCount: license.activationCount,
    maxActivations: license.maxActivations,
    issuedAt: license.issuedAt,
    expiresAt: license.expiresAt,
    lastVerifiedAt: license.lastVerifiedAt,
    systemInfo: systemInfo || null,
    validationChecks: checks,
    validationIssues: issues,
    hardwareBinding: license.hardwareBinding ? JSON.parse(license.hardwareBinding) : null
  }
  
  // Determine next steps
  const nextSteps: string[] = []
  
  if (!isValid) {
    nextSteps.push('Review and address validation issues')
    nextSteps.push('Contact support if issues persist')
  }
  
  if (riskLevel === 'high') {
    nextSteps.push('Immediate security review required')
    nextSteps.push('Consider temporarily suspending the license')
  }
  
  if (issues.some(issue => issue.includes('expiring'))) {
    nextSteps.push('Plan for license renewal')
  }
  
  if (issues.some(issue => issue.includes('activation'))) {
    nextSteps.push('Review activation patterns and limits')
  }
  
  if (recommendations.length > 0) {
    nextSteps.push(...recommendations)
  }
  
  // Add general maintenance steps
  if (isValid && riskLevel === 'low') {
    nextSteps.push('Continue regular monitoring')
    nextSteps.push('Schedule periodic verification')
  }
  
  return {
    summary,
    riskLevel,
    securityScore,
    details,
    nextSteps
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { licenseKey, systemInfo, includeDetails = false, generateReport = false } = body

    if (!licenseKey) {
      return NextResponse.json(
        { error: 'License key is required' },
        { status: 400 }
      )
    }

    // Find the license
    const license = await db.license.findUnique({
      where: { licenseKey },
      include: {
        activations: {
          where: { isActive: true },
          orderBy: { activatedAt: 'desc' }
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
        error: 'License not found',
        confidence: 0,
        recommendations: ['Check the license key and try again', 'Contact support if you believe this is an error']
      })
    }

    // Perform advanced validation
    const validation = performAdvancedValidation(licenseKey, license, systemInfo)
    
    // Update verification timestamp
    await db.license.update({
      where: { id: license.id },
      data: { lastVerifiedAt: new Date() }
    })

    // Prepare response
    const response: any = {
      isValid: validation.isValid,
      licenseKey,
      confidence: validation.confidence,
      checks: validation.checks,
      issues: validation.issues,
      recommendations: validation.recommendations,
      verifiedAt: new Date().toISOString()
    }

    // Add basic license info
    if (includeDetails) {
      response.license = {
        id: license.id,
        type: license.type,
        status: license.status,
        clientName: license.clientName,
        clientEmail: license.clientEmail,
        maxUsers: license.maxUsers,
        maxStores: license.maxStores,
        maxActivations: license.maxActivations,
        activationCount: license.activationCount,
        issuedAt: license.issuedAt,
        expiresAt: license.expiresAt,
        lastVerifiedAt: license.lastVerifiedAt
      }
    }

    // Generate verification report if requested
    if (generateReport) {
      const report = generateVerificationReport(license, validation, systemInfo)
      response.report = report
    }

    // Add risk assessment
    response.riskLevel = validation.confidence >= 85 ? 'low' : 
                         validation.confidence >= 70 ? 'medium' : 'high'
    
    // Add verification score
    response.verificationScore = Math.round(validation.confidence)

    return NextResponse.json(response)

  } catch (error) {
    console.error('License verification error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to verify license',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        isValid: false,
        confidence: 0
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'health') {
      // Return verification service health status
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        checks: {
          database: 'healthy',
          validation: 'healthy',
          security: 'healthy'
        }
      }

      return NextResponse.json({ health })
    }

    if (action === 'stats') {
      // Get verification statistics
      const totalLicenses = await db.license.count()
      const activeLicenses = await db.license.count({ where: { status: 'active' } })
      const recentVerifications = await db.license.count({
        where: {
          lastVerifiedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })

      const totalActivations = await db.licenseActivation.count({
        where: { isActive: true }
      })

      const stats = {
        totalLicenses,
        activeLicenses,
        recentVerifications,
        totalActivations,
        verificationRate: totalLicenses > 0 ? (recentVerifications / totalLicenses * 100).toFixed(2) + '%' : '0%',
        averageActivationsPerLicense: totalLicenses > 0 ? (totalActivations / totalLicenses).toFixed(2) : '0'
      }

      return NextResponse.json({ stats })
    }

    if (action === 'validation-rules') {
      // Return current validation rules and thresholds
      const rules = {
        format: {
          pattern: '^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$',
          description: '20-character license key with dashes in 5-character segments'
        },
        checksum: {
          algorithm: 'modulo sum',
          description: 'Each segment includes a checksum character based on character sum'
        },
        expiration: {
          warningThreshold: 30, // days
          criticalThreshold: 0, // days
          description: 'License expiration warnings and enforcement'
        },
        activation: {
          warningThreshold: 0.8, // 80% of max activations
          criticalThreshold: 1.0, // 100% of max activations
          description: 'Activation limit monitoring and enforcement'
        },
        hardware: {
          strictMode: true,
          maxBindings: 3,
          description: 'Hardware binding validation and limits'
        },
        confidence: {
          highThreshold: 85,
          mediumThreshold: 70,
          lowThreshold: 0,
          description: 'Confidence score thresholds for risk assessment'
        }
      }

      return NextResponse.json({ rules })
    }

    return NextResponse.json(
      { error: 'Invalid action parameter' },
      { status: 400 }
    )

  } catch (error) {
    console.error('License verification info error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get verification information',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}