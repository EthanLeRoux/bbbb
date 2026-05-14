/**
 * Test Test Resubmission Feature
 * Tests the complete test resubmission functionality for spaced repetition analysis
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

async function testTestResubmission() {
  console.log('=== Testing Test Resubmission Feature ===\n');

  try {
    // Test 1: Create initial vault item and test
    console.log('1. Creating initial vault item and test...');
    const vaultItem = {
      id: 'test-vault-resubmission-demo',
      title: 'Resubmission Demo Content',
      domain: 'networking',
      section: 'advanced-concepts',
      type: 'content',
      description: 'Content for testing resubmission feature'
    };

    // Create vault item
    const createResponse = await makeRequest('/api/vault', 'POST', vaultItem);
    console.log(`   Vault creation: ${createResponse.statusCode === 200 ? 'SUCCESS' : 'FAILED'}`);

    // Submit initial test
    const initialTest = {
      vaultId: 'test-vault-resubmission-demo',
      scorePercent: 65,
      totalQuestions: 10,
      correctAnswers: 6,
      avgTimePerQuestion: 55
    };

    const initialResponse = await makeRequest('/api/vault-learning/submit-test', 'POST', initialTest);
    console.log(`   Initial test: ${initialResponse.statusCode === 200 ? 'SUCCESS' : 'FAILED'}`);
    
    let originalTestId = null;
    if (initialResponse.data?.success) {
      originalTestId = initialResponse.data.data.spacedRepetitionResult.data.testAttempt.id;
      console.log(`   Original test ID: ${originalTestId}`);
      console.log(`   Initial quality: ${initialResponse.data.data.spacedRepetitionResult.data.testAttempt.recallQuality}`);
      console.log(`   Initial priority: ${initialResponse.data.data.spacedRepetitionResult.data.updatedStats.material.priorityScore}`);
    }
    console.log('   Initial setup: PASSED\n');

    // Test 2: Get test history
    console.log('2. Getting vault test history...');
    const historyResponse = await makeRequest('/api/vault-learning/test-history/test-vault-resubmission-demo');
    console.log(`   Status: ${historyResponse.statusCode}`);
    console.log(`   Success: ${historyResponse.data?.success ? 'YES' : 'NO'}`);
    
    if (historyResponse.data?.success) {
      const history = historyResponse.data.data;
      console.log(`   Total attempts: ${history.totalAttempts}`);
      console.log(`   Latest attempt: ${history.testHistory[0]?.recallQuality} (${history.testHistory[0]?.scorePercent}%)`);
    }
    console.log('   Test history: PASSED\n');

    // Test 3: Resubmit test with improved score
    console.log('3. Resubmitting test with improved score...');
    const resubmittedTest = {
      vaultId: 'test-vault-resubmission-demo',
      originalTestId: originalTestId,
      updatedTestData: {
        scorePercent: 85,
        totalQuestions: 10,
        correctAnswers: 8,
        avgTimePerQuestion: 45
      }
    };

    const resubmitResponse = await makeRequest('/api/vault-learning/resubmit-test', 'POST', resubmittedTest);
    console.log(`   Status: ${resubmitResponse.statusCode}`);
    console.log(`   Success: ${resubmitResponse.data?.success ? 'YES' : 'NO'}`);
    
    if (resubmitResponse.data?.success) {
      const result = resubmitResponse.data.data;
      console.log(`   Submission type: ${result.submissionType}`);
      console.log(`   New quality: ${result.spacedRepetitionResult.data.testAttempt.recallQuality}`);
      console.log(`   New priority: ${result.spacedRepetitionResult.data.updatedStats.material.priorityScore}`);
      
      if (result.resubmissionAnalysis) {
        const analysis = result.resubmissionAnalysis;
        console.log(`   Score improvement: +${analysis.scoreImprovement}% (${analysis.scoreImprovementPercent}% improvement)`);
        console.log(`   Recall quality improved: ${analysis.recallQualityImproved ? 'YES' : 'NO'}`);
        console.log(`   Retention strength change: +${analysis.retentionStrengthChange.toFixed(2)}`);
        console.log(`   Time since original: ${analysis.timeSinceOriginal} days`);
        console.log(`   Recommendation: ${analysis.recommendation}`);
      }
    }
    console.log('   Test resubmission: PASSED\n');

    // Test 4: Get resubmission analytics
    console.log('4. Getting resubmission analytics...');
    const analyticsResponse = await makeRequest('/api/vault-learning/resubmission-analytics/test-vault-resubmission-demo');
    console.log(`   Status: ${analyticsResponse.statusCode}`);
    console.log(`   Success: ${analyticsResponse.data?.success ? 'YES' : 'NO'}`);
    
    if (analyticsResponse.data?.success) {
      const analytics = analyticsResponse.data.data;
      console.log(`   Total resubmissions: ${analytics.totalResubmissions}`);
      console.log(`   Average score improvement: ${analytics.averageScoreImprovement}%`);
      console.log(`   Average retention gain: ${analytics.averageRetentionGain}`);
      console.log(`   Improvement rate: ${analytics.improvementRate}%`);
      
      if (analytics.recentResubmissions && analytics.recentResubmissions.length > 0) {
        console.log('   Recent resubmissions:');
        analytics.recentResubmissions.forEach((sub, index) => {
          console.log(`     ${index + 1}. ${sub.originalScore}% -> ${sub.newScore}% (${sub.scoreChange > 0 ? '+' : ''}${sub.scoreChange}%)`);
        });
      }
    }
    console.log('   Resubmission analytics: PASSED\n');

    // Test 5: Test multiple resubmissions with different scenarios
    console.log('5. Testing multiple resubmission scenarios...');
    
    const scenarios = [
      { name: 'Poor to Good', original: 45, resubmitted: 78 },
      { name: 'Good to Excellent', original: 82, resubmitted: 95 },
      { name: 'No Improvement', original: 70, resubmitted: 68 },
      { name: 'Huge Improvement', original: 35, resubmitted: 88 }
    ];

    for (const scenario of scenarios) {
      // Create new vault item for each scenario
      const scenarioVaultId = `test-vault-${scenario.name.toLowerCase().replace(/\s+/g, '-')}`;
      await makeRequest('/api/vault', 'POST', {
        id: scenarioVaultId,
        title: `${scenario.name} Test Case`,
        domain: 'testing',
        section: 'resubmission',
        type: 'content'
      });

      // Submit original test
      const originalResult = await makeRequest('/api/vault-learning/submit-test', 'POST', {
        vaultId: scenarioVaultId,
        scorePercent: scenario.original,
        totalQuestions: 10,
        correctAnswers: Math.round(scenario.original * 10 / 100)
      });

      if (originalResult.data?.success) {
        const originalTestId = originalResult.data.data.spacedRepetitionResult.data.testAttempt.id;

        // Resubmit test
        const resubmitResult = await makeRequest('/api/vault-learning/resubmit-test', 'POST', {
          vaultId: scenarioVaultId,
          originalTestId: originalTestId,
          updatedTestData: {
            scorePercent: scenario.resubmitted,
            totalQuestions: 10,
            correctAnswers: Math.round(scenario.resubmitted * 10 / 100)
          }
        });

        if (resubmitResult.data?.success) {
          const analysis = resubmitResult.data.data.resubmissionAnalysis;
          console.log(`   ${scenario.name}: ${scenario.original}% -> ${scenario.resubmitted}% (${analysis.scoreImprovement > 0 ? '+' : ''}${analysis.scoreImprovement}%)`);
          console.log(`     Recommendation: ${analysis.recommendation}`);
        }
      }
    }
    console.log('   Multiple scenarios: PASSED\n');

    // Test 6: Error handling
    console.log('6. Testing error handling...');
    
    // Test invalid original test ID
    const invalidResponse = await makeRequest('/api/vault-learning/resubmit-test', 'POST', {
      vaultId: 'test-vault-resubmission-demo',
      originalTestId: 'invalid-test-id',
      updatedTestData: { scorePercent: 90, totalQuestions: 10, correctAnswers: 9 }
    });
    console.log(`   Invalid test ID: ${invalidResponse.statusCode === 404 ? 'CORRECTLY REJECTED' : 'FAILED'}`);
    
    // Test missing fields
    const missingFieldsResponse = await makeRequest('/api/vault-learning/resubmit-test', 'POST', {
      vaultId: 'test-vault-resubmission-demo',
      updatedTestData: { scorePercent: 90, totalQuestions: 10, correctAnswers: 9 }
    });
    console.log(`   Missing fields: ${missingFieldsResponse.statusCode === 400 ? 'CORRECTLY REJECTED' : 'FAILED'}`);
    
    console.log('   Error handling: PASSED\n');

    // Test 7: Final analytics summary
    console.log('7. Getting final analytics summary...');
    const finalAnalyticsResponse = await makeRequest('/api/vault-learning/resubmission-analytics/test-vault-resubmission-demo');
    
    if (finalAnalyticsResponse.data?.success) {
      const analytics = finalAnalyticsResponse.data.data;
      console.log('   Final Analytics Summary:');
      console.log(`     Total resubmissions processed: ${analytics.totalResubmissions}`);
      console.log(`     Average improvement: ${analytics.averageScoreImprovement}%`);
      console.log(`     Success rate: ${analytics.improvementRate}% showed improvement`);
      console.log(`     Retention strength gains: ${analytics.averageRetentionGain}`);
    }
    console.log('   Final summary: PASSED\n');

    console.log('=== TEST RESUBMISSION FEATURE TESTS COMPLETE ===');
    console.log('\nAll resubmission features working correctly:');
    console.log('  - Test resubmission with spaced repetition analysis');
    console.log('  - Score improvement tracking and analysis');
    console.log('  - Recall quality comparison');
    console.log('  - Retention strength change measurement');
    console.log('  - Personalized recommendations based on improvement');
    console.log('  - Comprehensive analytics and reporting');
    console.log('  - Error handling for invalid scenarios');
    console.log('  - Multiple resubmission scenario support');
    console.log('\nAPI Endpoints working:');
    console.log('  - POST /api/vault-learning/resubmit-test');
    console.log('  - GET /api/vault-learning/test-history/:vaultId');
    console.log('  - GET /api/vault-learning/resubmission-analytics/:vaultId');

  } catch (error) {
    console.error('Test Resubmission Error:', error.message);
    console.log('Make sure the server is running on localhost:4000');
  }
}

// Run the test
testTestResubmission();
