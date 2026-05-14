/**
 * Debug Test Submission
 * Test individual components to find the issue
 */

const http = require('http');

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            data: body ? JSON.parse(body) : null
          };
          resolve(result);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function debugTestSubmission() {
  console.log('=== DEBUGGING TEST SUBMISSION ===\n');

  try {
    // Test 1: Simple test submission
    console.log('1. Testing simple test submission...');
    const testData = {
      vaultId: 'debug-test-123',
      scorePercent: 75,
      totalQuestions: 10,
      correctAnswers: 7,
      avgTimePerQuestion: 45
    };

    const response = await makeRequest('/api/vault-learning/submit-test', 'POST', testData);
    console.log(`   Status Code: ${response.statusCode}`);
    console.log(`   Response:`, response.data);
    
    if (response.data?.success) {
      console.log('   SUCCESS: Test submission working');
    } else {
      console.log('   FAILED: Test submission failed');
      console.log(`   Error: ${response.data?.error || 'Unknown error'}`);
      console.log(`   Details: ${response.data?.details || 'No details'}`);
    }

    // Test 2: Test with minimal data
    console.log('\n2. Testing minimal data submission...');
    const minimalData = {
      vaultId: 'debug-minimal-456',
      scorePercent: 50,
      totalQuestions: 5,
      correctAnswers: 2
    };

    const minimalResponse = await makeRequest('/api/vault-learning/submit-test', 'POST', minimalData);
    console.log(`   Status Code: ${minimalResponse.statusCode}`);
    console.log(`   Response:`, minimalResponse.data);

    // Test 3: Test with invalid data to see validation
    console.log('\n3. Testing invalid data...');
    const invalidData = {
      vaultId: 'debug-invalid-789',
      scorePercent: 150, // Invalid score
      totalQuestions: 10,
      correctAnswers: 12 // More correct than total
    };

    const invalidResponse = await makeRequest('/api/vault-learning/submit-test', 'POST', invalidData);
    console.log(`   Status Code: ${invalidResponse.statusCode}`);
    console.log(`   Response:`, invalidResponse.data);

    // Test 4: Test with missing required fields
    console.log('\n4. Testing missing required fields...');
    const missingData = {
      vaultId: 'debug-missing-999'
      // Missing scorePercent, totalQuestions, correctAnswers
    };

    const missingResponse = await makeRequest('/api/vault-learning/submit-test', 'POST', missingData);
    console.log(`   Status Code: ${missingResponse.statusCode}`);
    console.log(`   Response:`, missingResponse.data);

    console.log('\n=== DEBUG COMPLETE ===');

  } catch (error) {
    console.error('Debug failed:', error.message);
  }
}

// Run debug
debugTestSubmission();
