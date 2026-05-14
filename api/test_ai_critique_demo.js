'use strict';

/**
 * Demo script to show how AI critiques would work with proper OpenAI configuration
 */

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
    },
    {
      question: 'Explain the concept of Defense in Depth in network security.',
      answer: 'Defense in Depth is a security strategy that involves using multiple layers of protection instead of relying on a single control mechanism to enhance security resilience.',
      sourceConcept: 'Defense in Depth'
    }
  ]
};

// Mock attempt with user's actual answers
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
    },
    'q1': {
      correct: false,
      userAnswer: 'Defense in depth is the concept of using multiple layers of security to create a depth in the overall defense system of a network.',
      expectedAnswer: 'Defense in Depth is a security strategy that involves using multiple layers of protection instead of relying on a single control mechanism to enhance security resilience.',
      question: 'Explain the concept of Defense in Depth in network security.',
      timing: 58
    }
  },
  score: 0,
  totalTime: 150
};

/**
 * Demonstrate AI critique functionality
 */
async function demonstrateAICritiques() {
  console.log('=== AI Critique Demonstration ===\n');
  
  const critiqueService = new CritiqueService();
  
  console.log('1. Testing AI critique generation...');
  
  try {
    const critiques = await critiqueService.generateCritiques(mockAttempt, mockTest);
    
    console.log('\n2. Generated critiques:');
    console.log(JSON.stringify(critiques, null, 2));
    
    // Check if we got AI critiques or fallback
    const hasAICritiques = critiques.perQuestionCritiques['q0']?.confidence !== 'low';
    
    if (hasAICritiques) {
      console.log('\n3. SUCCESS: AI critiques are working!');
      
      // Show detailed critique for first question
      const firstCritique = critiques.perQuestionCritiques['q0'];
      console.log('\n4. Sample AI Critique:');
      console.log(`- Question: ${firstCritique.question.substring(0, 80)}...`);
      console.log(`- User Answer: ${firstCritique.userAnswer.substring(0, 80)}...`);
      console.log(`- Expected Answer: ${firstCritique.expectedAnswer.substring(0, 80)}...`);
      console.log(`- AI Feedback: ${firstCritique.critique}`);
      console.log(`- Explanation: ${firstCritique.explanation}`);
      console.log(`- Improvement: ${firstCritique.improvement}`);
      console.log(`- Confidence: ${firstCritique.confidence}`);
      
    } else {
      console.log('\n3. FALLBACK: Using basic critiques (AI not available)');
      console.log('This indicates the OpenAI API key is not configured.');
      
      // Show what the fallback looks like
      const firstCritique = critiques.perQuestionCritiques['q0'];
      console.log('\n4. Fallback Critique:');
      console.log(`- Feedback: ${firstCritique.critique}`);
      console.log(`- Explanation: ${firstCritique.explanation}`);
      console.log(`- Improvement: ${firstCritique.improvement}`);
      console.log(`- Confidence: ${firstCritique.confidence}`);
    }
    
    console.log('\n5. Overall Analysis:');
    console.log(`- Weaknesses: ${critiques.overallWeaknesses.length} identified`);
    console.log(`- Recommendations: ${critiques.studyRecommendations.length} provided`);
    console.log(`- Strengths: ${critiques.strengths.length} recognized`);
    
    return hasAICritiques;
    
  } catch (error) {
    console.error('Demo failed:', error);
    return false;
  }
}

/**
 * Show what AI critiques would look like with proper configuration
 */
function showExpectedAICritiques() {
  console.log('\n=== Expected AI Critiques (with OpenAI API) ===\n');
  
  console.log('With proper OpenAI API configuration, the critiques would include:\n');
  
  console.log('PER-QUESTION FEEDBACK:');
  console.log('Q1. HIDS Question');
  console.log('  AI Feedback: "Your answer focuses on network traffic detection, but HIDS specifically monitors system activity on the host device itself rather than network traffic."');
  console.log('  Explanation: "A HIDS operates at the host level, analyzing system calls, file access patterns, and process behavior to detect malicious activities on individual devices."');
  console.log('  Improvement: "Focus on understanding that HIDS monitors host-based indicators like file integrity, log analysis, and process monitoring rather than network traffic."');
  console.log('  Confidence: "high"');
  console.log('');
  
  console.log('Q2. Defense in Depth Question');
  console.log('  AI Feedback: "You correctly identified the multi-layer concept, but could emphasize the strategic aspect and resilience benefits."');
  console.log('  Explanation: "Defense in Depth is about creating redundancy in security controls so that if one layer fails, others continue to protect the system."');
  console.log('  Improvement: "Study real-world examples of how multiple security layers (network, host, application, data) work together to provide comprehensive protection."');
  console.log('  Confidence: "medium"');
  console.log('');
  
  console.log('OVERALL ANALYSIS:');
  console.log('Weaknesses:');
  console.log('- Confusion between host-based and network-based security concepts');
  console.log('- Need to emphasize strategic aspects over technical descriptions');
  console.log('- Missing key terminology precision in cybersecurity definitions');
  console.log('');
  
  console.log('Study Recommendations:');
  console.log('- Review the distinction between HIDS (host-based) and NIDS (network-based) intrusion detection');
  console.log('- Study Defense in Depth case studies to understand practical implementation');
  console.log('- Focus on precise cybersecurity terminology and definitions');
  console.log('');
  
  console.log('Strengths:');
  console.log('- Good understanding of multi-layer security concepts');
  console.log('- Ability to connect security concepts to practical outcomes');
  console.log('- Comprehensive coverage of all question topics');
}

/**
 * Show setup instructions
 */
function showSetupInstructions() {
  console.log('\n=== Setup Instructions ===\n');
  
  console.log('To enable AI critiques, you need to:');
  console.log('1. Set up OpenAI API key:');
  console.log('   export OPENAI_API_KEY="your-openai-api-key-here"');
  console.log('   # Or add to .env file:');
  console.log('   OPENAI_API_KEY=your-openai-api-key-here');
  console.log('');
  console.log('2. Ensure you have OpenAI API access with sufficient credits');
  console.log('3. The system uses gpt-3.5-turbo model for cost efficiency');
  console.log('4. Each critique generation costs approximately $0.001-0.005 per attempt');
  console.log('');
  console.log('Current Status: Using fallback critiques due to missing API key');
}

/**
 * Main demo runner
 */
async function runDemo() {
  console.log('AI Critique System Demonstration\n');
  console.log('Based on your actual test attempt from "First real benkyo ai test for nes511"\n');
  
  const aiWorking = await demonstrateAICritiques();
  
  if (!aiWorking) {
    showExpectedAICritiques();
    showSetupInstructions();
  }
  
  console.log('\n=== Summary ===');
  console.log(`AI Status: ${aiWorking ? 'WORKING' : 'NOT CONFIGURED'}`);
  console.log('Current critiques are basic fallbacks.');
  console.log('With OpenAI API key, you would get detailed, personalized feedback.');
}

// Run demo if executed directly
if (require.main === module) {
  runDemo().catch(console.error);
}

module.exports = {
  demonstrateAICritiques,
  showExpectedAICritiques,
  showSetupInstructions,
  runDemo
};
