'use strict';

/**
 * =====================================================
 * SPACED REPETITION SERVICE
 * =====================================================
 */

const { updateHierarchyStats } = require('./spacedRepetition/updateHierarchyStats');
const { calculateRecallQuality } = require('./spacedRepetition/calculateRecallQuality');
const { calculateRetentionStrength } = require('./spacedRepetition/calculateRetentionStrength');
const { calculateWeightedScore } = require('./spacedRepetition/calculateWeightedScore');

class SpacedRepetitionService {
  constructor(firestore) {
    this.firestore = firestore;
    this.testAttemptsCollection = firestore.collection('test_attempts');
    this.reviewStatsCollection = firestore.collection('review_stats');
  }

  async submitTest(testData) {
    try {
      console.log(`[SpacedRepetitionService] Submitting test for material: ${testData.materialId}`);
      this.validateTestSubmission(testData);
      const testAttempt = await this.saveTestAttempt(testData);
      const currentStats = await this.getCurrentHierarchyStats(testData.domainId, testData.sectionId, testData.materialId);
      const hierarchyUpdate = await this.updateHierarchyStatistics(testData, testAttempt, currentStats);
      await this.saveUpdatedStats(hierarchyUpdate.updatedStats);
      if (testData.sourceNotes && testData.perQuestionResults) {
        await this.updateNoteStats(testData.sourceNotes, testData.perQuestionResults, testData.domainId, testData.sectionId);
      }
      return this.formatSubmissionResults(testAttempt, hierarchyUpdate);
    } catch (error) {
      console.error('[SpacedRepetitionService] Test submission error:', error);
      throw new Error(`Failed to submit test: ${error.message}`);
    }
  }

  validateTestSubmission(testData) {
    const required = ['domainId', 'sectionId', 'materialId', 'scorePercent', 'totalQuestions'];
    for (const field of required) {
      if (!testData[field]) throw new Error(`Missing required field: ${field}`);
    }
    if (typeof testData.scorePercent !== 'number' || testData.scorePercent < 0 || testData.scorePercent > 100) {
      throw new Error('Invalid scorePercent: must be 0-100');
    }
    if (typeof testData.totalQuestions !== 'number' || testData.totalQuestions <= 0) {
      throw new Error('Invalid totalQuestions: must be positive number');
    }
    if (testData.correctAnswers && (testData.correctAnswers < 0 || testData.correctAnswers > testData.totalQuestions)) {
      throw new Error('Invalid correctAnswers: must be 0-totalQuestions');
    }
  }

  async saveTestAttempt(testData) {
    const { calculateRecallQuality } = require('./spacedRepetition/calculateRecallQuality');
    const testAttempt = {
      domainId: testData.domainId,
      sectionId: testData.sectionId,
      materialTypeId: testData.materialId,
      scorePercent: testData.scorePercent,
      totalQuestions: testData.totalQuestions,
      correctAnswers: testData.correctAnswers || Math.round(testData.scorePercent * testData.totalQuestions / 100),
      avgTimePerQuestion: testData.avgTimePerQuestion || 0,
      completedAt: new Date(),
      createdAt: new Date(),
      recallQuality: calculateRecallQuality(testData.scorePercent).quality,
      retentionStrength: testData.retentionStrength || 1.0,
      isResubmission: testData.isResubmission || false,
      originalTestId: testData.originalTestId || null,
    };
    const docRef = await this.testAttemptsCollection.add(testAttempt);
    const doc = await docRef.get();
    console.log(`[SpacedRepetitionService] Saved test attempt: ${doc.id}`);
    return { id: doc.id, ...testAttempt, completedAt: doc.data().completedAt.toDate() };
  }

  async getCurrentHierarchyStats(domainId, sectionId, materialId) {
    const stats = {};
    try {
      const materialDoc = await this.reviewStatsCollection.doc(`material_${materialId}`).get();
      if (materialDoc.exists) {
        stats.material = {
          ...materialDoc.data(),
          lastReviewedAt: materialDoc.data().lastReviewedAt?.toDate(),
          nextReviewAt: materialDoc.data().nextReviewAt?.toDate()
        };
      }
      const sectionDoc = await this.reviewStatsCollection.doc(`section_${sectionId}`).get();
      if (sectionDoc.exists) {
        stats.section = {
          ...sectionDoc.data(),
          lastReviewedAt: sectionDoc.data().lastReviewedAt?.toDate(),
          nextReviewAt: sectionDoc.data().nextReviewAt?.toDate()
        };
      }
      const domainDoc = await this.reviewStatsCollection.doc(`domain_${domainId}`).get();
      if (domainDoc.exists) {
        stats.domain = {
          ...domainDoc.data(),
          lastReviewedAt: domainDoc.data().lastReviewedAt?.toDate(),
          nextReviewAt: domainDoc.data().nextReviewAt?.toDate()
        };
      }
    } catch (error) {
      console.error('[SpacedRepetitionService] Error getting current stats:', error);
    }
    return stats;
  }

