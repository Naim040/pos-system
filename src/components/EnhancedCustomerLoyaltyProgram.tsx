"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { 
  Gift, 
  Star, 
  Crown, 
  Trophy, 
  Users, 
  Target, 
  TrendingUp, 
  Calendar,
  CreditCard,
  ShoppingCart,
  Award,
  Zap,
  Bell,
  Settings,
  Plus,
  Mail,
  Phone,
  MapPin,
  Cake,
  Activity,
  BarChart3,
  Gift as GiftIcon,
  RefreshCw,
  Filter,
  Search,
  CheckCircle
} from 'lucide-react'
import { formatPrice } from '@/lib/currency'

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  birthday?: string
  loyaltyPoints: number
  loyaltyTier: string
  totalSpent: number
  visitCount: number
  lastVisit?: string
  memberSince: string
  preferences?: {
    notifications: boolean
    emailMarketing: boolean
    smsOffers: boolean
  }
}

interface LoyaltyTier {
  name: string
  minPoints: number
  maxPoints: number
  benefits: string[]
  color: string
  icon: JSX.Element
}

interface LoyaltyReward {
  id: string
  name: string
  description: string
  pointsRequired: number
  type: 'discount' | 'free_item' | 'cashback' | 'experience'
  value: number
  expiryDays?: number
  isActive: boolean
  category: string
  image?: string
}

interface LoyaltyTransaction {
  id: string
  customerId: string
  points: number
  type: 'earned' | 'redeemed' | 'expired' | 'adjusted'
  description: string
  createdAt: string
  referenceId?: string
  balance: number
}

interface Campaign {
  id: string
  name: string
  description: string
  type: 'points_multiplier' | 'bonus_points' | 'tier_upgrade' | 'referral'
  startDate: string
  endDate: string
  targetAudience: string
  isActive: boolean
  participants: number
  pointsMultiplier?: number
  bonusPoints?: number
}

