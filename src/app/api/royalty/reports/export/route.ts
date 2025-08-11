import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withLicenseProtection } from '@/lib/licenseMiddleware'

// Export royalty reports in various formats
export const GET = withLicenseProtection(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const reportType = searchParams.get('type') || 'overview'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const franchiseId = searchParams.get('franchiseId')

    // Get report data based on type
    let reportData: any = {}
    let filename = ''

    switch (reportType) {
      case 'overview':
        reportData = await getOverviewReport(franchiseId)
        filename = 'royalty-overview-report'
        break
      case 'revenue':
        reportData = await getRevenueReport(startDate, endDate, franchiseId)
        filename = 'royalty-revenue-report'
        break
      case 'outstanding':
        reportData = await getOutstandingReport(franchiseId)
        filename = 'royalty-outstanding-report'
        break
      case 'franchise-performance':
        reportData = await getFranchisePerformanceReport(startDate, endDate)
        filename = 'franchise-performance-report'
        break
      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        )
    }

    // Generate export based on format
    let content: string
    let contentType: string
    let fileExtension: string

    switch (format) {
      case 'csv':
        content = generateCSV(reportData, reportType)
        contentType = 'text/csv'
        fileExtension = 'csv'
        break
      case 'excel':
        content = generateExcelCSV(reportData, reportType)
        contentType = 'text/csv'
        fileExtension = 'xlsx'
        break
      case 'pdf':
        // For PDF, we'll return a simple HTML format that can be converted to PDF
        content = generateHTMLReport(reportData, reportType)
        contentType = 'text/html'
        fileExtension = 'html'
        break
      default:
        return NextResponse.json(
          { error: 'Invalid export format' },
          { status: 400 }
        )
    }

    // Add timestamp to filename
    const timestamp = new Date().toISOString().split('T')[0]
    const fullFilename = `${filename}-${timestamp}.${fileExtension}`

    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fullFilename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })

  } catch (error) {
    console.error('Export royalty report error:', error)
    return NextResponse.json(
      { error: 'Failed to export report' },
      { status: 500 }
    )
  }
})

// Generate CSV format
function generateCSV(data: any, reportType: string): string {
  let csv = ''

  switch (reportType) {
    case 'overview':
      csv = generateOverviewCSV(data)
      break
    case 'revenue':
      csv = generateRevenueCSV(data)
      break
    case 'outstanding':
      csv = generateOutstandingCSV(data)
      break
    case 'franchise-performance':
      csv = generatePerformanceCSV(data)
      break
  }

  return csv
}

// Generate Excel-compatible CSV (with proper formatting)
function generateExcelCSV(data: any, reportType: string): string {
  // Add BOM for UTF-8 Excel compatibility
  const BOM = '\uFEFF'
  return BOM + generateCSV(data, reportType)
}

// Generate HTML report (can be converted to PDF)
function generateHTMLReport(data: any, reportType: string): string {
  const timestamp = new Date().toLocaleString()
  
  let html = `
<!DOCTYPE html>
<html>
<head>
    <title>Royalty Report - ${reportType}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .metric { display: inline-block; margin: 10px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #333; }
        .metric-label { font-size: 14px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Royalty Report - ${reportType.toUpperCase()}</h1>
        <p>Generated on: ${timestamp}</p>
    </div>
  `

  switch (reportType) {
    case 'overview':
      html += generateOverviewHTML(data)
      break
    case 'revenue':
      html += generateRevenueHTML(data)
      break
    case 'outstanding':
      html += generateOutstandingHTML(data)
      break
    case 'franchise-performance':
      html += generatePerformanceHTML(data)
      break
  }

  html += `
</body>
</html>
  `

  return html
}

// Overview report generators
function generateOverviewCSV(data: any): string {
  let csv = 'Report Type,Metric,Value\n'
  
  // Summary metrics
  csv += `Overview,Total Franchises,${data.summary.totalFranchises}\n`
  csv += `Overview,Active Franchises,${data.summary.activeFranchises}\n`
  csv += `Overview,Total Clients,${data.summary.totalClients}\n`
  csv += `Overview,Total Revenue,${data.summary.totalRevenue}\n`
  csv += `Overview,Total Outstanding,${data.summary.totalOutstanding}\n`
  csv += `Overview,Monthly Recurring Revenue,${data.summary.monthlyRecurringRevenue}\n`
  csv += `Overview,Collection Rate,${data.summary.collectionRate}%\n`
  
  csv += '\n'
  
  // Payment statistics
  csv += 'Payment Status,Count,Amount\n'
  Object.entries(data.paymentStats).forEach(([status, stats]: [string, any]) => {
    csv += `${status},${stats.count},${stats.amount}\n`
  })
  
  csv += '\n'
  
  // Overdue payments
  csv += 'Overdue Payments\n'
  csv += 'Franchise Name,Franchise Email,Amount,Due Date\n'
  data.overduePayments.forEach((payment: any) => {
    csv += `"${payment.franchise.name}","${payment.franchise.email}",${payment.amount},"${payment.dueDate}"\n`
  })
  
  return csv
}

