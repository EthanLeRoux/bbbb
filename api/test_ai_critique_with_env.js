'use strict';

/**
 * Test AI critiques with proper environment variable loading
 */

// Load environment variables first
require('dotenv').config();

const CritiqueService = require('./Services/critiqueService');

// Mock test data based on the user's actual attempt
const mockTest = {
  id: 'nes511-test',
  topic: 'university',
  difficulty: 'hard',
  domain: 'university',
  shortAnswerQuestions: [
    {
      question: 'What is the purpose of a Host-Based Intrusion Detection System (HIDS)?',
      answer: 'A HIDS is security software that monitors a single device for suspicious or malicious activity by collecting and analyzing system activity on the host itself.',
      sourceConcept: 'Host-Based Intrusion Detection System (HIDS)'
    }
  ]
};

// Mock attempt with user's actual answer
const mockAttempt = {
  id: 'user-attempt-123',
  testId: mockTest.id,
  perQuestionResults: {
    'q0': {
      correct: false,
      userAnswer: 'An HID is for detecting unusual traffic that indicate intrusion attempts and alert the user,as a safeguard for an individual host device. it contributes to the overall depth in the network defense.',
      expectedAnswer: 'A HIDS is security software that monitors a single device for suspicious or malicious activity by collecting and analyzing system activity on the host itself.',
      question: 'What is the purpose of a Host-Based Intrusion Detection System (HIDS)?',
      timing: 92
    }
  },
  score: 0,
  totalTime: 92
};

/**
 * Test AI critiques with environment variables loaded
 */
async function testAICritiquesWithEnv() {
  console.log('=== Testing AI Critiques with Environment Variables ===\n');
  
  // Check if environment variable is loaded
  console.log('Environment check:');
  console.log(`OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET'}`);
  
  if (!process.env.OPENAI_API_KEY) {
    console.log('\nERROR: OPENAI_API_KEY is not set in environment variables');
    console.log('Make sure your .env file contains: OPENAI_API_KEY=your-key-here');
    return false;
  }
  
  console.log('\n1. Initializing CritiqueService...');
  const critiqueService = new CritiqueService();
  
  console.log('2. Testing AI critique generation...');
  
  try {
    const critiques = await critiqueService.generateCritiques(mockAttempt, mockTest);
    
    console.log('\n3. Generated critiques:');
    console.log(JSON.stringify(critiques, null, 2));
    
    // Check if we got AI critiques or fallback
    const firstCritique = critiques.perQuestionCritiques['q0'];
    const hasAICritiques = firstCritique?.confidence !== 'low';
    
    if (hasAICritiques) {
      console.log('\n4. SUCCESS: AI critiques are working!');
      console.log('\nDetailed AI Feedback:');
      console.log(`- Question: ${firstCritique.question}`);
      console.log(`- User Answer: ${firstCritique.userAnswer}`);
      console.log(`- Expected Answer: ${firstCritique.expectedAnswer}`);
      console.log(`- AI Feedback: ${firstCritique.critique}`);
      console.log(`- Explanation: ${firstCritique.explanation}`);
      console.log(`- Improvement: ${firstCritique.improvement}`);
      console.log(`- Confidence: ${firstCritique.confidence}`);
      
      return true;
    } else {
      console.log('\n4. STILL FALLBACK: AI critiques not working despite API key');
      console.log('This suggests an issue with the OpenAI API call itself.');
      return false;
    }
    
  } catch (error) {
    console.error('Test failed:', error);
    return false;
  }
}

/**
 * Test OpenAI API directly
 */
async function testOpenAIAPI() {
  console.log('\n=== Testing OpenAI API Directly ===\n');
  
  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    console.log('1. Testing OpenAI connection...');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational assessment designer. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: 'Respond with JSON: {"status": "test", "message": "OpenAI API is working"}'
        }
      ],
      temperature: 0.1,
      max_tokens: 100,
      response_format: { type: 'json_object' }
    });
    
    console.log('2. OpenAI API Response:');
    console.log(JSON.stringify(response.choices[0].message.content, null, 2));
    
    return true;
    
  } catch (error) {
    console.error('OpenAI API test failed:', error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('AI Critique System Test with Environment Variables\n');
  
  const envWorking = await testAICritiquesWithEnv();
  
  if (!envWorking) {
    console.log('\nTesting OpenAI API directly...');
    const apiWorking = await testOpenAIAPI();
    
    if (!apiWorking) {
      console.log('\n=== Diagnosis ===');
      console.log('Issue: OpenAI API key is set but API calls are failing');
      console.log('Possible causes:');
      console.log('- Invalid API key');
      console.log('- No OpenAI credits');
      console.log('- Network connectivity issues');
      console.log('- OpenAI service outage');
    } else {
      console.log('\n=== Diagnosis ===');
      console.log('Issue: OpenAI API works but critique service fails');
      console.log('Possible causes:');
      console.log('- Prompt formatting issues');
      console.log('- JSON parsing problems');
      console.log('- Service logic errors');
    }
  }
  
  console.log('\n=== Summary ===');
  console.log(`Environment Variables: ${process.env.OPENAI_API_KEY ? 'LOADED' : 'NOT LOADED'}`);
  console.log(`AI Critiques: ${envWorking ? 'WORKING' : 'NOT WORKING'}`);
  
  return envWorking;
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testAICritiquesWithEnv,
  testOpenAIAPI,
  runTests
};
