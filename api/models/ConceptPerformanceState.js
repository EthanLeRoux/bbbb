'use strict';

const { getFirestore, docToObject, createDocumentWithTimestamps, updateDocumentWithTimestamp } = require('../firebase');

/**
 * Firestore operations for concept-level performance tracking.
 * Maintains aggregated performance state for spaced repetition calculations.
 */

const COLLECTION_NAME = 'concept_performance_states';

class ConceptPerformanceStateModel {
  /**
   * Create or update a concept performance state.
   * @param {Object} stateData - Concept performance data
   * @returns {Promise<Object>} Created/updated concept performance document
   */
  static async upsert(stateData) {
    try {
      const firestore = getFirestore();
      
      // Validate required fields
      if (!stateData.conceptId || !stateData.domain || !stateData.section) {
        throw new Error('Missing required fields: conceptId, domain, section');
      }

      // Check if document exists
      const existingDoc = await firestore.collection(COLLECTION_NAME)
        .where('conceptId', '==', stateData.conceptId)
        .limit(1)
        .get();

      const documentData = createDocumentWithTimestamps({
        ...stateData,
        lastReviewed: new Date(),
        reviewCount: stateData.reviewCount || 0,
        totalAttempts: stateData.totalAttempts || 0,
        correctAttempts: stateData.correctAttempts || 0,
        averageTimeSpent: stateData.averageTimeSpent || 0,
        retentionStrength: stateData.retentionStrength || 0,
        masteryLevel: stateData.masteryLevel || 'beginner',
        nextReviewDate: stateData.nextReviewDate || null,
        difficulty: stateData.difficulty || 'medium',
        confidence: stateData.confidence || null
      });

      if (!existingDoc.empty) {
        // Update existing document
        const docId = existingDoc.docs[0].id;
        await firestore.collection(COLLECTION_NAME).doc(docId).update(documentData);
        
        const updatedDoc = await firestore.collection(COLLECTION_NAME).doc(docId).get();
        const resultObj = docToObject(updatedDoc);
        resultObj.toJSON = () => resultObj;
        
        console.log(`[ConceptPerformanceStateModel] Updated concept performance for: ${stateData.conceptId}`);
        return resultObj;
      } else {
        // Create new document
        const docRef = await firestore.collection(COLLECTION_NAME).add(documentData);
        const doc = await docRef.get();
        
        const resultObj = docToObject(doc);
        resultObj.toJSON = () => resultObj;
        
        console.log(`[ConceptPerformanceStateModel] Created concept performance for: ${stateData.conceptId}`);
        return resultObj;
      }
    } catch (error) {
      console.error('[ConceptPerformanceStateModel] upsert error:', error);
      throw error;
    }
  }

