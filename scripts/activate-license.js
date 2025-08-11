#!/usr/bin/env node

/**
 * License Activation Utility
 * This script activates licenses for specific domains and systems
 * 
 * Usage:
 * node scripts/activate-license.js --license-key <key> --email <email> --domain <domain>
 * 
 * Options:
 * --license-key <key>   License key to activate
 * --email <email>        Email associated with the license
 * --domain <domain>      Domain to activate for (default: localhost)
 * --hardware-id <id>     Hardware ID for binding (default: DEMO-HARDWARE-ID)
 * --list                 List all available licenses
 * --activate-demo        Activate the demo license
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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
    licenseKey: '',
    email: '',
    domain: 'localhost',
    hardwareId: 'DEMO-HARDWARE-ID',
    list: false,
    activateDemo: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--license-key':
        options.licenseKey = args[i + 1];
        i++;
        break;
      case '--email':
        options.email = args[i + 1];
        i++;
        break;
      case '--domain':
        options.domain = args[i + 1];
        i++;
        break;
      case '--hardware-id':
        options.hardwareId = args[i + 1];
        i++;
        break;
      case '--list':
        options.list = true;
        break;
      case '--activate-demo':
        options.activateDemo = true;
        options.licenseKey = '';
        options.email = 'admin@pos.com';
        options.domain = 'localhost';
        break;
    }
  }

  return options;
}

// List all available licenses
async function listLicenses() {
  try {
    const licenses = await prisma.license.findMany({
      include: {
        activations: {
          where: { isActive: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('📋 Available Licenses:\n');

    if (licenses.length === 0) {
      console.log('No licenses found.');
      return;
    }

    licenses.forEach((license, index) => {
      console.log(`${index + 1}. License Key: ${license.licenseKey}`);
      console.log(`   Type: ${license.type}`);
      console.log(`   Status: ${license.status}`);
      console.log(`   Client: ${license.clientName} (${license.clientEmail})`);
      console.log(`   Max Users: ${license.maxUsers}`);
      console.log(`   Max Stores: ${license.maxStores}`);
      console.log(`   Activations: ${license.activations.length}/${license.maxActivations}`);
      console.log(`   Created: ${license.createdAt.toISOString()}`);
      console.log(`   Expires: ${license.expiresAt ? license.expiresAt.toISOString() : 'Never'}`);
      
      if (license.activations.length > 0) {
        console.log(`   Active Activations:`);
        license.activations.forEach((activation, actIndex) => {
          console.log(`     ${actIndex + 1}. Domain: ${activation.domain || 'N/A'}`);
          console.log(`        Hardware ID: ${activation.hardwareId || 'N/A'}`);
          console.log(`        Activated: ${activation.activatedAt.toISOString()}`);
        });
      }
      
      console.log('');
    });

    return licenses;
  } catch (error) {
    console.error('❌ Error listing licenses:', error);
    throw error;
  }
}

// Find demo license
async function findDemoLicense() {
  try {
    const demoLicense = await prisma.license.findFirst({
      where: {
        OR: [
          { clientEmail: 'admin@pos.com' },
          { licenseKey: { contains: 'DEMO' } }
        ],
        status: 'active'
      },
      include: {
        activations: {
          where: { isActive: true }
        }
      }
    });

    if (!demoLicense) {
      console.log('❌ No demo license found. Please create one first.');
      return null;
    }

    console.log('✅ Found demo license:');
    console.log(`   License Key: ${demoLicense.licenseKey}`);
    console.log(`   Client: ${demoLicense.clientName} (${demoLicense.clientEmail})`);
    console.log(`   Type: ${demoLicense.type}`);
    console.log(`   Status: ${demoLicense.status}`);

    return demoLicense;
  } catch (error) {
    console.error('❌ Error finding demo license:', error);
    throw error;
  }
}

// Activate license
async function activateLicense(licenseKey, email, domain, hardwareId) {
  try {
    // Find the license
    const license = await prisma.license.findUnique({
      where: { licenseKey },
      include: {
        activations: {
          where: { isActive: true }
        }
      }
    });

    if (!license) {
      console.log('❌ License key not found');
      return null;
    }

    // Check license status
    if (license.status !== 'active') {
      console.log(`❌ License is ${license.status}`);
      return null;
    }

    // Check expiration
    if (license.expiresAt && new Date() > new Date(license.expiresAt)) {
      console.log('❌ License has expired');
      return null;
    }

    // Check if client email matches
    if (license.clientEmail.toLowerCase() !== email.toLowerCase()) {
      console.log('❌ Client email does not match license record');
      return null;
    }

    // Check activation limits
    if (license.activations.length >= license.maxActivations) {
      console.log('❌ Maximum number of activations reached');
      return null;
    }

    // Check domain restrictions
    if (license.allowedDomains) {
      const allowedDomains = JSON.parse(license.allowedDomains);
      if (domain && !allowedDomains.includes(domain)) {
        console.log('❌ Domain not allowed for this license');
        return null;
      }
    }

    // Check hardware binding
    if (license.hardwareBinding) {
      const hardwareBinding = JSON.parse(license.hardwareBinding);
      if (hardwareBinding.hardwareId && hardwareId !== hardwareBinding.hardwareId) {
        console.log('❌ Hardware binding mismatch');
        return null;
      }
    }

    // Deactivate any existing activations for this system (if any)
    if (hardwareId) {
      const deactivatedCount = await prisma.licenseActivation.updateMany({
        where: {
          hardwareId,
          isActive: true
        },
        data: {
          isActive: false,
          deactivatedAt: new Date(),
          deactivationReason: 'New activation on same hardware'
        }
      });

      if (deactivatedCount.count > 0) {
        console.log(`🔄 Deactivated ${deactivatedCount.count} existing activation(s) for this hardware`);
      }
    }

    // Generate activation key
    const activationKey = generateActivationKey();

    // Create activation record
    const activation = await prisma.licenseActivation.create({
      data: {
        activationKey,
        licenseId: license.id,
        domain,
        hardwareId,
        ipAddress: '127.0.0.1',
        isActive: true,
        activatedAt: new Date()
      }
    });

    // Update license activation count and last activated timestamp
    await prisma.license.update({
      where: { id: license.id },
      data: {
        activationCount: license.activationCount + 1,
        lastActivatedAt: new Date()
      }
    });

    console.log('✅ License activated successfully:');
    console.log(`   License Key: ${license.licenseKey}`);
    console.log(`   Activation Key: ${activationKey}`);
    console.log(`   Domain: ${domain}`);
    console.log(`   Hardware ID: ${hardwareId}`);
    console.log(`   Activated At: ${activation.activatedAt.toISOString()}`);

    return activation;
  } catch (error) {
    console.error('❌ Error activating license:', error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    console.log('🔑 License Activation Utility\n');

    const options = parseArgs();

    if (options.list) {
      console.log('📋 Listing all available licenses...\n');
      await listLicenses();
      return;
    }

    if (options.activateDemo) {
      console.log('🎯 Activating demo license...\n');
      const demoLicense = await findDemoLicense();
      if (demoLicense) {
        await activateLicense(
          demoLicense.licenseKey,
          demoLicense.clientEmail,
          options.domain,
          options.hardwareId
        );
      }
      return;
    }

    if (!options.licenseKey || !options.email) {
      console.log('❌ License key and email are required');
      console.log('\nUsage:');
      console.log('  node scripts/activate-license.js --license-key <key> --email <email> --domain <domain>');
      console.log('  node scripts/activate-license.js --list');
      console.log('  node scripts/activate-license.js --activate-demo');
      console.log('\nOptions:');
      console.log('  --license-key <key>   License key to activate');
      console.log('  --email <email>        Email associated with the license');
      console.log('  --domain <domain>      Domain to activate for (default: localhost)');
      console.log('  --hardware-id <id>     Hardware ID for binding (default: DEMO-HARDWARE-ID)');
      console.log('  --list                 List all available licenses');
      console.log('  --activate-demo        Activate the demo license');
      return;
    }

    console.log('📋 Activation Configuration:');
    console.log(`   License Key: ${options.licenseKey}`);
    console.log(`   Email: ${options.email}`);
    console.log(`   Domain: ${options.domain}`);
    console.log(`   Hardware ID: ${options.hardwareId}\n`);

    await activateLicense(options.licenseKey, options.email, options.domain, options.hardwareId);

  } catch (error) {
    console.error('\n❌ License Activation Failed:', error);
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
  generateActivationKey,
  listLicenses,
  findDemoLicense,
  activateLicense
};