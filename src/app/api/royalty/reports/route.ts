import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withLicenseProtection } from '@/lib/licenseMiddleware'

// Get royalty reports and analytics (admin only)
export const GET = withLicenseProtection(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'overview'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const franchiseId = searchParams.get('franchiseId')

    let reportData: any = {}

    switch (reportType) {
      case 'overview':
        reportData = await getOverviewReport(franchiseId)
        break
      case 'revenue':
        reportData = await getRevenueReport(startDate, endDate, franchiseId)
        break
      case 'outstanding':
        reportData = await getOutstandingReport(franchiseId)
        break
      case 'franchise-performance':
        reportData = await getFranchisePerformanceReport(startDate, endDate)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        )
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error('Get royalty report error:', error)
    return NextResponse.json(
      { error: 'Failed to generate royalty report' },
      { status: 500 }
    )
  }
})

// Overview report with key metrics
async function getOverviewReport(franchiseId?: string) {
  const where = franchiseId ? { franchiseId } : {}

  const [
    totalFranchises,
    activeFranchises,
    totalClients,
    totalRevenue,
    totalOutstanding,
    monthlyRecurringRevenue,
    paymentStats,
    overduePayments
  ] = await Promise.all([
    db.franchise.count({ where: franchiseId ? { id: franchiseId } : {} }),
    db.franchise.count({ 
      where: { 
        ...where,
        status: { in: ['active', 'approved'] },
        isBlocked: false
      }
    }),
    db.franchiseClient.count({ where }),
    db.royaltyPayment.aggregate({
      where: { 
        ...where,
        status: 'paid'
      },
      _sum: { amount: true }
    }),
    db.royaltyPayment.aggregate({
      where: { 
        ...where,
        status: { in: ['pending', 'overdue'] }
      },
      _sum: { amount: true }
    }),
    db.royaltyPayment.aggregate({
      where: { 
        ...where,
        paymentType: 'monthly',
        status: 'paid'
      },
      _sum: { amount: true }
    }),
    db.royaltyPayment.groupBy({
      by: ['status'],
      where,
      _count: { status: true },
      _sum: { amount: true }
    }),
    db.royaltyPayment.findMany({
      where: {
        ...where,
        status: 'overdue'
      },
      include: {
        franchise: {
          select: { id: true, name: true, email: true }
        }
      }
    })
  ])

  return {
    summary: {
      totalFranchises,
      activeFranchises,
      totalClients,
      totalRevenue: totalRevenue._sum.amount || 0,
      totalOutstanding: totalOutstanding._sum.amount || 0,
      monthlyRecurringRevenue: monthlyRecurringRevenue._sum.amount || 0,
      collectionRate: totalRevenue._sum.amount ? 
        Math.round((totalRevenue._sum.amount / (totalRevenue._sum.amount + totalOutstanding._sum.amount)) * 100) : 0
    },
    paymentStats: paymentStats.reduce((acc, stat) => {
      acc[stat.status] = {
        count: stat._count.status,
        amount: stat._sum.amount || 0
      }
      return acc
    }, {} as any),
    overduePayments: overduePayments.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      dueDate: payment.dueDate,
      franchise: payment.franchise
    }))
  }
}

