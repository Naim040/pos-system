import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const licenseId = searchParams.get('licenseId')

    if (!licenseId) {
      // Get all licenses status overview
      const licenses = await db.license.findMany({
        include: {
          activations: {
            where: { isActive: true }
          },
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      // Calculate status overview
      const statusOverview = {
        total: licenses.length,
        active: licenses.filter(l => l.status === 'active').length,
        expired: licenses.filter(l => l.status === 'expired').length,
        suspended: licenses.filter(l => l.status === 'suspended').length,
        cancelled: licenses.filter(l => l.status === 'cancelled').length,
        expiringSoon: licenses.filter(l => {
          if (!l.expiresAt) return false
          const daysUntilExpiry = Math.ceil(
            (new Date(l.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          )
          return daysUntilExpiry <= 30 && daysUntilExpiry > 0
        }).length
      }

      return NextResponse.json({
        statusOverview,
        licenses
      })
    }

    // Get specific license monitoring data
    const license = await db.license.findUnique({
      where: { id: licenseId },
      include: {
        activations: {
          orderBy: { activatedAt: 'desc' }
        },
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!license) {
      return NextResponse.json(
        { error: 'License not found' },
        { status: 404 }
      )
    }

    // Calculate monitoring metrics
    const monitoringData = {
      license,
      metrics: {
        totalActivations: license.activations.length,
        activeActivations: license.activations.filter(a => a.isActive).length,
        recentActivations: license.activations.filter(a => {
          const daysSinceActivation = Math.ceil(
            (new Date().getTime() - new Date(a.activatedAt).getTime()) / (1000 * 60 * 60 * 24)
          )
          return daysSinceActivation <= 7
        }).length,
        suspiciousActivity: license.activations.filter(a => {
          // Check for suspicious patterns
          return a.deactivationReason?.includes('Security') || 
                 a.deactivationReason?.includes('violation')
        }).length,
        lastActivity: license.activations.length > 0 ? license.activations[0].activatedAt : null,
        totalPayments: license.payments.length,
        lastPayment: license.payments.length > 0 ? license.payments[0].createdAt : null
      },
      alerts: generateLicenseAlerts(license)
    }

    return NextResponse.json(monitoringData)

  } catch (error) {
    console.error('License monitoring error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get license monitoring data',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

function generateLicenseAlerts(license: any): Array<{ type: string; severity: string; message: string; timestamp: string }> {
  const alerts: Array<{ type: string; severity: string; message: string; timestamp: string }> = []
  const now = new Date()

  // Expiration alerts
  if (license.expiresAt) {
    const daysUntilExpiry = Math.ceil(
      (new Date(license.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysUntilExpiry <= 0) {
      alerts.push({
        type: 'expiration',
        severity: 'critical',
        message: 'License has expired',
        timestamp: now.toISOString()
      })
    } else if (daysUntilExpiry <= 7) {
      alerts.push({
        type: 'expiration',
        severity: 'high',
        message: `License expires in ${daysUntilExpiry} days`,
        timestamp: now.toISOString()
      })
    } else if (daysUntilExpiry <= 30) {
      alerts.push({
        type: 'expiration',
        severity: 'medium',
        message: `License expires in ${daysUntilExpiry} days`,
        timestamp: now.toISOString()
      })
    }
  }

  // Activation limit alerts
  if (license.activationCount >= license.maxActivations * 0.8) {
    alerts.push({
      type: 'activation_limit',
      severity: license.activationCount >= license.maxActivations ? 'high' : 'medium',
      message: `License activation limit: ${license.activationCount}/${license.maxActivations}`,
      timestamp: now.toISOString()
    })
  }

  // Suspicious activity alerts
  const recentActivations = license.activations?.filter((a: any) => {
    const daysSinceActivation = Math.ceil(
      (now.getTime() - new Date(a.activatedAt).getTime()) / (1000 * 60 * 60 * 24)
    )
    return daysSinceActivation <= 1
  }) || []

  if (recentActivations.length > 3) {
    alerts.push({
      type: 'suspicious_activity',
      severity: 'medium',
      message: `Multiple recent activations detected (${recentActivations.length} in 24 hours)`,
      timestamp: now.toISOString()
    })
  }

  // Payment status alerts (for subscription licenses)
  if (license.type !== 'lifetime') {
    const lastPayment = license.payments?.[0]
    if (lastPayment && lastPayment.status === 'pending') {
      alerts.push({
        type: 'payment',
        severity: 'high',
        message: 'Payment is pending',
        timestamp: now.toISOString()
      })
    }
  }

  return alerts
}