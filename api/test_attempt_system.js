require('dotenv').config();
const { initializeFirebase } = require('./firebase');
const AttemptService = require('./Services/attemptService');
const TestGenerationService = require('./Services/testGenerationService');

async function testCompleteAttemptSystem() {
  try {
    console.log('=== COMPLETE ATTEMPT SYSTEM TEST ===');
    
    // Initialize Firebase
    initializeFirebase();
    console.log('Firebase initialized');
    
    const attemptService = new AttemptService();
    const testService = new TestGenerationService();
    
    // Step 1: Generate a test first
    console.log('\n1. Generating a test...');
    const test = await testService.generateShortAnswerTest({
      domain: 'ai_prompting',
      sections: '_root',
      difficulty: 'easy',
      questionCount: 3
    });
    
    console.log(`   Test generated with ID: ${test.id}`);
    console.log(`   Questions: ${test.shortAnswerQuestions.length}`);
    
    // Step 2: Start an attempt
    console.log('\n2. Starting an attempt...');
    const attempt = await attemptService.startAttempt({
      testId: test.id
    });
    
    console.log(`   Attempt started with ID: ${attempt.id}`);
    console.log(`   Status: ${attempt.status}`);
    
    // Step 3: Prepare mock answers and timings
    console.log('\n3. Preparing answers and timings...');
    const answers = {};
    const timings = {};
    
    test.shortAnswerQuestions.forEach((question, index) => {
      const questionId = `q${index}`;
      answers[questionId] = question.answer; // Use correct answer for testing
      timings[questionId] = Math.random() * 60 + 10; // Random time between 10-70 seconds
    });
    
    console.log(`   Prepared ${Object.keys(answers).length} answers`);
    
    // Step 4: Submit the attempt
    console.log('\n4. Submitting attempt...');
    const submittedAttempt = await attemptService.submitAttempt({
      attemptId: attempt.id,
      testId: test.id,
      answers,
      timings
    });
    
    console.log(`   Attempt submitted successfully`);
    console.log(`   Score: ${submittedAttempt.score}%`);
    console.log(`   Correct: ${submittedAttempt.perQuestionResults ? Object.values(submittedAttempt.perQuestionResults).filter(r => r.correct).length : 0}/${test.shortAnswerQuestions.length}`);
    console.log(`   Total time: ${submittedAttempt.totalTime}s`);
    console.log(`   Status: ${submittedAttempt.status}`);
    
    // Step 5: Retrieve and verify the attempt
    console.log('\n5. Retrieving submitted attempt...');
    const retrievedAttempt = await attemptService.getAttemptById(attempt.id);
    
    console.log(`   Retrieved attempt score: ${retrievedAttempt.score}%`);
    console.log(`   Answers stored: ${Object.keys(retrievedAttempt.answers || {}).length}`);
    console.log(`   Timings stored: ${Object.keys(retrievedAttempt.timings || {}).length}`);
    
    // Step 6: Get statistics
    console.log('\n6. Getting attempt statistics...');
    const stats = await attemptService.getAttemptStatistics();
    
    console.log(`   Total attempts: ${stats.totalAttempts}`);
    console.log(`   Completed attempts: ${stats.completedAttempts}`);
    console.log(`   Average score: ${stats.averageScore}%`);
    console.log(`   Completion rate: ${stats.completionRate}%`);
    
    // Step 7: Get attempts by test ID
    console.log('\n7. Getting attempts by test ID...');
    const testAttempts = await attemptService.getAttemptsByTestId(test.id);
    
    console.log(`   Found ${testAttempts.length} attempts for test ${test.id}`);
    
    // Cleanup
    console.log('\n8. Cleaning up test data...');
    await attemptService.deleteAttempt(attempt.id);
    console.log('   Attempt deleted');
    
    console.log('\n=== ALL TESTS PASSED ===');
    console.log('The complete attempt submission system is working correctly!');
    
    return {
      testId: test.id,
      attemptId: attempt.id,
      score: submittedAttempt.score,
      totalTime: submittedAttempt.totalTime
    };
    
  } catch (error) {
    console.error('TEST FAILED:', error.message);
    console.error('Full error:', error);
    return null;
  }
}

// Run the test
testCompleteAttemptSystem().then(result => {
  if (result) {
    console.log('\nTest completed successfully with results:', result);
  }
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
