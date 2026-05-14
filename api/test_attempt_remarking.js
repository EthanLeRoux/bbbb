'use strict';

/**
 * Test attempt remarking functionality
 */

// Load environment variables first
require('dotenv').config();

const AttemptService = require('./Services/attemptService');
const Attempt = require('./models/Attempt');
const Test = require('./models/Test');

// Mock test data
const mockTest = {
  id: 'remarking-test',
  name: 'Test for AI Remarking',
  topic: 'university',
  difficulty: 'hard',
  domain: 'university',
  shortAnswerQuestions: [
    {
      question: 'What is the purpose of a Host-Based Intrusion Detection System (HIDS)?',
      answer: 'A HIDS is security software that monitors a single device for suspicious or malicious activity by collecting and analyzing system activity on the host itself.',
      sourceConcept: 'Host-Based Intrusion Detection System (HIDS)'
    },
    {
      question: 'Explain the concept of Defense in Depth in network security.',
      answer: 'Defense in Depth is a security strategy that involves using multiple layers of protection instead of relying on a single control mechanism to enhance security resilience.',
      sourceConcept: 'Defense in Depth'
    }
  ]
};

// Mock old attempt with basic scoring
const mockOldAttempt = {
  id: 'old-attempt-123',
  testId: mockTest.id,
  answers: {
    'q0': 'An HID is for detecting unusual traffic that indicate intrusion attempts and alert the user,as a safeguard for an individual host device. it contributes to the overall depth in the network defense.',
    'q1': 'Defense in depth is the concept of using multiple layers of security to create a depth in the overall defense system of a network.'
  },
  timings: {
    'q0': 92,
    'q1': 58
  },
  score: 0, // Old basic scoring would give 0%
  correctCount: 0,
  totalQuestions: 2,
  totalTime: 150,
  perQuestionResults: {
    'q0': {
      correct: false,
      expectedAnswer: 'A HIDS is security software that monitors a single device for suspicious or malicious activity by collecting and analyzing system activity on the host itself.',
      userAnswer: 'An HID is for detecting unusual traffic that indicate intrusion attempts and alert the user,as a safeguard for an individual host device. it contributes to the overall depth in the network defense.',
      timing: 92,
      question: 'What is the purpose of a Host-Based Intrusion Detection System (HIDS)?'
    },
    'q1': {
      correct: false,
      expectedAnswer: 'Defense in Depth is a security strategy that involves using multiple layers of protection instead of relying on a single control mechanism to enhance security resilience.',
      userAnswer: 'Defense in depth is the concept of using multiple layers of security to create a depth in the overall defense system of a network.',
      timing: 58,
      question: 'Explain the concept of Defense in Depth in network security.'
    }
  },
  status: 'completed',
  submittedAt: new Date('2026-04-29T10:00:00.000Z'),
  critiques: null, // No AI critiques in old attempt
  remarkCount: 0
};

/**
 * Test attempt remarking functionality
 */
