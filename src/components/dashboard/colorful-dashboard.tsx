'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ColorfulCard } from '@/components/ui/colorful-card'
import { AnimatedButton } from '@/components/ui/animated-button'
import { ColorfulChart, AnimatedStatCard } from '@/components/ui/colorful-chart'
import { ThemeSwitcher } from '@/components/ui/theme-switcher'
import { GradientBackground } from '@/components/ui/gradient-background'
import { ShoppingCart, TrendingUp, Users, DollarSign, Package, Star, Zap, Target } from 'lucide-react'

interface DashboardStats {
  totalSales: number
  totalOrders: number
  totalCustomers: number
  totalProducts: number
  revenue: number
  growth: number
}

interface RecentActivity {
  id: string
  type: 'sale' | 'order' | 'customer' | 'product'
  description: string
  amount?: number
  time: string
}

export function ColorfulDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    revenue: 0,
    growth: 0
  })

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate data loading
    const loadData = async () => {
      setIsLoading(true)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock data
      setStats({
        totalSales: 1250,
        totalOrders: 856,
        totalCustomers: 342,
        totalProducts: 128,
        revenue: 45680,
        growth: 12.5
      })

      setRecentActivity([
        { id: '1', type: 'sale', description: 'New sale completed', amount: 120, time: '2 min ago' },
        { id: '2', type: 'order', description: 'Order #1234 processed', amount: 85, time: '5 min ago' },
        { id: '3', type: 'customer', description: 'New customer registered', time: '10 min ago' },
        { id: '4', type: 'product', description: 'Product added to inventory', time: '15 min ago' },
        { id: '5', type: 'sale', description: 'Bulk sale completed', amount: 450, time: '20 min ago' }
      ])
      
      setIsLoading(false)
    }

    loadData()
  }, [])

  const salesData = [
    { name: 'Mon', value: 4000 },
    { name: 'Tue', value: 3000 },
    { name: 'Wed', value: 2000 },
    { name: 'Thu', value: 2780 },
    { name: 'Fri', value: 1890 },
    { name: 'Sat', value: 2390 },
    { name: 'Sun', value: 3490 }
  ]

  const categoryData = [
    { name: 'Electronics', value: 35 },
    { name: 'Clothing', value: 25 },
    { name: 'Food', value: 20 },
    { name: 'Books', value: 15 },
    { name: 'Other', value: 5 }
  ]

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'sale': return <DollarSign className="w-4 h-4" />
      case 'order': return <ShoppingCart className="w-4 h-4" />
      case 'customer': return <Users className="w-4 h-4" />
      case 'product': return <Package className="w-4 h-4" />
      default: return <Star className="w-4 h-4" />
    }
  }

  const getActivityColor = (type: RecentActivity['type']) => {
    switch (type) {
      case 'sale': return 'success'
      case 'order': return 'primary'
      case 'customer': return 'accent'
      case 'product': return 'secondary'
      default: return 'warning'
    }
  }

  if (isLoading) {
    return (
      <GradientBackground variant="primary" intensity="low">
        <div className="min-h-screen flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
          />
        </div>
      </GradientBackground>
    )
  }

  return (
    <GradientBackground variant="primary" intensity="low">
      <div className="min-h-screen p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">POS Dashboard</h1>
            <p className="text-white/70">Welcome back! Here's what's happening today.</p>
          </div>
          <ThemeSwitcher />
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <AnimatedStatCard
            title="Total Sales"
            value={stats.totalSales.toLocaleString()}
            change={stats.growth}
            icon={<DollarSign className="w-6 h-6" />}
            color="primary"
          />
          <AnimatedStatCard
            title="Total Orders"
            value={stats.totalOrders.toLocaleString()}
            change={8.2}
            icon={<ShoppingCart className="w-6 h-6" />}
            color="secondary"
          />
          <AnimatedStatCard
            title="Total Customers"
            value={stats.totalCustomers.toLocaleString()}
            change={15.3}
            icon={<Users className="w-6 h-6" />}
            color="accent"
          />
          <AnimatedStatCard
            title="Total Products"
            value={stats.totalProducts.toLocaleString()}
            change={5.7}
            icon={<Package className="w-6 h-6" />}
            color="success"
          />
        </motion.div>

        {/* Charts Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
        >
          <ColorfulChart
            data={salesData}
            type="line"
            title="Weekly Sales Trend"
            colors={['#3B82F6', '#10B981']}
          />
          <ColorfulChart
            data={categoryData}
            type="pie"
            title="Sales by Category"
            colors={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']}
          />
        </motion.div>

        {/* Recent Activity and Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <ColorfulCard color="primary" variant="glass" hoverEffect="lift">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
                <AnimatedButton variant="ghost" size="sm">
                  View All
                </AnimatedButton>
              </div>
              
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="flex items-center gap-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className={`p-2 rounded-lg bg-${getActivityColor(activity.type)}-500/20`}>
                      <div className={`text-${getActivityColor(activity.type)}-400`}>
                        {getActivityIcon(activity.type)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{activity.description}</p>
                      <p className="text-white/60 text-sm">{activity.time}</p>
                    </div>
                    {activity.amount && (
                      <div className="text-green-400 font-semibold">
                        +${activity.amount}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </ColorfulCard>
          </div>

          {/* Quick Actions */}
          <div>
            <ColorfulCard color="accent" variant="glass" hoverEffect="lift">
              <h2 className="text-xl font-semibold text-white mb-6">Quick Actions</h2>
              
              <div className="space-y-3">
                <AnimatedButton
                  variant="primary"
                  size="md"
                  icon={<ShoppingCart className="w-4 h-4" />}
                  className="w-full"
                >
                  New Sale
                </AnimatedButton>
                
                <AnimatedButton
                  variant="secondary"
                  size="md"
                  icon={<Package className="w-4 h-4" />}
                  className="w-full"
                >
                  Add Product
                </AnimatedButton>
                
                <AnimatedButton
                  variant="accent"
                  size="md"
                  icon={<Users className="w-4 h-4" />}
                  className="w-full"
                >
                  Add Customer
                </AnimatedButton>
                
                <AnimatedButton
                  variant="success"
                  size="md"
                  icon={<TrendingUp className="w-4 h-4" />}
                  className="w-full"
                >
                  View Reports
                </AnimatedButton>
                
                <AnimatedButton
                  variant="warning"
                  size="md"
                  icon={<Target className="w-4 h-4" />}
                  className="w-full"
                >
                  Set Goals
                </AnimatedButton>
                
                <AnimatedButton
                  variant="danger"
                  size="md"
                  icon={<Zap className="w-4 h-4" />}
                  className="w-full"
                >
                  Quick Settings
                </AnimatedButton>
              </div>
            </ColorfulCard>
          </div>
        </motion.div>

        {/* Performance Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8"
        >
          <ColorfulCard color="secondary" variant="glass" hoverEffect="lift">
            <h2 className="text-xl font-semibold text-white mb-6">Performance Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">
                  ${stats.revenue.toLocaleString()}
                </div>
                <div className="text-white/70">Total Revenue</div>
                <div className="text-green-400 text-sm mt-1">+{stats.growth}% from last month</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  ${(stats.revenue / stats.totalOrders).toFixed(2)}
                </div>
                <div className="text-white/70">Average Order Value</div>
                <div className="text-blue-400 text-sm mt-1">+5.2% from last month</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-400 mb-2">
                  {Math.round(stats.totalOrders / 30)}
                </div>
                <div className="text-white/70">Daily Orders</div>
                <div className="text-orange-400 text-sm mt-1">+8.7% from last month</div>
              </div>
            </div>
          </ColorfulCard>
        </motion.div>
      </div>
    </GradientBackground>
  )
}