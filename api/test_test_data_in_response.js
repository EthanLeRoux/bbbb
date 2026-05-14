'use strict';

/**
 * Test script to verify that test data (including test name) is included
 * in the attempt submission response.
 */

const AttemptService = require('./Services/attemptService');

// Mock test data with name
const mockTest = {
  id: 'test-with-name-123',
  name: 'JavaScript Fundamentals Quiz',
  topic: 'JavaScript Fundamentals',
  difficulty: 'intermediate',
  domain: 'Programming',
  section: 'Web Development',
  shortAnswerQuestions: [
    {
      question: 'What is the difference between let and const in JavaScript?',
      answer: 'let allows reassignment, const does not',
      sourceConcept: 'Variable Declaration'
    }
  ]
};

/**
 * Test that test data is included in submission response
 */
async function testTestDataInResponse() {
  console.log('=== Testing Test Data in Submission Response ===\n');
  
  const attemptService = new AttemptService();
  
  try {
    // Mock the Test.findById method to return our test data
    const originalTestFindById = require('./models/Test').findById;
    require('./models/Test').findById = async (testId) => {
      if (testId === mockTest.id) {
        return mockTest;
      }
      return null;
    };
    
    // Mock the Attempt model methods
    const mockAttempt = {
      id: 'mock-attempt-456',
      testId: mockTest.id,
      status: 'in_progress',
      createdAt: new Date()
    };
    
    const originalAttemptCreate = require('./models/Attempt').create;
    const originalAttemptFindById = require('./models/Attempt').findById;
    const originalAttemptFindAndUpdate = require('./models/Attempt').findByIdAndUpdate;
    
    require('./models/Attempt').create = async (data) => {
      console.log('[Mock] Creating attempt:', data);
      return mockAttempt;
    };
    
    require('./models/Attempt').findById = async (id) => {
      console.log('[Mock] Finding attempt:', id);
      return mockAttempt;
    };
    
    require('./models/Attempt').findByIdAndUpdate = async (id, data) => {
      console.log('[Mock] Updating attempt:', id, data);
      return {
        ...mockAttempt,
        ...data,
        toJSON: () => ({ ...mockAttempt, ...data })
      };
    };
    
    // Test submission
    console.log('1. Testing attempt submission with test data...');
    
    const submissionData = {
      attemptId: mockAttempt.id,
      testId: mockTest.id,
      answers: {
        'q0': 'let is for variables, const is for constants' // Incorrect
      },
      timings: {
        'q0': 30
      }
    };
    
    const submittedAttempt = await attemptService.submitAttempt(submissionData);
    
    console.log('\n2. Submitted attempt results:');
    console.log('- Attempt ID:', submittedAttempt.id);
    console.log('- Test ID:', submittedAttempt.testId);
    console.log('- Score:', submittedAttempt.score);
    console.log('- Has critiques:', !!submittedAttempt.critiques);
    
    // Now test the controller response
    console.log('\n3. Testing controller response structure...');
    
    const AttemptController = require('./controllers/attemptController');
    const controller = new AttemptController();
    
    // Mock request and response objects
    const mockReq = {
      body: submissionData
    };
    
    let responseData = null;
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          responseData = data;
          console.log(`Response status: ${code}`);
        }
      })
    };
    
    await controller.submitAttempt(mockReq, mockRes);
    
    if (responseData && responseData.success && responseData.data) {
      console.log('\n4. Controller response validation:');
      console.log('- Response successful:', responseData.success);
      console.log('- Has test name:', !!responseData.data.testName);
      console.log('- Test name:', responseData.data.testName);
      console.log('- Has test topic:', !!responseData.data.testTopic);
      console.log('- Test topic:', responseData.data.testTopic);
      console.log('- Has test difficulty:', !!responseData.data.testDifficulty);
      console.log('- Test difficulty:', responseData.data.testDifficulty);
      console.log('- Has test domain:', !!responseData.data.testDomain);
      console.log('- Test domain:', responseData.data.testDomain);
      console.log('- Has test section:', !!responseData.data.testSection);
      console.log('- Test section:', responseData.data.testSection);
      console.log('- Has critiques:', !!responseData.data.critiques);
      
      // Validate required test fields
      const requiredTestFields = ['testName', 'testTopic', 'testDifficulty', 'testDomain', 'testSection'];
      const missingFields = requiredTestFields.filter(field => !responseData.data[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required test fields: ${missingFields.join(', ')}`);
      }
      
      console.log('\n5. All test fields are present and correct!');
      
      // Display the complete response structure
      console.log('\n6. Complete response structure:');
      console.log(JSON.stringify(responseData, null, 2));
      
    } else {
      throw new Error('Invalid controller response structure');
    }
    
    // Restore original methods
    require('./models/Test').findById = originalTestFindById;
    require('./models/Attempt').create = originalAttemptCreate;
    require('./models/Attempt').findById = originalAttemptFindById;
    require('./models/Attempt').findByIdAndUpdate = originalAttemptFindAndUpdate;
    
    console.log('\n=== Test completed successfully! ===');
    return true;
    
  } catch (error) {
    console.error('Test failed:', error);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

/**
 * Test edge case where test is not found
 */
async function testTestNotFound() {
  console.log('\n=== Testing Test Not Found Edge Case ===\n');
  
  try {
    const AttemptController = require('./controllers/attemptController');
    const controller = new AttemptController();
    
    // Mock the Test.findById to return null
    const originalTestFindById = require('./models/Test').findById;
    require('./models/Test').findById = async () => null;
    
    // Mock request and response
    const mockReq = {
      body: {
        attemptId: 'test-attempt',
        testId: 'non-existent-test',
        answers: {},
        timings: {}
      }
    };
    
    let responseData = null;
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          responseData = data;
          console.log(`Response status: ${code}`);
        }
      })
    };
    
    await controller.submitAttempt(mockReq, mockRes);
    
    // Should still succeed but with default test values
    if (responseData && responseData.data) {
      console.log('Test name when test not found:', responseData.data.testName);
      console.log('Test topic when test not found:', responseData.data.testTopic);
      
      if (responseData.data.testName === 'Unknown Test') {
        console.log('Correctly handled missing test with default values');
      } else {
        throw new Error('Expected "Unknown Test" as default name');
      }
    }
    
    // Restore original method
    require('./models/Test').findById = originalTestFindById;
    
    console.log('Edge case test passed!');
    return true;
    
  } catch (error) {
    console.error('Edge case test failed:', error);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('Starting Test Data Response Tests...\n');
  
  const test1 = await testTestDataInResponse();
  const test2 = await testTestNotFound();
  
  console.log('\n=== Final Results ===');
  console.log(`Test Data In Response: ${test1 ? 'PASSED' : 'FAILED'}`);
  console.log(`Test Not Found Edge Case: ${test2 ? 'PASSED' : 'FAILED'}`);
  
  if (test1 && test2) {
    console.log('\nAll tests passed! Test data is properly included in responses.');
  } else {
    console.log('\nSome tests failed. Please check the implementation.');
  }
  
  return test1 && test2;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testTestDataInResponse,
  testTestNotFound,
  runTests
};
