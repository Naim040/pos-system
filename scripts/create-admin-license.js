#!/usr/bin/env node

/**
 * Admin License Creation Script
 * This script creates licenses for admin users and sets up the system properly
 * 
 * Usage:
 * node scripts/create-admin-license.js
 * 
 * Options:
 * --type <type>           License type: lifetime, monthly, yearly (default: lifetime)
 * --email <email>         Admin email (default: admin@pos.com)
 * --name <name>           Admin name (default: Admin User)
 * --max-users <count>     Maximum users (default: 10)
 * --max-stores <count>    Maximum stores (default: 5)
 * --activate              Automatically activate the license
 * --domain <domain>       Domain for activation (default: localhost)
 * --demo                  Create demo license with predefined settings
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Helper function to generate license keys
function generateLicenseKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) result += '-';
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper function to generate activation key
function generateActivationKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    if (i > 0 && i % 8 === 0) result += '-';
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    type: 'lifetime',
    email: 'admin@pos.com',
    name: 'Admin User',
    maxUsers: 10,
    maxStores: 5,
    activate: false,
    domain: 'localhost',
    demo: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--type':
        options.type = args[i + 1];
        i++;
        break;
      case '--email':
        options.email = args[i + 1];
        i++;
        break;
      case '--name':
        options.name = args[i + 1];
        i++;
        break;
      case '--max-users':
        options.maxUsers = parseInt(args[i + 1]);
        i++;
        break;
      case '--max-stores':
        options.maxStores = parseInt(args[i + 1]);
        i++;
        break;
      case '--activate':
        options.activate = true;
        break;
      case '--domain':
        options.domain = args[i + 1];
        i++;
        break;
      case '--demo':
        options.demo = true;
        options.type = 'lifetime';
        options.email = 'admin@pos.com';
        options.name = 'Demo Admin';
        options.maxUsers = 5;
        options.maxStores = 3;
        options.activate = true;
        break;
    }
  }

  return options;
}

// Create or update admin user
async function createOrUpdateAdminUser(email, name, role = 'admin') {
  try {
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          name,
          role,
          status: 'active'
        }
      });
      console.log(`✅ Created admin user: ${email}`);
    } else {
      // Update existing user
      user = await prisma.user.update({
        where: { email },
        data: {
          name,
          role,
          status: 'active'
        }
      });
      console.log(`✅ Updated admin user: ${email}`);
    }

    return user;
  } catch (error) {
    console.error('❌ Error creating/updating admin user:', error);
    throw error;
  }
}

// Create license
async function createLicense(options) {
  try {
    // Calculate expiration date for non-lifetime licenses
    let expiresAt = null;
    if (options.type === 'monthly') {
      expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else if (options.type === 'yearly') {
      expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }

    const licenseKey = generateLicenseKey();

    const license = await prisma.license.create({
      data: {
        licenseKey,
        type: options.type,
        clientId: options.email, // Use email as client ID
        clientName: options.name,
        clientEmail: options.email,
        maxUsers: options.maxUsers,
        maxStores: options.maxStores,
        expiresAt,
        status: 'active',
        allowedDomains: JSON.stringify([options.domain, 'localhost']),
        maxActivations: options.demo ? 5 : 3,
        createdBy: 'system' // System created license
      }
    });

    console.log(`✅ Created ${options.type} license:`);
    console.log(`   License Key: ${licenseKey}`);
    console.log(`   Client: ${options.name} (${options.email})`);
    console.log(`   Max Users: ${options.maxUsers}`);
    console.log(`   Max Stores: ${options.maxStores}`);
    console.log(`   Expires: ${expiresAt ? expiresAt.toISOString() : 'Never'}`);
    console.log(`   Max Activations: ${options.demo ? 5 : 3}`);

    return license;
  } catch (error) {
    console.error('❌ Error creating license:', error);
    throw error;
  }
}

// Activate license
async function activateLicense(license, domain = 'localhost') {
  try {
    const activationKey = generateActivationKey();

    const activation = await prisma.licenseActivation.create({
      data: {
        activationKey,
        licenseId: license.id,
        domain,
        hardwareId: 'DEMO-HARDWARE-ID',
        ipAddress: '127.0.0.1',
        isActive: true,
        activatedAt: new Date()
      }
    });

    // Update license activation count
    await prisma.license.update({
      where: { id: license.id },
      data: {
        activationCount: license.activationCount + 1,
        lastActivatedAt: new Date()
      }
    });

    console.log(`✅ License activated:`);
    console.log(`   Activation Key: ${activationKey}`);
    console.log(`   Domain: ${domain}`);
    console.log(`   Hardware ID: DEMO-HARDWARE-ID`);

    return activation;
  } catch (error) {
    console.error('❌ Error activating license:', error);
    throw error;
  }
}

// Create default store
async function createDefaultStore() {
  try {
    let store = await prisma.store.findFirst({
      where: { code: 'MAIN' }
    });

    if (!store) {
      store = await prisma.store.create({
        data: {
          name: 'Main Store',
          code: 'MAIN',
          address: '123 Main Street',
          city: 'Demo City',
          state: 'Demo State',
          country: 'Demo Country',
          phone: '+1-555-0123',
          email: 'store@demo.com',
          currency: 'USD',
          isActive: true,
          isHeadquarters: true
        }
      });
      console.log(`✅ Created default store: ${store.name}`);
    } else {
      console.log(`✅ Default store already exists: ${store.name}`);
    }

    return store;
  } catch (error) {
    console.error('❌ Error creating default store:', error);
    throw error;
  }
}

// Link admin user to store
async function linkUserToStore(user, store, role = 'admin') {
  try {
    let userStore = await prisma.userStore.findUnique({
      where: {
        userId_storeId: {
          userId: user.id,
          storeId: store.id
        }
      }
    });

    if (!userStore) {
      userStore = await prisma.userStore.create({
        data: {
          userId: user.id,
          storeId: store.id,
          role,
          isActive: true
        }
      });
      console.log(`✅ Linked user ${user.email} to store ${store.name} with role ${role}`);
    } else {
      console.log(`✅ User ${user.email} already linked to store ${store.name}`);
    }

    return userStore;
  } catch (error) {
    console.error('❌ Error linking user to store:', error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    console.log('🚀 Starting Admin License Creation...\n');

    const options = parseArgs();

    if (options.demo) {
      console.log('📋 Demo Mode - Creating demo license with predefined settings\n');
    } else {
      console.log('📋 Configuration:');
      console.log(`   Type: ${options.type}`);
      console.log(`   Email: ${options.email}`);
      console.log(`   Name: ${options.name}`);
      console.log(`   Max Users: ${options.maxUsers}`);
      console.log(`   Max Stores: ${options.maxStores}`);
      console.log(`   Auto-activate: ${options.activate}`);
      console.log(`   Domain: ${options.domain}\n`);
    }

    // Step 1: Create or update admin user
    console.log('Step 1: Creating/Updating admin user...');
    const adminUser = await createOrUpdateAdminUser(options.email, options.name, 'admin');

    // Step 2: Create default store
    console.log('\nStep 2: Creating default store...');
    const defaultStore = await createDefaultStore();

    // Step 3: Link admin user to store
    console.log('\nStep 3: Linking admin user to store...');
    await linkUserToStore(adminUser, defaultStore, 'admin');

    // Step 4: Create license
    console.log('\nStep 4: Creating license...');
    const license = await createLicense(options);

    // Step 5: Activate license if requested
    let activation = null;
    if (options.activate) {
      console.log('\nStep 5: Activating license...');
      activation = await activateLicense(license, options.domain);
    }

    // Summary
    console.log('\n🎉 Admin License Creation Complete!\n');
    console.log('📄 Summary:');
    console.log(`   Admin Email: ${adminUser.email}`);
    console.log(`   Admin Name: ${adminUser.name}`);
    console.log(`   Admin Role: ${adminUser.role}`);
    console.log(`   Store: ${defaultStore.name} (${defaultStore.code})`);
    console.log(`   License Key: ${license.licenseKey}`);
    console.log(`   License Type: ${license.type}`);
    console.log(`   Max Users: ${license.maxUsers}`);
    console.log(`   Max Stores: ${license.maxStores}`);
    
    if (activation) {
      console.log(`   Activation Key: ${activation.activationKey}`);
      console.log(`   Domain: ${activation.domain}`);
    }

    console.log('\n🔐 Login Credentials:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Password: password`);
    console.log(`   URL: http://localhost:3000/login`);

    if (options.demo) {
      console.log('\n🎯 Demo Setup Complete!');
      console.log('   You can now login with the credentials above.');
      console.log('   The license is already activated for localhost.');
    }

  } catch (error) {
    console.error('\n❌ Admin License Creation Failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  generateLicenseKey,
  generateActivationKey,
  createLicense,
  activateLicense,
  createOrUpdateAdminUser,
  createDefaultStore,
  linkUserToStore
};