// Revenue report with time-based analysis
async function getRevenueReport(startDate?: string, endDate?: string, franchiseId?: string) {
  const where: any = { status: 'paid' }
  if (franchiseId) where.franchiseId = franchiseId
  if (startDate) where.paidDate = { gte: new Date(startDate) }
  if (endDate) {
    where.paidDate = { 
      ...where.paidDate,
      lte: new Date(endDate) 
    }
  }

  const [
    totalRevenue,
    revenueByType,
    revenueByMonth,
    topFranchises
  ] = await Promise.all([
    db.royaltyPayment.aggregate({
      where,
      _sum: { amount: true },
      _count: true
    }),
    db.royaltyPayment.groupBy({
      by: ['paymentType'],
      where,
      _sum: { amount: true },
      _count: true
    }),
    db.royaltyPayment.findMany({
      where,
      select: {
        paidDate: true,
        amount: true,
        paymentType: true
      },
      orderBy: { paidDate: 'asc' }
    }),
    db.franchise.findMany({
      where: franchiseId ? { id: franchiseId } : {},
      select: {
        id: true,
        name: true,
        totalRevenue: true,
        currentClients: true,
        _count: {
          select: {
            clients: true
          }
        }
      },
      orderBy: { totalRevenue: 'desc' },
      take: 10
    })
  ])

  // Group revenue by month
  const monthlyRevenue = revenueByMonth.reduce((acc, payment) => {
    const month = new Date(payment.paidDate).toISOString().slice(0, 7) // YYYY-MM
    if (!acc[month]) {
      acc[month] = { oneTime: 0, monthly: 0, total: 0 }
    }
    if (payment.paymentType === 'one_time') {
      acc[month].oneTime += payment.amount
    } else if (payment.paymentType === 'monthly') {
      acc[month].monthly += payment.amount
    }
    acc[month].total += payment.amount
    return acc
  }, {} as any)

  return {
    totalRevenue: totalRevenue._sum.amount || 0,
    totalPayments: totalRevenue._count,
    revenueByType: revenueByType.reduce((acc, stat) => {
      acc[stat.paymentType] = {
        amount: stat._sum.amount || 0,
        count: stat._count
      }
      return acc
    }, {} as any),
    monthlyRevenue,
    topFranchises: topFranchises.map(franchise => ({
      id: franchise.id,
      name: franchise.name,
      revenue: franchise.totalRevenue,
      clients: franchise._count.clients,
      avgRevenuePerClient: franchise._count.clients > 0 ? franchise.totalRevenue / franchise._count.clients : 0
    }))
  }
}

// Outstanding payments report
async function getOutstandingReport(franchiseId?: string) {
  const where: any = { status: { in: ['pending', 'overdue'] } }
  if (franchiseId) where.franchiseId = franchiseId

  const [
    totalOutstanding,
    outstandingByStatus,
    outstandingByFranchise,
    overdueByAge
  ] = await Promise.all([
    db.royaltyPayment.aggregate({
      where,
      _sum: { amount: true },
      _count: true
    }),
    db.royaltyPayment.groupBy({
      by: ['status'],
      where,
      _sum: { amount: true },
      _count: true
    }),
    db.franchise.findMany({
      where: franchiseId ? { id: franchiseId } : {},
      select: {
        id: true,
        name: true,
        email: true,
        outstandingBalance: true,
        isBlocked: true,
        status: true,
        _count: {
          select: {
            royaltyPayments: {
              where: { status: { in: ['pending', 'overdue'] } }
            }
          }
        }
      },
      orderBy: { outstandingBalance: 'desc' }
    }),
    db.royaltyPayment.findMany({
      where: { status: 'overdue' },
      select: {
        id: true,
        amount: true,
        dueDate: true,
        franchise: {
          select: { id: true, name: true }
        }
      }
    })
  ])

  // Calculate overdue by age (days overdue)
  const now = new Date()
  const overdueByAgeGroup = {
    '0-30': 0,
    '31-60': 0,
    '61-90': 0,
    '90+': 0
  }

  // Group payments by age
  const overduePayments = await db.royaltyPayment.findMany({
    where: { status: 'overdue' },
    select: {
      id: true,
      amount: true,
      dueDate: true,
      franchise: {
        select: { id: true, name: true }
      }
    }
  })

  overduePayments.forEach(payment => {
    const daysOverdue = Math.floor((now.getTime() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24))
    if (daysOverdue <= 30) {
      overdueByAgeGroup['0-30'] += payment.amount
    } else if (daysOverdue <= 60) {
      overdueByAgeGroup['31-60'] += payment.amount
    } else if (daysOverdue <= 90) {
      overdueByAgeGroup['61-90'] += payment.amount
    } else {
      overdueByAgeGroup['90+'] += payment.amount
    }
  })

  return {
    totalOutstanding: totalOutstanding._sum.amount || 0,
    totalOutstandingPayments: totalOutstanding._count,
    outstandingByStatus: outstandingByStatus.reduce((acc, stat) => {
      acc[stat.status] = {
        amount: stat._sum.amount || 0,
        count: stat._count
      }
      return acc
    }, {} as any),
    outstandingByFranchise: outstandingByFranchise.map(franchise => ({
      id: franchise.id,
      name: franchise.name,
      email: franchise.email,
      outstandingBalance: franchise.outstandingBalance,
      isBlocked: franchise.isBlocked,
      status: franchise.status,
      overduePayments: franchise._count.royaltyPayments
    })),
    overdueByAgeGroup
  }
}

