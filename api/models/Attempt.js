'use strict';

const { getFirestore, docToObject, createDocumentWithTimestamps, updateDocumentWithTimestamp } = require('../firebase');

/**
 * Firestore operations for test attempts.
 * Handles storing and retrieving test attempt data with scoring and timing.
 */

const COLLECTION_NAME = 'attempts';

class AttemptModel {
  /**
   * Create a new attempt document in Firestore.
   * @param {Object} attemptData - Attempt data
   * @returns {Promise<Object>} Created attempt document
   */
  static async create(attemptData) {
    try {
      const firestore = getFirestore();
      
      // Validate required fields
      if (!attemptData.testId) {
        throw new Error('Missing required field: testId');
      }

      // Add timestamps and default values
      const documentData = createDocumentWithTimestamps({
        ...attemptData,
        status: 'in_progress',
        score: null,
        totalTime: null,
        perQuestionResults: {},
        submittedAt: null,
        critiques: null,
        // New fields for enhanced tracking
        domain: attemptData.domain || null,
        section: attemptData.section || null,
        vaultId: attemptData.vaultId || null,
        questionResults: attemptData.questionResults || [], // Array of detailed question results
        conceptPerformance: attemptData.conceptPerformance || {}, // Concept-level performance summary
        averageConfidence: attemptData.averageConfidence || null,
        difficultyDistribution: attemptData.difficultyDistribution || { easy: 0, medium: 0, hard: 0 }
      });

      // Create document
      const docRef = await firestore.collection(COLLECTION_NAME).add(documentData);
      const doc = await docRef.get();

      console.log(`[AttemptModel] Created attempt with ID: ${doc.id}`);
      const attemptObj = docToObject(doc);
      
      // Add toJSON method for compatibility
      attemptObj.toJSON = () => attemptObj;
      
      return attemptObj;
    } catch (error) {
      console.error('[AttemptModel] Create error:', error);
      throw error;
    }
  }

  /**
   * Find an attempt by ID.
   * @param {string} id - Attempt ID
   * @returns {Promise<Object>} Attempt document
   */
  static async findById(id) {
    try {
      const firestore = getFirestore();
      const doc = await firestore.collection(COLLECTION_NAME).doc(id).get();
      
      if (!doc.exists) {
        return null;
      }

      const attemptObj = docToObject(doc);
      
      // Add toJSON method for compatibility
      attemptObj.toJSON = () => attemptObj;
      
      return attemptObj;
    } catch (error) {
      console.error('[AttemptModel] findById error:', error);
      throw error;
    }
  }

  /**
   * Update an attempt by ID.
   * @param {string} id - Attempt ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated attempt document
   */
  static async findByIdAndUpdate(id, updateData) {
    try {
      const firestore = getFirestore();
      
      const documentData = updateDocumentWithTimestamp(updateData);
      await firestore.collection(COLLECTION_NAME).doc(id).update(documentData);
      
      const updatedDoc = await firestore.collection(COLLECTION_NAME).doc(id).get();
      const attemptObj = docToObject(updatedDoc);
      attemptObj.toJSON = () => attemptObj;
      return attemptObj;
    } catch (error) {
      console.error('[AttemptModel] findByIdAndUpdate error:', error);
      throw error;
    }
  }

  /**
   * Delete an attempt by ID.
   * @param {string} id - Attempt ID
   * @returns {Promise<Object>} Deleted attempt document
   */
  static async findByIdAndDelete(id) {
    try {
      const firestore = getFirestore();
      const doc = await firestore.collection(COLLECTION_NAME).doc(id).get();
      
      if (!doc.exists) {
        return null;
      }

      await firestore.collection(COLLECTION_NAME).doc(id).delete();
      console.log(`[AttemptModel] Deleted attempt with ID: ${id}`);
      
      const attemptObj = docToObject(doc);
      attemptObj.toJSON = () => attemptObj;
      return attemptObj;
    } catch (error) {
      console.error('[AttemptModel] findByIdAndDelete error:', error);
      throw error;
    }
  }