  /**
   * Find concept performance by concept ID.
   * @param {string} conceptId - Concept ID
   * @returns {Promise<Object>} Concept performance document
   */
  static async findByConceptId(conceptId) {
    try {
      const firestore = getFirestore();
      
      const snapshot = await firestore.collection(COLLECTION_NAME)
        .where('conceptId', '==', conceptId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const resultObj = docToObject(snapshot.docs[0]);
      resultObj.toJSON = () => resultObj;
      return resultObj;
    } catch (error) {
      console.error('[ConceptPerformanceStateModel] findByConceptId error:', error);
      throw error;
    }
  }

  /**
   * Find concepts by domain.
   * @param {string} domain - Domain name
   * @returns {Promise<Array>} Array of concept performance documents
   */
  static async findByDomain(domain) {
    try {
      const firestore = getFirestore();
      
      const snapshot = await firestore.collection(COLLECTION_NAME)
        .where('domain', '==', domain.toLowerCase())
        .orderBy('retentionStrength', 'asc')
        .get();

      return snapshot.docs.map(doc => {
        const resultObj = docToObject(doc);
        resultObj.toJSON = () => resultObj;
        return resultObj;
      });
    } catch (error) {
      console.error('[ConceptPerformanceStateModel] findByDomain error:', error);
      throw error;
    }
  }

  /**
   * Find concepts by domain and section.
   * @param {string} domain - Domain name
   * @param {string} section - Section name
   * @returns {Promise<Array>} Array of concept performance documents
   */
  static async findByDomainAndSection(domain, section) {
    try {
      const firestore = getFirestore();
      
      const snapshot = await firestore.collection(COLLECTION_NAME)
        .where('domain', '==', domain.toLowerCase())
        .where('section', '==', section.toLowerCase())
        .orderBy('retentionStrength', 'asc')
        .get();

      return snapshot.docs.map(doc => {
        const resultObj = docToObject(doc);
        resultObj.toJSON = () => resultObj;
        return resultObj;
      });
    } catch (error) {
      console.error('[ConceptPerformanceStateModel] findByDomainAndSection error:', error);
      throw error;
    }
  }

  /**
   * Get concepts ready for review.
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} Array of concept performance documents
   */
  static async getReadyForReview(options = {}) {
    try {
      const { domain, section, limit = 50 } = options;
      const firestore = getFirestore();
      const now = new Date();

      let query = firestore.collection(COLLECTION_NAME)
        .where('nextReviewDate', '<=', now)
        .orderBy('nextReviewDate', 'asc')
        .limit(limit);

      // Add domain filter if specified
      if (domain) {
        query = query.where('domain', '==', domain.toLowerCase());
      }

      // Add section filter if specified
      if (section) {
        query = query.where('section', '==', section.toLowerCase());
      }

      const snapshot = await query.get();

      return snapshot.docs.map(doc => {
        const resultObj = docToObject(doc);
        resultObj.toJSON = () => resultObj;
        return resultObj;
      });
    } catch (error) {
      console.error('[ConceptPerformanceStateModel] getReadyForReview error:', error);
      throw error;
    }
  }

  /**
   * Get concepts by mastery level.
   * @param {string} masteryLevel - Mastery level (beginner, intermediate, advanced, master)
   * @param {Object} options - Additional filters
   * @returns {Promise<Array>} Array of concept performance documents
   */
  static async findByMasteryLevel(masteryLevel, options = {}) {
    try {
      const { domain, limit = 100 } = options;
      const firestore = getFirestore();

      let query = firestore.collection(COLLECTION_NAME)
        .where('masteryLevel', '==', masteryLevel)
        .orderBy('retentionStrength', 'desc')
        .limit(limit);

      if (domain) {
        query = query.where('domain', '==', domain.toLowerCase());
      }

      const snapshot = await query.get();

      return snapshot.docs.map(doc => {
        const resultObj = docToObject(doc);
        resultObj.toJSON = () => resultObj;
        return resultObj;
      });
    } catch (error) {
      console.error('[ConceptPerformanceStateModel] findByMasteryLevel error:', error);
      throw error;
    }
  }

  /**
   * Update concept performance after a question attempt.
   * @param {string} conceptId - Concept ID
   * @param {Object} attemptData - Attempt data (isCorrect, timeSpent, confidence, difficulty)
   * @returns {Promise<Object>} Updated concept performance document
   */
  static async updateAfterAttempt(conceptId, attemptData) {
    try {
      const existing = await this.findByConceptId(conceptId);
      
      const updateData = {
        conceptId,
        lastReviewed: new Date(),
        reviewCount: (existing?.reviewCount || 0) + 1,
        totalAttempts: (existing?.totalAttempts || 0) + 1,
        correctAttempts: (existing?.correctAttempts || 0) + (attemptData.isCorrect ? 1 : 0),
        averageTimeSpent: this._calculateNewAverage(
          existing?.averageTimeSpent || 0,
          existing?.totalAttempts || 0,
          attemptData.timeSpent || 0
        ),
        confidence: attemptData.confidence || existing?.confidence || null,
        difficulty: attemptData.difficulty || existing?.difficulty || 'medium'
      };

      // Calculate new accuracy rate
      updateData.accuracyRate = Math.round((updateData.correctAttempts / updateData.totalAttempts) * 10000) / 100;

      // Update mastery level based on performance
      updateData.masteryLevel = this._calculateMasteryLevel(
        updateData.accuracyRate,
        updateData.reviewCount,
        updateData.retentionStrength || 0
      );

      // Update retention strength (simplified calculation)
      updateData.retentionStrength = this._calculateRetentionStrength(
        attemptData.isCorrect,
        existing?.retentionStrength || 0,
        attemptData.timeSpent || 0
      );

      // Calculate next review date (simplified spaced repetition)
      updateData.nextReviewDate = this._calculateNextReviewDate(
        updateData.retentionStrength,
        attemptData.isCorrect
      );

      // Include domain and section from existing record if available
      if (existing) {
        updateData.domain = existing.domain;
        updateData.section = existing.section;
        updateData.vaultId = existing.vaultId;
      }

      return await this.upsert(updateData);
    } catch (error) {
      console.error('[ConceptPerformanceStateModel] updateAfterAttempt error:', error);
      throw error;
    }
  }

  /**
   * Get performance statistics by domain.
   * @param {string} domain - Domain name
   * @returns {Promise<Object>} Domain performance statistics
   */
  static async getDomainStats(domain) {
    try {
      const concepts = await this.findByDomain(domain);
      
      const stats = {
        domain,
        totalConcepts: concepts.length,
        masteryDistribution: {
          beginner: 0,
          intermediate: 0,
          advanced: 0,
          master: 0
        },
        averageRetentionStrength: 0,
        averageAccuracy: 0,
        conceptsReadyForReview: 0,
        difficultyDistribution: {
          easy: 0,
          medium: 0,
          hard: 0
        },
        totalReviews: 0,
        totalAttempts: 0
      };

      let totalRetentionStrength = 0;
      let totalAccuracy = 0;
      const now = new Date();

      concepts.forEach(concept => {
        // Mastery distribution
        if (stats.masteryDistribution[concept.masteryLevel] !== undefined) {
          stats.masteryDistribution[concept.masteryLevel]++;
        }

        // Difficulty distribution
        if (stats.difficultyDistribution[concept.difficulty] !== undefined) {
          stats.difficultyDistribution[concept.difficulty]++;
        }

        // Retention strength
        totalRetentionStrength += concept.retentionStrength || 0;

        // Accuracy
        if (concept.accuracyRate !== undefined) {
          totalAccuracy += concept.accuracyRate;
        }

        // Ready for review
        if (concept.nextReviewDate && concept.nextReviewDate.toDate() <= now) {
          stats.conceptsReadyForReview++;
        }

        // Totals
        stats.totalReviews += concept.reviewCount || 0;
        stats.totalAttempts += concept.totalAttempts || 0;
      });

      // Calculate averages
      stats.averageRetentionStrength = concepts.length > 0 ? 
        Math.round((totalRetentionStrength / concepts.length) * 100) / 100 : 0;
      
      stats.averageAccuracy = concepts.length > 0 ? 
        Math.round((totalAccuracy / concepts.length) * 100) / 100 : 0;

      return stats;
    } catch (error) {
      console.error('[ConceptPerformanceStateModel] getDomainStats error:', error);
      throw error;
    }
  }

  /**
   * Calculate new average time spent.
   * @private
   */
  static _calculateNewAverage(currentAvg, count, newValue) {
    if (count === 0) return newValue;
    return Math.round(((currentAvg * count + newValue) / (count + 1)) * 100) / 100;
  }

  /**
   * Calculate mastery level based on performance.
   * @private
   */
  static _calculateMasteryLevel(accuracyRate, reviewCount, retentionStrength) {
    if (reviewCount < 3) return 'beginner';
    if (accuracyRate >= 90 && retentionStrength >= 0.8) return 'master';
    if (accuracyRate >= 75 && retentionStrength >= 0.6) return 'advanced';
    if (accuracyRate >= 60 && retentionStrength >= 0.4) return 'intermediate';
    return 'beginner';
  }

  /**
   * Calculate retention strength.
   * @private
   */
  static _calculateRetentionStrength(isCorrect, currentStrength, timeSpent) {
    const timeBonus = timeSpent < 30 ? 0.1 : timeSpent < 60 ? 0.05 : 0;
    const change = isCorrect ? 0.15 + timeBonus : -0.1;
    const newStrength = Math.max(0, Math.min(1, currentStrength + change));
    return Math.round(newStrength * 100) / 100;
  }

  /**
   * Calculate next review date using spaced repetition.
   * @private
   */
  static _calculateNextReviewDate(retentionStrength, isCorrect) {
    const baseInterval = 1; // 1 day
    const maxInterval = 180; // 6 months
    
    let multiplier;
    if (retentionStrength >= 0.8) multiplier = 4;
    else if (retentionStrength >= 0.6) multiplier = 3;
    else if (retentionStrength >= 0.4) multiplier = 2;
    else multiplier = 1;

    if (!isCorrect) multiplier = 0.5; // Review sooner if incorrect

    const intervalDays = Math.min(maxInterval, Math.ceil(baseInterval * multiplier * (1 + retentionStrength)));
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + intervalDays);
    
    return nextReview;
  }

  /**
   * Delete concept performance by concept ID.
   * @param {string} conceptId - Concept ID
   * @returns {Promise<boolean>} True if deleted
   */
  static async deleteByConceptId(conceptId) {
    try {
      const firestore = getFirestore();
      const snapshot = await firestore.collection(COLLECTION_NAME)
        .where('conceptId', '==', conceptId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return false;
      }

      await firestore.collection(COLLECTION_NAME).doc(snapshot.docs[0].id).delete();
      console.log(`[ConceptPerformanceStateModel] Deleted concept performance for: ${conceptId}`);
      
      return true;
    } catch (error) {
      console.error('[ConceptPerformanceStateModel] deleteByConceptId error:', error);
      throw error;
    }
  }
}

module.exports = ConceptPerformanceStateModel;
