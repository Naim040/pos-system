#!/usr/bin/env node

const http = require('http');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TIMEOUT = 30000; // 30 seconds

console.log('🚀 Starting POS System Smoke Test...');
console.log(`📍 Base URL: ${BASE_URL}`);
console.log(`⏱️  Timeout: ${TIMEOUT}ms`);
console.log('');

const tests = [
  {
    name: 'Health Check',
    path: '/api/health',
    expectedStatus: 200,
    description: 'Basic health endpoint should return 200'
  },
  {
    name: 'Root Page',
    path: '/',
    expectedStatus: 200,
    description: 'Main page should load successfully'
  },
  {
    name: 'Login Page',
    path: '/login',
    expectedStatus: 200,
    description: 'Login page should be accessible'
  },
  {
    name: 'Public Settings',
    path: '/api/settings/public',
    expectedStatus: 200,
    description: 'Public settings API should be accessible'
  }
];

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(TIMEOUT, () => {
      req.destroy();
      reject(new Error(`Request timeout after ${TIMEOUT}ms`));
    });

    req.end();
  });
}

async function runTest(test) {
  const url = new URL(test.path, BASE_URL);
  
  try {
    console.log(`🔍 Testing: ${test.name}`);
    console.log(`   ${test.description}`);
    console.log(`   URL: ${url}`);
    
    const response = await makeRequest(url);
    
    if (response.status === test.expectedStatus) {
      console.log(`   ✅ PASS - Status: ${response.status}`);
      
      if (test.path.includes('/api/')) {
        try {
          const data = JSON.parse(response.data);
          console.log(`   📦 Response: ${JSON.stringify(data).substring(0, 100)}...`);
        } catch (e) {
          console.log(`   📄 Response: ${response.data.substring(0, 100)}...`);
        }
      }
      
      console.log('');
      return true;
    } else {
      console.log(`   ❌ FAIL - Expected ${test.expectedStatus}, got ${response.status}`);
      console.log(`   📄 Response: ${response.data.substring(0, 200)}...`);
      console.log('');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ FAIL - Error: ${error.message}`);
    console.log('');
    return false;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await runTest(test);
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log('='.repeat(60));
  console.log('📊 Test Results:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
  console.log('');
  
  if (failed === 0) {
    console.log('🎉 All tests passed! The application is ready for deployment.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please check the application before deploying.');
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

main();