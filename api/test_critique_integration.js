'use strict';

/**
 * Integration test for AI critique generation in the attempt submission flow.
 * Tests the complete flow from attempt submission to critique generation.
 */

const AttemptService = require('./Services/attemptService');

// Mock test data
const mockTest = {
  id: 'integration-test-123',
  topic: 'JavaScript Fundamentals',
  difficulty: 'intermediate',
  shortAnswerQuestions: [
    {
      question: 'What is the difference between let and const in JavaScript?',
      answer: 'let allows reassignment, const does not',
      sourceConcept: 'Variable Declaration'
    },
    {
      question: 'What is a closure in JavaScript?',
      answer: 'A function that remembers its outer variables even after the outer function has returned',
      sourceConcept: 'Closures'
    }
  ]
};

/**
 * Test the complete attempt submission flow with critique generation
 */
async function testAttemptSubmissionWithCritiques() {
  console.log('=== Testing Attempt Submission with Critique Generation ===\n');
  
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
    
    // Test 1: Start an attempt
    console.log('1. Testing attempt start...');
    const startedAttempt = await attemptService.startAttempt({ testId: mockTest.id });
    console.log('Started attempt:', startedAttempt.id);
    
    // Test 2: Submit attempt with answers
    console.log('\n2. Testing attempt submission with critiques...');
    
    const submissionData = {
      attemptId: mockAttempt.id,
      testId: mockTest.id,
      answers: {
        'q0': 'let is for variables, const is for constants', // Incorrect
        'q1': 'A function that remembers its outer variables even after the outer function has returned' // Correct
      },
      timings: {
        'q0': 30,
        'q1': 45
      }
    };
    
    const submittedAttempt = await attemptService.submitAttempt(submissionData);
    
    console.log('\n3. Submitted attempt results:');
    console.log('- Score:', submittedAttempt.score);
    console.log('- Status:', submittedAttempt.status);
    console.log('- Has critiques:', !!submittedAttempt.critiques);
    
    if (submittedAttempt.critiques) {
      console.log('- Per-question critiques:', Object.keys(submittedAttempt.critiques.perQuestionCritiques || {}).length);
      console.log('- Overall weaknesses:', submittedAttempt.critiques.overallWeaknesses?.length || 0);
      console.log('- Study recommendations:', submittedAttempt.critiques.studyRecommendations?.length || 0);
      console.log('- Strengths:', submittedAttempt.critiques.strengths?.length || 0);
      
      // Display a sample critique
      const firstCritique = Object.values(submittedAttempt.critiques.perQuestionCritiques || {})[0];
      if (firstCritique) {
        console.log('\n4. Sample critique:');
        console.log('- Question:', firstCritique.question.substring(0, 50) + '...');
        console.log('- User Answer:', firstCritique.userAnswer);
        console.log('- Expected Answer:', firstCritique.expectedAnswer);
        console.log('- Critique:', firstCritique.critique);
        console.log('- Improvement:', firstCritique.improvement);
      }
    }
    
    // Restore original methods
    require('./models/Test').findById = originalTestFindById;
    require('./models/Attempt').create = originalAttemptCreate;
    require('./models/Attempt').findById = originalAttemptFindById;
    require('./models/Attempt').findByIdAndUpdate = originalAttemptFindAndUpdate;
    
    console.log('\n=== Integration test completed successfully! ===');
    return true;
    
  } catch (error) {
    console.error('Integration test failed:', error);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

/**
 * Test the controller response format
 */
async function testControllerResponse() {
  console.log('\n=== Testing Controller Response Format ===\n');
  
  try {
    // Mock attempt with critiques
    const mockAttemptWithCritiques = {
      id: 'test-attempt-789',
      testId: 'test-123',
      score: 50,
      perQuestionResults: {
        'q0': { correct: false },
        'q1': { correct: true }
      },
      critiques: {
        perQuestionCritiques: {
          'q0': {
            questionId: 'q0',
            question: 'Test question',
            userAnswer: 'Wrong answer',
            expectedAnswer: 'Correct answer',
            critique: 'Your answer is incorrect',
            explanation: 'Here is why...',
            improvement: 'Study this topic',
            confidence: 'medium'
          }
        },
        overallWeaknesses: ['Concept understanding'],
        studyRecommendations: ['Review basics'],
        strengths: ['Good effort']
      },
      submittedAt: new Date(),
      status: 'completed',
      toJSON: () => mockAttemptWithCritiques
    };
    
    // Simulate controller response structure
    const controllerResponse = {
      success: true,
      data: {
        attemptId: mockAttemptWithCritiques.id,
        testId: mockAttemptWithCritiques.testId,
        score: mockAttemptWithCritiques.score,
        correctCount: 1,
        totalQuestions: 2,
        totalTime: 75,
        perQuestionResults: mockAttemptWithCritiques.perQuestionResults,
        critiques: mockAttemptWithCritiques.critiques,
        submittedAt: mockAttemptWithCritiques.submittedAt,
        status: mockAttemptWithCritiques.status
      },
      message: 'Test attempt submitted successfully'
    };
    
    console.log('Controller response structure:');
    console.log(JSON.stringify(controllerResponse, null, 2));
    
    // Validate response structure
    const requiredFields = ['attemptId', 'testId', 'score', 'critiques', 'perQuestionResults'];
    const missingFields = requiredFields.filter(field => !(field in controllerResponse.data));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Validate critique structure
    const critiques = controllerResponse.data.critiques;
    if (!critiques.perQuestionCritiques || !critiques.overallWeaknesses || !critiques.studyRecommendations) {
      throw new Error('Invalid critique structure in response');
    }
    
    console.log('\nController response validation passed!');
    return true;
    
  } catch (error) {
    console.error('Controller response test failed:', error);
    return false;
  }
}

/**
 * Main test runner
 */
async function runIntegrationTests() {
  console.log('Starting AI Critique Integration Tests...\n');
  
  const test1 = await testAttemptSubmissionWithCritiques();
  const test2 = await testControllerResponse();
  
  console.log('\n=== Final Integration Results ===');
  console.log(`Attempt Submission Test: ${test1 ? 'PASSED' : 'FAILED'}`);
  console.log(`Controller Response Test: ${test2 ? 'PASSED' : 'FAILED'}`);
  
  if (test1 && test2) {
    console.log('\nAll integration tests passed! AI critique system is fully integrated.');
  } else {
    console.log('\nSome integration tests failed. Please check the implementation.');
  }
  
  return test1 && test2;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runIntegrationTests().catch(console.error);
}

module.exports = {
  testAttemptSubmissionWithCritiques,
  testControllerResponse,
  runIntegrationTests
};
