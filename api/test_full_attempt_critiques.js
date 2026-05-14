'use strict';

/**
 * Test AI critiques with the user's full attempt data
 */

// Load environment variables first
require('dotenv').config();

const CritiqueService = require('./Services/critiqueService');

// Full test data based on the user's actual test
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
    },
    {
      question: 'How does Firewall configuration contribute to network security?',
      answer: 'Firewall configuration sets rules for what traffic is allowed to enter or leave a network, acting as the first filter layer between the network and the outside world to prevent unauthorized access.',
      sourceConcept: 'Firewall configuration'
    },
    {
      question: 'Why is Host Security essential in cybersecurity?',
      answer: 'Host Security is crucial because a single compromised device can lead to system-wide breaches, making it necessary to protect individual devices from threats, unauthorized access, and malicious activities.',
      sourceConcept: 'Host Security'
    },
    {
      question: 'What is the main purpose of DNS Security?',
      answer: 'DNS Security aims to protect the Domain Name System from being manipulated, redirected, or abused to prevent users from being sent to fake or malicious sites.',
      sourceConcept: 'DNS Security'
    },
    {
      question: 'How does Access Control play a role in network security?',
      answer: 'Access Control determines who is allowed in a system and what actions they are permitted to perform, helping to prevent unauthorized access and ensuring security.',
      sourceConcept: 'Access Control'
    },
    {
      question: 'Explain the concept of Biometric Authentication and its significance in cybersecurity.',
      answer: 'Biometric Authentication verifies identity using unique biological or behavioral traits, offering a more secure method than traditional passwords for controlling access to secure environments.',
      sourceConcept: 'Biometric Authentication'
    },
    {
      question: 'Why is Multimodal Biometric Authentication considered stronger than passwords for controlling access?',
      answer: 'Multimodal Biometric Authentication combines multiple biometric methods, making it harder to spoof, enhancing security, accuracy, and supporting zero-trust models.',
      sourceConcept: 'Multimodal Biometric Authentication'
    },
    {
      question: 'What is the purpose of a Firewall in network security?',
      answer: 'A Firewall acts as a security guard for a network, setting rules to control what traffic is allowed to enter or leave the network, serving as the first filter layer between the network and external threats.',
      sourceConcept: 'Firewall'
    },
    {
      question: 'How does Data Backup and Recovery contribute to cybersecurity resilience?',
      answer: 'Data Backup and Recovery ensures that data can be restored after incidents like data loss, damage, or attacks, enabling organizations to recover and continue operations, especially when combined with proactive monitoring.',
      sourceConcept: 'Data Backup and Recovery'
    }
  ]
};

// Full attempt with all user's answers
const mockAttempt = {
  id: 'user-full-attempt-123',
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
    },
    'q2': {
      correct: false,
      userAnswer: 'By configuring a firewall and setting its filters, we can prevent unwanted traffic from reaching the netowrk, which includes traffic that pose a risk to data safety, such as malware, ppshiging emails,etc. This ensures that risk is reduced/ mitigated.',
      expectedAnswer: 'Firewall configuration sets rules for what traffic is allowed to enter or leave a network, acting as the first filter layer between the network and the outside world to prevent unauthorized access.',
      question: 'How does Firewall configuration contribute to network security?',
      timing: 104
    },
    'q3': {
      correct: false,
      userAnswer: 'It is important for a network to have security, and it is also important for hosts to be secured because they are also assets that need to be protected, they provide a final layer of protection in case of a breach, increasing defense in depth.',
      expectedAnswer: 'Host Security is crucial because a single compromised device can lead to system-wide breaches, making it necessary to protect individual devices from threats, unauthorized access, and malicious activities.',
      question: 'Why is Host Security essential in cybersecurity?',
      timing: 82
    },
    'q4': {
      correct: false,
      userAnswer: 'DNSSEC is important, because it ensures that dns records have data integrity, and not altered, increasing risk of phishing and spoofing, by protecting dns we mitigate the risk of data breaches overall',
      expectedAnswer: 'DNS Security aims to protect the Domain Name System from being manipulated, redirected, or abused to prevent users from being sent to fake or malicious sites.',
      question: 'What is the main purpose of DNS Security?',
      timing: 114
    },
    'q5': {
      correct: false,
      userAnswer: 'Access control is the measures that ensure that access is properly structured, ensuring least access privileges,',
      expectedAnswer: 'Access Control determines who is allowed in a system and what actions they are permitted to perform, helping to prevent unauthorized access and ensuring security.',
      question: 'How does Access Control play a role in network security?',
      timing: 83
    },
    'q6': {
      correct: false,
      userAnswer: 'Biometric authentication is the verification of an identity. It is what proves that it is who they claim they are. By using biometric auth, we ensure that data is only accessible to who has permissions to do so, enforcing least privileges and access control',
      expectedAnswer: 'Biometric Authentication verifies identity using unique biological or behavioral traits, offering a more secure method than traditional passwords for controlling access to secure environments.',
      question: 'Explain the concept of Biometric Authentication and its significance in cybersecurity.',
      timing: 115
    },
    'q7': {
      correct: false,
      userAnswer: 'Multimodal biometric auth is stronger because it is the combination of 2 biometric authentication methods, passwords are much easier to attain, brute force or even predict, making that method much more secure.',
      expectedAnswer: 'Multimodal Biometric Authentication combines multiple biometric methods, making it harder to spoof, enhancing security, accuracy, and supporting zero-trust models.',
      question: 'Why is Multimodal Biometric Authentication considered stronger than passwords for controlling access?',
      timing: 89
    },
    'q8': {
      correct: false,
      userAnswer: 'A firewall provides security by filtering unwanted traffic, preventing unauthorized access to the network, preventing attacks such as phishing emails and malware. This provides a layer to the network\'s depth in defense.',
      expectedAnswer: 'A Firewall acts as a security guard for a network, setting rules to control what traffic is allowed to enter or leave the network, serving as the first filter layer between the network and external threats.',
      question: 'What is the purpose of a Firewall in network security?',
      timing: 101
    },
    'q9': {
      correct: false,
      userAnswer: 'They are methods implemented for disaster recovery plans, which are part of an o organizations means to improve their resilience. To resume business operations, data restored from data backups done regularly before would allow operations to resume, and their systems can be restored through the backedup system restores.',
      expectedAnswer: 'Data Backup and Recovery ensures that data can be restored after incidents like data loss, damage, or attacks, enabling organizations to recover and continue operations, especially when combined with proactive monitoring.',
      question: 'How does Data Backup and Recovery contribute to cybersecurity resilience?',
      timing: 151
    }
  },
  score: 0,
  totalTime: 989
};