  /**
   * Find attempts with filters.
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of attempt documents
   */
  static async find(filters = {}) {
    try {
      const { testId, status, limit = 20, offset = 0 } = filters;
      const firestore = getFirestore();

      let query = firestore.collection(COLLECTION_NAME);

      // Add filters
      if (testId) {
        query = query.where('testId', '==', testId);
      }
      if (status) {
        query = query.where('status', '==', status);
      }

      // Order by creation date and apply pagination
      query = query.orderBy('createdAt', 'desc').limit(limit + offset);

      const snapshot = await query.get();
      let results = snapshot.docs.map(doc => {
        const attemptObj = docToObject(doc);
        attemptObj.toJSON = () => attemptObj;
        return attemptObj;
      });

      // Apply offset
      return results.slice(offset);
    } catch (error) {
      console.error('[AttemptModel] find error:', error);
      throw error;
    }
  }

  /**
   * Count attempts matching filters.
   * @param {Object} filters - Filter options
   * @returns {Promise<number>} Document count
   */
  static async countDocuments(filters = {}) {
    try {
      const { testId, status } = filters;
      const firestore = getFirestore();

      let query = firestore.collection(COLLECTION_NAME);

      // Add filters
      if (testId) {
        query = query.where('testId', '==', testId);
      }
      if (status) {
        query = query.where('status', '==', status);
      }

      const snapshot = await query.get();
      return snapshot.size;
    } catch (error) {
      console.error('[AttemptModel] countDocuments error:', error);
      return 0;
    }
  }

  /**
   * Get recent attempts.
   * @param {number} days - Number of days to look back
   * @param {number} limit - Maximum results
   * @returns {Promise<Array>} Array of attempt documents
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
        const attemptObj = docToObject(doc);
        attemptObj.toJSON = () => attemptObj;
        return attemptObj;
      });
    } catch (error) {
      console.error('[AttemptModel] findRecent error:', error);
      throw error;
    }
  }

  /**
   * Get attempts by test ID.
   * @param {string} testId - Test ID
   * @param {number} limit - Maximum results
   * @returns {Promise<Array>} Array of attempt documents
   */
  static async findByTestId(testId, limit = 20) {
    try {
      const firestore = getFirestore();
      
      const snapshot = await firestore.collection(COLLECTION_NAME)
        .where('testId', '==', testId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => {
        const attemptObj = docToObject(doc);
        attemptObj.toJSON = () => attemptObj;
        return attemptObj;
      });
    } catch (error) {
      console.error('[AttemptModel] findByTestId error:', error);
      throw error;
    }
  }

  /**
   * Get statistics about attempts.
   * @returns {Promise<Object>} Statistics object
   */
  static async getStatistics() {
    try {
      // Get all attempts and calculate statistics manually
      const attempts = await this.find({ limit: 1000 }); // Get a large sample
      
      const stats = {
        totalAttempts: attempts.length,
        completedAttempts: 0,
        inProgressAttempts: 0,
        averageScore: 0,
        averageTime: 0,
        totalScore: 0,
        totalTime: 0,
        testIds: new Set(),
        scores: []
      };

      attempts.forEach(attempt => {
        stats.testIds.add(attempt.testId);
        
        if (attempt.status === 'completed') {
          stats.completedAttempts++;
          if (attempt.score !== null) {
            stats.totalScore += attempt.score;
            stats.scores.push(attempt.score);
          }
          if (attempt.totalTime !== null) {
            stats.totalTime += attempt.totalTime;
          }
        } else if (attempt.status === 'in_progress') {
          stats.inProgressAttempts++;
        }
      });

      stats.averageScore = stats.completedAttempts > 0 && stats.scores.length > 0 ? 
        Math.round((stats.totalScore / stats.scores.length) * 100) / 100 : 0;
      
      stats.averageTime = stats.completedAttempts > 0 ? 
        Math.round((stats.totalTime / stats.completedAttempts) * 100) / 100 : 0;
      
      stats.testCount = stats.testIds.size;
      stats.completionRate = attempts.length > 0 ? 
        Math.round((stats.completedAttempts / attempts.length) * 10000) / 100 : 0;

      // Convert Sets to arrays for JSON serialization
      return {
        totalAttempts: stats.totalAttempts,
        completedAttempts: stats.completedAttempts,
        inProgressAttempts: stats.inProgressAttempts,
        averageScore: stats.averageScore,
        averageTime: stats.averageTime,
        testCount: stats.testCount,
        completionRate: stats.completionRate,
        testIds: Array.from(stats.testIds)
      };
    } catch (error) {
      console.error('[AttemptModel] getStatistics error:', error);
      throw error;
    }
  }