  async updateHierarchyStatistics(testData, testAttempt, currentStats) {
    const input = {
      materialId: testData.materialId,
      sectionId: testData.sectionId,
      domainId: testData.domainId,
      testAttempt: {
        scorePercent: testAttempt.scorePercent,
        completedAt: testAttempt.completedAt
      },
      currentStats
    };
    return await updateHierarchyStats(input);
  }

  async saveUpdatedStats(updatedStats) {
    const batch = this.firestore.batch();
    const materialRef = this.reviewStatsCollection.doc(`material_${updatedStats.material.entityId}`);
    batch.set(materialRef, { ...updatedStats.material, lastReviewedAt: updatedStats.material.lastReviewedAt, nextReviewAt: updatedStats.material.nextReviewAt, updatedAt: new Date() }, { merge: true });
    const sectionRef = this.reviewStatsCollection.doc(`section_${updatedStats.section.entityId}`);
    batch.set(sectionRef, { ...updatedStats.section, lastReviewedAt: updatedStats.section.lastReviewedAt, nextReviewAt: updatedStats.section.nextReviewAt, updatedAt: new Date() }, { merge: true });
    const domainRef = this.reviewStatsCollection.doc(`domain_${updatedStats.domain.entityId}`);
    batch.set(domainRef, { ...updatedStats.domain, lastReviewedAt: updatedStats.domain.lastReviewedAt, nextReviewAt: updatedStats.domain.nextReviewAt, updatedAt: new Date() }, { merge: true });
    await batch.commit();
    console.log('[SpacedRepetitionService] Saved updated hierarchy stats');
  }

  formatSubmissionResults(testAttempt, hierarchyUpdate) {
    const { calculateRecallQuality } = require('./spacedRepetition/calculateRecallQuality');
    const recallQuality = calculateRecallQuality(testAttempt.scorePercent);
    return {
      testAttempt: {
        id: testAttempt.id,
        scorePercent: testAttempt.scorePercent,
        totalQuestions: testAttempt.totalQuestions,
        correctAnswers: testAttempt.correctAnswers,
        avgTimePerQuestion: testAttempt.avgTimePerQuestion,
        completedAt: testAttempt.completedAt,
        recallQuality: recallQuality.quality,
        recallDescription: recallQuality.description
      },
      updatedStats: {
        material: {
          entityId: hierarchyUpdate.updatedStats.material.entityId,
          avgScore: hierarchyUpdate.updatedStats.material.avgScore,
          weightedScore: hierarchyUpdate.updatedStats.material.weightedScore,
          retentionStrength: hierarchyUpdate.updatedStats.material.retentionStrength,
          priorityScore: hierarchyUpdate.updatedStats.material.priorityScore,
          nextReviewAt: hierarchyUpdate.updatedStats.material.nextReviewAt,
          reviewCount: hierarchyUpdate.updatedStats.material.reviewCount,
          streak: hierarchyUpdate.updatedStats.material.streak,
          lapseCount: hierarchyUpdate.updatedStats.material.lapseCount
        },
        section: {
          entityId: hierarchyUpdate.updatedStats.section.entityId,
          avgScore: hierarchyUpdate.updatedStats.section.avgScore,
          weightedScore: hierarchyUpdate.updatedStats.section.weightedScore,
          retentionStrength: hierarchyUpdate.updatedStats.section.retentionStrength,
          priorityScore: hierarchyUpdate.updatedStats.section.priorityScore,
          nextReviewAt: hierarchyUpdate.updatedStats.section.nextReviewAt,
          reviewCount: hierarchyUpdate.updatedStats.section.reviewCount,
          streak: hierarchyUpdate.updatedStats.section.streak,
          lapseCount: hierarchyUpdate.updatedStats.section.lapseCount
        },
        domain: {
          entityId: hierarchyUpdate.updatedStats.domain.entityId,
          avgScore: hierarchyUpdate.updatedStats.domain.avgScore,
          weightedScore: hierarchyUpdate.updatedStats.domain.weightedScore,
          retentionStrength: hierarchyUpdate.updatedStats.domain.retentionStrength,
          priorityScore: hierarchyUpdate.updatedStats.domain.priorityScore,
          nextReviewAt: hierarchyUpdate.updatedStats.domain.nextReviewAt,
          reviewCount: hierarchyUpdate.updatedStats.domain.reviewCount,
          streak: hierarchyUpdate.updatedStats.domain.streak,
          lapseCount: hierarchyUpdate.updatedStats.domain.lapseCount
        }
      },
      weakAreas: hierarchyUpdate.weakAreas,
      nextReviewRecommendations: {
        material: hierarchyUpdate.nextReviewRecommendations.material,
        section: hierarchyUpdate.nextReviewRecommendations.section,
        domain: hierarchyUpdate.nextReviewRecommendations.domain
      },
      hierarchyImpact: hierarchyUpdate.hierarchyImpact
    };
  }

