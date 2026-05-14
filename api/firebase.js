'use strict';

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

/**
 * Firebase Admin SDK configuration and initialization.
 * Loads service account key from local file and initializes Firestore.
 */

let db = null;
let app = null;

/**
 * Initialize Firebase Admin SDK with service account key.
 * @returns {admin.firestore.Firestore} Firestore database instance
 */
function initializeFirebase() {
  if (db) {
    return db; // Return existing instance if already initialized
  }

  try {
    // Load service account key from local file
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
      path.join(__dirname, 'service-account-key.json');

    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(`Service account key file not found at: ${serviceAccountPath}`);
    }

    const serviceAccount = require(serviceAccountPath);

    // Initialize Firebase Admin SDK
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    // Get Firestore instance
    db = admin.firestore();

    // Configure Firestore settings
    db.settings({
      timestampsInSnapshots: true,
      ignoreUndefinedProperties: false
    });

    console.log('Firebase Admin SDK initialized successfully');
    console.log('Firestore database connected');

    return db;

  } catch (error) {
    console.error('Failed to initialize Firebase:', error.message);
    throw error;
  }
}

/**
 * Get Firestore database instance.
 * Initializes Firebase if not already done.
 * @returns {admin.firestore.Firestore} Firestore database instance
 */
function getFirestore() {
  if (!db) {
    return initializeFirebase();
  }
  return db;
}

/**
 * Get Firebase Admin app instance.
 * @returns {admin.app.App} Firebase Admin app instance
 */
function getFirebaseApp() {
  if (!app) {
    initializeFirebase();
  }
  return app;
}

/**
 * Health check for Firebase connection.
 * @returns {Promise<Object>} Health status
 */
async function healthCheck() {
  try {
    const firestore = getFirestore();
    
    // Test a simple read operation
    const testDoc = await firestore.collection('_health').doc('test').get();
    
    return {
      status: 'healthy',
      message: 'Firebase/Firestore is accessible',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Firebase health check failed: ${error.message}`,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Convert Firestore document to plain object with proper ID handling.
 * @param {admin.firestore.DocumentSnapshot} doc - Firestore document snapshot
 * @returns {Object} Plain object with document data and ID
 */
function docToObject(doc) {
  if (!doc.exists) {
    return null;
  }

  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate?.() || data.createdAt,
    updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
  };
}

/**
 * Create a document with timestamps.
 * @param {Object} data - Document data
 * @returns {Object} Data with timestamps added
 */
function createDocumentWithTimestamps(data) {
  return {
    ...data,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
}

/**
 * Update a document with updated timestamp.
 * @param {Object} data - Document data
 * @returns {Object} Data with updated timestamp added
 */
function updateDocumentWithTimestamp(data) {
  return {
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
}

/**
 * Close Firebase connection (for graceful shutdown).
 * @returns {Promise<void>}
 */
async function closeConnection() {
  if (app) {
    await app.delete();
    console.log('Firebase connection closed');
    db = null;
    app = null;
  }
}

module.exports = {
  initializeFirebase,
  getFirestore,
  getFirebaseApp,
  healthCheck,
  docToObject,
  createDocumentWithTimestamps,
  updateDocumentWithTimestamp,
  closeConnection
};