function generateOverviewHTML(data: any): string {
  let html = '<div class="section"><h2>Summary Metrics</h2><div>'
  
  Object.entries(data.summary).forEach(([key, value]) => {
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
    html += `<div class="metric">
      <div class="metric-value">${typeof value === 'number' ? value.toFixed(2) : value}</div>
      <div class="metric-label">${label}</div>
    </div>`
  })
  
  html += '</div></div>'
  
  html += '<div class="section"><h2>Payment Statistics</h2><table>'
  html += '<tr><th>Status</th><th>Count</th><th>Amount</th></tr>'
  Object.entries(data.paymentStats).forEach(([status, stats]: [string, any]) => {
    html += `<tr><td>${status}</td><td>${stats.count}</td><td>$${stats.amount.toFixed(2)}</td></tr>`
  })
  html += '</table></div>'
  
  return html
}

// Revenue report generators
function generateRevenueCSV(data: any): string {
  let csv = 'Revenue Analysis\n'
  csv += 'Total Revenue,Total Payments\n'
  csv += `${data.totalRevenue},${data.totalPayments}\n\n`
  
  // Revenue by type
  csv += 'Revenue by Type\n'
  csv += 'Type,Amount,Count\n'
  Object.entries(data.revenueByType).forEach(([type, stats]: [string, any]) => {
    csv += `${type},${stats.amount},${stats.count}\n`
  })
  
  csv += '\n'
  
  // Monthly revenue
  csv += 'Monthly Revenue\n'
  csv += 'Month,One-Time Revenue,Monthly Revenue,Total Revenue\n'
  Object.entries(data.monthlyRevenue).forEach(([month, revenue]: [string, any]) => {
    csv += `${month},${revenue.oneTime},${revenue.monthly},${revenue.total}\n`
  })
  
  csv += '\n'
  
  // Top franchises
  csv += 'Top Performing Franchises\n'
  csv += 'Rank,Franchise Name,Revenue,Clients,Avg Revenue per Client\n'
  data.topFranchises.forEach((franchise: any, index: number) => {
    csv += `${index + 1},"${franchise.name}",${franchise.revenue},${franchise.clients},${franchise.avgRevenuePerClient}\n`
  })
  
  return csv
}

function generateRevenueHTML(data: any): string {
  let html = '<div class="section"><h2>Revenue Analysis</h2>'
  
  html += `<div class="metric">
    <div class="metric-value">$${data.totalRevenue.toFixed(2)}</div>
    <div class="metric-label">Total Revenue</div>
  </div>`
  
  html += '<table><tr><th>Type</th><th>Amount</th><th>Count</th></tr>'
  Object.entries(data.revenueByType).forEach(([type, stats]: [string, any]) => {
    html += `<tr><td>${type}</td><td>$${stats.amount.toFixed(2)}</td><td>${stats.count}</td></tr>`
  })
  html += '</table></div>'
  
  return html
}

// Outstanding report generators
function generateOutstandingCSV(data: any): string {
  let csv = 'Outstanding Payments Report\n'
  csv += 'Total Outstanding,Total Outstanding Payments\n'
  csv += `${data.totalOutstanding},${data.totalOutstandingPayments}\n\n`
  
  // Outstanding by status
  csv += 'Outstanding by Status\n'
  csv += 'Status,Count,Amount\n'
  Object.entries(data.outstandingByStatus).forEach(([status, stats]: [string, any]) => {
    csv += `${status},${stats.count},${stats.amount}\n`
  })
  
  csv += '\n'
  
  // Overdue by age
  csv += 'Overdue by Age\n'
  csv += 'Age Range,Amount\n'
  Object.entries(data.overdueByAge).forEach(([age, amount]: [string, any]) => {
    csv += `${age},${amount}\n`
  })
  
  csv += '\n'
  
  // Outstanding by franchise
  csv += 'Outstanding by Franchise\n'
  csv += 'Franchise Name,Franchise Email,Outstanding Balance,Overdue Payments,Status,Blocked\n'
  data.outstandingByFranchise.forEach((franchise: any) => {
    csv += `"${franchise.name}","${franchise.email}",${franchise.outstandingBalance},${franchise.overduePayments},"${franchise.status}",${franchise.isBlocked}\n`
  })
  
  return csv
}