async function testAttemptRemarking() {
  console.log('=== Testing Attempt Remarking ===\n');
  
  console.log('Original Attempt Data:');
  console.log(`- Attempt ID: ${mockOldAttempt.id}`);
  console.log(`- Test ID: ${mockOldAttempt.testId}`);
  console.log(`- Original Score: ${mockOldAttempt.score}%`);
  console.log(`- Correct Answers: ${mockOldAttempt.correctCount}/${mockOldAttempt.totalQuestions}`);
  console.log(`- Has AI Critiques: ${mockOldAttempt.critiques ? 'YES' : 'NO'}`);
  console.log(`- Remark Count: ${mockOldAttempt.remarkCount}`);
  console.log('');
  
  console.log('User Answers:');
  Object.entries(mockOldAttempt.answers).forEach(([questionId, answer], index) => {
    const question = mockTest.shortAnswerQuestions[index];
    console.log(`Q${index + 1}. ${question.question.substring(0, 60)}...`);
    console.log(`   Answer: ${answer.substring(0, 80)}...`);
    console.log('');
  });
  
  const attemptService = new AttemptService();
  
  // Mock the database methods
  const originalAttemptFindById = require('./models/Attempt').findById;
  const originalAttemptFindAndUpdate = require('./models/Attempt').findByIdAndUpdate;
  const originalTestFindById = require('./models/Test').findById;
  
  // Mock Attempt.findById
  require('./models/Attempt').findById = async (id) => {
    if (id === mockOldAttempt.id) {
      console.log(`[Mock] Found attempt: ${id}`);
      return { ...mockOldAttempt, toJSON: () => ({ ...mockOldAttempt }) };
    }
    throw new Error('Attempt not found');
  };
  
  // Mock Attempt.findByIdAndUpdate
  require('./models/Attempt').findByIdAndUpdate = async (id, updateData) => {
    console.log(`[Mock] Updating attempt: ${id}`);
    console.log(`[Mock] Update data keys: ${Object.keys(updateData).join(', ')}`);
    
    const updatedAttempt = {
      ...mockOldAttempt,
      ...updateData,
      toJSON: () => ({ ...mockOldAttempt, ...updateData })
    };
    
    console.log(`[Mock] New score: ${updateData.score}%`);
    console.log(`[Mock] New remark count: ${updateData.remarkCount}`);
    
    return updatedAttempt;
  };
  
  // Mock Test.findById
  require('./models/Test').findById = async (id) => {
    if (id === mockTest.id) {
      console.log(`[Mock] Found test: ${id}`);
      return { ...mockTest, toJSON: () => ({ ...mockTest }) };
    }
    throw new Error('Test not found');
  };
  
  try {
    console.log('Testing attempt remarking...\n');
    
    const startTime = Date.now();
    const remarkedAttempt = await attemptService.remarkAttempt({ attemptId: mockOldAttempt.id });
    const endTime = Date.now();
    
    console.log(`\nRemarking completed in ${endTime - startTime}ms\n`);
    
    // Display results
    console.log('=== REMARKING RESULTS ===\n');
    
    console.log('Score Comparison:');
    console.log(`- Original Score: ${mockOldAttempt.score}%`);
    console.log(`- New AI Score: ${remarkedAttempt.score}%`);
    console.log(`- Score Improvement: +${(remarkedAttempt.score - mockOldAttempt.score).toFixed(1)}%`);
    console.log('');
    
    console.log('New Per-Question Results:');
    Object.entries(remarkedAttempt.perQuestionResults).forEach(([questionId, result], index) => {
      const oldResult = mockOldAttempt.perQuestionResults[questionId];
      console.log(`\nQ${index + 1}. ${result.question.substring(0, 60)}...`);
      console.log(`   Old Result: ${oldResult.correct ? 'CORRECT' : 'INCORRECT'}`);
      console.log(`   New AI Score: ${result.aiScore}/100`);
      console.log(`   New Result: ${result.correct ? 'CORRECT' : 'INCORRECT'}`);
      console.log(`   Confidence: ${result.confidence.toUpperCase()}`);
      console.log(`   Evaluation: ${result.evaluation}`);
      
      if (result.keyPointsMatched && result.keyPointsMatched.length > 0) {
        console.log(`   Key Points Matched: ${result.keyPointsMatched.join(', ')}`);
      }
    });
    
    console.log('\nAI Critiques:');
    if (remarkedAttempt.critiques) {
      console.log(`- Per-Question Critiques: ${Object.keys(remarkedAttempt.critiques.perQuestionCritiques).length}`);
      console.log(`- Overall Weaknesses: ${remarkedAttempt.critiques.overallWeaknesses.length}`);
      console.log(`- Study Recommendations: ${remarkedAttempt.critiques.studyRecommendations.length}`);
      console.log(`- Strengths: ${remarkedAttempt.critiques.strengths.length}`);
    } else {
      console.log('- No AI critiques generated');
    }
    
    console.log('\nRemarking Metadata:');
    console.log(`- Last Remarked At: ${remarkedAttempt.lastRemarkedAt}`);
    console.log(`- Total Remark Count: ${remarkedAttempt.remarkCount}`);
    
    // Verify improvements
    const hasImproved = remarkedAttempt.score > mockOldAttempt.score;
    const hasAICritiques = remarkedAttempt.critiques !== null;
    const hasAIScoring = Object.values(remarkedAttempt.perQuestionResults)
      .some(result => result.aiScore !== undefined);
    
    console.log('\n=== VERIFICATION ===');
    console.log(`Score Improved: ${hasImproved ? 'YES' : 'NO'}`);
    console.log(`AI Critiques Generated: ${hasAICritiques ? 'YES' : 'NO'}`);
    console.log(`AI Scoring Applied: ${hasAIScoring ? 'YES' : 'NO'}`);
    console.log(`Remark Count Updated: ${remarkedAttempt.remarkCount > 0 ? 'YES' : 'NO'}`);
    
    if (hasImproved && hasAICritiques && hasAIScoring) {
      console.log('\n=== SUCCESS ===');
      console.log('Attempt remarking is working perfectly!');
      console.log('Old attempts can now be re-evaluated with AI-powered scoring.');
      
      // Show benefits
      console.log('\n=== REMARKING BENEFITS ===');
      console.log('1. Fair Scoring: Partial credit for partially correct answers');
      console.log('2. AI Feedback: Detailed critiques and improvement suggestions');
      console.log('3. Score Improvement: Better evaluation of understanding');
      console.log('4. Tracking: Records how many times attempts have been re-marked');
      console.log('5. Timestamp: Tracks when remarking occurred');
      
      return true;
    } else {
      console.log('\n=== ISSUES DETECTED ===');
      console.log('Remarking may not be working as expected.');
      return false;
    }
    
  } catch (error) {
    console.error('Remarking test failed:', error);
    return false;
  } finally {
    // Restore original methods
    require('./models/Attempt').findById = originalAttemptFindById;
    require('./models/Attempt').findByIdAndUpdate = originalAttemptFindAndUpdate;
    require('./models/Test').findById = originalTestFindById;
  }
}

/**
 * Test remarking edge cases
 */
async function testRemarkingEdgeCases() {
  console.log('\n=== Testing Remarking Edge Cases ===\n');
  
  const attemptService = new AttemptService();
  
  // Test cases
  const testCases = [
    {
      name: 'Invalid Attempt ID',
      attemptId: 'invalid-id',
      expectedError: 'Attempt not found'
    },
    {
      name: 'Empty Attempt ID',
      attemptId: '',
      expectedError: 'Attempt ID is required'
    },
    {
      name: 'Null Attempt ID',
      attemptId: null,
      expectedError: 'Attempt ID is required'
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}`);
    
    try {
      await attemptService.remarkAttempt({ attemptId: testCase.attemptId });
      console.log(`Result: UNEXPECTED SUCCESS (should have failed)`);
    } catch (error) {
      if (error.message.includes(testCase.expectedError)) {
        console.log(`Result: CORRECTLY FAILED - ${error.message}`);
      } else {
        console.log(`Result: UNEXPECTED ERROR - ${error.message}`);
      }
    }
  }
}

// Run tests if executed directly
if (require.main === module) {
  testAttemptRemarking()
    .then(success => {
      testRemarkingEdgeCases().catch(console.error);
    })
    .catch(console.error);
}

module.exports = {
  testAttemptRemarking,
  testRemarkingEdgeCases
};
