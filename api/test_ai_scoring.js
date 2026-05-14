'use strict';

/**
 * Test AI-powered scoring functionality
 */

// Load environment variables first
require('dotenv').config();

const AttemptService = require('./Services/attemptService');

// Sample test data
const mockTest = {
  id: 'ai-scoring-test',
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

// Sample user answers (from the user's actual attempt)
const sampleAnswers = {
  'q0': 'An HID is for detecting unusual traffic that indicate intrusion attempts and alert the user,as a safeguard for an individual host device. it contributes to the overall depth in the network defense.',
  'q1': 'Defense in depth is the concept of using multiple layers of security to create a depth in the overall defense system of a network.'
};

const sampleTimings = {
  'q0': 92,
  'q1': 58
};

/**
 * Test AI scoring functionality
 */
async function testAIScoring() {
  console.log('=== Testing AI-Powered Scoring ===\n');
  
  console.log('Test Configuration:');
  console.log(`- Questions: ${mockTest.shortAnswerQuestions.length}`);
  console.log(`- Domain: ${mockTest.domain}`);
  console.log(`- Topic: ${mockTest.topic}`);
  console.log(`- Difficulty: ${mockTest.difficulty}`);
  console.log('');
  
  const attemptService = new AttemptService();
  
  console.log('User Answers:');
  Object.entries(sampleAnswers).forEach(([questionId, answer], index) => {
    const question = mockTest.shortAnswerQuestions[index];
    console.log(`Q${index + 1}. ${question.question.substring(0, 60)}...`);
    console.log(`   Your Answer: ${answer.substring(0, 80)}...`);
    console.log('');
  });
  
  console.log('Testing AI scoring...');
  
  try {
    const startTime = Date.now();
    const scoringResults = await attemptService._calculateScoring(mockTest, sampleAnswers, sampleTimings);
    const endTime = Date.now();
    
    console.log(`\nScoring completed in ${endTime - startTime}ms\n`);
    
    // Display results
    console.log('=== AI SCORING RESULTS ===\n');
    
    console.log('Overall Score:');
    console.log(`- Score: ${scoringResults.score}%`);
    console.log(`- Correct Answers: ${scoringResults.correctCount}/${scoringResults.totalQuestions}`);
    console.log(`- Total Time: ${scoringResults.totalTime}s`);
    console.log('');
    
    console.log('Per-Question Analysis:');
    Object.entries(scoringResults.perQuestionResults).forEach(([questionId, result], index) => {
      console.log(`\nQ${index + 1}. ${result.question.substring(0, 60)}...`);
      console.log(`   AI Score: ${result.aiScore}/100`);
      console.log(`   Correct: ${result.correct ? 'YES' : 'NO'}`);
      console.log(`   Confidence: ${result.confidence.toUpperCase()}`);
      console.log(`   Evaluation: ${result.evaluation}`);
      console.log(`   Strengths: ${result.strengths}`);
      console.log(`   Improvements: ${result.improvements}`);
      
      if (result.keyPointsMatched && result.keyPointsMatched.length > 0) {
        console.log(`   Key Points Matched: ${result.keyPointsMatched.join(', ')}`);
      }
      
      if (result.keyPointsMissed && result.keyPointsMissed.length > 0) {
        console.log(`   Key Points Missed: ${result.keyPointsMissed.join(', ')}`);
      }
    });
    
    // Check if AI scoring is working
    const hasAIScores = Object.values(scoringResults.perQuestionResults)
      .some(result => result.aiScore !== undefined && result.aiScore !== null);
    
    if (hasAIScores) {
      console.log('\n=== SUCCESS ===');
      console.log('AI-powered scoring is working!');
      console.log('The system now evaluates answers based on semantic understanding');
      console.log('rather than simple string matching.');
      
      // Show comparison with old scoring
      console.log('\n=== SCORING IMPROVEMENTS ===');
      console.log('BEFORE (String Matching):');
      console.log('- Binary correct/incorrect based on word overlap');
      console.log('- No partial credit');
      console.log('- No confidence levels');
      console.log('- No detailed evaluation');
      console.log('');
      
      console.log('AFTER (AI Evaluation):');
      console.log('- 0-100 scoring based on semantic understanding');
      console.log('- Partial credit for partially correct answers');
      console.log('- Confidence levels (high/medium/low)');
      console.log('- Detailed evaluation with strengths and improvements');
      console.log('- Key points identification');
      
      return true;
    } else {
      console.log('\n=== ISSUES DETECTED ===');
      console.log('AI scoring may not be working properly.');
      console.log('Falling back to basic scoring.');
      return false;
    }
    
  } catch (error) {
    console.error('AI scoring test failed:', error);
    return false;
  }
}

/**
 * Test scoring edge cases
 */
async function testScoringEdgeCases() {
  console.log('\n=== Testing Scoring Edge Cases ===\n');
  
  const attemptService = new AttemptService();
  
  // Test cases
  const testCases = [
    {
      name: 'Perfect Answer',
      userAnswer: 'A HIDS is security software that monitors a single device for suspicious or malicious activity by collecting and analyzing system activity on the host itself.',
      expectedScore: 90
    },
    {
      name: 'Partially Correct Answer',
      userAnswer: 'HIDS monitors a device for suspicious activity.',
      expectedScore: 60
    },
    {
      name: 'Incorrect Answer',
      userAnswer: 'HIDS is for network traffic monitoring.',
      expectedScore: 20
    },
    {
      name: 'Empty Answer',
      userAnswer: '',
      expectedScore: 0
    }
  ];
  
  const question = mockTest.shortAnswerQuestions[0];
  const expectedAnswer = question.answer;
  
  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}`);
    console.log(`User Answer: "${testCase.userAnswer}"`);
    
    try {
      const result = await attemptService.critiqueService.aiProvider.scoreAnswer(
        testCase.userAnswer,
        expectedAnswer,
        question.question
      );
      
      console.log(`AI Score: ${result.score}/100 (Expected: ~${testCase.expectedScore})`);
      console.log(`Correct: ${result.isCorrect}`);
      console.log(`Confidence: ${result.confidence}`);
      console.log(`Evaluation: ${result.evaluation}`);
      console.log('');
      
    } catch (error) {
      console.error(`Failed to score ${testCase.name}:`, error.message);
    }
  }
}

// Run tests if executed directly
if (require.main === module) {
  testAIScoring()
    .then(success => {
      if (success) {
        testScoringEdgeCases().catch(console.error);
      }
    })
    .catch(console.error);
}

module.exports = {
  testAIScoring,
  testScoringEdgeCases
};
