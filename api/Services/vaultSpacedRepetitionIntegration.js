/**
 * =====================================================
 * VAULT - SPACED REPETITION INTEGRATION (updated)
 * =====================================================
 *
 * Key change: vault items live on the filesystem (VaultService),
 * not in Firestore.  The vaultId is a stable key derived by the
 * frontend as:  domain__section__fileNameStem
 *
 * This lets us:
 *  - Resolve domain / section / materialId without a Firestore lookup
 *  - Look up the actual note content via VaultService when needed
 */

'use strict';

const SpacedRepetitionService = require('./spacedRepetitionService');
const VaultService = require('./vaultService');
const { getFirestore } = require('firebase-admin/firestore');

/** Separator used when building the compound vaultId key. */
const ID_SEP = '__';

class VaultSpacedRepetitionIntegration {
  constructor() {
    this.firestore = getFirestore();
    this.spacedRepetitionService = new SpacedRepetitionService(this.firestore);
    // Filesystem-based vault (Obsidian markdown notes)
    this.vaultService = new VaultService();
  }

  // ─── vaultId helpers ────────────────────────────────────────────────────────

  /**
   * Parse a compound vaultId back into its parts.
   * Format:  domain__section__fileNameStem
   *
   * Falls back gracefully for legacy / unknown ids.
   *
   * @param {string} vaultId
   * @returns {{ domain: string, section: string, stem: string, isCompound: boolean }}
   */
  parseVaultId(vaultId) {
    const parts = vaultId.split(ID_SEP);
    if (parts.length >= 3) {
      return {
        domain: parts[0],
        section: parts[1],
        stem: parts.slice(2).join(ID_SEP),
        isCompound: true,
      };
    }
    return { domain: 'general', section: 'main', stem: vaultId, isCompound: false };
  }

  /**
   * Attempt to find the matching Note object in VaultService.
   * Returns null if not found (non-fatal).
   *
   * @param {string} vaultId
   * @returns {Promise<import('./vaultService').Note | null>}
   */
  async getVaultItem(vaultId) {
    try {
      const { domain, section, stem } = this.parseVaultId(vaultId);
      const notes = await this.vaultService.getNotesBySection(domain, section);
      return notes.find(n => n.fileName.replace(/\.md$/i, '') === stem) || null;
    } catch {
      return null;
    }
  }

  // ─── Hierarchy mapping ──────────────────────────────────────────────────────

  /**
   * Derive the spaced-repetition hierarchy from a vaultId.
   * Uses the compound key directly — no Firestore needed.
   *
   * @param {string} vaultId
   * @param {import('./vaultService').Note | null} note
   * @returns {{ domainId: string, sectionId: string, materialId: string }}
   */
  mapVaultToHierarchy(vaultId, note) {
    const { domain, section } = this.parseVaultId(vaultId);

    return {
      domainId: domain,
      sectionId: section,
      materialId: vaultId,   // use the full compound key as the stable material id
    };
  }

  // ─── Core submission ────────────────────────────────────────────────────────

  async processVaultTestSubmission(testData) {
    try {
      console.log(`[VaultIntegration] Processing test for vault: ${testData.vaultId}`);

      // 1. Try to get the note from the filesystem (optional — graceful fallback)
      const note = await this.getVaultItem(testData.vaultId);

      // 2. Map to spaced repetition hierarchy
      const hierarchyData = this.mapVaultToHierarchy(testData.vaultId, note);

      // 3. Build submission payload
      const spacedRepetitionData = {
        domainId: hierarchyData.domainId,
        sectionId: hierarchyData.sectionId,
        materialId: hierarchyData.materialId,
        scorePercent: testData.scorePercent,
        totalQuestions: testData.totalQuestions,
        correctAnswers: testData.correctAnswers,
        avgTimePerQuestion: testData.avgTimePerQuestion,
        vaultId: testData.vaultId,
        vaultTitle: note?.title || testData.vaultId,
        isResubmission: testData.isResubmission || false,
        originalTestId: testData.originalTestId || null,
      };

      // 4. Submit to spaced repetition engine
      const result = await this.spacedRepetitionService.submitTest(spacedRepetitionData);

      // 5. Store mapping so review schedule can enrich with vault info later
      await this.storeVaultMapping(testData.vaultId, hierarchyData, note);

      // 6. Track resubmission record if applicable
      if (testData.isResubmission) {
        await this.trackTestResubmission(testData, result);
      }

      console.log(`[VaultIntegration] Processed: ${testData.vaultId} → ${result.testAttempt.recallQuality}`);

      return {
        success: true,
        vaultId: testData.vaultId,
        vaultInfo: {
          vaultId: testData.vaultId,
          title: note?.title || testData.vaultId,
          domain: this.formatFolderName(hierarchyData.domainId),
          section: this.formatFolderName(hierarchyData.sectionId),
          path: note ? `${note.domain}/${note.section}/${note.fileName}` : testData.vaultId,
        },
        spacedRepetitionResult: { data: result },
        hierarchyMapping: hierarchyData,
        submissionType: testData.isResubmission ? 'resubmission' : 'new',
        resubmissionAnalysis: testData.isResubmission
          ? await this.analyzeResubmission(testData, { data: result })
          : null,
      };

    } catch (error) {
      console.error('[VaultIntegration] Error processing vault test:', error);
      throw new Error(`Failed to process vault test: ${error.message}`);
    }
  }

