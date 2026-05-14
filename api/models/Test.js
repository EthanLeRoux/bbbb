'use strict';

const { getFirestore, docToObject, createDocumentWithTimestamps, updateDocumentWithTimestamp } = require('../firebase');

/**
 * Firestore operations for generated short-answer tests.
 * Replaces MongoDB schema with Firestore collection operations.
 */

const COLLECTION_NAME = 'generated_tests';

class TestModel {
  /**
   * Create a new test document in Firestore.
   * @param {Object} testData - Test data
   * @returns {Promise<Object>} Created test document
   */
  static async create(testData) {
    try {
      const firestore = getFirestore();
      
      // Validate required fields
      if (!testData.domain || !testData.section || !testData.topic || !testData.difficulty) {
        throw new Error('Missing required fields: domain, section, topic, difficulty');
      }

      if (!testData.shortAnswerQuestions || testData.shortAnswerQuestions.length === 0) {
        throw new Error('Test must contain at least one question');
      }

      // Generate default name if not provided
      let testName = testData.name;
      if (!testName || testName.trim().length === 0) {
        testName = this._generateDefaultName(testData);
      }

      // Prepare source notes data if included
      let sourceNotes = [];
      if (testData.sourceNotes && Array.isArray(testData.sourceNotes)) {
        sourceNotes = testData.sourceNotes.map(note => ({
          id: note.id || note.noteId || '',
          noteId: note.id || note.noteId || '',
          title: note.title || note.noteTitle || 'Untitled note',
          noteTitle: note.title || note.noteTitle || 'Untitled note',
          type: note.type || '',
          domain: note.domain || '',
          section: note.section || '',
          topic: note.topic || '',
          source: note.source || '',
          tags: Array.isArray(note.tags) ? note.tags : [],
        }));
      }

      // Add timestamps and metadata
      const documentData = createDocumentWithTimestamps({
        ...testData,
        name: testName.trim(),
        generatedBy: 'ai-short-answer-generator',
        sourceNotes
      });

      // Create document
      const docRef = await firestore.collection(COLLECTION_NAME).add(documentData);
      const doc = await docRef.get();

      console.log(`[TestModel] Created test with ID: ${doc.id}, name: "${testName}"`);
      const testObj = docToObject(doc);
      
      // Add toJSON method for compatibility
      testObj.toJSON = () => testObj;
      
      return testObj;
    } catch (error) {
      console.error('[TestModel] Create error:', error);
      throw error;
    }
  }

