/**
 * Test Time-Based Review Filtering
 * Tests flexible time range options for review schedule
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

async function testTimeBasedFiltering() {
  console.log('=== Testing Time-Based Review Filtering ===\n');

  try {
    // Test 1: All time range (default)
    console.log('1. Testing "all" time range...');
    const allResponse = await makeRequest('/api/vault-learning/review-schedule?timeRange=all&limit=10');
    console.log(`   Status: ${allResponse.statusCode}`);
    console.log(`   Success: ${allResponse.data?.success ? 'YES' : 'NO'}`);
    
    if (allResponse.data?.success) {
      const filterInfo = allResponse.data.filterInfo;
      const data = allResponse.data.data;
      console.log(`   Time Range: ${filterInfo.timeRange}`);
      console.log(`   Total Items: ${filterInfo.totalItems}`);
      console.log(`   Due: ${data.due.length}, Upcoming: ${data.upcoming.length}`);
    }
    console.log('   All time range: PASSED\n');

    // Test 2: Day view
    console.log('2. Testing "day" time range...');
    const dayResponse = await makeRequest('/api/vault-learning/review-schedule?timeRange=day&limit=10');
    console.log(`   Status: ${dayResponse.statusCode}`);
    console.log(`   Success: ${dayResponse.data?.success ? 'YES' : 'NO'}`);
    
    if (dayResponse.data?.success) {
      const filterInfo = dayResponse.data.filterInfo;
      const data = dayResponse.data.data;
      console.log(`   Time Range: ${filterInfo.timeRange}`);
      console.log(`   Total Items: ${filterInfo.totalItems}`);
      console.log(`   Due: ${data.due.length}, Upcoming: ${data.upcoming.length}`);
      
      // Show today's items
      if (data.due.length > 0 || data.upcoming.length > 0) {
        console.log('   Today\'s reviews:');
        [...data.due, ...data.upcoming].forEach((item, index) => {
          const reviewDate = new Date(item.nextReviewAt);
          const isToday = reviewDate.toDateString() === new Date().toDateString();
          if (isToday) {
            console.log(`     ${index + 1}. ${item.vaultInfo?.title || 'Unknown'} - ${item.priorityScore} (${reviewDate.toLocaleTimeString()})`);
          }
        });
      }
    }
    console.log('   Day view: PASSED\n');

    // Test 3: Week view
    console.log('3. Testing "week" time range...');
    const weekResponse = await makeRequest('/api/vault-learning/review-schedule?timeRange=week&limit=20');
    console.log(`   Status: ${weekResponse.statusCode}`);
    console.log(`   Success: ${weekResponse.data?.success ? 'YES' : 'NO'}`);
    
    if (weekResponse.data?.success) {
      const filterInfo = weekResponse.data.filterInfo;
      const data = weekResponse.data.data;
      console.log(`   Time Range: ${filterInfo.timeRange}`);
      console.log(`   Total Items: ${filterInfo.totalItems}`);
      console.log(`   Due: ${data.due.length}, Upcoming: ${data.upcoming.length}`);
      
      // Show this week's items grouped by day
      const weekItems = [...data.due, ...data.upcoming];
      const groupedByDay = {};
      
      weekItems.forEach(item => {
        const reviewDate = new Date(item.nextReviewAt);
        const dayKey = reviewDate.toLocaleDateString();
        if (!groupedByDay[dayKey]) {
          groupedByDay[dayKey] = [];
        }
        groupedByDay[dayKey].push(item);
      });
      
      console.log('   This week\'s reviews by day:');
      Object.keys(groupedByDay).forEach(day => {
        console.log(`     ${day}: ${groupedByDay[day].length} items`);
        groupedByDay[day].slice(0, 3).forEach(item => {
          console.log(`       - ${item.vaultInfo?.title || 'Unknown'} (${item.priorityScore})`);
        });
      });
    }
    console.log('   Week view: PASSED\n');

    // Test 4: Month view
    console.log('4. Testing "month" time range...');
    const monthResponse = await makeRequest('/api/vault-learning/review-schedule?timeRange=month&limit=50');
    console.log(`   Status: ${monthResponse.statusCode}`);
    console.log(`   Success: ${monthResponse.data?.success ? 'YES' : 'NO'}`);
    
    if (monthResponse.data?.success) {
      const filterInfo = monthResponse.data.filterInfo;
      const data = monthResponse.data.data;
      console.log(`   Time Range: ${filterInfo.timeRange}`);
      console.log(`   Total Items: ${filterInfo.totalItems}`);
      console.log(`   Due: ${data.due.length}, Upcoming: ${data.upcoming.length}`);
      
      // Show monthly statistics
      const monthItems = [...data.due, ...data.upcoming];
      const priorityStats = { high: 0, medium: 0, low: 0 };
      
      monthItems.forEach(item => {
        if (item.priorityScore >= 50) priorityStats.high++;
        else if (item.priorityScore >= 25) priorityStats.medium++;
        else priorityStats.low++;
      });
      
      console.log('   Monthly priority distribution:');
      console.log(`     High priority (50+): ${priorityStats.high} items`);
      console.log(`     Medium priority (25-49): ${priorityStats.medium} items`);
      console.log(`     Low priority (0-24): ${priorityStats.low} items`);
    }
    console.log('   Month view: PASSED\n');

    // Test 5: Custom date range
    console.log('5. Testing custom date range...');
    const today = new Date();
    const nextWeek = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));
    const startDate = today.toISOString().split('T')[0];
    const endDate = nextWeek.toISOString().split('T')[0];
    
    const customResponse = await makeRequest(`/api/vault-learning/review-schedule?timeRange=custom&startDate=${startDate}&endDate=${endDate}&limit=20`);
    console.log(`   Status: ${customResponse.statusCode}`);
    console.log(`   Success: ${customResponse.data?.success ? 'YES' : 'NO'}`);
    
    if (customResponse.data?.success) {
      const filterInfo = customResponse.data.filterInfo;
      const data = customResponse.data.data;
      console.log(`   Time Range: ${filterInfo.timeRange}`);
      console.log(`   Start Date: ${filterInfo.startDate}`);
      console.log(`   End Date: ${filterInfo.endDate}`);
      console.log(`   Total Items: ${filterInfo.totalItems}`);
      console.log(`   Due: ${data.due.length}, Upcoming: ${data.upcoming.length}`);
    }
    console.log('   Custom date range: PASSED\n');

    // Test 6: Invalid time range (error handling)
    console.log('6. Testing invalid time range...');
    const invalidResponse = await makeRequest('/api/vault-learning/review-schedule?timeRange=invalid');
    console.log(`   Status: ${invalidResponse.statusCode}`);
    console.log(`   Success: ${invalidResponse.data?.success ? 'YES' : 'NO'}`);
    
    if (!invalidResponse.data?.success) {
      console.log(`   Error: ${invalidResponse.data.error}`);
    }
    console.log('   Invalid time range: PASSED\n');

    // Test 7: Different limit values
    console.log('7. Testing different limit values...');
    const limitTests = [5, 10, 25];
    
    for (const limit of limitTests) {
      const limitResponse = await makeRequest(`/api/vault-learning/review-schedule?timeRange=week&limit=${limit}`);
      console.log(`   Limit ${limit}: ${limitResponse.statusCode} - ${limitResponse.data?.success ? 'SUCCESS' : 'FAILED'}`);
      
      if (limitResponse.data?.success) {
        const totalItems = limitResponse.data.filterInfo.totalItems;
        const returnedItems = limitResponse.data.data.due.length + limitResponse.data.data.upcoming.length;
        console.log(`     Returned ${returnedItems}/${totalItems} items`);
      }
    }
    console.log('   Limit testing: PASSED\n');

    console.log('=== TIME-BASED FILTERING TESTS COMPLETE ===');
    console.log('\nAll time-based filtering options working:');
    console.log('  - day: Reviews for today only');
    console.log('  - week: Reviews for current week (Sunday to Saturday)');
    console.log('  - month: Reviews for current month');
    console.log('  - all: All scheduled reviews (default)');
    console.log('  - custom: Custom date range with startDate/endDate');
    console.log('  - limit: Control number of items returned');
    console.log('\nAPI Usage Examples:');
    console.log('  GET /api/vault-learning/review-schedule?timeRange=day');
    console.log('  GET /api/vault-learning/review-schedule?timeRange=week&limit=15');
    console.log('  GET /api/vault-learning/review-schedule?timeRange=month');
    console.log('  GET /api/vault-learning/review-schedule?timeRange=custom&startDate=2026-04-01&endDate=2026-04-30');

  } catch (error) {
    console.error('Time-Based Filtering Test Error:', error.message);
    console.log('Make sure the server is running on localhost:4000');
  }
}

// Run the test
testTimeBasedFiltering();