// Franchise performance report
async function getFranchisePerformanceReport(startDate?: string, endDate?: string) {
  const where: any = {}
  if (startDate) where.createdAt = { gte: new Date(startDate) }
  if (endDate) {
    where.createdAt = { 
      ...where.createdAt,
      lte: new Date(endDate) 
    }
  }

  const franchises = await db.franchise.findMany({
    where,
    include: {
      _count: {
        select: {
          clients: true,
          users: true,
          royaltyPayments: true
        }
      },
      royaltyPayments: {
        where: { status: 'paid' },
        select: { amount: true, paymentType: true, paidDate: true }
      }
    },
    orderBy: { totalRevenue: 'desc' }
  })

  const performanceData = franchises.map(franchise => {
    const paidPayments = franchise.royaltyPayments
    const totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount, 0)
    const oneTimeRevenue = paidPayments.filter(p => p.paymentType === 'one_time').reduce((sum, p) => sum + p.amount, 0)
    const monthlyRevenue = paidPayments.filter(p => p.paymentType === 'monthly').reduce((sum, p) => sum + p.amount, 0)
    
    const clientEfficiency = franchise._count.clients > 0 ? totalRevenue / franchise._count.clients : 0
    const capacityUtilization = franchise.maxClients > 0 ? (franchise.currentClients / franchise.maxClients) * 100 : 0

    return {
      id: franchise.id,
      name: franchise.name,
      email: franchise.email,
      status: franchise.status,
      isBlocked: franchise.isBlocked,
      metrics: {
        totalClients: franchise._count.clients,
        totalUsers: franchise._count.users,
        totalPayments: franchise._count.royaltyPayments,
        totalRevenue,
        oneTimeRevenue,
        monthlyRevenue,
        clientEfficiency,
        capacityUtilization: Math.round(capacityUtilization),
        outstandingBalance: franchise.outstandingBalance
      }
    }
  })

  // Calculate overall metrics
  const overallMetrics = {
    totalFranchises: performanceData.length,
    activeFranchises: performanceData.filter(f => f.status === 'active' && !f.isBlocked).length,
    totalRevenue: performanceData.reduce((sum, f) => sum + f.metrics.totalRevenue, 0),
    totalClients: performanceData.reduce((sum, f) => sum + f.metrics.totalClients, 0),
    avgRevenuePerFranchise: performanceData.length > 0 ? 
      performanceData.reduce((sum, f) => sum + f.metrics.totalRevenue, 0) / performanceData.length : 0,
    avgClientsPerFranchise: performanceData.length > 0 ? 
      performanceData.reduce((sum, f) => sum + f.metrics.totalClients, 0) / performanceData.length : 0,
    avgCapacityUtilization: performanceData.length > 0 ? 
      performanceData.reduce((sum, f) => sum + f.metrics.capacityUtilization, 0) / performanceData.length : 0
  }

  return {
    overallMetrics,
    franchisePerformance: performanceData,
    topPerformers: performanceData
      .sort((a, b) => b.metrics.totalRevenue - a.metrics.totalRevenue)
      .slice(0, 10),
    needsAttention: performanceData
      .filter(f => f.metrics.outstandingBalance > 100 || f.isBlocked)
      .sort((a, b) => b.metrics.outstandingBalance - a.metrics.outstandingBalance)
  }
}