  /**
   * Search attempts by test content or user answers.
   * @param {string} searchTerm - Search term
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} Array of attempt documents
   */
  static async searchAttempts(searchTerm, options = {}) {
    try {
      const { testId, status, domain, section, limit = 20, offset = 0 } = options;
      const firestore = getFirestore();

      let query = firestore.collection(COLLECTION_NAME);

      // Add filters
      if (testId) {
        query = query.where('testId', '==', testId);
      }
      if (status) {
        query = query.where('status', '==', status);
      }
      if (domain) {
        query = query.where('domain', '==', domain.toLowerCase());
      }
      if (section) {
        query = query.where('section', '==', section.toLowerCase());
      }

      // Order by creation date and apply pagination
      query = query.orderBy('createdAt', 'desc').limit(limit);

      const snapshot = await query.get();
      let results = snapshot.docs.map(doc => {
        const attemptObj = docToObject(doc);
        attemptObj.toJSON = () => attemptObj;
        return attemptObj;
      });

      // Apply text search filtering (Firestore doesn't support full-text search natively)
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        results = results.filter(attempt => {
          return attempt.testId?.toLowerCase().includes(term) ||
                 attempt.domain?.toLowerCase().includes(term) ||
                 attempt.section?.toLowerCase().includes(term) ||
                 Object.values(attempt.answers || {}).some(answer => 
                   answer.toLowerCase().includes(term)
                 );
        });
      }

      // Apply offset
      return results.slice(offset);
    } catch (error) {
      console.error('[AttemptModel] searchAttempts error:', error);
      throw error;
    }
  }

  /**
   * Find attempts by domain.
   * @param {string} domain - Domain name
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} Array of attempt documents
   */
  static async findByDomain(domain, options = {}) {
    try {
      const { status, limit = 20, offset = 0 } = options;
      const firestore = getFirestore();

      let query = firestore.collection(COLLECTION_NAME)
        .where('domain', '==', domain.toLowerCase())
        .orderBy('createdAt', 'desc')
        .limit(limit + offset);

      if (status) {
        query = query.where('status', '==', status);
      }

      const snapshot = await query.get();
      let results = snapshot.docs.map(doc => {
        const attemptObj = docToObject(doc);
        attemptObj.toJSON = () => attemptObj;
        return attemptObj;
      });

      return results.slice(offset);
    } catch (error) {
      console.error('[AttemptModel] findByDomain error:', error);
      throw error;
    }
  }

  /**
   * Find attempts by domain and section.
   * @param {string} domain - Domain name
   * @param {string} section - Section name
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} Array of attempt documents
   */
  static async findByDomainAndSection(domain, section, options = {}) {
    try {
      const { status, limit = 20, offset = 0 } = options;
      const firestore = getFirestore();

      let query = firestore.collection(COLLECTION_NAME)
        .where('domain', '==', domain.toLowerCase())
        .where('section', '==', section.toLowerCase())
        .orderBy('createdAt', 'desc')
        .limit(limit + offset);

      if (status) {
        query = query.where('status', '==', status);
      }

      const snapshot = await query.get();
      let results = snapshot.docs.map(doc => {
        const attemptObj = docToObject(doc);
        attemptObj.toJSON = () => attemptObj;
        return attemptObj;
      });

      return results.slice(offset);
    } catch (error) {
      console.error('[AttemptModel] findByDomainAndSection error:', error);
      throw error;
    }
  }

  /**
   * Update attempt with detailed question results.
   * @param {string} attemptId - Attempt ID
   * @param {Array} questionResults - Array of question result objects
   * @returns {Promise<Object>} Updated attempt document
   */
  static async updateQuestionResults(attemptId, questionResults) {
    try {
      const firestore = getFirestore();
      
      // Calculate derived metrics
      const correctCount = questionResults.filter(r => r.isCorrect).length;
      const totalCount = questionResults.length;
      const averageTime = questionResults.reduce((sum, r) => sum + (r.timeSpent || 0), 0) / totalCount;
      const confidenceScores = questionResults.filter(r => r.confidence !== null && r.confidence !== undefined).map(r => r.confidence);
      const averageConfidence = confidenceScores.length > 0 ? 
        confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length : null;

      // Calculate difficulty distribution
      const difficultyDistribution = { easy: 0, medium: 0, hard: 0 };
      questionResults.forEach(r => {
        if (difficultyDistribution[r.difficulty] !== undefined) {
          difficultyDistribution[r.difficulty]++;
        }
      });

      // Calculate concept performance summary
      const conceptPerformance = {};
      questionResults.forEach(r => {
        if (r.conceptId) {
          if (!conceptPerformance[r.conceptId]) {
            conceptPerformance[r.conceptId] = {
              totalQuestions: 0,
              correctAnswers: 0,
              totalTime: 0,
              averageConfidence: 0,
              confidenceScores: []
            };
          }
          const perf = conceptPerformance[r.conceptId];
          perf.totalQuestions++;
          if (r.isCorrect) perf.correctAnswers++;
          perf.totalTime += r.timeSpent || 0;
          if (r.confidence !== null && r.confidence !== undefined) {
            perf.confidenceScores.push(r.confidence);
          }
        }
      });

      // Finalize concept performance calculations
      Object.keys(conceptPerformance).forEach(conceptId => {
        const perf = conceptPerformance[conceptId];
        perf.averageTime = perf.totalTime / perf.totalQuestions;
        perf.accuracyRate = Math.round((perf.correctAnswers / perf.totalQuestions) * 10000) / 100;
        if (perf.confidenceScores.length > 0) {
          perf.averageConfidence = perf.confidenceScores.reduce((a, b) => a + b, 0) / perf.confidenceScores.length;
        }
        delete perf.confidenceScores; // Remove temporary array
      });

      const updateData = {
        questionResults,
        score: Math.round((correctCount / totalCount) * 10000) / 100,
        averageTime: Math.round(averageTime * 100) / 100,
        averageConfidence: averageConfidence !== null ? Math.round(averageConfidence * 100) / 100 : null,
        difficultyDistribution,
        conceptPerformance
      };

      const documentData = updateDocumentWithTimestamp(updateData);
      await firestore.collection(COLLECTION_NAME).doc(attemptId).update(documentData);
      
      const updatedDoc = await firestore.collection(COLLECTION_NAME).doc(attemptId).get();
      const attemptObj = docToObject(updatedDoc);
      attemptObj.toJSON = () => attemptObj;
      
      console.log(`[AttemptModel] Updated question results for attempt ${attemptId}`);
      return attemptObj;
    } catch (error) {
      console.error('[AttemptModel] updateQuestionResults error:', error);
      throw error;
    }
  }

  /**
   * Get performance analytics by domain.
   * @param {string} domain - Domain name
   * @param {number} days - Number of days to look back
   * @returns {Promise<Object>} Domain performance analytics
   */
  static async getDomainAnalytics(domain, days = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const attempts = await this.findByDomain(domain, { limit: 1000 });
      const filteredAttempts = attempts.filter(attempt => 
        attempt.createdAt >= cutoffDate && attempt.status === 'completed'
      );

      const analytics = {
        domain,
        totalAttempts: filteredAttempts.length,
        averageScore: 0,
        averageTime: 0,
        averageConfidence: 0,
        difficultyDistribution: { easy: 0, medium: 0, hard: 0 },
        sectionPerformance: {},
        conceptPerformance: {},
        dailyPerformance: []
      };

      let totalScore = 0;
      let totalTime = 0;
      let totalConfidence = 0;
      let confidenceCount = 0;

      // Process each attempt
      filteredAttempts.forEach(attempt => {
        totalScore += attempt.score || 0;
        totalTime += attempt.averageTime || 0;
        
        if (attempt.averageConfidence !== null && attempt.averageConfidence !== undefined) {
          totalConfidence += attempt.averageConfidence;
          confidenceCount++;
        }

        // Difficulty distribution
        if (attempt.difficultyDistribution) {
          Object.keys(attempt.difficultyDistribution).forEach(difficulty => {
            analytics.difficultyDistribution[difficulty] += attempt.difficultyDistribution[difficulty] || 0;
          });
        }

        // Section performance
        if (attempt.section) {
          if (!analytics.sectionPerformance[attempt.section]) {
            analytics.sectionPerformance[attempt.section] = {
              attempts: 0,
              totalScore: 0,
              totalTime: 0
            };
          }
          const sectionPerf = analytics.sectionPerformance[attempt.section];
          sectionPerf.attempts++;
          sectionPerf.totalScore += attempt.score || 0;
          sectionPerf.totalTime += attempt.averageTime || 0;
        }

        // Concept performance
        if (attempt.conceptPerformance) {
          Object.keys(attempt.conceptPerformance).forEach(conceptId => {
            if (!analytics.conceptPerformance[conceptId]) {
              analytics.conceptPerformance[conceptId] = {
                totalQuestions: 0,
                correctAnswers: 0,
                totalTime: 0,
                attempts: 0
              };
            }
            const conceptPerf = analytics.conceptPerformance[conceptId];
            const attemptConceptPerf = attempt.conceptPerformance[conceptId];
            conceptPerf.totalQuestions += attemptConceptPerf.totalQuestions || 0;
            conceptPerf.correctAnswers += attemptConceptPerf.correctAnswers || 0;
            conceptPerf.totalTime += attemptConceptPerf.totalTime || 0;
            conceptPerf.attempts++;
          });
        }
      });

      // Calculate averages
      analytics.averageScore = filteredAttempts.length > 0 ? 
        Math.round((totalScore / filteredAttempts.length) * 100) / 100 : 0;
      analytics.averageTime = filteredAttempts.length > 0 ? 
        Math.round((totalTime / filteredAttempts.length) * 100) / 100 : 0;
      analytics.averageConfidence = confidenceCount > 0 ? 
        Math.round((totalConfidence / confidenceCount) * 100) / 100 : 0;

      // Finalize section performance
      Object.keys(analytics.sectionPerformance).forEach(section => {
        const sectionPerf = analytics.sectionPerformance[section];
        sectionPerf.averageScore = Math.round((sectionPerf.totalScore / sectionPerf.attempts) * 100) / 100;
        sectionPerf.averageTime = Math.round((sectionPerf.totalTime / sectionPerf.attempts) * 100) / 100;
        delete sectionPerf.totalScore;
        delete sectionPerf.totalTime;
      });

      // Finalize concept performance
      Object.keys(analytics.conceptPerformance).forEach(conceptId => {
        const conceptPerf = analytics.conceptPerformance[conceptId];
        conceptPerf.accuracyRate = conceptPerf.totalQuestions > 0 ? 
          Math.round((conceptPerf.correctAnswers / conceptPerf.totalQuestions) * 10000) / 100 : 0;
        conceptPerf.averageTime = conceptPerf.totalQuestions > 0 ? 
          Math.round((conceptPerf.totalTime / conceptPerf.totalQuestions) * 100) / 100 : 0;
        delete conceptPerf.correctAnswers;
        delete conceptPerf.totalTime;
      });

      return analytics;
    } catch (error) {
      console.error('[AttemptModel] getDomainAnalytics error:', error);
      throw error;
    }
  }
}

module.exports = AttemptModel;
