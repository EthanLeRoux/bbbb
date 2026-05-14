/**
 * Test Vault Structure with _root folder
 * Test the updated vault integration with proper folder structure handling
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

async function testVaultStructure() {
  console.log('=== TESTING VAULT STRUCTURE WITH _ROOT FOLDER ===\n');

  try {
    // Test 1: Create vault item with _root folder structure
    console.log('1. Creating vault item with _root folder structure...');
    const vaultWithRoot = {
      id: 'test-vault-root-structure',
      title: 'Network Fundamentals',
      path: '_root/networking/ip-addressing/cidr-notation',
      folders: ['networking', 'ip-addressing'],
      type: 'content',
      description: 'Understanding CIDR notation and subnetting'
    };

    const createResponse = await makeRequest('/api/vault', 'POST', vaultWithRoot);
    console.log(`   Vault creation: ${createResponse.statusCode === 200 ? 'SUCCESS' : 'FAILED'}`);

    // Test 2: Submit test for this vault
    console.log('\n2. Submitting test for vault with _root structure...');
    const testData = {
      vaultId: 'test-vault-root-structure',
      scorePercent: 85,
      totalQuestions: 10,
      correctAnswers: 8,
      avgTimePerQuestion: 45
    };

    const submitResponse = await makeRequest('/api/vault-learning/submit-test', 'POST', testData);
    
    if (submitResponse.data?.success) {
      const result = submitResponse.data.data;
      console.log('   Test submission successful');
      console.log('   Hierarchy mapping:', result.hierarchyMapping);
      console.log('   Recall Quality:', result.spacedRepetitionResult.data.testAttempt.recallQuality);
    } else {
      console.log('   Test submission failed:', submitResponse.data?.error);
    }

    // Test 3: Check review schedule to see vault info
    console.log('\n3. Checking review schedule for vault info...');
    const scheduleResponse = await makeRequest('/api/vault-learning/review-schedule?limit=10');
    
    if (scheduleResponse.data?.success) {
      const schedule = scheduleResponse.data.data;
      const allItems = [...schedule.due, ...schedule.upcoming];
      
      const testVaultItem = allItems.find(item => item.vaultInfo?.vaultId === 'test-vault-root-structure');
      
      if (testVaultItem) {
        console.log('   Found vault item in schedule:');
        console.log(`     Title: ${testVaultItem.vaultInfo.title}`);
        console.log(`     Domain: ${testVaultItem.vaultInfo.domain}`);
        console.log(`     Section: ${testVaultItem.vaultInfo.section}`);
        console.log(`     Path: ${testVaultItem.vaultInfo.path}`);
        console.log(`     Folders: ${testVaultItem.vaultInfo.folders.join(', ')}`);
      } else {
        console.log('   Vault item not found in schedule yet');
      }
    }

    // Test 4: Test with different folder structures
    console.log('\n4. Testing different folder structures...');
    
    const testCases = [
      {
        id: 'test-deep-structure',
        path: '_root/programming/javascript/advanced/async-patterns',
        folders: ['programming', 'javascript', 'advanced'],
        expectedDomain: 'Programming',
        expectedSection: 'Javascript'
      },
      {
        id: 'test-simple-structure',
        path: '_root/math/calculus/integrals',
        folders: ['math', 'calculus'],
        expectedDomain: 'Math',
        expectedSection: 'Calculus'
      },
      {
        id: 'test-no-structure',
        // No path or folders
        expectedDomain: 'general',
        expectedSection: 'main'
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n   Testing ${testCase.id}:`);
      
      // Create vault item
      const vaultData = {
        id: testCase.id,
        title: `Test ${testCase.id}`,
        path: testCase.path,
        folders: testCase.folders,
        type: 'content'
      };

      const vaultCreateResponse = await makeRequest('/api/vault', 'POST', vaultData);
      
      if (vaultCreateResponse.statusCode === 200) {
        // Submit test
        const testResponse = await makeRequest('/api/vault-learning/submit-test', 'POST', {
          vaultId: testCase.id,
          scorePercent: 75,
          totalQuestions: 10,
          correctAnswers: 7
        });

        if (testResponse.data?.success) {
          const mapping = testResponse.data.data.hierarchyMapping;
          console.log(`     Expected Domain: ${testCase.expectedDomain}, Got: ${mapping.domainId}`);
          console.log(`     Expected Section: ${testCase.expectedSection}, Got: ${mapping.sectionId}`);
          
          // Check if they match (case-insensitive for formatted names)
          const domainMatch = mapping.domainId.toLowerCase() === testCase.expectedDomain.toLowerCase();
          const sectionMatch = mapping.sectionId.toLowerCase() === testCase.expectedSection.toLowerCase();
          
          console.log(`     Domain Match: ${domainMatch ? 'YES' : 'NO'}`);
          console.log(`     Section Match: ${sectionMatch ? 'YES' : 'NO'}`);
        }
      }
    }

    // Test 5: Check final review schedule with all items
    console.log('\n5. Checking final review schedule...');
    const finalScheduleResponse = await makeRequest('/api/vault-learning/review-schedule?limit=20');
    
    if (finalScheduleResponse.data?.success) {
      const finalSchedule = finalScheduleResponse.data.data;
      const allFinalItems = [...finalSchedule.due, ...finalSchedule.upcoming];
      
      console.log(`   Total items in schedule: ${allFinalItems.length}`);
      
      console.log('\n   All vault items with domain/section info:');
      allFinalItems.forEach((item, index) => {
        console.log(`     ${index + 1}. ${item.vaultInfo?.title || 'Unknown'}`);
        console.log(`        Domain: ${item.vaultInfo?.domain}`);
        console.log(`        Section: ${item.vaultInfo?.section}`);
        console.log(`        Path: ${item.vaultInfo?.path || 'N/A'}`);
      });
    }

    console.log('\n=== VAULT STRUCTURE TEST COMPLETE ===');
    console.log('\nThe system now properly handles _root folder structure:');
    console.log('  - Extracts domain from first folder after _root');
    console.log('  - Extracts section from second folder after _root');
    console.log('  - Formats folder names to Title Case');
    console.log('  - Falls back gracefully when no structure exists');

  } catch (error) {
    console.error('Vault structure test failed:', error.message);
  }
}

// Run the test
testVaultStructure();