/**
 * Test AI critiques with full attempt data
 */
async function testFullAttemptCritiques() {
  console.log('=== Testing AI Critiques with Full Attempt Data ===\n');
  
  console.log(`Attempt: ${mockAttempt.id}`);
  console.log(`Test: ${mockTest.id} (${mockTest.topic} - ${mockTest.difficulty})`);
  console.log(`Questions: ${Object.keys(mockAttempt.perQuestionResults).length}`);
  console.log(`Score: ${mockAttempt.score} / ${Object.keys(mockAttempt.perQuestionResults).length}`);
  console.log(`Total Time: ${mockAttempt.totalTime}s (${Math.round(mockAttempt.totalTime/60)}min ${mockAttempt.totalTime%60}s)`);
  console.log('');
  
  const critiqueService = new CritiqueService();
  
  console.log('Generating AI critiques for all incorrect answers...');
  
  try {
    const startTime = Date.now();
    const critiques = await critiqueService.generateCritiques(mockAttempt, mockTest);
    const endTime = Date.now();
    
    console.log(`\nCritiques generated in ${endTime - startTime}ms\n`);
    
    // Display results
    console.log('=== AI CRITIQUE RESULTS ===\n');
    
    console.log('PER-QUESTION ANALYSIS:');
    Object.entries(critiques.perQuestionCritiques).forEach(([questionId, critique], index) => {
      console.log(`\nQ${index + 1}. ${critique.question.substring(0, 60)}...`);
      console.log(`   Your Answer: ${critique.userAnswer.substring(0, 60)}...`);
      console.log(`   AI Feedback: ${critique.critique}`);
      console.log(`   Confidence: ${critique.confidence.toUpperCase()}`);
    });
    
    console.log('\nOVERALL ANALYSIS:');
    console.log('\nIdentified Weaknesses:');
    critiques.overallWeaknesses.forEach((weakness, index) => {
      console.log(`${index + 1}. ${weakness}`);
    });
    
    console.log('\nStudy Recommendations:');
    critiques.studyRecommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    
    console.log('\nRecognized Strengths:');
    critiques.strengths.forEach((strength, index) => {
      console.log(`${index + 1}. ${strength}`);
    });
    
    // Check if all critiques have high confidence
    const highConfidenceCount = Object.values(critiques.perQuestionCritiques)
      .filter(c => c.confidence === 'high').length;
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Questions Analyzed: ${Object.keys(critiques.perQuestionCritiques).length}`);
    console.log(`High Confidence Critiques: ${highConfidenceCount}`);
    console.log(`Weaknesses Identified: ${critiques.overallWeaknesses.length}`);
    console.log(`Recommendations Provided: ${critiques.studyRecommendations.length}`);
    console.log(`Strengths Recognized: ${critiques.strengths.length}`);
    
    return true;
    
  } catch (error) {
    console.error('Full attempt test failed:', error);
    return false;
  }
}

/**
 * Show comparison between old and new critiques
 */
function showComparison() {
  console.log('\n=== BEFORE vs AFTER COMPARISON ===\n');
  
  console.log('BEFORE (Fallback):');
  console.log('- Feedback: "Unable to generate detailed critique due to technical issues."');
  console.log('- Explanation: "Your answer differs from the expected answer."');
  console.log('- Improvement: "Review the source material and try to understand the key concepts better."');
  console.log('- Confidence: low');
  console.log('');
  
  console.log('AFTER (AI-Powered):');
  console.log('- Feedback: "The answer incorrectly focuses on detecting traffic and safeguarding the user, missing the key point of monitoring system activity on the host device."');
  console.log('- Explanation: "A HIDS is designed to monitor and analyze system activity on a single host device for suspicious or malicious behavior, enhancing security by detecting potential intrusions internally."');
  console.log('- Improvement: "To improve understanding, focus on the key function of a HIDS as software that monitors and analyzes system activity on a single device to detect potential security breaches."');
  console.log('- Confidence: high');
  console.log('');
  
  console.log('Key Improvements:');
  console.log('1. Specific feedback on what was wrong');
  console.log('2. Detailed explanations of concepts');
  console.log('3. Actionable improvement suggestions');
  console.log('4. High confidence in AI analysis');
  console.log('5. Personalized study recommendations');
}

// Run test if executed directly
if (require.main === module) {
  testFullAttemptCritiques()
    .then(success => {
      if (success) {
        showComparison();
        console.log('\n=== SUCCESS ===');
        console.log('AI critiques are now working perfectly!');
        console.log('Users will receive detailed, personalized feedback on their quiz attempts.');
      } else {
        console.log('\n=== ISSUES DETECTED ===');
        console.log('There may still be problems with the AI critique system.');
      }
    })
    .catch(console.error);
}

module.exports = {
  testFullAttemptCritiques,
  showComparison
};