  /**
   * Get review schedule.
   * Accepts either a plain integer limit (legacy) or an options object.
   */
  async getReviewSchedule(options = {}) {
    try {
      // Support legacy call signature: getReviewSchedule(20)
      if (typeof options === 'number') {
        options = { limit: options };
      }

      const limit = Math.floor(Number(options.limit) || 20);
      const now = new Date();

      const allReviews = await this.reviewStatsCollection
        .limit(limit * 2)
        .get();

      const reviews = allReviews.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        nextReviewAt: doc.data().nextReviewAt?.toDate(),
        lastReviewedAt: doc.data().lastReviewedAt?.toDate()
      }));

      // Apply timeRange filter if provided
      let filteredReviews = reviews;
      if (options.timeRange && options.timeRange !== 'all') {
        const start = options.startDate ? new Date(options.startDate) : null;
        const end = options.endDate ? new Date(options.endDate) : null;

        let rangeStart = null;
        let rangeEnd = null;

        if (options.timeRange === 'custom') {
          rangeStart = start;
          rangeEnd = end;
        } else if (options.timeRange === 'day') {
          rangeStart = new Date(now); rangeStart.setHours(0, 0, 0, 0);
          rangeEnd = new Date(now); rangeEnd.setHours(23, 59, 59, 999);
        } else if (options.timeRange === 'week') {
          rangeStart = new Date(now); rangeStart.setDate(now.getDate() - 7);
        } else if (options.timeRange === 'month') {
          rangeStart = new Date(now); rangeStart.setMonth(now.getMonth() - 1);
        }

        if (rangeStart || rangeEnd) {
          filteredReviews = reviews.filter(r => {
            if (!r.nextReviewAt) return false;
            if (rangeStart && r.nextReviewAt < rangeStart) return false;
            if (rangeEnd && r.nextReviewAt > rangeEnd) return false;
            return true;
          });
        }
      }

      const dueReviews = filteredReviews
        .filter(r => r.nextReviewAt && r.nextReviewAt <= now)
        .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))
        .slice(0, limit);

      const upcomingReviews = filteredReviews
        .filter(r => r.nextReviewAt && r.nextReviewAt > now)
        .sort((a, b) => a.nextReviewAt - b.nextReviewAt)
        .slice(0, limit);

      return { due: dueReviews, upcoming: upcomingReviews };
    } catch (error) {
      console.error('[SpacedRepetitionService] Error getting review schedule:', error);
      throw new Error(`Failed to get review schedule: ${error.message}`);
    }
  }

  async getUserStats() {
    try {
      const stats = await this.reviewStatsCollection.get();
      const userStats = {
        totalReviews: 0,
        avgScore: 0,
        avgWeightedScore: 0,
        avgRetentionStrength: 0,
        totalLapses: 0,
        entitiesByType: { material: 0, section: 0, domain: 0 },
        priorityDistribution: { critical: 0, high: 0, medium: 0, low: 0 }
      };
      let totalScore = 0, totalWeightedScore = 0, totalStrength = 0;
      stats.forEach(doc => {
        const data = doc.data();
        userStats.totalReviews += data.reviewCount || 0;
        userStats.totalLapses += data.lapseCount || 0;
        userStats.entitiesByType[data.entityType] = (userStats.entitiesByType[data.entityType] || 0) + 1;
        totalScore += data.avgScore || 0;
        totalWeightedScore += data.weightedScore || 0;
        totalStrength += data.retentionStrength || 0;
        const priority = data.priorityScore || 0;
        if (priority >= 75) userStats.priorityDistribution.critical++;
        else if (priority >= 50) userStats.priorityDistribution.high++;
        else if (priority >= 25) userStats.priorityDistribution.medium++;
        else userStats.priorityDistribution.low++;
      });
      const totalEntities = stats.size || 1;
      userStats.avgScore = totalScore / totalEntities;
      userStats.avgWeightedScore = totalWeightedScore / totalEntities;
      userStats.avgRetentionStrength = totalStrength / totalEntities;
      return userStats;
    } catch (error) {
      console.error('[SpacedRepetitionService] Error getting user stats:', error);
      throw new Error(`Failed to get user stats: ${error.message}`);
    }
  }

  async updateNoteStats(sourceNotes, perQuestionResults, domainId, sectionId) {
    const { calculateNextReviewDate } = require('./spacedRepetition/calculateNextReviewDate');
    const { calculateRecallQuality } = require('./spacedRepetition/calculateRecallQuality');

    if (!sourceNotes || sourceNotes.length === 0) return;

    const now = new Date();
    const noteByTitle = {};
    for (const note of sourceNotes) {
      if (note.noteId) {
        noteByTitle[note.noteId.toLowerCase()] = note;
        if (note.title) noteByTitle[note.title.toLowerCase()] = note;
      }
    }

    const noteScores = {};
    for (const [, result] of Object.entries(perQuestionResults)) {
      const concept = (result.sourceConcept || result.conceptId || '').toLowerCase().trim();
      const matched = concept ? noteByTitle[concept] : null;
      if (!matched) continue;
      const id = matched.noteId;
      if (!noteScores[id]) noteScores[id] = { correct: 0, total: 0, note: matched };
      noteScores[id].total += 1;
      if (result.correct) noteScores[id].correct += 1;
    }

    if (Object.keys(noteScores).length === 0) {
      console.log('[SpacedRepetitionService] No note-question mappings found; skipping per-note SR update');
      return;
    }

    const batch = this.firestore.batch();

    for (const [noteId, { correct, total, note }] of Object.entries(noteScores)) {
      const scorePercent = total > 0 ? Math.round((correct / total) * 100) : 0;
      const docId = `note_${noteId}`;
      const ref = this.reviewStatsCollection.doc(docId);

      let existing = null;
      try {
        const snap = await ref.get();
        if (snap.exists) existing = snap.data();
      } catch (_) { /* first time */ }

      const reviewCount = (existing?.reviewCount || 0) + 1;
      const retentionStrength = existing?.retentionStrength || 1.0;
      const currentInterval = existing?.intervalDays || null;
      const recallQuality = calculateRecallQuality(scorePercent);

      const nextReview = calculateNextReviewDate({
        currentScore: scorePercent,
        retentionStrength,
        reviewCount,
        currentInterval,
        lastReviewDate: now,
      });

      const prevStreak = existing?.streak || 0;
      const streak = (recallQuality.quality === 'good' || recallQuality.quality === 'easy') ? prevStreak + 1 : 0;
      const lapseCount = (existing?.lapseCount || 0) + (recallQuality.quality === 'fail' || recallQuality.quality === 'again' ? 1 : 0);
      const prevAvg = existing?.avgScore || scorePercent;
      const avgScore = Math.round(((prevAvg * (reviewCount - 1)) + scorePercent) / reviewCount * 10) / 10;

      const docData = {
        entityType: 'note',
        entityId: noteId,
        noteId,
        noteTitle: note.title || '',
        domainId,
        sectionId,
        section: note.section || sectionId || '',
        lastScore: scorePercent,
        avgScore,
        questionsAttempted: total,
        questionsCorrect: correct,
        recallQuality: recallQuality.quality,
        reviewCount,
        streak,
        lapseCount,
        retentionStrength,
        intervalDays: nextReview.intervalDays,
        lastReviewedAt: now,
        nextReviewAt: nextReview.nextReviewDate,
        schedulingReason: nextReview.schedulingReason,
        updatedAt: now,
      };

      if (!existing) docData.createdAt = now;
      batch.set(ref, docData, { merge: true });
    }

    await batch.commit();
    console.log(`[SpacedRepetitionService] Updated SR stats for ${Object.keys(noteScores).length} notes`);
  }
}

module.exports = SpacedRepetitionService;