'use strict';

const { getFirestore } = require('firebase-admin/firestore');
const SpacedRepetitionService = require('./spacedRepetitionService');

const COLLECTION_ATTEMPTS = 'attempts';

/**
 * Unified service for test attempt storage and spaced-repetition integration.
 * All attempt reads/writes flow through this service; spaced-repetition stats
 * are kept in sync as a side-effect of submissions.
 */
class UnifiedTestService {
  constructor() {
    this.db = getFirestore();
    this.attemptsCollection = this.db.collection(COLLECTION_ATTEMPTS);
  }

  // ===============================================
  // START ATTEMPT
  // ===============================================
  async startAttempt({ testId, vaultId = null, domainId = null, sectionId = null }) {
    try {
      const now = new Date();
      const docData = {
        testId,
        vaultId,
        domainId,
        sectionId,
        status: 'in_progress',
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await this.attemptsCollection.add(docData);
      const doc = await docRef.get();
      return this._hydrate(doc.id, doc.data());
    } catch (error) {
      console.error('[UnifiedTestService] startAttempt error:', error);
      throw error;
    }
  }

  // ===============================================
// SUBMIT ATTEMPT
// ===============================================
async submitAttempt({
  attemptId = null,
  testId,
  vaultId = null,
  domainId = null,
  sectionId = null,
  scorePercent,
  totalQuestions,
  correctAnswers,
  avgTimePerQuestion = 0,
  answers = {},
  timings = {},
  perQuestionResults = {},
  critiques = [],
  hasAIScoring = false,
  remarkCount = 0,
}) {
  try {
    const now = new Date();
    const docData = {
      testId,
      vaultId,
      domainId,
      sectionId,
      status: 'completed',
      scorePercent,
      totalQuestions,
      correctAnswers,
      avgTimePerQuestion,
      answers,
      timings,
      perQuestionResults,
      critiques,
      hasAIScoring,
      remarkCount,
      submittedAt: now,
      updatedAt: now,
    };

    let docRef;
    if (attemptId) {
      docRef = this.attemptsCollection.doc(attemptId);
      await docRef.update({ ...docData });
    } else {
      docData.createdAt = now;
      docRef = await this.attemptsCollection.add(docData);
    }

    const doc = await docRef.get();
    const attempt = this._hydrate(doc.id, doc.data());

    // ── Spaced-repetition side-effect (non-fatal) ──────────────────────────
    // Write SR stats whenever we have enough context. Mirrors the logic in
    // updateAttemptWithDomainInfo so that vault test submissions (which go
    // straight to submitAttempt) also populate review_stats.
    if (scorePercent != null && (domainId || vaultId)) {
      try {
        const ssService = new SpacedRepetitionService(this.db);
        const effectiveDomain   = domainId  || 'general';
        const effectiveSection  = sectionId || 'main';
        const effectiveMaterial = vaultId   || testId                  || 'unknown';

        const currentStats = await ssService.getCurrentHierarchyStats(
          effectiveDomain,
          effectiveSection,
          effectiveMaterial,
        );

        const testAttempt = { scorePercent, completedAt: now };

        const hierarchyUpdate = await ssService.updateHierarchyStatistics(
          {
            domainId:   effectiveDomain,
            sectionId:  effectiveSection,
            materialId: effectiveMaterial,
            testAttempt,
            currentStats,
          },
          testAttempt,
          currentStats,
        );

        await ssService.saveUpdatedStats(hierarchyUpdate.updatedStats);

        // Per-note SR — fires when the test document carries sourceNotes
        // and the attempt has per-question results (AI-scored attempts).
        try {
          const Test = require('../models/Test');
          const test = testId ? await Test.findById(testId) : null;
          const sourceNotes = test?.sourceNotes || [];
          if (sourceNotes.length > 0 && Object.keys(perQuestionResults).length > 0) {
            await ssService.updateNoteStats(
              sourceNotes,
              perQuestionResults,
              effectiveDomain,
              effectiveSection,
            );
          }
        } catch (noteErr) {
          console.error('[UnifiedTestService] Per-note SR update failed (non-fatal):', noteErr.message);
        }

        console.log(`[UnifiedTestService] SR stats written for attempt ${attempt.id}`);
      } catch (ssError) {
        console.error('[UnifiedTestService] SR write failed (non-fatal):', ssError.message);
      }
    }

    return attempt;
  } catch (error) {
    console.error('[UnifiedTestService] submitAttempt error:', error);
    throw error;
  }
}

  // ===============================================
  // UPDATE ATTEMPT DOMAIN INFO
  // ===============================================
  async updateAttemptWithDomainInfo(attemptId, { domainId, sectionId, materialId }) {
    try {
      const attemptRef = this.attemptsCollection.doc(attemptId);
      const attemptDoc = await attemptRef.get();

      if (!attemptDoc.exists) {
        throw new Error(`Attempt not found: ${attemptId}`);
      }

      const data = attemptDoc.data();

      if (data.status !== 'completed' || !data.scorePercent) {
        return { success: false, reason: 'Attempt not completed or has no score' };
      }

      let vaultId = data.vaultId;
      if (!vaultId && domainId && sectionId) {
        vaultId = `${domainId}__${sectionId}`;
      }

      const updates = {
        domainId: domainId || data.domainId,
        sectionId: sectionId || data.sectionId,
        materialId: materialId || data.materialId || vaultId,
        vaultId: vaultId || data.vaultId,
        hasAIScoring: true,
        updatedAt: new Date(),
      };

      await attemptRef.update(updates);

      const ssService = new SpacedRepetitionService(this.db);

      try {
        const currentStats = await ssService.getCurrentHierarchyStats(
          updates.domainId,
          updates.sectionId,
          updates.materialId
        );

        const testAttempt = {
          scorePercent: data.scorePercent,
          completedAt: data.submittedAt || data.createdAt || new Date(),
        };

        const hierarchyUpdate = await ssService.updateHierarchyStatistics(
          {
            domainId: updates.domainId,
            sectionId: updates.sectionId,
            materialId: updates.materialId,
            testAttempt,
            currentStats,
          },
          testAttempt,
          currentStats
        );

        await ssService.saveUpdatedStats(hierarchyUpdate.updatedStats);

        try {
          const Test = require('../models/Test');
          const test = data.testId ? await Test.findById(data.testId) : null;
          const sourceNotes = test?.sourceNotes || [];
          const perQuestionResults = data.perQuestionResults || {};
          if (sourceNotes.length > 0 && Object.keys(perQuestionResults).length > 0) {
            await ssService.updateNoteStats(sourceNotes, perQuestionResults, updates.domainId, updates.sectionId);
          }
        } catch (noteErr) {
          console.error('[UnifiedTestService] Per-note SR update failed (non-fatal):', noteErr.message);
        }

        console.log(`[UnifiedTestService] Updated review_stats for attempt ${attemptId} (${updates.domainId}/${updates.sectionId}/${updates.materialId})`);
      } catch (ssError) {
        console.error('[UnifiedTestService] Spaced repetition update failed (non-fatal):', ssError.message);
      }

      const updatedDoc = await attemptRef.get();
      return this._hydrate(updatedDoc.id, updatedDoc.data());
    } catch (error) {
      console.error('[UnifiedTestService] Update attempt domain info error:', error);
      throw error;
    }
  }

  /**
   * Update hierarchy statistics.
   */
  async updateHierarchyStatistics(input, testAttempt, currentStats) {
    const ssService = new SpacedRepetitionService(this.db);
    return await ssService.updateHierarchyStatistics(input, testAttempt, currentStats);
  }

  // ===============================================
  // VAULT HELPERS
  // ===============================================

  async getVaultStats(vaultId) {
    try {
      const snapshot = await this.attemptsCollection
        .where('vaultId', '==', vaultId)
        .where('status', '==', 'completed')
        .orderBy('submittedAt', 'desc')
        .get();

      const attempts = snapshot.docs.map(d => this._hydrate(d.id, d.data()));
      if (attempts.length === 0) return { vaultId, totalAttempts: 0 };

      const scores = attempts.map(a => a.scorePercent).filter(s => s != null);
      const avg = scores.length ? scores.reduce((s, v) => s + v, 0) / scores.length : 0;
      const best = scores.length ? Math.max(...scores) : 0;

      return {
        vaultId,
        totalAttempts: attempts.length,
        avgScore: Math.round(avg * 10) / 10,
        bestScore: best,
        lastAttemptAt: attempts[0]?.submittedAt || null,
      };
    } catch (error) {
      console.error('[UnifiedTestService] getVaultStats error:', error);
      throw error;
    }
  }

  async getVaultItemStats(vaultId) {
    return this.getVaultStats(vaultId);
  }

  async getVaultTestHistory(vaultId, limit = 10) {
    try {
      const snapshot = await this.attemptsCollection
        .where('vaultId', '==', vaultId)
        .where('status', '==', 'completed')
        .orderBy('submittedAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(d => this._hydrate(d.id, d.data()));
    } catch (error) {
      console.error('[UnifiedTestService] getVaultTestHistory error:', error);
      throw error;
    }
  }

  // ===============================================
  // ATTEMPTS QUERY
  // ===============================================

  async getAttempts(options = {}) {
    try {
      const { testId, vaultId, domainId, sectionId, status, limit = 20, offset = 0 } = options;
      let query = this.attemptsCollection;

      if (testId)    query = query.where('testId',    '==', testId);
      if (vaultId)   query = query.where('vaultId',   '==', vaultId);
      if (domainId)  query = query.where('domainId',  '==', domainId);
      if (sectionId) query = query.where('sectionId', '==', sectionId);
      if (status)    query = query.where('status',    '==', status);

      query = query.orderBy('createdAt', 'desc').limit(limit + offset);

      const snapshot = await query.get();
      return snapshot.docs
        .map(d => this._hydrate(d.id, d.data()))
        .slice(offset);
    } catch (error) {
      console.error('[UnifiedTestService] getAttempts error:', error);
      throw error;
    }
  }

  async countAttempts(filters = {}) {
    try {
      const { testId, vaultId, domainId, sectionId, status } = filters;
      let query = this.attemptsCollection;

      if (testId)    query = query.where('testId',    '==', testId);
      if (vaultId)   query = query.where('vaultId',   '==', vaultId);
      if (domainId)  query = query.where('domainId',  '==', domainId);
      if (sectionId) query = query.where('sectionId', '==', sectionId);
      if (status)    query = query.where('status',    '==', status);

      const snapshot = await query.get();
      return snapshot.size;
    } catch (error) {
      console.error('[UnifiedTestService] countAttempts error:', error);
      return 0;
    }
  }

  async getUserStats() {
    try {
      const snapshot = await this.attemptsCollection
        .where('status', '==', 'completed')
        .orderBy('submittedAt', 'desc')
        .get();

      const attempts = snapshot.docs.map(d => this._hydrate(d.id, d.data()));
      const scores = attempts.map(a => a.scorePercent).filter(s => s != null);
      const avg = scores.length ? scores.reduce((s, v) => s + v, 0) / scores.length : 0;

      return {
        totalAttempts: attempts.length,
        avgScore: Math.round(avg * 10) / 10,
        bestScore: scores.length ? Math.max(...scores) : 0,
        lastAttemptAt: attempts[0]?.submittedAt || null,
      };
    } catch (error) {
      console.error('[UnifiedTestService] getUserStats error:', error);
      throw error;
    }
  }

  // ===============================================
  // REVIEW SCHEDULE
  // ===============================================

  async getReviewSchedule(options = {}) {
    try {
      const ssService = new SpacedRepetitionService(this.db);
      return await ssService.getReviewSchedule(options);
    } catch (error) {
      console.error('[UnifiedTestService] getReviewSchedule error:', error);
      throw error;
    }
  }

  // ===============================================
  // REMARK / RESUBMIT
  // ===============================================

  async remarkAttempt(attemptId, remarkData = {}) {
    try {
      const attemptRef = this.attemptsCollection.doc(attemptId);
      const doc = await attemptRef.get();

      if (!doc.exists) throw new Error(`Attempt not found: ${attemptId}`);

      const data = doc.data();
      const updates = {
        ...remarkData,
        remarkCount: (data.remarkCount || 0) + 1,
        updatedAt: new Date(),
      };

      await attemptRef.update(updates);
      const updated = await attemptRef.get();
      return this._hydrate(updated.id, updated.data());
    } catch (error) {
      console.error('[UnifiedTestService] remarkAttempt error:', error);
      throw error;
    }
  }

  async resubmitAttempt(originalTestId, submissionData = {}) {
    try {
      return await this.submitAttempt({
        ...submissionData,
        testId: originalTestId,
        remarkCount: 0,
      });
    } catch (error) {
      console.error('[UnifiedTestService] resubmitAttempt error:', error);
      throw error;
    }
  }

  async getResubmissionAnalytics(vaultId) {
    try {
      const history = await this.getVaultTestHistory(vaultId, 50);
      const scores = history.map(a => a.scorePercent).filter(s => s != null);

      if (scores.length < 2) {
        return { vaultId, improvement: null, attempts: scores.length };
      }

      const first = scores[scores.length - 1];
      const latest = scores[0];

      return {
        vaultId,
        totalAttempts: scores.length,
        firstScore: first,
        latestScore: latest,
        improvement: Math.round((latest - first) * 10) / 10,
        avgScore: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length * 10) / 10,
        trend: latest > first ? 'improving' : latest < first ? 'declining' : 'stable',
      };
    } catch (error) {
      console.error('[UnifiedTestService] getResubmissionAnalytics error:', error);
      throw error;
    }
  }

  // ===============================================
  // INTERNAL HELPERS
  // ===============================================

  _hydrate(id, data) {
    return { id, ...data };
  }
}

module.exports = UnifiedTestService;