export default function EnhancedCustomerLoyaltyProgram() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loyaltyTiers, setLoyaltyTiers] = useState<LoyaltyTier[]>([])
  const [rewards, setRewards] = useState<LoyaltyReward[]>([])
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [tierFilter, setTierFilter] = useState('all')
  const [showAddReward, setShowAddReward] = useState(false)
  const [showAddCampaign, setShowAddCampaign] = useState(false)
  const [analytics, setAnalytics] = useState({
    totalMembers: 0,
    activeMembers: 0,
    totalPointsIssued: 0,
    totalPointsRedeemed: 0,
    averagePointsPerCustomer: 0,
    retentionRate: 0,
    redemptionRate: 0
  })
  const { toast } = useToast()

  // Form states
  const [newReward, setNewReward] = useState({
    name: '',
    description: '',
    pointsRequired: 0,
    type: 'discount',
    value: 0,
    expiryDays: 30,
    category: 'general',
    isActive: true
  })

  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    type: 'points_multiplier',
    startDate: '',
    endDate: '',
    targetAudience: 'all',
    pointsMultiplier: 2,
    bonusPoints: 0,
    isActive: true
  })

  useEffect(() => {
    fetchLoyaltyData()
    fetchAnalytics()
  }, [])

  const fetchLoyaltyData = async () => {
    setLoading(true)
    try {
      // Fetch customers
      const customersResponse = await fetch('/api/customers')
      if (customersResponse.ok) {
        const customersData = await customersResponse.json()
        setCustomers(customersData)
      }

      // Fetch loyalty tiers (mock data for now)
      setLoyaltyTiers([
        {
          name: 'Bronze',
          minPoints: 0,
          maxPoints: 999,
          benefits: ['5% birthday discount', 'Points on purchases'],
          color: 'bg-amber-100 text-amber-800',
          icon: <Star className="h-4 w-4" />
        },
        {
          name: 'Silver',
          minPoints: 1000,
          maxPoints: 4999,
          benefits: ['10% birthday discount', 'Double points on weekends', 'Exclusive offers'],
          color: 'bg-gray-100 text-gray-800',
          icon: <Crown className="h-4 w-4" />
        },
        {
          name: 'Gold',
          minPoints: 5000,
          maxPoints: 9999,
          benefits: ['15% birthday discount', 'Triple points on weekends', 'Priority support', 'Free shipping'],
          color: 'bg-yellow-100 text-yellow-800',
          icon: <Trophy className="h-4 w-4" />
        },
        {
          name: 'Platinum',
          minPoints: 10000,
          maxPoints: Infinity,
          benefits: ['20% birthday discount', 'Quadruple points always', 'VIP events', 'Personal manager', 'Exclusive gifts'],
          color: 'bg-purple-100 text-purple-800',
          icon: <Award className="h-4 w-4" />
        }
      ])

      // Fetch rewards (mock data)
      setRewards([
        {
          id: '1',
          name: 'Free Coffee',
          description: 'Get a free coffee of your choice',
          pointsRequired: 100,
          type: 'free_item',
          value: 5.00,
          category: 'beverages',
          isActive: true
        },
        {
          id: '2',
          name: '10% Discount',
          description: '10% off your next purchase',
          pointsRequired: 200,
          type: 'discount',
          value: 10,
          category: 'discounts',
          isActive: true
        },
        {
          id: '3',
          name: '$5 Cashback',
          description: '$5 cashback on your account',
          pointsRequired: 500,
          type: 'cashback',
          value: 5.00,
          category: 'cashback',
          isActive: true
        },
        {
          id: '4',
          name: 'VIP Experience',
          description: 'Exclusive VIP tasting event',
          pointsRequired: 2000,
          type: 'experience',
          value: 0,
          category: 'experiences',
          isActive: true
        }
      ])

      // Fetch campaigns (mock data)
      setCampaigns([
        {
          id: '1',
          name: 'Weekend Double Points',
          description: 'Earn double points on all weekend purchases',
          type: 'points_multiplier',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          targetAudience: 'all',
          isActive: true,
          participants: 156,
          pointsMultiplier: 2
        },
        {
          id: '2',
          name: 'New Member Bonus',
          description: 'Get 500 bonus points when you join',
          type: 'bonus_points',
          startDate: '2024-01-01',
          endDate: '2024-06-30',
          targetAudience: 'new_customers',
          isActive: true,
          participants: 45,
          bonusPoints: 500
        }
      ])

      // Fetch transactions (mock data)
      setTransactions([
        {
          id: '1',
          customerId: '1',
          points: 50,
          type: 'earned',
          description: 'Purchase at Main Store',
          createdAt: '2024-01-15T10:30:00Z',
          balance: 350
        },
        {
          id: '2',
          customerId: '1',
          points: 100,
          type: 'redeemed',
          description: 'Redeemed Free Coffee',
          createdAt: '2024-01-16T14:20:00Z',
          balance: 250
        }
      ])

    } catch (error) {
      console.error('Error fetching loyalty data:', error)
      toast({
        title: "Error",
        description: "Failed to load loyalty program data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    // Mock analytics data
    setAnalytics({
      totalMembers: 342,
      activeMembers: 289,
      totalPointsIssued: 125000,
      totalPointsRedeemed: 78000,
      averagePointsPerCustomer: 365,
      retentionRate: 84.5,
      redemptionRate: 62.4
    })
  }

  const createLoyaltyReward = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/loyalty/rewards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newReward),
      })

      if (response.ok) {
        await fetchLoyaltyData()
        setShowAddReward(false)
        setNewReward({
          name: '',
          description: '',
          pointsRequired: 0,
          type: 'discount',
          value: 0,
          expiryDays: 30,
          category: 'general',
          isActive: true
        })
        toast({
          title: "Success",
          description: "Loyalty reward created successfully",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to create loyalty reward",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create loyalty reward",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const createCampaign = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/loyalty/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCampaign),
      })

      if (response.ok) {
        await fetchLoyaltyData()
        setShowAddCampaign(false)
        setNewCampaign({
          name: '',
          description: '',
          type: 'points_multiplier',
          startDate: '',
          endDate: '',
          targetAudience: 'all',
          pointsMultiplier: 2,
          bonusPoints: 0,
          isActive: true
        })
        toast({
          title: "Success",
          description: "Campaign created successfully",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to create campaign",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const redeemReward = async (customerId: string, rewardId: string) => {
    try {
      const response = await fetch(`/api/customers/${customerId}/loyalty/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rewardId }),
      })

      if (response.ok) {
        await fetchLoyaltyData()
        toast({
          title: "Success",
          description: "Reward redeemed successfully",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to redeem reward",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to redeem reward",
        variant: "destructive"
      })
    }
  }

  const getCustomerTier = (points: number) => {
    return loyaltyTiers.find(tier => points >= tier.minPoints && points <= tier.maxPoints) || loyaltyTiers[0]
  }

  const getTierProgress = (points: number, tier: LoyaltyTier) => {
    if (tier.maxPoints === Infinity) return 100
    return ((points - tier.minPoints) / (tier.maxPoints - tier.minPoints)) * 100
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone?.includes(searchTerm)
    const matchesTier = tierFilter === 'all' || customer.loyaltyTier === tierFilter
    return matchesSearch && matchesTier
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Customer Loyalty Program</h2>
          <p className="text-gray-600">Manage customer rewards, tiers, and engagement</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowAddCampaign(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
          <Button onClick={() => setShowAddReward(true)}>
            <Gift className="h-4 w-4 mr-2" />
            New Reward
          </Button>
          <Button onClick={fetchLoyaltyData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-2xl font-bold">{analytics.totalMembers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Members</p>
                <p className="text-2xl font-bold">{analytics.activeMembers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Points Issued</p>
                <p className="text-2xl font-bold">{analytics.totalPointsIssued.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Gift className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Points Redeemed</p>
                <p className="text-2xl font-bold">{analytics.totalPointsRedeemed.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Retention Rate</p>
                <p className="text-2xl font-bold">{analytics.retentionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Redemption Rate</p>
                <p className="text-2xl font-bold">{analytics.redemptionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="customers" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="tiers">Loyalty Tiers</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search customers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={tierFilter} onValueChange={setTierFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    {loyaltyTiers.map(tier => (
                      <SelectItem key={tier.name} value={tier.name}>{tier.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Customers List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredCustomers.map((customer) => {
              const tier = getCustomerTier(customer.loyaltyPoints)
              const progress = getTierProgress(customer.loyaltyPoints, tier)
              
              return (
                <Card key={customer.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{customer.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={tier.color}>
                            {tier.icon}
                            <span className="ml-1">{tier.name}</span>
                          </Badge>
                          <Badge variant="outline">
                            <Star className="h-3 w-3 mr-1" />
                            {customer.loyaltyPoints} pts
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatPrice(customer.totalSpent)}</p>
                        <p className="text-sm text-gray-600">{customer.visitCount} visits</p>
                      </div>
                    </div>
                    
                    {/* Tier Progress */}
                    {tier.maxPoints !== Infinity && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress to {loyaltyTiers.find(t => t.minPoints === tier.maxPoints + 1)?.name || 'Max'}</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    )}
                    
                    {/* Customer Info */}
                    <div className="space-y-2 text-sm text-gray-600">
                      {customer.email && (
                        <div className="flex items-center">
                          <Mail className="h-3 w-3 mr-2" />
                          {customer.email}
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-2" />
                          {customer.phone}
                        </div>
                      )}
                      {customer.birthday && (
                        <div className="flex items-center">
                          <Cake className="h-3 w-3 mr-2" />
                          Birthday: {new Date(customer.birthday).toLocaleDateString()}
                        </div>
                      )}
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-2" />
                        Member since {new Date(customer.memberSince).toLocaleDateString()}
                      </div>
                    </div>
                    
                    {/* Available Rewards */}
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Available Rewards:</p>
                      <div className="flex flex-wrap gap-2">
                        {rewards
                          .filter(reward => reward.isActive && customer.loyaltyPoints >= reward.pointsRequired)
                          .slice(0, 3)
                          .map(reward => (
                            <Button
                              key={reward.id}
                              size="sm"
                              variant="outline"
                              onClick={() => redeemReward(customer.id, reward.id)}
                            >
                              <Gift className="h-3 w-3 mr-1" />
                              {reward.name}
                            </Button>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="tiers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {loyaltyTiers.map((tier) => (
              <Card key={tier.name} className="relative overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-2 ${tier.color.split(' ')[0]}`}></div>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center">
                    {tier.icon}
                    <span className="ml-2">{tier.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Points Range</p>
                      <p className="font-semibold">
                        {tier.minPoints.toLocaleString()} - {tier.maxPoints === Infinity ? '∞' : tier.maxPoints.toLocaleString()}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Benefits</p>
                      <ul className="space-y-1">
                        {tier.benefits.map((benefit, index) => (
                          <li key={index} className="text-sm flex items-center">
                            <CheckCircle className="h-3 w-3 mr-2 text-green-600" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Customers in Tier</p>
                      <p className="font-semibold">
                        {customers.filter(c => c.loyaltyTier === tier.name).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map((reward) => (
              <Card key={reward.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{reward.name}</span>
                    {reward.isActive ? (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{reward.description}</p>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Points Required</span>
                      <Badge variant="outline">
                        <Star className="h-3 w-3 mr-1" />
                        {reward.pointsRequired}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Type</span>
                      <Badge variant="outline">{reward.type.replace('_', ' ')}</Badge>
                    </div>
                    
                    {reward.value > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Value</span>
                        <span className="font-semibold">
                          {reward.type === 'discount' ? `${reward.value}%` : formatPrice(reward.value)}
                        </span>
                      </div>
                    )}
                    
                    {reward.expiryDays && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Expires in</span>
                        <span className="text-sm">{reward.expiryDays} days</span>
                      </div>
                    )}
                    
                    <div className="pt-2">
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          // Find customers eligible for this reward
                          const eligibleCustomers = customers.filter(c => c.loyaltyPoints >= reward.pointsRequired)
                          toast({
                            title: "Eligible Customers",
                            description: `${eligibleCustomers.length} customers can redeem this reward`,
                          })
                        }}
                      >
                        View Eligible Customers
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{campaign.name}</span>
                    {campaign.isActive ? (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{campaign.description}</p>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Type</span>
                      <Badge variant="outline">{campaign.type.replace('_', ' ')}</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Duration</span>
                      <span className="text-sm">
                        {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Target Audience</span>
                      <span className="text-sm">{campaign.targetAudience.replace('_', ' ')}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Participants</span>
                      <span className="font-semibold">{campaign.participants}</span>
                    </div>
                    
                    {campaign.pointsMultiplier && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Points Multiplier</span>
                        <Badge className="bg-blue-100 text-blue-800">x{campaign.pointsMultiplier}</Badge>
                      </div>
                    )}
                    
                    {campaign.bonusPoints > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Bonus Points</span>
                        <Badge className="bg-purple-100 text-purple-800">+{campaign.bonusPoints}</Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tier Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loyaltyTiers.map((tier) => {
                    const customerCount = customers.filter(c => c.loyaltyTier === tier.name).length
                    const percentage = analytics.totalMembers > 0 ? (customerCount / analytics.totalMembers) * 100 : 0
                    
                    return (
                      <div key={tier.name} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            {tier.icon}
                            <span className="ml-2 font-medium">{tier.name}</span>
                          </div>
                          <span className="text-sm text-gray-600">{customerCount} customers ({percentage.toFixed(1)}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Program Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Active Member Rate</span>
                      <span className="text-sm text-gray-600">{((analytics.activeMembers / analytics.totalMembers) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={(analytics.activeMembers / analytics.totalMembers) * 100} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Points Redemption Rate</span>
                      <span className="text-sm text-gray-600">{analytics.redemptionRate}%</span>
                    </div>
                    <Progress value={analytics.redemptionRate} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Customer Retention</span>
                      <span className="text-sm text-gray-600">{analytics.retentionRate}%</span>
                    </div>
                    <Progress value={analytics.retentionRate} className="h-2" />
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{analytics.averagePointsPerCustomer}</p>
                        <p className="text-sm text-gray-600">Avg Points/Customer</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          {Math.round((analytics.totalPointsRedeemed / analytics.totalPointsIssued) * 100)}%
                        </p>
                        <p className="text-sm text-gray-600">Points Utilized</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Reward Dialog */}
      {showAddReward && (
        <Dialog open={showAddReward} onOpenChange={setShowAddReward}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Reward</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="rewardName">Reward Name</Label>
                <Input
                  id="rewardName"
                  value={newReward.name}
                  onChange={(e) => setNewReward({...newReward, name: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="rewardDescription">Description</Label>
                <Textarea
                  id="rewardDescription"
                  value={newReward.description}
                  onChange={(e) => setNewReward({...newReward, description: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pointsRequired">Points Required</Label>
                  <Input
                    id="pointsRequired"
                    type="number"
                    value={newReward.pointsRequired}
                    onChange={(e) => setNewReward({...newReward, pointsRequired: parseInt(e.target.value)})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="rewardType">Type</Label>
                  <Select value={newReward.type} onValueChange={(value) => setNewReward({...newReward, type: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discount">Discount</SelectItem>
                      <SelectItem value="free_item">Free Item</SelectItem>
                      <SelectItem value="cashback">Cashback</SelectItem>
                      <SelectItem value="experience">Experience</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rewardValue">Value</Label>
                  <Input
                    id="rewardValue"
                    type="number"
                    value={newReward.value}
                    onChange={(e) => setNewReward({...newReward, value: parseFloat(e.target.value)})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="expiryDays">Expiry Days</Label>
                  <Input
                    id="expiryDays"
                    type="number"
                    value={newReward.expiryDays}
                    onChange={(e) => setNewReward({...newReward, expiryDays: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddReward(false)}>
                  Cancel
                </Button>
                <Button onClick={createLoyaltyReward} disabled={loading}>
                  Create Reward
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Campaign Dialog */}
      {showAddCampaign && (
        <Dialog open={showAddCampaign} onOpenChange={setShowAddCampaign}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="campaignName">Campaign Name</Label>
                <Input
                  id="campaignName"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="campaignDescription">Description</Label>
                <Textarea
                  id="campaignDescription"
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({...newCampaign, description: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="campaignType">Type</Label>
                  <Select value={newCampaign.type} onValueChange={(value) => setNewCampaign({...newCampaign, type: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="points_multiplier">Points Multiplier</SelectItem>
                      <SelectItem value="bonus_points">Bonus Points</SelectItem>
                      <SelectItem value="tier_upgrade">Tier Upgrade</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <Select value={newCampaign.targetAudience} onValueChange={(value) => setNewCampaign({...newCampaign, targetAudience: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Customers</SelectItem>
                      <SelectItem value="new_customers">New Customers</SelectItem>
                      <SelectItem value="vip_customers">VIP Customers</SelectItem>
                      <SelectItem value="inactive_customers">Inactive Customers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newCampaign.startDate}
                    onChange={(e) => setNewCampaign({...newCampaign, startDate: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newCampaign.endDate}
                    onChange={(e) => setNewCampaign({...newCampaign, endDate: e.target.value})}
                  />
                </div>
              </div>
              
              {newCampaign.type === 'points_multiplier' && (
                <div>
                  <Label htmlFor="pointsMultiplier">Points Multiplier</Label>
                  <Input
                    id="pointsMultiplier"
                    type="number"
                    value={newCampaign.pointsMultiplier}
                    onChange={(e) => setNewCampaign({...newCampaign, pointsMultiplier: parseInt(e.target.value)})}
                  />
                </div>
              )}
              
              {newCampaign.type === 'bonus_points' && (
                <div>
                  <Label htmlFor="bonusPoints">Bonus Points</Label>
                  <Input
                    id="bonusPoints"
                    type="number"
                    value={newCampaign.bonusPoints}
                    onChange={(e) => setNewCampaign({...newCampaign, bonusPoints: parseInt(e.target.value)})}
                  />
                </div>
              )}
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddCampaign(false)}>
                  Cancel
                </Button>
                <Button onClick={createCampaign} disabled={loading}>
                  Create Campaign
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}