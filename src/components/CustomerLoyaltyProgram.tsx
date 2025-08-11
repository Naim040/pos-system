"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth'
import { 
  Gift, 
  Star, 
  Users, 
  TrendingUp, 
  Calendar, 
  Share2, 
  CreditCard, 
  Award,
  Crown,
  Diamond,
  Target,
  GiftCard,
  QrCode,
  BarChart3,
  Settings,
  Plus,
  Edit,
  Trash2,
  Download
} from 'lucide-react'
import { formatPrice } from '@/lib/currency'

interface LoyaltyProgram {
  id: string
  name: string
  description: string
  isActive: boolean
  pointsPerDollar: number
  signupBonus: number
  birthdayBonus: number
  referralBonus: number
  tiers: LoyaltyTier[]
  rewards: LoyaltyReward[]
  earningRules: EarningRule[]
}

interface LoyaltyTier {
  id: string
  name: string
  description: string
  minPoints: number
  maxPoints?: number
  benefits: string[]
  color: string
  icon: string
}

interface LoyaltyReward {
  id: string
  name: string
  description: string
  pointsRequired: number
  type: 'discount' | 'free_item' | 'cashback' | 'experience'
  value: number
  isActive: boolean
  expiryDays?: number
}

interface EarningRule {
  id: string
  name: string
  description: string
  points: number
  condition: string
  isActive: boolean
}

interface CustomerLoyaltyData {
  customerId: string
  totalPoints: number
  currentTier: string
  pointsExpiring: Array<{
    points: number
    expiresAt: string
  }>
  referralCode: string
  referralCount: number
  totalEarned: number
  totalRedeemed: number
  lastActivity: string
}

