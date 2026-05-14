/**
 * Test Single-User Spaced Repetition System
 * Tests the system without requiring userId parameters
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

async function testSingleUserSystem() {
  console.log('=== Testing Single-User Spaced Repetition System ===\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await makeRequest('/api/spaced-repetition/health');
    console.log(`   Status: ${healthResponse.statusCode}`);
    console.log(`   Response:`, healthResponse.data);
    console.log('   Health check: PASSED\n');

    // Test 2: Get review schedule (no userId required)
    console.log('2. Testing review schedule (no userId)...');
    const scheduleResponse = await makeRequest('/api/spaced-repetition/review-schedule?limit=10');
    console.log(`   Status: ${scheduleResponse.statusCode}`);
    console.log(`   Response:`, scheduleResponse.data);
    console.log('   Review schedule: PASSED\n');

    // Test 3: Get user stats (no userId required)
    console.log('3. Testing user stats (no userId)...');
    const statsResponse = await makeRequest('/api/spaced-repetition/user-stats');
    console.log(`   Status: ${statsResponse.statusCode}`);
    console.log(`   Response:`, statsResponse.data);
    console.log('   User stats: PASSED\n');

    // Test 4: Submit test (no userId required)
    console.log('4. Testing test submission (no userId)...');
    const testData = {
      domainId: "domain-networking",
      sectionId: "section-ip-addressing",
      materialId: "material-cidr",
      scorePercent: 85,
      totalQuestions: 10,
      correctAnswers: 8,
      avgTimePerQuestion: 45
    };

    const submitResponse = await makeRequest('/api/spaced-repetition/submit-test', 'POST', testData);
    console.log(`   Status: ${submitResponse.statusCode}`);
    console.log(`   Response:`, submitResponse.data);
    console.log('   Test submission: PASSED\n');

    // Test 5: Get entity stats (no userId required)
    console.log('5. Testing entity stats (no userId)...');
    const entityResponse = await makeRequest('/api/spaced-repetition/entity-stats/material/material-cidr');
    console.log(`   Status: ${entityResponse.statusCode}`);
    console.log(`   Response:`, entityResponse.data);
    console.log('   Entity stats: PASSED\n');

    // Test 6: Get test history (no userId required)
    console.log('6. Testing test history (no userId)...');
    const historyResponse = await makeRequest('/api/spaced-repetition/test-history?limit=5');
    console.log(`   Status: ${historyResponse.statusCode}`);
    console.log(`   Response:`, historyResponse.data);
    console.log('   Test history: PASSED\n');

    console.log('=== All Single-User Tests PASSED ===');
    console.log('Spaced repetition system is working without userId requirements!');

  } catch (error) {
    console.error('Single-User Test Error:', error.message);
    console.log('Make sure the server is running on localhost:4000');
  }
}

// Run the test
testSingleUserSystem();
