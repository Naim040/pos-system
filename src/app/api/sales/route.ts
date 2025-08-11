import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { smsService } from '@/lib/smsService'

export async function GET() {
  try {
    const sales = await db.sale.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        saleItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true
              }
            }
          }
        },
        payments: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(sales)
  } catch (error) {
    console.error('Error fetching sales:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sales' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { totalAmount, taxAmount, discount, paymentMethod, items, customerId } = body

    if (!totalAmount || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Total amount and items are required' },
        { status: 400 }
      )
    }

    // Create a default user if none exists (for demo purposes)
    let user = await db.user.findFirst()
    if (!user) {
      user = await db.user.create({
        data: {
          email: 'staff@pos.com',
          name: 'Staff User',
          role: 'staff'
        }
      })
    }

    // Create a default store if none exists (for demo purposes)
    let store = await db.store.findFirst()
    if (!store) {
      store = await db.store.create({
        data: {
          name: 'Main Store',
          code: 'MAIN',
          address: '123 Business Street',
          city: 'Business City',
          state: 'BC',
          zipCode: '12345',
          phone: '(555) 123-4567',
          email: 'store@pos.com'
        }
      })
    }

    // Create the sale
    const sale = await db.sale.create({
      data: {
        userId: user.id,
        customerId: customerId || null,
        storeId: store.id,
        totalAmount: parseFloat(totalAmount),
        taxAmount: parseFloat(taxAmount) || 0,
        discount: parseFloat(discount) || 0,
        paymentMethod,
        status: 'completed'
      }
    })

    // Create sale items and update inventory
    for (const item of items) {
      await db.saleItem.create({
        data: {
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unitPrice),
          totalPrice: parseFloat(item.totalPrice)
        }
      })

      // Update inventory
      const inventory = await db.inventory.findUnique({
        where: { 
          productId_storeId: {
            productId: item.productId,
            storeId: store.id
          }
        }
      })

      if (inventory) {
        await db.inventory.update({
          where: { 
            productId_storeId: {
              productId: item.productId,
              storeId: store.id
            }
          },
          data: {
            quantity: Math.max(0, inventory.quantity - item.quantity)
          }
        })
      } else {
        // Create inventory record if it doesn't exist
        await db.inventory.create({
          data: {
            productId: item.productId,
            storeId: store.id,
            quantity: Math.max(0, 0 - item.quantity),
            minStock: 0,
            maxStock: 100,
            reorderPoint: 5,
            costPrice: parseFloat(item.unitPrice) || 0
          }
        })
      }
    }

    // Create payment record (only for cash and card payments)
    if (paymentMethod !== 'due') {
      await db.payment.create({
        data: {
          saleId: sale.id,
          amount: parseFloat(totalAmount) + parseFloat(taxAmount || 0) - parseFloat(discount || 0),
          method: paymentMethod || 'cash'
        }
      })
    }

    // Create customer ledger entry for due payments
    if (paymentMethod === 'due' && customerId) {
      const finalAmount = parseFloat(totalAmount) + parseFloat(taxAmount || 0) - parseFloat(discount || 0)
      
      // Get customer's current due balance
      const customer = await db.customer.findUnique({
        where: { id: customerId }
      })

      if (customer) {
        const newDueBalance = customer.dueBalance + finalAmount
        
        // Update customer's due balance
        await db.customer.update({
          where: { id: customerId },
          data: {
            dueBalance: newDueBalance
          }
        })
        
        // Create ledger entry
        await db.customerLedger.create({
          data: {
            customerId: customerId,
            type: 'sale',
            amount: finalAmount,
            balance: newDueBalance,
            description: `Due payment for sale #${sale.id}`,
            referenceId: sale.id,
            createdBy: user.id || 'system'
          }
        })
      }
    }

    // Update customer information if customerId is provided
    if (customerId) {
      const customer = await db.customer.findUnique({
        where: { id: customerId }
      })

      if (customer) {
        const finalAmount = parseFloat(totalAmount) + parseFloat(taxAmount || 0) - parseFloat(discount || 0)
        
        // For due payments, only update visit count and last visit
        // For paid payments, update all stats including loyalty
        if (paymentMethod === 'due') {
          await db.customer.update({
            where: { id: customerId },
            data: {
              visitCount: customer.visitCount + 1,
              lastVisit: new Date()
            }
          })
        } else {
          const loyaltyPointsEarned = Math.floor(finalAmount / 10) // 1 point per $10 spent

          // Update customer stats for paid payments
          await db.customer.update({
            where: { id: customerId },
            data: {
              totalSpent: customer.totalSpent + finalAmount,
              visitCount: customer.visitCount + 1,
              lastVisit: new Date(),
              loyaltyPoints: customer.loyaltyPoints + loyaltyPointsEarned,
              loyaltyTier: getLoyaltyTier(customer.totalSpent + finalAmount)
            }
          })

          // Create loyalty transaction for paid payments only
          await db.loyaltyTransaction.create({
            data: {
              customerId: customerId,
              points: loyaltyPointsEarned,
              type: 'earned',
              description: `Earned ${loyaltyPointsEarned} points from purchase`,
              saleId: sale.id
            }
          })
        }
      }
    }

    // Fetch the complete sale with relations
    const completeSale = await db.sale.findUnique({
      where: { id: sale.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            loyaltyPoints: true,
            loyaltyTier: true
          }
        },
        saleItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true
              }
            }
          }
        },
        payments: true
      }
    })

    // Send SMS confirmation if customer has phone number and SMS is enabled
    try {
      if (completeSale?.customer?.phone) {
        await smsService.loadSettings()
        await smsService.sendNewSaleSMS(completeSale.customer.phone, {
          invoiceId: sale.id,
          amount: completeSale.totalAmount,
          storeName: store?.name || 'POS System',
          customerName: completeSale.customer.name
        })
      }
    } catch (smsError) {
      console.error('Error sending SMS confirmation:', smsError)
      // Don't fail the sale creation if SMS fails
    }

    return NextResponse.json(completeSale, { status: 201 })
  } catch (error) {
    console.error('Error creating sale:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create sale',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

// Helper function to determine loyalty tier
function getLoyaltyTier(totalSpent: number): string {
  if (totalSpent >= 1000) return 'platinum'
  if (totalSpent >= 500) return 'gold'
  if (totalSpent >= 200) return 'silver'
  return 'bronze'
}