require('dotenv').config();
const VaultService = require('./Services/vaultService');
const PromptBuilder = require('./Services/promptBuilder');
const AIProvider = require('./Services/aiProvider');

async function testAIOnly() {
  try {
    console.log('=== AI-ONLY TEST ===');
    
    // Step 1: Get vault notes
    console.log('Getting vault notes...');
    const vaultService = new VaultService();
    const notes = await vaultService.getNotesBySection('books', 'Network Security Fundamentals by Gert De Laet');
    console.log(`Found ${notes.length} notes`);
    
    // Step 2: Build prompt
    console.log('Building prompt...');
    const prompt = PromptBuilder.buildPrompt({
      domain: 'books',
      sections: 'Network Security Fundamentals by Gert De Laet',
      notes,
      difficulty: 'medium',
      questionCount: 3
    });
    console.log('Prompt built (length:', prompt.length, 'characters)');
    
    // Step 3: Generate questions
    console.log('Generating questions...');
    const aiProvider = new AIProvider();
    const response = await aiProvider.generateQuestions(prompt);
    
    console.log('SUCCESS! Generated response:');
    console.log('- Topic:', response.topic);
    console.log('- Difficulty:', response.difficulty);
    console.log('- Questions:', response.shortAnswerQuestions.length);
    console.log('- First question:', response.shortAnswerQuestions[0]?.question);
    console.log('- First answer:', response.shortAnswerQuestions[0]?.answer);
    
  } catch (error) {
    console.error('AI-ONLY TEST ERROR:', error.message);
    console.error('Full error:', error);
    console.error('Stack:', error.stack);
  }
}

testAIOnly();
