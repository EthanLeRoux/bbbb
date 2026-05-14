require('dotenv').config();
const mongoose = require('mongoose');

async function debugMongoDB() {
  try {
    console.log('=== MONGODB DEBUG ===');
    console.log('MONGO_URI:', process.env.MONGO_URI);
    
    // Check connection state
    console.log('Current connection state:', mongoose.connection.readyState);
    console.log('0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting');
    
    // Try to connect if not connected
    if (mongoose.connection.readyState !== 1) {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGO_URI);
      console.log('Connected successfully');
    }
    
    // Test a simple operation
    console.log('\n--- TESTING DATABASE OPERATION ---');
    const Test = require('./models/Test');
    
    // Create a simple test document
    const testDoc = {
      domain: 'test',
      section: 'test',
      topic: 'test',
      difficulty: 'easy',
      shortAnswerQuestions: [{
        question: 'Test question?',
        answer: 'Test answer',
        sourceConcept: 'test'
      }]
    };
    
    console.log('Creating test document...');
    const test = new Test(testDoc);
    
    console.log('Saving test document...');
    const savedTest = await test.save();
    console.log('SUCCESS! Saved test with ID:', savedTest._id);
    
    // Clean up
    console.log('Cleaning up test document...');
    await Test.findByIdAndDelete(savedTest._id);
    console.log('Test document deleted');
    
  } catch (error) {
    console.error('MONGODB ERROR:', error.message);
    console.error('Full error:', error);
  } finally {
    // Close connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  }
}

debugMongoDB();
