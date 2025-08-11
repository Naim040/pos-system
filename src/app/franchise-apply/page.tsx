"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building, User, Mail, Phone, MapPin, Globe, FileText, Shield, CheckCircle, Loader2 } from 'lucide-react'

interface FormData {
  // Franchise Information
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  website: string
  contactPerson: string
  businessLicense: string
  taxId: string
  
  // Admin User Information
  adminName: string
  adminEmail: string
  adminPassword: string
  confirmPassword: string
  
  // Business Information
  businessType: string
  yearsInBusiness: string
  expectedClients: string
  territory: string
  businessPlan: string
}

export default function FranchiseApplication() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    website: '',
    contactPerson: '',
    businessLicense: '',
    taxId: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    businessType: '',
    yearsInBusiness: '',
    expectedClients: '',
    territory: '',
    businessPlan: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [step, setStep] = useState(1)

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const validateStep1 = () => {
    const required = ['name', 'email', 'phone', 'contactPerson']
    return required.every(field => formData[field as keyof FormData].trim() !== '')
  }

  const validateStep2 = () => {
    const required = ['adminName', 'adminEmail', 'adminPassword', 'confirmPassword']
    if (!required.every(field => formData[field as keyof FormData].trim() !== '')) {
      return false
    }
    if (formData.adminPassword !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    if (formData.adminPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      return false
    }
    return true
  }

  const validateStep3 = () => {
    const required = ['businessType', 'territory', 'businessPlan']
    return required.every(field => formData[field as keyof FormData].trim() !== '')
  }

  const nextStep = () => {
    if (step === 1 && !validateStep1()) {
      setError('Please fill in all required fields')
      return
    }
    if (step === 2 && !validateStep2()) {
      return
    }
    if (step === 3 && !validateStep3()) {
      setError('Please fill in all required fields')
      return
    }
    
    setError('')
    if (step < 3) setStep(step + 1)
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateStep3()) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/franchise/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
          website: formData.website,
          contactPerson: formData.contactPerson,
          businessLicense: formData.businessLicense,
          taxId: formData.taxId,
          adminName: formData.adminName,
          adminEmail: formData.adminEmail,
          adminPassword: formData.adminPassword
        }),
      })

      if (response.ok) {
        setSuccess(true)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to submit application')
      }
    } catch (error) {
      setError('Failed to submit application. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Application Submitted!</CardTitle>
            <CardDescription>
              Your franchise application has been submitted successfully. We will review your application and contact you within 3-5 business days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  You will receive an email once your application is approved. Please check your email regularly for updates.
                </AlertDescription>
              </Alert>
              <Button 
                onClick={() => router.push('/login')} 
                className="w-full"
              >
                Return to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Building className="mx-auto h-12 w-12 text-blue-600" />
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Franchise Application</h1>
          <p className="mt-2 text-lg text-gray-600">
            Join our franchise network and start selling our POS system
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  step >= stepNumber 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'border-gray-300 text-gray-500'
                }`}>
                  {stepNumber}
                </div>
                <div className={`ml-2 text-sm font-medium ${
                  step >= stepNumber ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {stepNumber === 1 ? 'Franchise Info' : stepNumber === 2 ? 'Admin Account' : 'Business Details'}
                </div>
                {stepNumber < 3 && (
                  <div className={`ml-4 w-16 h-0.5 ${
                    step > stepNumber ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && 'Franchise Information'}
              {step === 2 && 'Administrator Account'}
              {step === 3 && 'Business Details'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Basic information about your franchise'}
              {step === 2 && 'Create the main administrator account for your franchise'}
              {step === 3 && 'Tell us about your business and plans'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Step 1: Franchise Information */}
              {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name">Franchise Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter franchise name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Business Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="franchise@example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPerson">Contact Person *</Label>
                    <Input
                      id="contactPerson"
                      value={formData.contactPerson}
                      onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Business Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="123 Business St"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="New York"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="NY"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      placeholder="10001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      placeholder="United States"
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="businessLicense">Business License Number</Label>
                    <Input
                      id="businessLicense"
                      value={formData.businessLicense}
                      onChange={(e) => handleInputChange('businessLicense', e.target.value)}
                      placeholder="BL-123456"
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxId">Tax ID</Label>
                    <Input
                      id="taxId"
                      value={formData.taxId}
                      onChange={(e) => handleInputChange('taxId', e.target.value)}
                      placeholder="Tax ID"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Administrator Account */}
              {step === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="adminName">Admin Name *</Label>
                    <Input
                      id="adminName"
                      value={formData.adminName}
                      onChange={(e) => handleInputChange('adminName', e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="adminEmail">Admin Email *</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={formData.adminEmail}
                      onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                      placeholder="admin@franchise.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="adminPassword">Password *</Label>
                    <Input
                      id="adminPassword"
                      type="password"
                      value={formData.adminPassword}
                      onChange={(e) => handleInputChange('adminPassword', e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Business Details */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="businessType">Business Type *</Label>
                      <Select onValueChange={(value) => handleInputChange('businessType', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Individual</SelectItem>
                          <SelectItem value="llc">LLC</SelectItem>
                          <SelectItem value="corporation">Corporation</SelectItem>
                          <SelectItem value="partnership">Partnership</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="yearsInBusiness">Years in Business</Label>
                      <Select onValueChange={(value) => handleInputChange('yearsInBusiness', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select years" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0-1">0-1 years</SelectItem>
                          <SelectItem value="2-5">2-5 years</SelectItem>
                          <SelectItem value="6-10">6-10 years</SelectItem>
                          <SelectItem value="10+">10+ years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="expectedClients">Expected Monthly Clients</Label>
                      <Select onValueChange={(value) => handleInputChange('expectedClients', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-10">1-10 clients</SelectItem>
                          <SelectItem value="11-25">11-25 clients</SelectItem>
                          <SelectItem value="26-50">26-50 clients</SelectItem>
                          <SelectItem value="50+">50+ clients</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="territory">Target Territory *</Label>
                      <Input
                        id="territory"
                        value={formData.territory}
                        onChange={(e) => handleInputChange('territory', e.target.value)}
                        placeholder="e.g., New York City, Los Angeles County"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="businessPlan">Business Plan *</Label>
                    <Textarea
                      id="businessPlan"
                      value={formData.businessPlan}
                      onChange={(e) => handleInputChange('businessPlan', e.target.value)}
                      placeholder="Describe your business plan, marketing strategy, and how you plan to grow your franchise..."
                      rows={4}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={step === 1}
                >
                  Previous
                </Button>
                
                <div className="flex space-x-2">
                  {step < 3 ? (
                    <Button type="button" onClick={nextStep}>
                      Next
                    </Button>
                  ) : (
                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Application'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}