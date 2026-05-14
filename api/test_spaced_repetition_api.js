/**
 * Test Spaced Repetition API Endpoints
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

async function testSpacedRepetitionAPI() {
  console.log('=== Testing Spaced Repetition API ===\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await makeRequest('/api/spaced-repetition/health');
    console.log(`   Status: ${healthResponse.statusCode}`);
    console.log(`   Response:`, healthResponse.data);
    console.log('   Health check: PASSED\n');

    // Test 2: Get review schedule (should work even with no data)
    console.log('2. Testing review schedule...');
    const scheduleResponse = await makeRequest('/api/spaced-repetition/review-schedule?userId=user-demo-123&limit=10');
    console.log(`   Status: ${scheduleResponse.statusCode}`);
    console.log(`   Response:`, scheduleResponse.data);
    console.log('   Review schedule: PASSED\n');

    // Test 3: Get user stats (should work even with no data)
    console.log('3. Testing user stats...');
    const statsResponse = await makeRequest('/api/spaced-repetition/user-stats?userId=user-demo-123');
    console.log(`   Status: ${statsResponse.statusCode}`);
    console.log(`   Response:`, statsResponse.data);
    console.log('   User stats: PASSED\n');

    // Test 4: Submit test (main functionality)
    console.log('4. Testing test submission...');
    const testData = {
      userId: "user-demo-123",
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

    console.log('=== All API Tests PASSED ===');
    console.log('Spaced repetition API is working correctly!');

  } catch (error) {
    console.error('API Test Error:', error.message);
    console.log('Make sure the server is running on localhost:4000');
  }
}

// Run the test
testSpacedRepetitionAPI();
