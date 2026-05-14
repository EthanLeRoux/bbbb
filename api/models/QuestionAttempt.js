'use strict';

const { getFirestore, docToObject, createDocumentWithTimestamps } = require('../firebase');

/**
 * Firestore operations for the normalized question_attempts analytics collection.
 *
 * Each document represents a single question answered within a test attempt,
 * providing the granular, aggregation-friendly data needed for advanced analytics
 * (weak-topic trends, knowledge decay, mistake classification, AI tutoring, etc.)
 *
 * Collection: question_attempts
 *
 * Shape:
 * {
 *   id,
 *   userId,          // future-proofing (pass null until auth is wired)
 *   attemptId,       // parent test_attempt doc id
 *   questionId,      // question key / index ("q0", "q1", …)
 *
 *   domainId,        // e.g. "cybersecurity"
 *   sectionId,       // e.g. "risk-management"
 *   materialId,      // testId or vaultId – the learning material
 *
 *   domainName,      // human-readable copies for display / filtering
 *   sectionName,
 *   materialName,    // test name or vault title
 *
 *   correct,         // boolean
 *   score,           // 0-100 (partial credit if applicable, else 0 or 100)
 *   difficulty,      // "easy" | "medium" | "hard"
 *   timeSpentSeconds,
 *   confidence,      // null | 0-100
 *   mistakeType,     // null or one of MISTAKE_TYPES
 *   answeredAt,      // ISO timestamp / Date
 *   createdAt,
 *   updatedAt,
 * }
 */

const COLLECTION_NAME = 'question_attempts';

/**
 * Supported mistake classifications.
 * Rule-based classification is applied at write time; future AI classification
 * can overwrite this field without a schema change.
 */
const MISTAKE_TYPES = [
  'concept_misunderstanding',  // answered incorrectly due to a knowledge gap
  'careless_error',            // likely knew the answer but made a slip
  'terminology_confusion',     // confused similar-sounding terms
  'rushed_answer',             // answered very quickly and got it wrong
  'partial_knowledge',         // partially correct — had some understanding
  'guessing',                  // very short time + wrong
  'memory_failure',            // long time spent but still wrong
  'misread_question',          // unusually fast wrong answer on a hard question
];

class QuestionAttemptModel {
  // ─────────────────────────────────────────────────────────────────────────
  // WRITE
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Persist a single question-attempt record.
   *
   * @param {Object} data - Question attempt data (see shape above)
   * @returns {Promise<Object>} Created document
   */
  static async create(data) {
    try {
      const firestore = getFirestore();

      const docData = createDocumentWithTimestamps({
        userId:           data.userId           ?? null,
        attemptId:        data.attemptId        ?? null,
        questionId:       data.questionId       ?? null,

        domainId:         data.domainId         ?? null,
        sectionId:        data.sectionId        ?? null,
        materialId:       data.materialId       ?? null,

        domainName:       data.domainName       ?? null,
        sectionName:      data.sectionName      ?? null,
        materialName:     data.materialName     ?? null,

        correct:          data.correct          ?? false,
        score:            data.score            ?? (data.correct ? 100 : 0),
        difficulty:       data.difficulty       ?? null,
        timeSpentSeconds: data.timeSpentSeconds ?? 0,
        confidence:       data.confidence       ?? null,
        mistakeType:      data.mistakeType      ?? null,
        answeredAt:       data.answeredAt       ?? new Date(),
      });

      const docRef = await firestore.collection(COLLECTION_NAME).add(docData);
      const doc    = await docRef.get();

      return docToObject(doc);
    } catch (error) {
      console.error('[QuestionAttemptModel] create error:', error);
      throw error;
    }
  }