function generateOutstandingHTML(data: any): string {
  let html = '<div class="section"><h2>Outstanding Payments</h2>'
  
  html += `<div class="metric">
    <div class="metric-value">$${data.totalOutstanding.toFixed(2)}</div>
    <div class="metric-label">Total Outstanding</div>
  </div>`
  
  html += '<table><tr><th>Franchise</th><th>Outstanding Balance</th><th>Status</th></tr>'
  data.outstandingByFranchise.forEach((franchise: any) => {
    html += `<tr><td>${franchise.name}</td><td>$${franchise.outstandingBalance.toFixed(2)}</td><td>${franchise.status}</td></tr>`
  })
  html += '</table></div>'
  
  return html
}

// Performance report generators
function generatePerformanceCSV(data: any): string {
  let csv = 'Franchise Performance Report\n'
  csv += 'Total Franchises,Active Franchises,Total Revenue,Total Clients,Avg Revenue per Franchise,Avg Clients per Franchise,Avg Capacity Utilization\n'
  csv += `${data.overallMetrics.totalFranchises},${data.overallMetrics.activeFranchises},${data.overallMetrics.totalRevenue},${data.overallMetrics.totalClients},${data.overallMetrics.avgRevenuePerFranchise},${data.overallMetrics.avgClientsPerFranchise},${data.overallMetrics.avgCapacityUtilization}%\n\n`
  
  // Top performers
  csv += 'Top Performers\n'
  csv += 'Rank,Franchise Name,Total Revenue,Total Clients,One-Time Revenue,Monthly Revenue,Client Efficiency,Capacity Utilization,Outstanding Balance\n'
  data.topPerformers.forEach((franchise: any, index: number) => {
    csv += `${index + 1},"${franchise.name}",${franchise.metrics.totalRevenue},${franchise.metrics.totalClients},${franchise.metrics.oneTimeRevenue},${franchise.metrics.monthlyRevenue},${franchise.metrics.clientEfficiency},${franchise.metrics.capacityUtilization}%,${franchise.metrics.outstandingBalance}\n`
  })
  
  csv += '\n'
  
  // Needs attention
  csv += 'Needs Attention\n'
  csv += 'Franchise Name,Status,Blocked,Total Revenue,Total Clients,Outstanding Balance\n'
  data.needsAttention.forEach((franchise: any) => {
    csv += `"${franchise.name}","${franchise.status}",${franchise.isBlocked},${franchise.metrics.totalRevenue},${franchise.metrics.totalClients},${franchise.metrics.outstandingBalance}\n`
  })
  
  return csv
}

function generatePerformanceHTML(data: any): string {
  let html = '<div class="section"><h2>Performance Metrics</h2>'
  
  Object.entries(data.overallMetrics).forEach(([key, value]) => {
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
    html += `<div class="metric">
      <div class="metric-value">${typeof value === 'number' ? value.toFixed(2) : value}</div>
      <div class="metric-label">${label}</div>
    </div>`
  })
  
  html += '</div>'
  
  return html
}

// Reuse the existing report functions from the main reports API
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
  const overdueByAgeData = {
    '0-30': 0,
    '31-60': 0,
    '61-90': 0,
    '90+': 0
  }

  // The overdueByAge variable from the database query is actually an array of payments
  const overduePayments = overdueByAge as any[]
  overduePayments.forEach(payment => {
    const daysOverdue = Math.floor((now.getTime() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24))
    if (daysOverdue <= 30) {
      overdueByAgeData['0-30'] += payment.amount
    } else if (daysOverdue <= 60) {
      overdueByAgeData['31-60'] += payment.amount
    } else if (daysOverdue <= 90) {
      overdueByAgeData['61-90'] += payment.amount
    } else {
      overdueByAgeData['90+'] += payment.amount
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
    overdueByAge: overdueByAgeData
  }
}

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