  // ─── Mapping storage ────────────────────────────────────────────────────────

  async storeVaultMapping(vaultId, hierarchyData, note) {
    try {
      await this.firestore
        .collection('vault_spaced_repetition_mapping')
        .doc(vaultId)
        .set({
          vaultId,
          ...hierarchyData,
          title: note?.title || vaultId,
          fileName: note?.fileName || '',
          createdAt: new Date(),
          updatedAt: new Date(),
        }, { merge: true });
    } catch (error) {
      console.error('[VaultIntegration] Error storing mapping (non-fatal):', error);
    }
  }

  // ─── Review schedule ────────────────────────────────────────────────────────

  async getVaultReviewRecommendations(options = {}) {
    const { limit = 20, timeRange = 'all', startDate = null, endDate = null } = options;

    const schedule = await this.spacedRepetitionService.getReviewSchedule(limit * 2);
    const filtered = this.filterScheduleByTimeRange(schedule, timeRange, startDate, endDate);
    const enriched = await this.enrichScheduleWithVaultInfo(filtered);

    enriched.due      = enriched.due.slice(0, limit);
    enriched.upcoming = enriched.upcoming.slice(0, limit);
    return enriched;
  }

  filterScheduleByTimeRange(schedule, timeRange, startDate, endDate) {
    if (timeRange === 'all') return schedule;

    const now = new Date();
    let filterStart, filterEnd;

    switch (timeRange) {
      case 'day':
        filterStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filterEnd   = new Date(filterStart.getTime() + 86400000);
        break;
      case 'week': {
        filterStart = new Date(now.getTime() - now.getDay() * 86400000);
        filterStart.setHours(0, 0, 0, 0);
        filterEnd = new Date(filterStart.getTime() + 7 * 86400000);
        break;
      }
      case 'month':
        filterStart = new Date(now.getFullYear(), now.getMonth(), 1);
        filterEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case 'custom':
        filterStart = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
        filterEnd   = endDate   ? new Date(endDate)   : new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      default:
        return schedule;
    }

    const inRange = item => {
      if (!item.nextReviewAt) return false;
      const d = new Date(item.nextReviewAt);
      return d >= filterStart && d <= filterEnd;
    };

    return {
      due:      schedule.due.filter(inRange),
      upcoming: schedule.upcoming.filter(inRange),
    };
  }

  async enrichScheduleWithVaultInfo(schedule) {
    const enrich = async item => {
      const info = await this.getVaultInfoFromMaterial(item.entityId);
      return { ...item, vaultInfo: info };
    };

    return {
      due:      await Promise.all(schedule.due.map(enrich)),
      upcoming: await Promise.all(schedule.upcoming.map(enrich)),
    };
  }

  // ─── Test history ────────────────────────────────────────────────────────────

