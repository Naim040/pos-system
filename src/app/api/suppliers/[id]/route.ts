import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supplier = await db.supplier.findUnique({
      where: { id: params.id },
      include: {
        purchaseOrders: {
          orderBy: { orderDate: 'desc' },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    sku: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(supplier)
  } catch (error) {
    console.error('Error fetching supplier:', error)
    return NextResponse.json(
      { error: 'Failed to fetch supplier' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const {
      name,
      contactPerson,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      country,
      website,
      taxId,
      paymentTerms,
      notes,
      isActive
    } = body

    // Check if another supplier with same email exists
    if (email) {
      const existingSupplier = await db.supplier.findFirst({
        where: {
          email,
          NOT: { id: params.id }
        }
      })

      if (existingSupplier) {
        return NextResponse.json(
          { error: 'Supplier with this email already exists' },
          { status: 400 }
        )
      }
    }

    const supplier = await db.supplier.update({
      where: { id: params.id },
      data: {
        name,
        contactPerson,
        email,
        phone,
        address,
        city,
        state,
        zipCode,
        country,
        website,
        taxId,
        paymentTerms,
        notes,
        isActive
      },
      include: {
        purchaseOrders: {
          orderBy: { orderDate: 'desc' },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    sku: true
                  }
                }
              }
            }
          }
        }
      }
    })

    return NextResponse.json(supplier)
  } catch (error) {
    console.error('Error updating supplier:', error)
    return NextResponse.json(
      { error: 'Failed to update supplier' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if supplier has any purchase orders
    const purchaseOrdersCount = await db.purchaseOrder.count({
      where: { supplierId: params.id }
    })

    if (purchaseOrdersCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete supplier with existing purchase orders' },
        { status: 400 }
      )
    }

    await db.supplier.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Supplier deleted successfully' })
  } catch (error) {
    console.error('Error deleting supplier:', error)
    return NextResponse.json(
      { error: 'Failed to delete supplier' },
      { status: 500 }
    )
  }
}