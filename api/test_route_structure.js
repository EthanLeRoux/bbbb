'use strict';

/**
 * Simple test to verify the route structure fix by reading the file
 */

const fs = require('fs');
const path = require('path');

/**
 * Test the route ordering by analyzing the file content
 */
function testRouteOrdering() {
  console.log('=== Testing Route Ordering Fix ===\n');
  
  try {
    const routesPath = path.join(__dirname, 'Routes', 'testRoutes.js');
    const content = fs.readFileSync(routesPath, 'utf8');
    
    // Find all router.get() calls
    const getRoutes = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const match = line.match(/router\.get\(['"]([^'"]+)['"]/);
      if (match) {
        getRoutes.push({
          path: match[1],
          lineNumber: index + 1,
          line: line.trim()
        });
      }
    });
    
    console.log('Found GET routes in order:');
    getRoutes.forEach(route => {
      console.log(`${route.lineNumber}: ${route.line}`);
    });
    
    // Check the order of specific routes
    const statsRoute = getRoutes.find(r => r.path === '/stats');
    const idRoute = getRoutes.find(r => r.path === '/:id');
    const healthRoute = getRoutes.find(r => r.path === '/health');
    const docsRoute = getRoutes.find(r => r.path === '/docs');
    
    console.log('\n=== Route Order Analysis ===');
    
    let issues = [];
    
    if (!statsRoute) {
      issues.push('Missing /stats route');
    }
    
    if (!idRoute) {
      issues.push('Missing /:id route');
    }
    
    if (statsRoute && idRoute) {
      if (statsRoute.lineNumber > idRoute.lineNumber) {
        issues.push('/stats route comes AFTER /:id route (should come BEFORE)');
      } else {
        console.log('1. SUCCESS: /stats route comes before /:id route');
      }
    }
    
    if (healthRoute && idRoute) {
      if (healthRoute.lineNumber > idRoute.lineNumber) {
        issues.push('/health route comes AFTER /:id route (should come BEFORE)');
      } else {
        console.log('2. SUCCESS: /health route comes before /:id route');
      }
    }
    
    if (docsRoute && idRoute) {
      if (docsRoute.lineNumber > idRoute.lineNumber) {
        issues.push('/docs route comes AFTER /:id route (should come BEFORE)');
      } else {
        console.log('3. SUCCESS: /docs route comes before /:id route');
      }
    }
    
    // Check for proper section organization
    const utilitySectionStart = content.indexOf('// === UTILITY ENDPOINTS ===');
    const parameterizedSectionStart = content.indexOf('// === PARAMETERIZED ENDPOINTS ===');
    
    if (utilitySectionStart !== -1 && parameterizedSectionStart !== -1) {
      if (utilitySectionStart < parameterizedSectionStart) {
        console.log('4. SUCCESS: Utility endpoints section comes before parameterized endpoints');
      } else {
        issues.push('Utility endpoints section comes after parameterized endpoints');
      }
    }
    
    console.log('\n=== Summary ===');
    
    if (issues.length === 0) {
      console.log('All route ordering checks PASSED! The fix should resolve the /stats issue.');
      console.log('\nThe problem was that /stats was being treated as a test ID "stats"');
      console.log('because the /:id route was defined before the /stats route.');
      console.log('\nNow the order is:');
      console.log('1. /stats (specific route)');
      console.log('2. /health (specific route)');
      console.log('3. /docs (specific route)');
      console.log('4. /:id (parameterized route - catches all remaining)');
      return true;
    } else {
      console.log('Issues found:');
      issues.forEach(issue => console.log(`- ${issue}`));
      return false;
    }
    
  } catch (error) {
    console.error('Error reading routes file:', error);
    return false;
  }
}

/**
 * Show the specific fix that was made
 */
function showFixDetails() {
  console.log('\n=== Fix Details ===\n');
  console.log('PROBLEM:');
  console.log('The original route order was:');
  console.log('1. router.get(\'/\', ...)');
  console.log('2. router.get(\'/:id\', ...)');  // This would catch "/stats" as an ID
  console.log('3. router.get(\'/stats\', ...)'); // Never reached');
  console.log('');
  
  console.log('SOLUTION:');
  console.log('The new route order is:');
  console.log('1. router.get(\'/\', ...)');
  console.log('2. router.get(\'/stats\', ...)');   // Catches "/stats" specifically');
  console.log('3. router.get(\'/health\', ...)');  // Catches "/health" specifically');
  console.log('4. router.get(\'/docs\', ...)');     // Catches "/docs" specifically');
  console.log('5. router.get(\'/:id\', ...)');     // Catches all other paths as IDs');
  console.log('');
  
  console.log('This ensures that specific routes like /stats are handled');
  console.log('before the generic /:id route that would otherwise capture them.');
}

// Run the test
if (require.main === module) {
  const success = testRouteOrdering();
  showFixDetails();
  
  if (success) {
    console.log('\n=== RESULT ===');
    console.log('The route ordering fix should resolve the "Test not found" errors');
    console.log('when accessing /api/tests/stats endpoint.');
  } else {
    console.log('\n=== RESULT ===');
    console.log('There may still be issues with the route ordering.');
  }
}

module.exports = {
  testRouteOrdering,
  showFixDetails
};