  async getVaultTestHistory(vaultId, limit = 10) {
    try {
      // materialId == vaultId in the new scheme
      const attemptsSnapshot = await this.spacedRepetitionService.testAttemptsCollection
        .where('materialTypeId', '==', vaultId)
        .orderBy('completedAt', 'desc')
        .limit(limit)
        .get();

      if (!attemptsSnapshot.empty) {
        return attemptsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            completedAt: data.completedAt.toDate(),
            createdAt: data.createdAt.toDate(),
            // Ensure these booleans exist for UI filtering
            isResubmission: data.isResubmission || false,
            originalTestId: data.originalTestId || null,
          };
        });
      }

      // Fallback: look up via mapping doc (supports legacy ids)
      const mappingDoc = await this.firestore
        .collection('vault_spaced_repetition_mapping')
        .doc(vaultId)
        .get();

      if (!mappingDoc.exists) return [];

      const { materialId } = mappingDoc.data();
      const fallback = await this.spacedRepetitionService.testAttemptsCollection
        .where('materialTypeId', '==', materialId)
        .orderBy('completedAt', 'desc')
        .limit(limit)
        .get();

      return fallback.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          completedAt: data.completedAt.toDate(),
          createdAt: data.createdAt.toDate(),
          isResubmission: data.isResubmission || false,
          originalTestId: data.originalTestId || null,
        };
      });

    } catch (error) {
      console.error('[VaultIntegration] Error getting vault test history:', error);
      return [];
    }
  }

  // ─── Resubmission ────────────────────────────────────────────────────────────

  async resubmitVaultTest(vaultId, originalTestId, updatedTestData) {
    const originalTestSnap = await this.spacedRepetitionService.testAttemptsCollection
      .doc(originalTestId)
      .get();

    if (!originalTestSnap.exists) {
      throw new Error(`Original test not found: ${originalTestId}`);
    }

    const originalTest = originalTestSnap.data();

    const resubmissionData = {
      ...updatedTestData,
      vaultId,
      isResubmission: true,
      originalTestId,
      originalScore: originalTest.scorePercent,
      originalCompletedAt: originalTest.completedAt.toDate(),
    };

    const result = await this.processVaultTestSubmission(resubmissionData);

    // Track and analyze resubmission (pass original doc)
    await this.trackTestResubmission(resubmissionData, result, originalTest);
    const analysis = await this.analyzeResubmission(resubmissionData, result, originalTest);

    return { ...result, resubmissionAnalysis: analysis };
  }

  async trackTestResubmission(testData, result, originalDoc) {
    try {
      const newTestId = result.spacedRepetitionResult?.data?.testAttempt?.id || result.testAttempt?.id;
      await this.firestore.collection('test_resubmissions').add({
        vaultId: testData.vaultId,
        originalTestId: testData.originalTestId,
        newTestId,
        originalScore: testData.originalScore,
        newScore: testData.scorePercent,
        scoreChange: testData.scorePercent - testData.originalScore,
        originalCompletedAt: testData.originalCompletedAt,
        resubmittedAt: new Date(),
        recallQualityChange: {
          original: originalDoc?.recallQuality || 'unknown',
          new: result.spacedRepetitionResult?.data?.testAttempt?.recallQuality || result.testAttempt?.recallQuality,
        },
        retentionStrengthChange: {
          original: originalDoc?.retentionStrength || 0,
          new: result.spacedRepetitionResult?.data?.updatedStats?.material?.retentionStrength || 0,
        },
      });
    } catch (error) {
      console.error('[VaultIntegration] Error tracking resubmission (non-fatal):', error);
    }
  }

  async analyzeResubmission(testData, result, originalDoc) {
    try {
      const originalScore = originalDoc?.scorePercent || testData.originalScore;
      const originalRetention = originalDoc?.retentionStrength || testData.originalRetentionStrength || 0;
      const originalRecallQuality = originalDoc?.recallQuality || testData.originalRecallQuality || 'unknown';

      // result is the full submission response; drill into spacedRepetitionResult.data
      const submissionData = result.spacedRepetitionResult?.data || result;
      const newStats = submissionData.updatedStats?.material;

      const scoreImprovement = testData.scorePercent - originalScore;
      const recallQualityImproved = this.compareRecallQuality(
        submissionData.testAttempt?.recallQuality,
        originalRecallQuality
      );

      return {
        scoreImprovement,
        scoreImprovementPercent: originalScore > 0 ? ((scoreImprovement / originalScore) * 100).toFixed(1) : '0',
        recallQualityImproved,
        retentionStrengthChange: (newStats?.retentionStrength || 0) - originalRetention,
        priorityScoreChange: (newStats?.priorityScore || 0) - (testData.originalPriorityScore || 0),
        timeSinceOriginal: testData.originalCompletedAt
          ? Math.floor((Date.now() - new Date(testData.originalCompletedAt)) / 86400000)
          : 0,
        recommendation: this.generateResubmissionRecommendation(scoreImprovement, recallQualityImproved),
      };
    } catch (error) {
      console.error('[VaultIntegration] Error analyzing resubmission:', error);
      return null;
    }
  }

  compareRecallQuality(newQ, oldQ) {
    const levels = { fail: 1, again: 2, hard: 3, good: 4, easy: 5 };
    return (levels[newQ] || 0) > (levels[oldQ] || 0);
  }

  generateResubmissionRecommendation(improvement, qualityImproved) {
    if (improvement > 20 && qualityImproved) return 'Excellent improvement! Consider increasing review interval.';
    if (improvement > 10)  return 'Good improvement! Continue with current review schedule.';
    if (improvement > 0)   return 'Slight improvement. Additional practice recommended.';
    return 'No improvement. Consider reviewing fundamental concepts.';
  }

  // ─── Analytics ───────────────────────────────────────────────────────────────

  async getVaultResubmissionAnalytics(vaultId) {
    try {
      const snap = await this.firestore
        .collection('test_resubmissions')
        .where('vaultId', '==', vaultId)
        .orderBy('resubmittedAt', 'desc')
        .get();

      if (snap.empty) {
        return { totalResubmissions: 0, averageScoreImprovement: 0, averageRetentionGain: 0, improvementRate: 0 };
      }

      const rows = snap.docs.map(d => d.data());
      const total = rows.length;

      return {
        totalResubmissions: total,
        averageScoreImprovement: (rows.reduce((s, r) => s + r.scoreChange, 0) / total).toFixed(1),
        averageRetentionGain: (rows.reduce((s, r) => s + (r.retentionStrengthChange?.new || 0), 0) / total).toFixed(2),
        improvementRate: ((rows.filter(r => r.scoreChange > 0).length / total) * 100).toFixed(1),
        recentResubmissions: rows.slice(0, 5),
      };
    } catch (error) {
      console.error('[VaultIntegration] Error getting resubmission analytics:', error);
      return null;
    }
  }

  // ─── Stats ───────────────────────────────────────────────────────────────────

  async getVaultItemStats(vaultId) {
    try {
      const statsDoc = await this.spacedRepetitionService.reviewStatsCollection
        .doc(`material_${vaultId}`)
        .get();

      if (!statsDoc.exists) return null;

      const s = statsDoc.data();
      const { domain, section } = this.parseVaultId(vaultId);

      return {
        vaultId,
        domainId: domain,
        sectionId: section,
        materialId: vaultId,
        spacedRepetitionStats: {
          avgScore: s.avgScore,
          weightedScore: s.weightedScore,
          reviewCount: s.reviewCount,
          streak: s.streak,
          lapseCount: s.lapseCount,
          retentionStrength: s.retentionStrength,
          priorityScore: s.priorityScore,
          lastReviewedAt: s.lastReviewedAt?.toDate(),
          nextReviewAt: s.nextReviewAt?.toDate(),
        },
      };
    } catch (error) {
      console.error('[VaultIntegration] Error getting vault item stats:', error);
      return null;
    }
  }

  // ─── Vault info lookup (for enriching review schedule) ───────────────────────

  async getVaultInfoFromMaterial(materialId) {
    try {
      const note = await this.getVaultItem(materialId);
      const { domain, section } = this.parseVaultId(materialId);

      return {
        vaultId: materialId,
        title: note?.title || materialId,
        domain: this.formatFolderName(domain),
        section: this.formatFolderName(section),
        path: note ? `${note.domain}/${note.section}/${note.fileName}` : '',
        folders: note ? [note.domain, note.section] : [],
      };
    } catch (error) {
      console.error('[VaultIntegration] Error getting vault info from material:', error);
      return null;
    }
  }

  formatFolderName(name) {
    if (!name || name === 'general' || name === 'main') return name;
    return name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  // ─── Migration ───────────────────────────────────────────────────────────────

  async migrateVaultContentToSpacedRepetition() {
    const notes = await this.vaultService.getAllNotes(100, 0);
    const processed = [];

    for (const note of notes) {
      const vaultId = `${note.domain}${ID_SEP}${note.section}${ID_SEP}${note.fileName.replace(/\.md$/i, '')}`;
      const hierarchyData = this.mapVaultToHierarchy(vaultId, note);
      await this.storeVaultMapping(vaultId, hierarchyData, note);
      processed.push({ vaultId, title: note.title, hierarchy: hierarchyData });
    }

    console.log(`[VaultIntegration] Migrated ${processed.length} vault items`);
    return processed;
  }
}

module.exports = VaultSpacedRepetitionIntegration;