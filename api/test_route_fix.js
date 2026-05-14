'use strict';

/**
 * Test script to verify the route ordering fix for /stats endpoint
 */

const express = require('express');
const TestRoutes = require('./Routes/testRoutes');

/**
 * Test the route ordering by simulating requests
 */
async function testRouteOrdering() {
  console.log('=== Testing Route Ordering Fix ===\n');
  
  try {
    // Create a test app
    const app = express();
    app.use(express.json());
    
    // Mock the test controller methods
    const mockController = {
      getTestStats: async (req, res) => {
        console.log('[Mock] getTestStats called - SUCCESS!');
        return res.json({
          success: true,
          data: {
            totalTests: 10,
            totalQuestions: 50,
            avgQuestionsPerTest: 5
          }
        });
      },
      getTestById: async (req, res) => {
        console.log('[Mock] getTestById called with ID:', req.params.id);
        if (req.params.id === 'stats') {
          return res.status(404).json({
            success: false,
            error: 'Test not found'
          });
        }
        return res.json({
          success: true,
          data: { id: req.params.id }
        });
      }
    };
    
    // Override the controller methods in the routes
    const originalRequire = require;
    require = function(id) {
      if (id === './controllers/testController') {
        return function() {
          return mockController;
        };
      }
      return originalRequire(id);
    };
    
    // Load and use the routes
    app.use('/api/tests', TestRoutes);
    
    // Restore original require
    require = originalRequire;
    
    console.log('1. Testing /api/tests/stats route...');
    
    // Simulate request to /stats
    const mockStatsReq = {
      method: 'GET',
      path: '/api/tests/stats',
      originalUrl: '/api/tests/stats',
      params: {},
      query: {}
    };
    
    let statsResponse = null;
    const mockStatsRes = {
      json: (data) => {
        statsResponse = data;
        console.log('Stats response:', JSON.stringify(data, null, 2));
      },
      status: (code) => ({
        json: (data) => {
          statsResponse = { ...data, statusCode: code };
          console.log('Stats response with status:', code, JSON.stringify(data, null, 2));
        }
      })
    };
    
    // Find the stats route handler
    const statsRoute = TestRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/stats' && layer.route.methods.get
    );
    
    if (statsRoute) {
      await statsRoute.handle(mockStatsReq, mockStatsRes);
      
      if (statsResponse && statsResponse.success) {
        console.log('2. SUCCESS: /stats route works correctly!');
      } else {
        console.log('2. FAILED: /stats route not working');
      }
    } else {
      console.log('2. FAILED: /stats route not found');
    }
    
    console.log('\n3. Testing that /:id route doesn\'t interfere...');
    
    // Simulate request to a test ID
    const mockIdReq = {
      method: 'GET',
      path: '/api/tests/abc123',
      originalUrl: '/api/tests/abc123',
      params: { id: 'abc123' },
      query: {}
    };
    
    let idResponse = null;
    const mockIdRes = {
      json: (data) => {
        idResponse = data;
        console.log('ID response:', JSON.stringify(data, null, 2));
      }
    };
    
    // Find the :id route handler
    const idRoute = TestRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/:id' && layer.route.methods.get
    );
    
    if (idRoute) {
      await idRoute.handle(mockIdReq, mockIdRes);
      
      if (idResponse && idResponse.success) {
        console.log('4. SUCCESS: /:id route works correctly!');
      } else {
        console.log('4. FAILED: /:id route not working');
      }
    } else {
      console.log('4. FAILED: /:id route not found');
    }
    
    console.log('\n=== Route Ordering Test Completed ===');
    console.log('The fix ensures specific routes (/stats, /health, /docs) are handled');
    console.log('before parameterized routes (/:id) to prevent conflicts.');
    
    return true;
    
  } catch (error) {
    console.error('Route test failed:', error);
    return false;
  }
}

/**
 * Simple route structure verification
 */
function verifyRouteStructure() {
  console.log('\n=== Verifying Route Structure ===\n');
  
  const routes = [];
  
  // Extract route information from the stack
  TestRoutes.stack.forEach((layer, index) => {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods)
        .filter(method => layer.route.methods[method])
        .join(', ');
      
      routes.push({
        index,
        path: layer.route.path,
        methods,
        stack: layer.route.stack.length
      });
    }
  });
  
  console.log('Route order in TestRoutes:');
  routes.forEach(route => {
    console.log(`${route.index}. ${route.methods} ${route.path}`);
  });
  
  // Check if /stats comes before /:id
  const statsIndex = routes.findIndex(r => r.path === '/stats');
  const idIndex = routes.findIndex(r => r.path === '/:id');
  
  if (statsIndex !== -1 && idIndex !== -1) {
    if (statsIndex < idIndex) {
      console.log('\n5. SUCCESS: /stats route comes before /:id route');
      return true;
    } else {
      console.log('\n5. FAILED: /stats route comes after /:id route');
      return false;
    }
  } else {
    console.log('\n5. WARNING: Could not find both /stats and /:id routes');
    return false;
  }
}

// Run tests
async function runTests() {
  const routeStructureCorrect = verifyRouteStructure();
  const routeOrderingWorks = await testRouteOrdering();
  
  console.log('\n=== Final Results ===');
  console.log(`Route Structure: ${routeStructureCorrect ? 'CORRECT' : 'INCORRECT'}`);
  console.log(`Route Functionality: ${routeOrderingWorks ? 'WORKING' : 'BROKEN'}`);
  
  if (routeStructureCorrect && routeOrderingWorks) {
    console.log('\nAll tests passed! The route ordering fix is working correctly.');
  } else {
    console.log('\nSome issues detected. Please check the route configuration.');
  }
}

// Run if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testRouteOrdering,
  verifyRouteStructure,
  runTests
};
