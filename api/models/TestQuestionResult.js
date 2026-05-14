'use strict';

const { getFirestore, docToObject, createDocumentWithTimestamps, updateDocumentWithTimestamp } = require('../firebase');

/**
 * Firestore operations for individual question results within test attempts.
 * Tracks detailed performance at the question level for spaced repetition analytics.
 */

const COLLECTION_NAME = 'test_question_results';

class TestQuestionResultModel {
  /**
   * Create a new question result document.
   * @param {Object} resultData - Question result data
   * @returns {Promise<Object>} Created question result document
   */
  static async create(resultData) {
    try {
      const firestore = getFirestore();
      
      // Validate required fields
      if (!resultData.attemptId || !resultData.questionId || !resultData.testId) {
        throw new Error('Missing required fields: attemptId, questionId, testId');
      }

      // Add timestamps and default values
      const documentData = createDocumentWithTimestamps({
        ...resultData,
        isCorrect: resultData.isCorrect || false,
        timeSpent: resultData.timeSpent || 0,
        difficulty: resultData.difficulty || 'medium',
        confidence: resultData.confidence || null
      });

      // Create document
      const docRef = await firestore.collection(COLLECTION_NAME).add(documentData);
      const doc = await docRef.get();

      console.log(`[TestQuestionResultModel] Created question result with ID: ${doc.id}`);
      const resultObj = docToObject(doc);
      
      // Add toJSON method for compatibility
      resultObj.toJSON = () => resultObj;
      
      return resultObj;
    } catch (error) {
      console.error('[TestQuestionResultModel] Create error:', error);
      throw error;
    }
  }

  /**
   * Find question results by attempt ID.
   * @param {string} attemptId - Attempt ID
   * @returns {Promise<Array>} Array of question result documents
   */
  static async findByAttemptId(attemptId) {
    try {
      const firestore = getFirestore();
      
      const snapshot = await firestore.collection(COLLECTION_NAME)
        .where('attemptId', '==', attemptId)
        .orderBy('createdAt', 'asc')
        .get();

      return snapshot.docs.map(doc => {
        const resultObj = docToObject(doc);
        resultObj.toJSON = () => resultObj;
        return resultObj;
      });
    } catch (error) {
      console.error('[TestQuestionResultModel] findByAttemptId error:', error);
      throw error;
    }
  }

  /**
   * Find question results by concept ID.
   * @param {string} conceptId - Concept ID
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} Array of question result documents
   */
  static async findByConceptId(conceptId, options = {}) {
    try {
      const { limit = 100, offset = 0, correctOnly = false } = options;
      const firestore = getFirestore();

      let query = firestore.collection(COLLECTION_NAME)
        .where('conceptId', '==', conceptId)
        .orderBy('createdAt', 'desc');

      if (correctOnly) {
        query = query.where('isCorrect', '==', true);
      }

      const snapshot = await query.limit(limit + offset).get();
      let results = snapshot.docs.map(doc => {
        const resultObj = docToObject(doc);
        resultObj.toJSON = () => resultObj;
        return resultObj;
      });

      return results.slice(offset);
    } catch (error) {
      console.error('[TestQuestionResultModel] findByConceptId error:', error);
      throw error;
    }
  }

  /**
   * Find question results by test ID.
   * @param {string} testId - Test ID
   * @returns {Promise<Array>} Array of question result documents
   */
  static async findByTestId(testId) {
    try {
      const firestore = getFirestore();
      
      const snapshot = await firestore.collection(COLLECTION_NAME)
        .where('testId', '==', testId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => {
        const resultObj = docToObject(doc);
        resultObj.toJSON = () => resultObj;
        return resultObj;
      });
    } catch (error) {
      console.error('[TestQuestionResultModel] findByTestId error:', error);
      throw error;
    }
  }

  /**
   * Get performance statistics by concept.
   * @param {string} conceptId - Concept ID
   * @param {number} days - Number of days to look back
   * @returns {Promise<Object>} Performance statistics
   */
  static async getConceptStats(conceptId, days = 30) {
    try {
      const firestore = getFirestore();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const snapshot = await firestore.collection(COLLECTION_NAME)
        .where('conceptId', '==', conceptId)
        .where('createdAt', '>=', cutoffDate)
        .get();

      const results = snapshot.docs.map(docToObject);
      
      const stats = {
        conceptId,
        totalAttempts: results.length,
        correctAttempts: 0,
        incorrectAttempts: 0,
        averageTimeSpent: 0,
        averageDifficulty: 0,
        averageConfidence: 0,
        difficultyDistribution: { easy: 0, medium: 0, hard: 0 },
        recentPerformance: [],
        totalTimeSpent: 0,
        confidenceScores: []
      };

      results.forEach(result => {
        if (result.isCorrect) {
          stats.correctAttempts++;
        } else {
          stats.incorrectAttempts++;
        }

        stats.totalTimeSpent += result.timeSpent || 0;
        
        if (result.difficulty) {
          stats.difficultyDistribution[result.difficulty] = 
            (stats.difficultyDistribution[result.difficulty] || 0) + 1;
        }

        if (result.confidence !== null && result.confidence !== undefined) {
          stats.confidenceScores.push(result.confidence);
        }
      });

      // Calculate averages
      stats.averageTimeSpent = stats.totalAttempts > 0 ? 
        Math.round((stats.totalTimeSpent / stats.totalAttempts) * 100) / 100 : 0;
      
      stats.averageConfidence = stats.confidenceScores.length > 0 ?
        Math.round((stats.confidenceScores.reduce((a, b) => a + b, 0) / stats.confidenceScores.length) * 100) / 100 : null;

      stats.accuracyRate = stats.totalAttempts > 0 ? 
        Math.round((stats.correctAttempts / stats.totalAttempts) * 10000) / 100 : 0;

      // Get recent performance (last 10 attempts)
      stats.recentPerformance = results
        .slice(0, 10)
        .map(result => ({
          isCorrect: result.isCorrect,
          timeSpent: result.timeSpent,
          difficulty: result.difficulty,
          confidence: result.confidence,
          createdAt: result.createdAt
        }));

      return stats;
    } catch (error) {
      console.error('[TestQuestionResultModel] getConceptStats error:', error);
      throw error;
    }
  }