export default function CustomerLoyaltyProgram() {
  const { user, hasRole } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [program, setProgram] = useState<LoyaltyProgram | null>(null)
  const [customerData, setCustomerData] = useState<CustomerLoyaltyData[]>([])
  const [analytics, setAnalytics] = useState<any>(null)

  // Form states
  const [showTierDialog, setShowTierDialog] = useState(false)
  const [showRewardDialog, setShowRewardDialog] = useState(false)
  const [showRuleDialog, setShowRuleDialog] = useState(false)

  // Default program data
  const defaultProgram: LoyaltyProgram = {
    id: '1',
    name: 'Premium Rewards',
    description: 'Earn points with every purchase and unlock exclusive benefits',
    isActive: true,
    pointsPerDollar: 1,
    signupBonus: 50,
    birthdayBonus: 100,
    referralBonus: 25,
    tiers: [
      {
        id: '1',
        name: 'Bronze',
        description: 'Starting your loyalty journey',
        minPoints: 0,
        maxPoints: 499,
        benefits: ['1 point per ৳100 spent', 'Birthday reward', 'Newsletter access'],
        color: '#CD7F32',
        icon: '🥉'
      },
      {
        id: '2',
        name: 'Silver',
        description: 'Valued customer status',
        minPoints: 500,
        maxPoints: 1499,
        benefits: ['1.2 points per ৳100 spent', 'Birthday reward', 'Exclusive offers', 'Priority support'],
        color: '#C0C0C0',
        icon: '🥈'
      },
      {
        id: '3',
        name: 'Gold',
        description: 'Premium customer experience',
        minPoints: 1500,
        maxPoints: 4999,
        benefits: ['1.5 points per ৳100 spent', 'Birthday reward', 'VIP events', 'Free shipping', 'Dedicated support'],
        color: '#FFD700',
        icon: '🥇'
      },
      {
        id: '4',
        name: 'Platinum',
        description: 'Elite member status',
        minPoints: 5000,
        benefits: ['2 points per ৳100 spent', 'Birthday reward', 'Exclusive events', 'Free shipping', 'Personal concierge', 'Early access'],
        color: '#E5E4E2',
        icon: '💎'
      }
    ],
    rewards: [
      {
        id: '1',
        name: '৳50 Discount',
        description: 'Get ৳50 off your next purchase',
        pointsRequired: 500,
        type: 'discount',
        value: 5,
        isActive: true,
        expiryDays: 90
      },
      {
        id: '2',
        name: 'Free Coffee',
        description: 'Complimentary coffee of your choice',
        pointsRequired: 200,
        type: 'free_item',
        value: 0,
        isActive: true
      },
      {
        id: '3',
        name: '10% Cashback',
        description: 'Get 10% cashback on your purchase',
        pointsRequired: 1000,
        type: 'cashback',
        value: 10,
        isActive: true
      }
    ],
    earningRules: [
      {
        id: '1',
        name: 'Birthday Bonus',
        description: 'Earn bonus points on your birthday',
        points: 100,
        condition: 'customer_birthday',
        isActive: true
      },
      {
        id: '2',
        name: 'Review Bonus',
        description: 'Earn points for leaving product reviews',
        points: 25,
        condition: 'product_review',
        isActive: true
      },
      {
        id: '3',
        name: 'Social Share',
        description: 'Earn points for sharing on social media',
        points: 50,
        condition: 'social_share',
        isActive: true
      }
    ]
  }

  useEffect(() => {
    loadProgram()
    loadCustomerData()
    loadAnalytics()
  }, [])

  const loadProgram = async () => {
    try {
      const response = await fetch('/api/loyalty/program')
      if (response.ok) {
        const data = await response.json()
        setProgram(data)
      } else {
        // Use default program if none exists
        setProgram(defaultProgram)
      }
    } catch (error) {
      console.error('Error loading loyalty program:', error)
      setProgram(defaultProgram)
    }
  }

  const loadCustomerData = async () => {
    try {
      const response = await fetch('/api/loyalty/customers')
      if (response.ok) {
        const data = await response.json()
        setCustomerData(data)
      }
    } catch (error) {
      console.error('Error loading customer loyalty data:', error)
    }
  }

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/loyalty/analytics')
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error loading loyalty analytics:', error)
    }
  }

  const saveProgram = async () => {
    if (!program) return

    setLoading(true)
    try {
      const response = await fetch('/api/loyalty/program', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(program),
      })

      if (response.ok) {
        toast({
          title: "Program saved",
          description: "Loyalty program has been updated successfully",
        })
      } else {
        throw new Error('Failed to save program')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save loyalty program",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const generateLoyaltyCards = async () => {
    try {
      const response = await fetch('/api/loyalty/generate-cards', {
        method: 'POST',
      })

      if (response.ok) {
        toast({
          title: "Cards generated",
          description: "Loyalty cards have been generated for all customers",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate loyalty cards",
        variant: "destructive"
      })
    }
  }

  const exportLoyaltyData = () => {
    if (!customerData.length) return

    const csvContent = [
      ['Customer ID', 'Total Points', 'Current Tier', 'Referral Code', 'Referral Count', 'Total Earned', 'Total Redeemed', 'Last Activity'],
      ...customerData.map(customer => [
        customer.customerId,
        customer.totalPoints,
        customer.currentTier,
        customer.referralCode,
        customer.referralCount,
        customer.totalEarned,
        customer.totalRedeemed,
        customer.lastActivity
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `loyalty-data-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Data exported",
      description: "Loyalty data has been exported successfully",
    })
  }

  const getTierIcon = (tierName: string) => {
    const icons: { [key: string]: string } = {
      'Bronze': '🥉',
      'Silver': '🥈',
      'Gold': '🥇',
      'Platinum': '💎'
    }
    return icons[tierName] || '⭐'
  }

  const getTierColor = (tierName: string) => {
    const colors: { [key: string]: string } = {
      'Bronze': '#CD7F32',
      'Silver': '#C0C0C0',
      'Gold': '#FFD700',
      'Platinum': '#E5E4E2'
    }
    return colors[tierName] || '#6B7280'
  }

  if (!program) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Loyalty Program</h2>
          <p className="text-gray-600">Manage customer rewards, tiers, and loyalty analytics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={exportLoyaltyData}
            className="flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button
            variant="outline"
            onClick={generateLoyaltyCards}
            className="flex items-center"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Generate Cards
          </Button>
          <Button
            onClick={saveProgram}
            disabled={loading}
            className="flex items-center"
          >
            <Settings className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Program'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="tiers" className="flex items-center">
            <Crown className="h-4 w-4 mr-2" />
            Tiers
          </TabsTrigger>
          <TabsTrigger value="rewards" className="flex items-center">
            <Gift className="h-4 w-4 mr-2" />
            Rewards
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Customers
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customerData.length}</div>
                <p className="text-xs text-muted-foreground">Active loyalty members</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Points Issued</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {customerData.reduce((sum, customer) => sum + customer.totalEarned, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Total points earned</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Points Redeemed</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {customerData.reduce((sum, customer) => sum + customer.totalRedeemed, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Total points redeemed</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Referrals</CardTitle>
                <Share2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {customerData.reduce((sum, customer) => sum + customer.referralCount, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Total referrals</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tier Distribution</CardTitle>
                <CardDescription>Customer distribution across loyalty tiers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {program.tiers.map((tier) => {
                    const count = customerData.filter(c => c.currentTier === tier.name).length
                    const percentage = customerData.length > 0 ? (count / customerData.length) * 100 : 0
                    
                    return (
                      <div key={tier.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{tier.icon}</span>
                          <span className="font-medium">{tier.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full"
                              style={{ 
                                width: `${percentage}%`,
                                backgroundColor: tier.color
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{count}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Rewards</CardTitle>
                <CardDescription>Most popular loyalty rewards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {program.rewards.slice(0, 5).map((reward) => (
                    <div key={reward.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{reward.name}</div>
                        <div className="text-sm text-gray-500">{reward.description}</div>
                      </div>
                      <Badge variant="secondary">{reward.pointsRequired} pts</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tiers" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Loyalty Tiers</CardTitle>
                  <CardDescription>Manage customer loyalty tiers and benefits</CardDescription>
                </div>
                <Dialog open={showTierDialog} onOpenChange={setShowTierDialog}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Tier
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Tier</DialogTitle>
                      <DialogDescription>
                        Create a new loyalty tier with custom benefits
                      </DialogDescription>
                    </DialogHeader>
                    {/* Add tier form here */}
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {program.tiers.map((tier) => (
                  <Card key={tier.id} className="border-l-4" style={{ borderLeftColor: tier.color }}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{tier.icon}</span>
                          <div>
                            <CardTitle className="text-lg">{tier.name}</CardTitle>
                            <CardDescription>{tier.description}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <Label>Points Range</Label>
                          <p className="text-sm text-gray-600">
                            {tier.minPoints.toLocaleString()} - {tier.maxPoints ? tier.maxPoints.toLocaleString() : '∞'} points
                          </p>
                        </div>
                        <div>
                          <Label>Benefits</Label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {tier.benefits.map((benefit, index) => (
                              <Badge key={index} variant="secondary">{benefit}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Loyalty Rewards</CardTitle>
                  <CardDescription>Manage available rewards and redemption options</CardDescription>
                </div>
                <Dialog open={showRewardDialog} onOpenChange={setShowRewardDialog}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Reward
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Reward</DialogTitle>
                      <DialogDescription>
                        Create a new reward for customers to redeem
                      </DialogDescription>
                    </DialogHeader>
                    {/* Add reward form here */}
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {program.rewards.map((reward) => (
                  <Card key={reward.id} className={!reward.isActive ? 'opacity-50' : ''}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{reward.name}</CardTitle>
                        <Switch
                          checked={reward.isActive}
                          onCheckedChange={(checked) => {
                            const updatedRewards = program.rewards.map(r =>
                              r.id === reward.id ? { ...r, isActive: checked } : r
                            )
                            setProgram({ ...program, rewards: updatedRewards })
                          }}
                        />
                      </div>
                      <CardDescription>{reward.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Points Required</span>
                          <Badge variant="outline">{reward.pointsRequired}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Type</span>
                          <Badge variant="secondary">{reward.type}</Badge>
                        </div>
                        {reward.expiryDays && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Expires in</span>
                            <span className="text-sm">{reward.expiryDays} days</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2 pt-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Loyalty Data</CardTitle>
              <CardDescription>View and manage customer loyalty information</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer ID</TableHead>
                    <TableHead>Current Tier</TableHead>
                    <TableHead>Total Points</TableHead>
                    <TableHead>Referral Code</TableHead>
                    <TableHead>Referrals</TableHead>
                    <TableHead>Total Earned</TableHead>
                    <TableHead>Total Redeemed</TableHead>
                    <TableHead>Last Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerData.slice(0, 10).map((customer) => (
                    <TableRow key={customer.customerId}>
                      <TableCell className="font-medium">{customer.customerId}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span>{getTierIcon(customer.currentTier)}</span>
                          <Badge 
                            variant="outline"
                            style={{ borderColor: getTierColor(customer.currentTier) }}
                          >
                            {customer.currentTier}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{customer.totalPoints.toLocaleString()}</TableCell>
                      <TableCell className="font-mono text-sm">{customer.referralCode}</TableCell>
                      <TableCell>{customer.referralCount}</TableCell>
                      <TableCell>{customer.totalEarned.toLocaleString()}</TableCell>
                      <TableCell>{customer.totalRedeemed.toLocaleString()}</TableCell>
                      <TableCell>{new Date(customer.lastActivity).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Program Settings</CardTitle>
                <CardDescription>Configure basic loyalty program parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Program Status</Label>
                    <p className="text-sm text-gray-500">Enable or disable the loyalty program</p>
                  </div>
                  <Switch
                    checked={program.isActive}
                    onCheckedChange={(checked) => setProgram({ ...program, isActive: checked })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="pointsPerDollar">Points per Dollar</Label>
                  <Input
                    id="pointsPerDollar"
                    type="number"
                    step="0.1"
                    value={program.pointsPerDollar}
                    onChange={(e) => setProgram({ ...program, pointsPerDollar: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="signupBonus">Signup Bonus Points</Label>
                  <Input
                    id="signupBonus"
                    type="number"
                    value={program.signupBonus}
                    onChange={(e) => setProgram({ ...program, signupBonus: parseInt(e.target.value) || 0 })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="birthdayBonus">Birthday Bonus Points</Label>
                  <Input
                    id="birthdayBonus"
                    type="number"
                    value={program.birthdayBonus}
                    onChange={(e) => setProgram({ ...program, birthdayBonus: parseInt(e.target.value) || 0 })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="referralBonus">Referral Bonus Points</Label>
                  <Input
                    id="referralBonus"
                    type="number"
                    value={program.referralBonus}
                    onChange={(e) => setProgram({ ...program, referralBonus: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Program Information</CardTitle>
                <CardDescription>Manage program details and description</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="programName">Program Name</Label>
                  <Input
                    id="programName"
                    value={program.name}
                    onChange={(e) => setProgram({ ...program, name: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="programDescription">Program Description</Label>
                  <textarea
                    id="programDescription"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows={4}
                    value={program.description}
                    onChange={(e) => setProgram({ ...program, description: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Earning Rules</CardTitle>
              <CardDescription>Configure additional ways customers can earn points</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {program.earningRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{rule.name}</div>
                      <div className="text-sm text-gray-600">{rule.description}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{rule.points} pts</Badge>
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={(checked) => {
                          const updatedRules = program.earningRules.map(r =>
                            r.id === rule.id ? { ...r, isActive: checked } : r
                          )
                          setProgram({ ...program, earningRules: updatedRules })
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}