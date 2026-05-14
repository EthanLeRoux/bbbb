/**
 * Test Simple Submission Directly
 * Test the spaced repetition service directly
 */

const VaultSpacedRepetitionIntegration = require('./Services/vaultSpacedRepetitionIntegration');

async function testDirectSubmission() {
  console.log('=== TESTING DIRECT SUBMISSION ===\n');

  try {
    // Initialize the service
    const { initializeFirebase } = require('./firebase');
    initializeFirebase();
    
    const vaultIntegration = new VaultSpacedRepetitionIntegration();

    // Test simple submission
    console.log('1. Testing direct vault integration...');
    const testData = {
      vaultId: 'direct-test-123',
      scorePercent: 75,
      totalQuestions: 10,
      correctAnswers: 7,
      avgTimePerQuestion: 45
    };

    const result = await vaultIntegration.processVaultTestSubmission(testData);
    console.log('SUCCESS: Direct submission worked');
    console.log('Result:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('Direct submission failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run test
testDirectSubmission();
