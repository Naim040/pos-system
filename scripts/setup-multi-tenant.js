#!/usr/bin/env node

/**
 * Multi-Tenant Setup Script
 * This script sets up the multi-tenant system with demo tenants and domains
 * 
 * Usage:
 * node scripts/setup-multi-tenant.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupMultiTenant() {
  try {
    console.log('🚀 Setting up Multi-Tenant POS System...\n');

    // Step 1: Create demo tenants
    console.log('Step 1: Creating demo tenants...');
    const demoTenants = [
      {
        name: 'Demo Restaurant',
        email: 'restaurant@demo.com',
        plan: 'professional',
        maxUsers: 10,
        maxStores: 2,
        settings: {
          industry: 'restaurant',
          currency: 'USD',
          timezone: 'America/New_York'
        }
      },
      {
        name: 'Demo Retail Store',
        email: 'retail@demo.com',
        plan: 'enterprise',
        maxUsers: 20,
        maxStores: 5,
        settings: {
          industry: 'retail',
          currency: 'USD',
          timezone: 'America/Los_Angeles'
        }
      },
      {
        name: 'Demo Service Business',
        email: 'service@demo.com',
        plan: 'basic',
        maxUsers: 5,
        maxStores: 1,
        settings: {
          industry: 'service',
          currency: 'USD',
          timezone: 'America/Chicago'
        }
      }
    ];

    const createdTenants = [];
    
    for (const tenantData of demoTenants) {
      const existingTenant = await prisma.tenant.findUnique({
        where: { email: tenantData.email }
      });

      if (!existingTenant) {
        const tenant = await prisma.tenant.create({
          data: {
            name: tenantData.name,
            email: tenantData.email,
            plan: tenantData.plan,
            maxUsers: tenantData.maxUsers,
            maxStores: tenantData.maxStores,
            customDomain: true,
            settings: JSON.stringify(tenantData.settings),
            isActive: true
          }
        });

        // Create subscription
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 30); // 30-day trial

        await prisma.subscription.create({
          data: {
            tenantId: tenant.id,
            plan: tenantData.plan,
            status: 'active',
            billingCycle: 'monthly',
            amount: 0,
            currency: 'USD',
            currentPeriodStart: new Date(),
            currentPeriodEnd: trialEndDate,
            trialEnd: trialEndDate,
            metadata: JSON.stringify({ trial: true, demo: true })
          }
        });

        createdTenants.push(tenant);
        console.log(`✅ Created tenant: ${tenant.name} (${tenant.email})`);
      } else {
        console.log(`✅ Tenant already exists: ${tenantData.name}`);
        createdTenants.push(existingTenant);
      }
    }

    // Step 2: Create demo domains
    console.log('\nStep 2: Creating demo domains...');
    const demoDomains = [
      {
        tenantEmail: 'restaurant@demo.com',
        domain: 'restaurant.demo-pos.com',
        isPrimary: true
      },
      {
        tenantEmail: 'retail@demo.com',
        domain: 'retail.demo-pos.com',
        isPrimary: true
      },
      {
        tenantEmail: 'service@demo.com',
        domain: 'service.demo-pos.com',
        isPrimary: true
      }
    ];

    for (const domainData of demoDomains) {
      const tenant = createdTenants.find(t => t.email === domainData.tenantEmail);
      if (!tenant) continue;

      const existingDomain = await prisma.tenantDomain.findUnique({
        where: { domain: domainData.domain }
      });

      if (!existingDomain) {
        const domain = await prisma.tenantDomain.create({
          data: {
            tenantId: tenant.id,
            domain: domainData.domain,
            isPrimary: domainData.isPrimary,
            isVerified: true, // Auto-verify for demo
            sslEnabled: false,
            dnsRecord: `pos-verify-${Math.random().toString(36).substring(2, 15)}`,
            verificationToken: Math.random().toString(36).substring(2, 15),
            verifiedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        console.log(`✅ Created domain: ${domain.domain} for ${tenant.name}`);
      } else {
        console.log(`✅ Domain already exists: ${domainData.domain}`);
      }
    }

    // Step 3: Create demo users for each tenant
    console.log('\nStep 3: Creating demo users...');
    
    for (const tenant of createdTenants) {
      const demoUsers = [
        { email: `admin@${tenant.email.split('@')[1]}`, name: `${tenant.name} Admin`, role: 'admin' },
        { email: `manager@${tenant.email.split('@')[1]}`, name: `${tenant.name} Manager`, role: 'manager' },
        { email: `staff@${tenant.email.split('@')[1]}`, name: `${tenant.name} Staff`, role: 'staff' }
      ];

      for (const userData of demoUsers) {
        let user = await prisma.user.findUnique({
          where: { email: userData.email }
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email: userData.email,
              name: userData.name,
              role: userData.role,
              status: 'active'
            }
          });
        }

        // Link user to tenant
        const existingTenantUser = await prisma.tenantUser.findUnique({
          where: {
            tenantId_userId: {
              tenantId: tenant.id,
              userId: user.id
            }
          }
        });

        if (!existingTenantUser) {
          await prisma.tenantUser.create({
            data: {
              tenantId: tenant.id,
              userId: user.id,
              role: userData.role,
              isActive: true,
              joinedAt: new Date()
            }
          });
          console.log(`✅ Created user: ${userData.email} for ${tenant.name}`);
        } else {
          console.log(`✅ User already exists: ${userData.email}`);
        }
      }
    }

    // Step 4: Create demo stores for each tenant
    console.log('\nStep 4: Creating demo stores...');
    
    for (const tenant of createdTenants) {
      const storeData = {
        name: `${tenant.name} Main Store`,
        code: tenant.name.toUpperCase().replace(/\s+/g, '_'),
        address: '123 Main Street',
        city: 'Demo City',
        state: 'Demo State',
        country: 'Demo Country',
        phone: '+1-555-0123',
        email: `store@${tenant.email.split('@')[1]}`,
        currency: 'USD',
        isActive: true,
        isHeadquarters: true
      };

      let store = await prisma.store.findFirst({
        where: { code: storeData.code }
      });

      if (!store) {
        store = await prisma.store.create({
          data: storeData
        });

        // Link store to tenant
        await prisma.tenantStore.create({
          data: {
            tenantId: tenant.id,
            storeId: store.id,
            isActive: true,
            addedAt: new Date()
          }
        });

        console.log(`✅ Created store: ${store.name} for ${tenant.name}`);
      } else {
        // Link existing store to tenant
        const existingTenantStore = await prisma.tenantStore.findUnique({
          where: {
            tenantId_storeId: {
              tenantId: tenant.id,
              storeId: store.id
            }
          }
        });

        if (!existingTenantStore) {
          await prisma.tenantStore.create({
            data: {
              tenantId: tenant.id,
              storeId: store.id,
              isActive: true,
              addedAt: new Date()
            }
          });
          console.log(`✅ Linked store: ${store.name} to ${tenant.name}`);
        } else {
          console.log(`✅ Store already linked: ${store.name}`);
        }
      }
    }

    // Summary
    console.log('\n🎉 Multi-Tenant Setup Complete!\n');
    console.log('📄 Demo Environment Ready:');
    console.log(`   Created ${createdTenants.length} demo tenants`);
    console.log(`   Created ${demoDomains.length} demo domains`);
    console.log(`   Created ${createdTenants.length * 3} demo users`);
    console.log(`   Created ${createdTenants.length} demo stores`);

    console.log('\n🔐 Demo Login Credentials:');
    
    for (const tenant of createdTenants) {
      console.log(`\n📂 ${tenant.name} (${tenant.plan} plan):`);
      console.log(`   Domain: ${demoDomains.find(d => d.tenantEmail === tenant.email)?.domain}`);
      console.log(`   Admin: admin@${tenant.email.split('@')[1]} / password`);
      console.log(`   Manager: manager@${tenant.email.split('@')[1]} / password`);
      console.log(`   Staff: staff@${tenant.email.split('@')[1]} / password`);
    }

    console.log('\n🌐 Access URLs:');
    console.log('   Main POS: http://localhost:3000/login');
    console.log('   Tenant Management: http://localhost:3000/tenants');
    
    console.log('\n🎯 Demo Features:');
    console.log('   ✅ Multi-tenant architecture');
    console.log('   ✅ Custom domain support');
    console.log('   ✅ Tenant isolation');
    console.log('   ✅ User role management');
    console.log('   ✅ Store management per tenant');
    console.log('   ✅ 30-day trial subscriptions');

    console.log('\n🚀 You can now start the development server:');
    console.log('   npm run dev');
    console.log('   # Then visit the URLs above');

    console.log('\n📋 Next Steps:');
    console.log('   1. Configure your server DNS settings');
    console.log('   2. Set up SSL certificates');
    console.log('   3. Test domain access');
    console.log('   4. Monitor tenant activity');

  } catch (error) {
    console.error('\n❌ Multi-Tenant Setup Failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  setupMultiTenant();
}

module.exports = { setupMultiTenant };