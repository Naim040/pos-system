import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { smsService } from '@/lib/smsService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { daysBefore = [1, 3, 7], dryRun = false } = body

    // Load SMS settings
    await smsService.loadSettings()
    const settings = await smsService['settings'] // Access private property for checking
    
    if (!settings?.triggers?.dueReminder?.enabled) {
      return NextResponse.json({ 
        error: 'Due payment reminder SMS trigger is disabled' 
      }, { status: 400 })
    }

    // Calculate target date (X days from now)
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + Math.max(...daysBefore))

    // Find customers with due payments that match the reminder criteria
    const duePayments = await db.customerLedger.findMany({
      where: {
        type: 'sale',
        amount: {
          gt: 0 // Only positive amounts (sales that created dues)
        },
        customer: {
          phone: {
            not: null // Only customers with phone numbers
          },
          dueBalance: {
            gt: 0 // Only customers with outstanding dues
          }
        }
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            dueBalance: true
          }
        }
      }
    })

    // Group by customer and get their most recent due payment
    const customerDueMap = new Map()
    duePayments.forEach(payment => {
      if (!customerDueMap.has(payment.customerId)) {
        customerDueMap.set(payment.customerId, payment)
      }
    })

    const uniqueCustomers = Array.from(customerDueMap.values())
    const results = []

    for (const payment of uniqueCustomers) {
      const customer = payment.customer
      
      // Check if any of the due dates match our reminder criteria
      const shouldRemind = daysBefore.some(days => {
        const reminderDate = new Date()
        reminderDate.setDate(reminderDate.getDate() + days)
        
        // For simplicity, we'll check if the payment was created within the reminder window
        const paymentDate = new Date(payment.date)
        const daysDiff = Math.ceil((reminderDate.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24))
        
        return Math.abs(daysDiff) <= 1 // Within 1 day of the target date
      })

      if (shouldRemind) {
        if (dryRun) {
          results.push({
            customerId: customer.id,
            customerName: customer.name,
            phone: customer.phone,
            dueAmount: customer.dueBalance,
            wouldSend: true
          })
        } else {
          try {
            const result = await smsService.sendDueReminderSMS(customer.phone, {
              customerName: customer.name,
              amount: customer.dueBalance,
              dueDate: targetDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
              storeName: 'POS System' // You might want to get this from settings
            })

            results.push({
              customerId: customer.id,
              customerName: customer.name,
              phone: customer.phone,
              dueAmount: customer.dueBalance,
              sent: result.success,
              error: result.error,
              messageId: result.messageId
            })
          } catch (error) {
            results.push({
              customerId: customer.id,
              customerName: customer.name,
              phone: customer.phone,
              dueAmount: customer.dueBalance,
              sent: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        }
      }
    }

    const summary = {
      totalProcessed: uniqueCustomers.length,
      remindersSent: results.filter(r => r.sent || r.wouldSend).length,
      remindersFailed: results.filter(r => !r.sent && !r.wouldSend && r.error).length,
      dryRun,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({
      summary,
      results,
      settings: {
        enabled: settings?.triggers?.dueReminder?.enabled,
        daysBefore: settings?.triggers?.dueReminder?.daysBefore
      }
    })

  } catch (error) {
    console.error('Error sending due payment reminders:', error)
    return NextResponse.json(
      { error: 'Failed to send due payment reminders' },
      { status: 500 }
    )
  }
}

// GET endpoint for checking status and preview
export async function GET() {
  try {
    // Load SMS settings
    await smsService.loadSettings()
    const settings = await smsService['settings']

    // Get customers with due payments
    const duePayments = await db.customerLedger.findMany({
      where: {
        type: 'sale',
        amount: {
          gt: 0
        },
        customer: {
          phone: {
            not: null
          },
          dueBalance: {
            gt: 0
          }
        }
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            dueBalance: true
          }
        }
      },
      take: 10, // Limit for preview
      orderBy: {
        date: 'desc'
      }
    })

    const summary = {
      totalCustomersWithDues: await db.customer.count({
        where: {
          dueBalance: {
            gt: 0
          },
          phone: {
            not: null
          }
        }
      }),
      totalDueAmount: await db.customer.aggregate({
        where: {
          dueBalance: {
            gt: 0
          },
          phone: {
            not: null
          }
        },
        _sum: {
          dueBalance: true
        }
      }),
      previewCustomers: duePayments.map(p => ({
        id: p.customer.id,
        name: p.customer.name,
        phone: p.customer.phone,
        dueBalance: p.customer.dueBalance
      })),
      settings: {
        enabled: settings?.triggers?.dueReminder?.enabled,
        daysBefore: settings?.triggers?.dueReminder?.daysBefore,
        template: settings?.triggers?.dueReminder?.template
      }
    }

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Error fetching due payment reminder status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch due payment reminder status' },
      { status: 500 }
    )
  }
}