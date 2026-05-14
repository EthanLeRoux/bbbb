/**
 * Debug Vault Information
 * Check what vault info is being returned and why domain/section aren't showing
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

async function debugVaultInfo() {
  console.log('=== DEBUGGING VAULT INFORMATION ===\n');

  try {
    // Test 1: Submit a test and check the vault info in the response
    console.log('1. Submitting test and checking vault info...');
    const testData = {
      vaultId: 'debug-vault-info-123',
      scorePercent: 75,
      totalQuestions: 10,
      correctAnswers: 7
    };

    const submitResponse = await makeRequest('/api/vault-learning/submit-test', 'POST', testData);
    
    if (submitResponse.data?.success) {
      const result = submitResponse.data.data;
      console.log('   Submission successful');
      console.log('   Hierarchy mapping:', result.hierarchyMapping);
      
      // Test 2: Get review schedule to see vault info
      console.log('\n2. Getting review schedule to check vault info...');
      const scheduleResponse = await makeRequest('/api/vault-learning/review-schedule?limit=5');
      
      if (scheduleResponse.data?.success) {
        const schedule = scheduleResponse.data.data;
        const allItems = [...schedule.due, ...schedule.upcoming];
        
        console.log('   Found items in schedule:', allItems.length);
        
        allItems.forEach((item, index) => {
          console.log(`   Item ${index + 1}:`);
          console.log(`     Vault ID: ${item.vaultInfo?.vaultId}`);
          console.log(`     Title: ${item.vaultInfo?.title}`);
          console.log(`     Domain: ${item.vaultInfo?.domain}`);
          console.log(`     Section: ${item.vaultInfo?.section}`);
          console.log(`     Type: ${item.vaultInfo?.type}`);
        });
      }

      // Test 3: Check vault stats
      console.log('\n3. Getting vault stats...');
      const statsResponse = await makeRequest('/api/vault-learning/vault-stats/debug-vault-info-123');
      
      if (statsResponse.data?.success) {
        const stats = statsResponse.data.data;
        console.log('   Vault stats hierarchy:', stats.hierarchy);
      }

      // Test 4: Create a vault item with domain/section and test again
      console.log('\n4. Creating vault item with domain/section...');
      const vaultItem = {
        id: 'debug-vault-with-domain-456',
        title: 'Test Vault with Domain',
        domain: 'networking',
        section: 'ip-addressing',
        type: 'content',
        description: 'Test vault item with proper domain and section'
      };

      const createResponse = await makeRequest('/api/vault', 'POST', vaultItem);
      console.log(`   Vault creation: ${createResponse.statusCode === 200 ? 'SUCCESS' : 'FAILED'}`);

      if (createResponse.statusCode === 200) {
        // Submit test for this vault
        const vaultTestData = {
          vaultId: 'debug-vault-with-domain-456',
          scorePercent: 85,
          totalQuestions: 10,
          correctAnswers: 8
        };

        const vaultTestResponse = await makeRequest('/api/vault-learning/submit-test', 'POST', vaultTestData);
        
        if (vaultTestResponse.data?.success) {
          const vaultResult = vaultTestResponse.data.data;
          console.log('   Vault with domain test successful');
          console.log('   Hierarchy mapping:', vaultResult.hierarchyMapping);
        }

        // Check schedule again
        const updatedScheduleResponse = await makeRequest('/api/vault-learning/review-schedule?limit=10');
        
        if (updatedScheduleResponse.data?.success) {
          const updatedSchedule = updatedScheduleResponse.data.data;
          const allUpdatedItems = [...updatedSchedule.due, ...updatedSchedule.upcoming];
          
          console.log('\n   Updated schedule items:');
          allUpdatedItems.forEach((item, index) => {
            if (item.vaultInfo?.vaultId === 'debug-vault-with-domain-456') {
              console.log(`   Found vault with domain:`);
              console.log(`     Vault ID: ${item.vaultInfo?.vaultId}`);
              console.log(`     Title: ${item.vaultInfo?.title}`);
              console.log(`     Domain: ${item.vaultInfo?.domain}`);
              console.log(`     Section: ${item.vaultInfo?.section}`);
            }
          });
        }
      }
    }

    console.log('\n=== DEBUG COMPLETE ===');

  } catch (error) {
    console.error('Debug failed:', error.message);
  }
}

// Run debug
debugVaultInfo();
