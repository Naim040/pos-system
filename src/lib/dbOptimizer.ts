// Database query optimization utilities

import { db } from './db'

interface QueryOptions {
  include?: string[]
  select?: string[]
  where?: any
  orderBy?: any
  limit?: number
  offset?: number
  cache?: boolean
  cacheKey?: string
}

interface PaginationOptions {
  page: number
  pageSize: number
}

class DBOptimizer {
  private queryCache = new Map<string, { data: any; timestamp: number }>()
  private cacheTTL = 2 * 60 * 1000 // 2 minutes

  private generateCacheKey(model: string, options: QueryOptions): string {
    return `${model}:${JSON.stringify(options)}`
  }

  private isCached(cacheKey: string): boolean {
    const cached = this.queryCache.get(cacheKey)
    if (!cached) return false
    
    return Date.now() - cached.timestamp < this.cacheTTL
  }

  private getFromCache(cacheKey: string) {
    return this.queryCache.get(cacheKey)?.data
  }

  private setCache(cacheKey: string, data: any) {
    this.queryCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    })
  }

  // Optimized product queries
  async getProducts(options: QueryOptions = {}) {
    const cacheKey = this.generateCacheKey('products', options)
    
    if (options.cache && this.isCached(cacheKey)) {
      return this.getFromCache(cacheKey)
    }

    const query: any = {}

    // Build include relations efficiently
    if (options.include) {
      query.include = {}
      options.include.forEach((relation: string) => {
        switch (relation) {
          case 'category':
            query.include.category = true
            break
          case 'inventory':
            query.include.inventory = {
              take: 1, // Only get first inventory record
              where: { isActive: true }
            }
            break
          case 'brand':
            query.include.brand = true
            break
        }
      })
    }

    // Add selective fields if specified
    if (options.select && options.select.length > 0) {
      query.select = {}
      options.select.forEach((field: string) => {
        query.select[field] = true
      })
    }

    // Add where clause
    if (options.where) {
      query.where = options.where
    }

    // Add ordering
    if (options.orderBy) {
      query.orderBy = options.orderBy
    } else {
      query.orderBy = { createdAt: 'desc' }
    }

    // Add pagination
    if (options.limit) {
      query.take = options.limit
    }
    if (options.offset) {
      query.skip = options.offset
    }

    try {
      const result = await db.product.findMany(query)
      
      if (options.cache) {
        this.setCache(cacheKey, result)
      }
      
      return result
    } catch (error) {
      console.error('Error fetching products:', error)
      throw error
    }
  }

  // Optimized customer queries
  async getCustomers(options: QueryOptions = {}) {
    const cacheKey = this.generateCacheKey('customers', options)
    
    if (options.cache && this.isCached(cacheKey)) {
      return this.getFromCache(cacheKey)
    }

    const query: any = {
      orderBy: { name: 'asc' }
    }

    if (options.include) {
      query.include = {}
      options.include.forEach((relation: string) => {
        if (relation === 'loyaltyTransactions') {
          query.include.loyaltyTransactions = {
            take: 5, // Limit recent transactions
            orderBy: { createdAt: 'desc' }
          }
        }
      })
    }

    if (options.where) {
      query.where = options.where
    }

    if (options.limit) {
      query.take = options.limit
    }

    try {
      const result = await db.customer.findMany(query)
      
      if (options.cache) {
        this.setCache(cacheKey, result)
      }
      
      return result
    } catch (error) {
      console.error('Error fetching customers:', error)
      throw error
    }
  }

  // Optimized inventory queries with pagination
  async getInventory(options: QueryOptions & PaginationOptions) {
    const cacheKey = this.generateCacheKey('inventory', options)
    
    if (options.cache && this.isCached(cacheKey)) {
      return this.getFromCache(cacheKey)
    }

    const { page, pageSize, ...queryOptions } = options
    const skip = (page - 1) * pageSize

    const query: any = {
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            barcode: true,
            price: true,
            category: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      skip,
      take: pageSize,
      orderBy: { updatedAt: 'desc' }
    }

    if (queryOptions.where) {
      query.where = queryOptions.where
    }

    try {
      const [data, total] = await Promise.all([
        db.inventory.findMany(query),
        db.inventory.count({ where: query.where })
      ])

      const result = {
        data,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }

      if (options.cache) {
        this.setCache(cacheKey, result)
      }

      return result
    } catch (error) {
      console.error('Error fetching inventory:', error)
      throw error
    }
  }

  // Batch operations for better performance
  async batchCreateProducts(products: any[]) {
    try {
      const result = await db.product.createMany({
        data: products,
        skipDuplicates: true
      })
      
      // Clear cache for products
      this.clearCache('products')
      
      return result
    } catch (error) {
      console.error('Error batch creating products:', error)
      throw error
    }
  }

  async batchUpdateInventory(updates: any[]) {
    try {
      const updatePromises = updates.map(update => 
        db.inventory.update({
          where: { id: update.id },
          data: update.data
        })
      )

      const results = await Promise.all(updatePromises)
      
      // Clear cache for inventory
      this.clearCache('inventory')
      
      return results
    } catch (error) {
      console.error('Error batch updating inventory:', error)
      throw error
    }
  }

  // Optimized search with full-text search capabilities
  async searchProducts(searchTerm: string, options: QueryOptions = {}) {
    const cacheKey = this.generateCacheKey('product-search', { ...options, searchTerm })
    
    if (options.cache && this.isCached(cacheKey)) {
      return this.getFromCache(cacheKey)
    }

    const query: any = {
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { sku: { contains: searchTerm, mode: 'insensitive' } },
          { barcode: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      include: {
        category: true,
        inventory: {
          take: 1,
          where: { isActive: true }
        }
      },
      take: options.limit || 50
    }

    try {
      const result = await db.product.findMany(query)
      
      if (options.cache) {
        this.setCache(cacheKey, result)
      }
      
      return result
    } catch (error) {
      console.error('Error searching products:', error)
      throw error
    }
  }

  // Clear cache for specific model or all cache
  clearCache(model?: string) {
    if (model) {
      const keysToDelete: string[] = []
      for (const [key] of this.queryCache) {
        if (key.startsWith(model)) {
          keysToDelete.push(key)
        }
      }
      keysToDelete.forEach(key => this.queryCache.delete(key))
    } else {
      this.queryCache.clear()
    }
  }

  // Periodic cache cleanup
  cleanup() {
    const now = Date.now()
    for (const [key, value] of this.queryCache) {
      if (now - value.timestamp > this.cacheTTL) {
        this.queryCache.delete(key)
      }
    }
  }

  // Get database health metrics
  async getHealthMetrics() {
    try {
      const [productCount, customerCount, inventoryCount] = await Promise.all([
        db.product.count(),
        db.customer.count(),
        db.inventory.count()
      ])

      return {
        productCount,
        customerCount,
        inventoryCount,
        cacheSize: this.queryCache.size,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error getting health metrics:', error)
      throw error
    }
  }
}

// Create singleton instance
export const dbOptimizer = new DBOptimizer()

// Periodic cleanup
if (typeof window !== 'undefined') {
  setInterval(() => {
    dbOptimizer.cleanup()
  }, 300000) // Clean up every 5 minutes
}