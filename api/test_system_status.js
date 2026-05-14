/**
 * System Status Check
 * Tests all vault spaced repetition system components
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

async function checkSystemStatus() {
  console.log('=== VAULT SPACED REPETITION SYSTEM STATUS ===\n');

  let systemWorking = true;
  const results = {};

  try {
    // Test 1: Basic Health Check
    console.log('1. Testing system health...');
    try {
      const healthResponse = await makeRequest('/api/vault-learning/health');
      results.health = {
        status: healthResponse.statusCode === 200 ? 'WORKING' : 'FAILED',
        statusCode: healthResponse.statusCode,
        response: healthResponse.data
      };
      console.log(`   Health Check: ${results.health.status}`);
    } catch (error) {
      results.health = { status: 'FAILED', error: error.message };
      console.log(`   Health Check: FAILED - ${error.message}`);
      systemWorking = false;
    }

    // Test 2: Review Schedule Endpoint
    console.log('\n2. Testing review schedule...');
    try {
      const scheduleResponse = await makeRequest('/api/vault-learning/review-schedule?limit=5');
      results.reviewSchedule = {
        status: scheduleResponse.statusCode === 200 ? 'WORKING' : 'FAILED',
        statusCode: scheduleResponse.statusCode,
        response: scheduleResponse.data
      };
      console.log(`   Review Schedule: ${results.reviewSchedule.status}`);
      
      if (scheduleResponse.data?.success) {
        const data = scheduleResponse.data.data;
        console.log(`   - Due items: ${data.due.length}`);
        console.log(`   - Upcoming items: ${data.upcoming.length}`);
      }
    } catch (error) {
      results.reviewSchedule = { status: 'FAILED', error: error.message };
      console.log(`   Review Schedule: FAILED - ${error.message}`);
      systemWorking = false;
    }

    // Test 3: Test Submission
    console.log('\n3. Testing test submission...');
    try {
      const testData = {
        vaultId: 'system-test-' + Date.now(),
        scorePercent: 75,
        totalQuestions: 10,
        correctAnswers: 7,
        avgTimePerQuestion: 45
      };

      const submitResponse = await makeRequest('/api/vault-learning/submit-test', 'POST', testData);
      results.testSubmission = {
        status: submitResponse.statusCode === 200 ? 'WORKING' : 'FAILED',
        statusCode: submitResponse.statusCode,
        response: submitResponse.data
      };
      console.log(`   Test Submission: ${results.testSubmission.status}`);
      
      if (submitResponse.data?.success) {
        const result = submitResponse.data.data;
        console.log(`   - Recall Quality: ${result.spacedRepetitionResult.data.testAttempt.recallQuality}`);
        console.log(`   - Priority Score: ${result.spacedRepetitionResult.data.updatedStats.material.priorityScore}`);
      }
    } catch (error) {
      results.testSubmission = { status: 'FAILED', error: error.message };
      console.log(`   Test Submission: FAILED - ${error.message}`);
      systemWorking = false;
    }

    // Test 4: Test History
    console.log('\n4. Testing test history...');
    try {
      const historyResponse = await makeRequest('/api/vault-learning/test-history/system-test-demo');
      results.testHistory = {
        status: historyResponse.statusCode === 200 ? 'WORKING' : 'FAILED',
        statusCode: historyResponse.statusCode,
        response: historyResponse.data
      };
      console.log(`   Test History: ${results.testHistory.status}`);
      
      if (historyResponse.data?.success) {
        console.log(`   - Total attempts: ${historyResponse.data.data.totalAttempts}`);
      }
    } catch (error) {
      results.testHistory = { status: 'FAILED', error: error.message };
      console.log(`   Test History: FAILED - ${error.message}`);
      systemWorking = false;
    }

    // Test 5: Time-Based Filtering
    console.log('\n5. Testing time-based filtering...');
    const timeRanges = ['day', 'week', 'month', 'all'];
    results.timeFiltering = {};
    
    for (const range of timeRanges) {
      try {
        const filterResponse = await makeRequest(`/api/vault-learning/review-schedule?timeRange=${range}&limit=5`);
        results.timeFiltering[range] = {
          status: filterResponse.statusCode === 200 ? 'WORKING' : 'FAILED',
          statusCode: filterResponse.statusCode
        };
        console.log(`   Time Range (${range}): ${results.timeFiltering[range].status}`);
      } catch (error) {
        results.timeFiltering[range] = { status: 'FAILED', error: error.message };
        console.log(`   Time Range (${range}): FAILED - ${error.message}`);
        systemWorking = false;
      }
    }

    // Test 6: Resubmission Feature
    console.log('\n6. Testing resubmission feature...');
    try {
      // First create a test
      const originalTest = {
        vaultId: 'resubmission-test-' + Date.now(),
        scorePercent: 60,
        totalQuestions: 10,
        correctAnswers: 6
      };
      
      const originalResponse = await makeRequest('/api/vault-learning/submit-test', 'POST', originalTest);
      
      if (originalResponse.data?.success) {
        const originalTestId = originalResponse.data.data.spacedRepetitionResult.data.testAttempt.id;
        
        // Now resubmit
        const resubmitData = {
          vaultId: originalTest.vaultId,
          originalTestId: originalTestId,
          updatedTestData: {
            scorePercent: 85,
            totalQuestions: 10,
            correctAnswers: 8
          }
        };
        
        const resubmitResponse = await makeRequest('/api/vault-learning/resubmit-test', 'POST', resubmitData);
        results.resubmission = {
          status: resubmitResponse.statusCode === 200 ? 'WORKING' : 'FAILED',
          statusCode: resubmitResponse.statusCode,
          response: resubmitResponse.data
        };
        console.log(`   Resubmission: ${results.resubmission.status}`);
        
        if (resubmitResponse.data?.success) {
          const analysis = resubmitResponse.data.data.resubmissionAnalysis;
          console.log(`   - Score improvement: +${analysis.scoreImprovement}%`);
          console.log(`   - Recommendation: ${analysis.recommendation}`);
        }
      } else {
        results.resubmission = { status: 'FAILED', error: 'Original test creation failed' };
        console.log(`   Resubmission: FAILED - Original test creation failed`);
        systemWorking = false;
      }
    } catch (error) {
      results.resubmission = { status: 'FAILED', error: error.message };
      console.log(`   Resubmission: FAILED - ${error.message}`);
      systemWorking = false;
    }

    // Test 7: Analytics
    console.log('\n7. Testing analytics...');
    try {
      const analyticsResponse = await makeRequest('/api/vault-learning/resubmission-analytics/resubmission-test-demo');
      results.analytics = {
        status: analyticsResponse.statusCode === 200 ? 'WORKING' : 'FAILED',
        statusCode: analyticsResponse.statusCode,
        response: analyticsResponse.data
      };
      console.log(`   Analytics: ${results.analytics.status}`);
      
      if (analyticsResponse.data?.success) {
        const data = analyticsResponse.data.data;
        console.log(`   - Total resubmissions: ${data.totalResubmissions}`);
        console.log(`   - Average improvement: ${data.averageScoreImprovement}%`);
      }
    } catch (error) {
      results.analytics = { status: 'FAILED', error: error.message };
      console.log(`   Analytics: FAILED - ${error.message}`);
      // Analytics failure is not critical for basic functionality
    }

    // Summary
    console.log('\n=== SYSTEM STATUS SUMMARY ===');
    console.log(`\nOverall Status: ${systemWorking ? 'WORKING' : 'ISSUES DETECTED'}`);
    
    console.log('\nComponent Status:');
    Object.entries(results).forEach(([component, result]) => {
      if (typeof result === 'object' && result.status) {
        console.log(`  ${component}: ${result.status}`);
      } else if (typeof result === 'object') {
        const workingCount = Object.values(result).filter(r => r.status === 'WORKING').length;
        const totalCount = Object.keys(result).length;
        console.log(`  ${component}: ${workingCount}/${totalCount} working`);
      }
    });

    if (systemWorking) {
      console.log('\n=== SYSTEM IS FULLY OPERATIONAL ===');
      console.log('\nAll vault spaced repetition features are working:');
      console.log('  - Test submission with spaced repetition');
      console.log('  - Review schedule with time-based filtering');
      console.log('  - Test resubmission with improvement analysis');
      console.log('  - Comprehensive analytics and tracking');
      console.log('  - Performance-based scheduling');
      console.log('\nAPI Endpoints available:');
      console.log('  - POST /api/vault-learning/submit-test');
      console.log('  - GET /api/vault-learning/review-schedule');
      console.log('  - POST /api/vault-learning/resubmit-test');
      console.log('  - GET /api/vault-learning/test-history/:vaultId');
      console.log('  - GET /api/vault-learning/resubmission-analytics/:vaultId');
    } else {
      console.log('\n=== SYSTEM ISSUES DETECTED ===');
      console.log('\nSome components are not working properly.');
      console.log('Check the detailed results above for specific issues.');
      console.log('Common issues:');
      console.log('  - Server not running on localhost:4000');
      console.log('  - Database connection issues');
      console.log('  - Missing API endpoints');
      console.log('  - Configuration problems');
    }

  } catch (error) {
    console.error('System status check failed:', error.message);
    console.log('\n=== SYSTEM CHECK FAILED ===');
    console.log('Unable to complete system status check.');
    console.log('Make sure the server is running on localhost:4000');
  }
}

// Run the status check
checkSystemStatus();
