#!/usr/bin/env node

/**
 * Demo License Setup Script
 * This script quickly sets up a demo license for development and testing
 * 
 * Usage:
 * node scripts/setup-demo-license.js
 * 
 * This script will:
 * 1. Create a demo admin user (admin@pos.com)
 * 2. Create a demo license
 * 3. Activate the license for localhost
 * 4. Create a default store
 * 5. Link everything together
 */

const { PrismaClient } = require('@prisma/client');
const { createLicense, activateLicense, createOrUpdateAdminUser, createDefaultStore, linkUserToStore } = require('./create-admin-license.js');

const prisma = new PrismaClient();

async function setupDemoLicense() {
  try {
    console.log('🚀 Setting up Demo License for Development...\n');

    // Demo configuration
    const demoConfig = {
      type: 'lifetime',
      email: 'admin@pos.com',
      name: 'Demo Admin',
      maxUsers: 5,
      maxStores: 3,
      activate: true,
      domain: 'localhost'
    };

    console.log('📋 Demo Configuration:');
    console.log(`   Email: ${demoConfig.email}`);
    console.log(`   Name: ${demoConfig.name}`);
    console.log(`   License Type: ${demoConfig.type}`);
    console.log(`   Max Users: ${demoConfig.maxUsers}`);
    console.log(`   Max Stores: ${demoConfig.maxStores}`);
    console.log(`   Domain: ${demoConfig.domain}\n`);

    // Step 1: Create demo admin user
    console.log('Step 1: Creating demo admin user...');
    const adminUser = await createOrUpdateAdminUser(demoConfig.email, demoConfig.name, 'admin');

    // Step 2: Create default store
    console.log('\nStep 2: Creating default store...');
    const defaultStore = await createDefaultStore();

    // Step 3: Link admin user to store
    console.log('\nStep 3: Linking admin user to store...');
    await linkUserToStore(adminUser, defaultStore, 'admin');

    // Step 4: Create demo license
    console.log('\nStep 4: Creating demo license...');
    const license = await createLicense(demoConfig);

    // Step 5: Activate demo license
    console.log('\nStep 5: Activating demo license...');
    const activation = await activateLicense(license, demoConfig.domain);

    // Create additional demo users
    console.log('\nStep 6: Creating additional demo users...');
    const demoUsers = [
      { email: 'manager@pos.com', name: 'Demo Manager', role: 'manager' },
      { email: 'staff@pos.com', name: 'Demo Staff', role: 'staff' }
    ];

    for (const userData of demoUsers) {
      const user = await createOrUpdateAdminUser(userData.email, userData.name, userData.role);
      await linkUserToStore(user, defaultStore, userData.role);
    }

    // Summary
    console.log('\n🎉 Demo License Setup Complete!\n');
    console.log('📄 Demo Environment Ready:');
    console.log(`   Admin Email: ${adminUser.email}`);
    console.log(`   Admin Name: ${adminUser.name}`);
    console.log(`   Admin Role: ${adminUser.role}`);
    console.log(`   Store: ${defaultStore.name} (${defaultStore.code})`);
    console.log(`   License Key: ${license.licenseKey}`);
    console.log(`   License Type: ${license.type}`);
    console.log(`   Max Users: ${license.maxUsers}`);
    console.log(`   Max Stores: ${license.maxStores}`);
    console.log(`   Activation Key: ${activation.activationKey}`);
    console.log(`   Domain: ${activation.domain}`);

    console.log('\n🔐 Login Credentials:');
    console.log(`   Admin: ${adminUser.email} / password`);
    console.log(`   Manager: manager@pos.com / password`);
    console.log(`   Staff: staff@pos.com / password`);
    console.log(`   URL: http://localhost:3000/login`);

    console.log('\n🎯 Demo Features:');
    console.log('   ✅ Lifetime license (never expires)');
    console.log('   ✅ Activated for localhost');
    console.log('   ✅ Up to 5 users');
    console.log('   ✅ Up to 3 stores');
    console.log('   ✅ Pre-configured admin, manager, and staff accounts');
    console.log('   ✅ Default store created');

    console.log('\n🚀 You can now start the development server and login!');
    console.log('   npm run dev');
    console.log('   # Then visit http://localhost:3000/login');

  } catch (error) {
    console.error('\n❌ Demo License Setup Failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  setupDemoLicense();
}

module.exports = { setupDemoLicense };