  /**
   * Batch-create multiple question-attempt records in a single Firestore
   * batch write (max 500 docs per batch — tests are far smaller).
   *
   * @param {Array<Object>} records - Array of question-attempt data objects
   * @returns {Promise<number>} Number of records written
   */
  static async createBatch(records) {
    if (!records || records.length === 0) return 0;

    try {
      const firestore = getFirestore();
      const batch     = firestore.batch();
      const colRef    = firestore.collection(COLLECTION_NAME);
      const now       = new Date();

      for (const data of records) {
        const docRef  = colRef.doc();              // auto-ID
        const docData = {
          userId:           data.userId           ?? null,
          attemptId:        data.attemptId        ?? null,
          questionId:       data.questionId       ?? null,

          domainId:         data.domainId         ?? null,
          sectionId:        data.sectionId        ?? null,
          materialId:       data.materialId       ?? null,

          domainName:       data.domainName       ?? null,
          sectionName:      data.sectionName      ?? null,
          materialName:     data.materialName     ?? null,

          correct:          data.correct          ?? false,
          score:            data.score            ?? (data.correct ? 100 : 0),
          difficulty:       data.difficulty       ?? null,
          timeSpentSeconds: data.timeSpentSeconds ?? 0,
          confidence:       data.confidence       ?? null,
          mistakeType:      data.mistakeType      ?? null,
          answeredAt:       data.answeredAt       ?? now,
          createdAt:        now,
          updatedAt:        now,
        };
        batch.set(docRef, docData);
      }

      await batch.commit();
      console.log(`[QuestionAttemptModel] Batch wrote ${records.length} question-attempt records`);
      return records.length;
    } catch (error) {
      console.error('[QuestionAttemptModel] createBatch error:', error);
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // READ
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Fetch all question-attempt records for a given test attempt.
   *
   * @param {string} attemptId
   * @returns {Promise<Array>}
   */
  static async findByAttemptId(attemptId) {
    try {
      const firestore = getFirestore();
      const snapshot  = await firestore
        .collection(COLLECTION_NAME)
        .where('attemptId', '==', attemptId)
        .orderBy('answeredAt', 'asc')
        .get();

      return snapshot.docs.map(d => docToObject(d));
    } catch (error) {
      console.error('[QuestionAttemptModel] findByAttemptId error:', error);
      throw error;
    }
  }

  /**
   * Fetch records filtered by domain (and optionally section / material).
   *
   * @param {Object} filters - { domainId, sectionId?, materialId?, limit? }
   * @returns {Promise<Array>}
   */
  static async findByTopic({ domainId, sectionId = null, materialId = null, limit = 200 } = {}) {
    try {
      const firestore = getFirestore();
      let query = firestore
        .collection(COLLECTION_NAME)
        .where('domainId', '==', domainId);

      if (sectionId)  query = query.where('sectionId',  '==', sectionId);
      if (materialId) query = query.where('materialId', '==', materialId);

      query = query.orderBy('answeredAt', 'desc').limit(limit);

      const snapshot = await query.get();
      return snapshot.docs.map(d => docToObject(d));
    } catch (error) {
      console.error('[QuestionAttemptModel] findByTopic error:', error);
      throw error;
    }
  }

  /**
   * Fetch records within a date range.
   *
   * @param {Date}   from
   * @param {Date}   to
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  static async findByDateRange(from, to, limit = 500) {
    try {
      const firestore = getFirestore();
      const snapshot  = await firestore
        .collection(COLLECTION_NAME)
        .where('answeredAt', '>=', from)
        .where('answeredAt', '<=', to)
        .orderBy('answeredAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(d => docToObject(d));
    } catch (error) {
      console.error('[QuestionAttemptModel] findByDateRange error:', error);
      throw error;
    }
  }

  /**
   * Generic flexible query.
   *
   * @param {Object} filters - { domainId?, sectionId?, materialId?, correct?, userId?, limit? }
   * @returns {Promise<Array>}
   */
  static async find({ domainId, sectionId, materialId, correct, userId, limit = 100 } = {}) {
    try {
      const firestore = getFirestore();
      let query = firestore.collection(COLLECTION_NAME);

      if (userId)     query = query.where('userId',     '==', userId);
      if (domainId)   query = query.where('domainId',   '==', domainId);
      if (sectionId)  query = query.where('sectionId',  '==', sectionId);
      if (materialId) query = query.where('materialId', '==', materialId);
      if (correct !== undefined && correct !== null) {
        query = query.where('correct', '==', correct);
      }

      query = query.orderBy('answeredAt', 'desc').limit(limit);
      const snapshot = await query.get();
      return snapshot.docs.map(d => docToObject(d));
    } catch (error) {
      console.error('[QuestionAttemptModel] find error:', error);
      throw error;
    }
  }
}

module.exports = { QuestionAttemptModel, MISTAKE_TYPES, COLLECTION_NAME };
