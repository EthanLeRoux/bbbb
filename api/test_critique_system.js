'use strict';

/**
 * Test script for the AI critique generation system.
 * Tests the complete flow from attempt submission to critique generation.
 */

const CritiqueService = require('./Services/critiqueService');
const AttemptService = require('./Services/attemptService');

// Mock test data
const mockTest = {
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
    },
    {
      question: 'What is the purpose of the "this" keyword in JavaScript?',
      answer: 'Refers to the object that is executing the current function',
      sourceConcept: 'This Keyword'
    }
  ]
};

// Mock attempt with some incorrect answers
const mockAttempt = {
  id: 'test-attempt-123',
  testId: 'test-123',
  perQuestionResults: {
    'q0': {
      correct: false,
      userAnswer: 'let is for variables, const is for constants',
      expectedAnswer: 'let allows reassignment, const does not',
      question: 'What is the difference between let and const in JavaScript?',
      timing: 30
    },
    'q1': {
      correct: true,
      userAnswer: 'A function that remembers its outer variables even after the outer function has returned',
      expectedAnswer: 'A function that remembers its outer variables even after the outer function has returned',
      question: 'What is a closure in JavaScript?',
      timing: 45
    },
    'q2': {
      correct: false,
      userAnswer: 'It refers to the current function',
      expectedAnswer: 'Refers to the object that is executing the current function',
      question: 'What is the purpose of the "this" keyword in JavaScript?',
      timing: 25
    }
  },
  score: 33.33,
  totalTime: 100
};

/**
 * Test critique generation functionality
 */
async function testCritiqueGeneration() {
  console.log('=== Testing AI Critique Generation ===\n');
  
  const critiqueService = new CritiqueService();
  
  try {
    console.log('1. Testing critique generation for mock attempt...');
    const critiques = await critiqueService.generateCritiques(mockAttempt, mockTest);
    
    console.log('\n2. Generated critiques:');
    console.log(JSON.stringify(critiques, null, 2));
    
    // Validate structure
    console.log('\n3. Validating critique structure...');
    
    if (!critiques.perQuestionCritiques) {
      throw new Error('Missing perQuestionCritiques');
    }
    
    if (!critiques.overallWeaknesses || !Array.isArray(critiques.overallWeaknesses)) {
      throw new Error('Missing or invalid overallWeaknesses');
    }
    
    if (!critiques.studyRecommendations || !Array.isArray(critiques.studyRecommendations)) {
      throw new Error('Missing or invalid studyRecommendations');
    }
    
    if (!critiques.strengths || !Array.isArray(critiques.strengths)) {
      throw new Error('Missing or invalid strengths');
    }
    
    // Check that critiques exist for incorrect answers
    const incorrectQuestions = ['q0', 'q2'];
    for (const questionId of incorrectQuestions) {
      if (!critiques.perQuestionCritiques[questionId]) {
        throw new Error(`Missing critique for question ${questionId}`);
      }
      
      const critique = critiques.perQuestionCritiques[questionId];
      if (!critique.critique || !critique.explanation || !critique.improvement) {
        throw new Error(`Incomplete critique for question ${questionId}`);
      }
    }
    
    console.log('4. Structure validation passed!');
    
    // Display summary
    console.log('\n5. Summary:');
    console.log(`- Per-question critiques: ${Object.keys(critiques.perQuestionCritiques).length}`);
    console.log(`- Overall weaknesses: ${critiques.overallWeaknesses.length}`);
    console.log(`- Study recommendations: ${critiques.studyRecommendations.length}`);
    console.log(`- Strengths: ${critiques.strengths.length}`);
    
    console.log('\n=== Test completed successfully! ===');
    return true;
    
  } catch (error) {
    console.error('Test failed:', error);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

/**
 * Test edge cases
 */
async function testEdgeCases() {
  console.log('\n=== Testing Edge Cases ===\n');
  
  const critiqueService = new CritiqueService();
  
  try {
    // Test with perfect score (no incorrect answers)
    console.log('1. Testing with perfect score...');
    const perfectAttempt = {
      ...mockAttempt,
      perQuestionResults: {
        'q0': {
          correct: true,
          userAnswer: 'let allows reassignment, const does not',
          expectedAnswer: 'let allows reassignment, const does not',
          question: 'What is the difference between let and const in JavaScript?',
          timing: 30
        },
        'q1': {
          correct: true,
          userAnswer: 'A function that remembers its outer variables even after the outer function has returned',
          expectedAnswer: 'A function that remembers its outer variables even after the outer function has returned',
          question: 'What is a closure in JavaScript?',
          timing: 45
        },
        'q2': {
          correct: true,
          userAnswer: 'Refers to the object that is executing the current function',
          expectedAnswer: 'Refers to the object that is executing the current function',
          question: 'What is the purpose of the "this" keyword in JavaScript?',
          timing: 25
        }
      },
      score: 100
    };
    
    const perfectCritiques = await critiqueService.generateCritiques(perfectAttempt, mockTest);
    
    if (perfectCritiques.overallWeaknesses.length === 0 || 
        !perfectCritiques.overallWeaknesses[0].includes('No incorrect answers')) {
      throw new Error('Perfect score handling failed');
    }
    
    console.log('2. Perfect score test passed!');
    
    // Test with empty attempt
    console.log('3. Testing with empty results...');
    const emptyAttempt = {
      ...mockAttempt,
      perQuestionResults: {}
    };
    
    const emptyCritiques = await critiqueService.generateCritiques(emptyAttempt, mockTest);
    
    if (!emptyCritiques.overallWeaknesses || !emptyCritiques.studyRecommendations) {
      throw new Error('Empty results handling failed');
    }
    
    console.log('4. Edge case tests passed!');
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
  console.log('Starting AI Critique System Tests...\n');
  
  const test1 = await testCritiqueGeneration();
  const test2 = await testEdgeCases();
  
  console.log('\n=== Final Results ===');
  console.log(`Critique Generation Test: ${test1 ? 'PASSED' : 'FAILED'}`);
  console.log(`Edge Cases Test: ${test2 ? 'PASSED' : 'FAILED'}`);
  
  if (test1 && test2) {
    console.log('\nAll tests passed! AI critique system is working correctly.');
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
  testCritiqueGeneration,
  testEdgeCases,
  runTests
};