  /**
   * Find tests by domain and section.
   * @param {string} domain - Domain name
   * @param {string} section - Section name
   * @returns {Promise<Array>} Array of test documents
   */
  static async findByDomainAndSection(domain, section) {
    try {
      const firestore = getFirestore();
      
      const snapshot = await firestore.collection(COLLECTION_NAME)
        .where('domain', '==', domain.toLowerCase().trim())
        .where('section', '==', section.toLowerCase().trim())
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => {
        const testObj = docToObject(doc);
        testObj.toJSON = () => testObj;
        return testObj;
      });
    } catch (error) {
      console.error('[TestModel] findByDomainAndSection error:', error);
      throw error;
    }
  }

  /**
   * Find tests by difficulty.
   * @param {string} difficulty - Difficulty level
   * @returns {Promise<Array>} Array of test documents
   */
  static async findByDifficulty(difficulty) {
    try {
      const firestore = getFirestore();
      
      const snapshot = await firestore.collection(COLLECTION_NAME)
        .where('difficulty', '==', difficulty)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => {
        const testObj = docToObject(doc);
        testObj.toJSON = () => testObj;
        return testObj;
      });
    } catch (error) {
      console.error('[TestModel] findByDifficulty error:', error);
      throw error;
    }
  }

  /**
   * Get recent tests.
   * @param {number} days - Number of days to look back
   * @param {number} limit - Maximum results
   * @returns {Promise<Array>} Array of test documents
   */
  static async findRecent(days = 7, limit = 20) {
    try {
      const firestore = getFirestore();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const snapshot = await firestore.collection(COLLECTION_NAME)
        .where('createdAt', '>=', cutoffDate)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => {
        const testObj = docToObject(doc);
        testObj.toJSON = () => testObj;
        return testObj;
      });
    } catch (error) {
      console.error('[TestModel] findRecent error:', error);
      throw error;
    }
  }

  /**
   * Get statistics by domain.
   * @returns {Promise<Array>} Array of domain statistics
   */
  static async getStatsByDomain() {
    try {
      const firestore = getFirestore();
      
      const snapshot = await firestore.collection(COLLECTION_NAME).get();
      const tests = snapshot.docs.map(docToObject);

      // Group by domain
      const domainStats = {};
      tests.forEach(test => {
        const domain = test.domain;
        if (!domainStats[domain]) {
          domainStats[domain] = {
            domain,
            totalTests: 0,
            totalQuestions: 0,
            difficulties: new Set(),
            sections: new Set(),
            lastGenerated: null
          };
        }

        const stats = domainStats[domain];
        stats.totalTests++;
        stats.totalQuestions += test.shortAnswerQuestions?.length || 0;
        stats.difficulties.add(test.difficulty);
        stats.sections.add(test.section);

        if (!stats.lastGenerated || test.createdAt > stats.lastGenerated) {
          stats.lastGenerated = test.createdAt;
        }
      });

      // Convert Sets to arrays and calculate averages
      return Object.values(domainStats)
        .map(stats => ({
          domain: stats.domain,
          totalTests: stats.totalTests,
          totalQuestions: stats.totalQuestions,
          avgQuestionsPerTest: Math.round((stats.totalQuestions / stats.totalTests) * 10) / 10,
          difficulties: Array.from(stats.difficulties),
          sectionCount: stats.sections.size,
          lastGenerated: stats.lastGenerated
        }))
        .sort((a, b) => b.totalTests - a.totalTests);
    } catch (error) {
      console.error('[TestModel] getStatsByDomain error:', error);
      throw error;
    }
  }

  /**
   * Search tests with filters.
   * @param {string} searchTerm - Search term
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} Array of test documents
   */
  static async searchQuestions(searchTerm, options = {}) {
    try {
      const { domain, section, difficulty, limit = 20, offset = 0 } = options;
      const firestore = getFirestore();

      let query = firestore.collection(COLLECTION_NAME);

      // Add filters
      if (domain) {
        query = query.where('domain', '==', domain);
      }
      if (section) {
        query = query.where('section', '==', section);
      }
      if (difficulty) {
        query = query.where('difficulty', '==', difficulty);
      }

      // Order by creation date and apply pagination
      query = query.orderBy('createdAt', 'desc').limit(limit);

      const snapshot = await query.get();
      let results = snapshot.docs.map(doc => {
        const testObj = docToObject(doc);
        testObj.toJSON = () => testObj;
        return testObj;
      });

      // Apply text search filtering (Firestore doesn't support full-text search natively)
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        results = results.filter(test => {
          return test.topic?.toLowerCase().includes(term) ||
                 test.shortAnswerQuestions?.some(q => 
                   q.question?.toLowerCase().includes(term) ||
                   q.answer?.toLowerCase().includes(term) ||
                   q.sourceConcept?.toLowerCase().includes(term)
                 );
        });
      }

      // Apply offset
      return results.slice(offset);
    } catch (error) {
      console.error('[TestModel] searchQuestions error:', error);
      throw error;
    }
  }

  /**
   * Find a test by ID.
   * @param {string} id - Test ID
   * @returns {Promise<Object>} Test document
   */
  static async findById(id) {
    try {
      const firestore = getFirestore();
      const doc = await firestore.collection(COLLECTION_NAME).doc(id).get();
      
      if (!doc.exists) {
        return null;
      }

      const testObj = docToObject(doc);
      
      // Add toJSON method for compatibility
      testObj.toJSON = () => testObj;
      
      return testObj;
    } catch (error) {
      console.error('[TestModel] findById error:', error);
      throw error;
    }
  }

  /**
   * Find tests with filters.
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of test documents
   */
  static async find(filters = {}) {
    try {
      const { domain, section, difficulty, limit = 20, offset = 0 } = filters;
      const firestore = getFirestore();

      let query = firestore.collection(COLLECTION_NAME);

      // Add filters
      if (domain) {
        query = query.where('domain', '==', domain);
      }
      if (section) {
        query = query.where('section', '==', section);
      }
      if (difficulty) {
        query = query.where('difficulty', '==', difficulty);
      }

      // Order by creation date and apply pagination
      query = query.orderBy('createdAt', 'desc').limit(limit + offset);

      const snapshot = await query.get();
      let results = snapshot.docs.map(doc => {
        const testObj = docToObject(doc);
        // Add toJSON method for compatibility
        testObj.toJSON = () => testObj;
        return testObj;
      });

      // Apply offset
      return results.slice(offset);
    } catch (error) {
      console.error('[TestModel] find error:', error);
      throw error;
    }
  }

  /**
   * Count documents matching filters.
   * @param {Object} filters - Filter options
   * @returns {Promise<number>} Document count
   */
  static async countDocuments(filters = {}) {
    try {
      const { domain, section, difficulty } = filters;
      const firestore = getFirestore();

      let query = firestore.collection(COLLECTION_NAME);

      // Add filters
      if (domain) {
        query = query.where('domain', '==', domain);
      }
      if (section) {
        query = query.where('section', '==', section);
      }
      if (difficulty) {
        query = query.where('difficulty', '==', difficulty);
      }

      const snapshot = await query.get();
      return snapshot.size;
    } catch (error) {
      console.error('[TestModel] countDocuments error:', error);
      return 0;
    }
  }

  /**
   * Update a test by ID.
   * @param {string} id - Test ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated test document
   */
  static async findByIdAndUpdate(id, updateData) {
    try {
      const firestore = getFirestore();
      
      const documentData = updateDocumentWithTimestamp(updateData);
      await firestore.collection(COLLECTION_NAME).doc(id).update(documentData);
      
      const updatedDoc = await firestore.collection(COLLECTION_NAME).doc(id).get();
      const testObj = docToObject(updatedDoc);
      testObj.toJSON = () => testObj;
      return testObj;
    } catch (error) {
      console.error('[TestModel] findByIdAndUpdate error:', error);
      throw error;
    }
  }

  /**
   * Delete a test by ID.
   * @param {string} id - Test ID
   * @returns {Promise<boolean>} True if deleted
   */
  static async findByIdAndDelete(id) {
    try {
      const firestore = getFirestore();
      const doc = await firestore.collection(COLLECTION_NAME).doc(id).get();
      
      if (!doc.exists) {
        return null;
      }

      await firestore.collection(COLLECTION_NAME).doc(id).delete();
      console.log(`[TestModel] Deleted test with ID: ${id}`);
      
      const testObj = docToObject(doc);
      testObj.toJSON = () => testObj;
      return testObj;
    } catch (error) {
      console.error('[TestModel] findByIdAndDelete error:', error);
      throw error;
    }
  }

  /**
   * Instance method: Get questions by source concept.
   * @param {Object} test - Test document
   * @param {string} concept - Concept to search for
   * @returns {Array} Filtered questions
   */
  static getQuestionsByConcept(test, concept) {
    if (!test.shortAnswerQuestions) return [];
    
    return test.shortAnswerQuestions.filter(q => 
      q.sourceConcept?.toLowerCase().includes(concept.toLowerCase())
    );
  }

  /**
   * Instance method: Get questions by pattern.
   * @param {Object} test - Test document
   * @param {string} pattern - Pattern to search for
   * @returns {Array} Filtered questions
   */
  static getQuestionsByPattern(test, pattern) {
    if (!test.shortAnswerQuestions) return [];
    
    const regex = new RegExp(pattern, 'i');
    return test.shortAnswerQuestions.filter(q => 
      regex.test(q.question) || regex.test(q.answer)
    );
  }

  /**
   * Generate a default name for a test based on its properties.
   * @param {Object} testData - Test data
   * @returns {string} Generated test name
   * @private
   */
  static _generateDefaultName(testData) {
    const { domain, section, difficulty, topic, shortAnswerQuestions } = testData;
    
    // Format section name (handle arrays and special cases)
    let sectionName = section;
    if (Array.isArray(section)) {
      sectionName = section.length === 1 ? section[0] : `${section.length} sections`;
    } else if (section === 'all') {
      sectionName = 'Domain-wide';
    }
    
    // Capitalize first letter of each word
    const capitalize = (str) => str.replace(/\b\w/g, l => l.toUpperCase());
    
    // Create base name
    const domainFormatted = capitalize(domain.replace(/[-_]/g, ' '));
    const sectionFormatted = capitalize(sectionName.replace(/[-_]/g, ' '));
    const difficultyFormatted = capitalize(difficulty);
    
    // Generate name based on available information
    if (topic && topic !== 'Domain-wide' && topic !== sectionName) {
      // Use topic if it's meaningful and different from section
      return `${topic} - ${difficultyFormatted} Test`;
    } else {
      // Use domain and section
      return `${domainFormatted} - ${sectionFormatted} (${difficultyFormatted})`;
    }
  }
}

module.exports = TestModel;