  /**
   * Find a question result by ID.
   * @param {string} id - Question result ID
   * @returns {Promise<Object>} Question result document
   */
  static async findById(id) {
    try {
      const firestore = getFirestore();
      const doc = await firestore.collection(COLLECTION_NAME).doc(id).get();
      
      if (!doc.exists) {
        return null;
      }

      const resultObj = docToObject(doc);
      resultObj.toJSON = () => resultObj;
      return resultObj;
    } catch (error) {
      console.error('[TestQuestionResultModel] findById error:', error);
      throw error;
    }
  }

  /**
   * Update a question result by ID.
   * @param {string} id - Question result ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated question result document
   */
  static async findByIdAndUpdate(id, updateData) {
    try {
      const firestore = getFirestore();
      
      const documentData = updateDocumentWithTimestamp(updateData);
      await firestore.collection(COLLECTION_NAME).doc(id).update(documentData);
      
      const updatedDoc = await firestore.collection(COLLECTION_NAME).doc(id).get();
      const resultObj = docToObject(updatedDoc);
      resultObj.toJSON = () => resultObj;
      return resultObj;
    } catch (error) {
      console.error('[TestQuestionResultModel] findByIdAndUpdate error:', error);
      throw error;
    }
  }

  /**
   * Delete question results by attempt ID.
   * @param {string} attemptId - Attempt ID
   * @returns {Promise<number>} Number of deleted documents
   */
  static async deleteByAttemptId(attemptId) {
    try {
      const firestore = getFirestore();
      const snapshot = await firestore.collection(COLLECTION_NAME)
        .where('attemptId', '==', attemptId)
        .get();

      const batch = firestore.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`[TestQuestionResultModel] Deleted ${snapshot.size} question results for attempt ${attemptId}`);
      
      return snapshot.size;
    } catch (error) {
      console.error('[TestQuestionResultModel] deleteByAttemptId error:', error);
      throw error;
    }
  }

  /**
   * Get performance trends over time for a concept.
   * @param {string} conceptId - Concept ID
   * @param {number} days - Number of days to analyze
   * @returns {Promise<Array>} Array of daily performance data
   */
  static async getConceptPerformanceTrend(conceptId, days = 30) {
    try {
      const firestore = getFirestore();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const snapshot = await firestore.collection(COLLECTION_NAME)
        .where('conceptId', '==', conceptId)
        .where('createdAt', '>=', cutoffDate)
        .orderBy('createdAt', 'asc')
        .get();

      const results = snapshot.docs.map(docToObject);
      
      // Group by day
      const dailyStats = {};
      results.forEach(result => {
        const dateKey = result.createdAt.toISOString().split('T')[0];
        
        if (!dailyStats[dateKey]) {
          dailyStats[dateKey] = {
            date: dateKey,
            totalAttempts: 0,
            correctAttempts: 0,
            totalTimeSpent: 0,
            averageConfidence: 0,
            confidenceScores: []
          };
        }

        const dayStats = dailyStats[dateKey];
        dayStats.totalAttempts++;
        
        if (result.isCorrect) {
          dayStats.correctAttempts++;
        }
        
        dayStats.totalTimeSpent += result.timeSpent || 0;
        
        if (result.confidence !== null && result.confidence !== undefined) {
          dayStats.confidenceScores.push(result.confidence);
        }
      });

      // Calculate final statistics and convert to array
      return Object.values(dailyStats).map(day => ({
        date: day.date,
        totalAttempts: day.totalAttempts,
        correctAttempts: day.correctAttempts,
        accuracyRate: day.totalAttempts > 0 ? 
          Math.round((day.correctAttempts / day.totalAttempts) * 10000) / 100 : 0,
        averageTimeSpent: day.totalAttempts > 0 ? 
          Math.round((day.totalTimeSpent / day.totalAttempts) * 100) / 100 : 0,
        averageConfidence: day.confidenceScores.length > 0 ?
          Math.round((day.confidenceScores.reduce((a, b) => a + b, 0) / day.confidenceScores.length) * 100) / 100 : null
      }));
    } catch (error) {
      console.error('[TestQuestionResultModel] getConceptPerformanceTrend error:', error);
      throw error;
    }
  }
}

module.exports = TestQuestionResultModel;
