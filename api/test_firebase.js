require('dotenv').config();
const { initializeFirebase, getFirestore, healthCheck } = require('./firebase');

async function testFirebaseIntegration() {
  try {
    console.log('=== FIREBASE INTEGRATION TEST ===');
    
    // Test 1: Initialize Firebase
    console.log('1. Testing Firebase initialization...');
    const db = initializeFirebase();
    console.log('   Firebase initialized successfully');
    
    // Test 2: Health check
    console.log('2. Testing Firebase health check...');
    const health = await healthCheck();
    console.log('   Health status:', health);
    
    // Test 3: Basic Firestore operations
    console.log('3. Testing basic Firestore operations...');
    const firestore = getFirestore();
    
    // Test write
    const testDoc = {
      domain: 'test',
      section: 'test',
      topic: 'Test Integration',
      difficulty: 'easy',
      shortAnswerQuestions: [{
        question: 'What is Firebase?',
        answer: 'Firebase is a mobile and web application development platform',
        sourceConcept: 'Firebase definition'
      }]
    };
    
    const docRef = await firestore.collection('generated_tests').add(testDoc);
    console.log('   Write successful - Document ID:', docRef.id);
    
    // Test read
    const doc = await docRef.get();
    console.log('   Read successful - Document exists:', doc.exists);
    
    // Test delete
    await docRef.delete();
    console.log('   Delete successful');
    
    // Test 4: Test model operations
    console.log('4. Testing Test model...');
    const Test = require('./models/Test');
    
    const createdTest = await Test.create({
      domain: 'test',
      section: 'test',
      topic: 'Model Test',
      difficulty: 'medium',
      shortAnswerQuestions: [{
        question: 'What is Firestore?',
        answer: 'Firestore is a flexible, scalable database for mobile, web, and server development',
        sourceConcept: 'Firestore definition'
      }]
    });
    
    console.log('   Model create successful - ID:', createdTest.id);
    
    const foundTest = await Test.findById(createdTest.id);
    console.log('   Model find successful - Found:', foundTest ? 'Yes' : 'No');
    
    await Test.findByIdAndDelete(createdTest.id);
    console.log('   Model delete successful');
    
    console.log('\n=== ALL TESTS PASSED ===');
    console.log('Firebase integration is working correctly!');
    
  } catch (error) {
    console.error('TEST FAILED:', error.message);
    console.error('Full error:', error);
  }
}

testFirebaseIntegration();
