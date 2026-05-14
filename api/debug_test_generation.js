require('dotenv').config();
const TestGenerationService = require('./Services/testGenerationService');

async function debugTestGeneration() {
  try {
    console.log('=== TEST GENERATION DEBUG ===');
    console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
    console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length || 0);
    
    const testService = new TestGenerationService();
    
    // Test AI provider health first
    console.log('\n--- AI PROVIDER HEALTH CHECK ---');
    const health = await testService.aiProvider.healthCheck();
    console.log('AI Health:', health);
    
    if (health.status !== 'healthy') {
      console.error('AI provider is not healthy, stopping test');
      return;
    }
    
    // Try to generate test
    console.log('\n--- GENERATING TEST ---');
    const test = await testService.generateShortAnswerTest({
      domain: 'books',
      sections: 'Network Security Fundamentals by Gert De Laet',
      difficulty: 'medium',
      questionCount: 5  // Reduced for testing
    });
    
    console.log('SUCCESS! Generated test:');
    console.log('- Domain:', test.domain);
    console.log('- Section:', test.section);
    console.log('- Questions:', test.shortAnswerQuestions.length);
    console.log('- First question:', test.shortAnswerQuestions[0]?.question);
    
  } catch (error) {
    console.error('DEBUG ERROR:', error.message);
    console.error('Full error:', error);
    console.error('Stack:', error.stack);
  }
}

debugTestGeneration();
