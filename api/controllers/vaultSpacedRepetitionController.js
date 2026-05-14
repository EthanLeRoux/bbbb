'use strict';

/**
 * =====================================================
 * VAULT SPACED REPETITION CONTROLLER
 * =====================================================
 *
 * Handles vault-based spaced repetition operations.
 * All attempt storage and SR data flows through UnifiedTestService
 * so that vault attempts and regular attempts share a single
 * Firestore "attempts" collection.
 */

const UnifiedTestService = require('../Services/unifiedTestService');
const VaultService = require('../Services/vaultService');

class VaultSpacedRepetitionController {
  constructor() {
    this.service = new UnifiedTestService();
    this.vaultService = new VaultService();
  }

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────

  async _getVaultCardOrThrow(id) {
    const card = await this.vaultService.getNoteById(id);
    if (!card) throw new Error(`Vault card not found: ${id}`);
    return card;
  }

  /**
   * Validate vault test submission body.
   * Throws on invalid data, returns the coerced body on success.
   */
  _validateVaultTestSubmission(body) {
    for (const field of ['vaultId', 'scorePercent', 'totalQuestions']) {
      if (body[field] == null) throw new Error(`Missing required field: ${field}`);
    }
    if (typeof body.scorePercent !== 'number' || body.scorePercent < 0 || body.scorePercent > 100) {
      throw new Error('scorePercent must be a number between 0 and 100');
    }
    if (typeof body.totalQuestions !== 'number' || body.totalQuestions <= 0) {
      throw new Error('totalQuestions must be a positive number');
    }
    if (body.correctAnswers != null) {
      if (typeof body.correctAnswers !== 'number' || body.correctAnswers < 0 || body.correctAnswers > body.totalQuestions) {
        throw new Error('correctAnswers must be a number between 0 and totalQuestions');
      }
    }
    if (body.avgTimePerQuestion != null) {
      if (typeof body.avgTimePerQuestion !== 'number' || body.avgTimePerQuestion < 0) {
        throw new Error('avgTimePerQuestion must be a non-negative number');
      }
    }
    return body;
  }

  // ─────────────────────────────────────────────
  // POST /api/vault-learning/submit-test
  // ─────────────────────────────────────────────
  submitVaultTest = async (req, res) => {
    try {
      const testData = this._validateVaultTestSubmission(req.body);
      const { vaultId, scorePercent, totalQuestions, correctAnswers, avgTimePerQuestion } = testData;

      const card = await this._getVaultCardOrThrow(vaultId);

      const attempt = await this.service.submitAttempt({
        vaultId,
        domainId: card.domain,
        sectionId: card.section,
        scorePercent,
        totalQuestions,
        correctAnswers: correctAnswers ?? Math.round((scorePercent / 100) * totalQuestions),
        avgTimePerQuestion: avgTimePerQuestion ?? 0,
        isResubmission: testData.isResubmission || false,
        originalTestId: testData.originalTestId || null,
      });

      // Derive SR stats from the running history for this vault item
      const stats = await this.service.getVaultStats(vaultId);

      res.status(200).json({
        success: true,
        data: {
          success: true,
          vaultId,
          vaultInfo: {
            vaultId,
            title: card.title,
            domain: card.domain,
            section: card.section,
            topic: card.topic,
          },
          attempt,
          spacedRepetitionResult: stats
            ? { data: { testAttempt: attempt, updatedStats: stats.spacedRepetitionStats } }
            : null,
          hierarchyMapping: { domainId: card.domain, sectionId: card.section, materialId: vaultId },
          submissionType: testData.isResubmission ? 'resubmission' : 'new',
        },
        message: 'Vault test submitted successfully with spaced repetition tracking',
      });
    } catch (error) {
      console.error('[VaultSpacedRepetitionController] Submit vault test error:', error);
      if (error.message.includes('Missing required field')) {
        return res.status(400).json({ success: false, error: 'Invalid request data', details: error.message });
      }
      if (error.message.includes('Vault card not found')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      res.status(500).json({ success: false, error: 'Failed to submit vault test', details: error.message });
    }
  };

  // ─────────────────────────────────────────────
  // GET /api/vault-learning/review-schedule
  // ─────────────────────────────────────────────
  getVaultReviewSchedule = async (req, res) => {
    try {
      const options = {
        limit: parseInt(req.query.limit) || 20,
        timeRange: req.query.timeRange || 'all',
        startDate: req.query.startDate || null,
        endDate: req.query.endDate || null,
      };

      const validRanges = ['day', 'week', 'month', 'all', 'custom'];
      if (!validRanges.includes(options.timeRange)) {
        return res.status(400).json({ success: false, error: 'Invalid timeRange. Must be: day, week, month, all, or custom' });
      }
      if (options.timeRange === 'custom') {
        if (options.startDate && isNaN(new Date(options.startDate).getTime())) {
          return res.status(400).json({ success: false, error: 'Invalid startDate format. Use YYYY-MM-DD' });
        }
        if (options.endDate && isNaN(new Date(options.endDate).getTime())) {
          return res.status(400).json({ success: false, error: 'Invalid endDate format. Use YYYY-MM-DD' });
        }
      }

      const schedule = await this.service.getReviewSchedule(options);

      res.status(200).json({
        success: true,
        data: schedule,
        message: `Vault review recommendations retrieved successfully for ${options.timeRange}`,
        filterInfo: {
          timeRange: options.timeRange,
          limit: options.limit,
          startDate: options.startDate,
          endDate: options.endDate,
          totalItems: schedule.due.length + schedule.upcoming.length,
        },
      });
    } catch (error) {
      console.error('[VaultSpacedRepetitionController] Get review schedule error:', error);
      res.status(500).json({ success: false, error: 'Failed to get vault review recommendations', details: error.message });
    }
  };

  // ─────────────────────────────────────────────
  // GET /api/vault-learning/vault-stats/:vaultId
  // ─────────────────────────────────────────────
  getVaultItemStats = async (req, res) => {
    try {
      const { vaultId } = req.params;
      if (!vaultId) return res.status(400).json({ success: false, error: 'Vault ID is required' });

      const stats = await this.service.getVaultItemStats(vaultId);
      if (!stats) {
        return res.status(404).json({ success: false, error: 'Vault item statistics not found' });
      }

      res.status(200).json({ success: true, data: stats, message: 'Vault item statistics retrieved successfully' });
    } catch (error) {
      console.error('[VaultSpacedRepetitionController] Get vault item stats error:', error);
      res.status(500).json({ success: false, error: 'Failed to get vault item statistics', details: error.message });
    }
  };

  // ─────────────────────────────────────────────
  // GET /api/vault-learning/test-history/:vaultId
  // ─────────────────────────────────────────────
  getVaultTestHistory = async (req, res) => {
    try {
      const { vaultId } = req.params;
      const limit = parseInt(req.query.limit) || 10;
      if (!vaultId) return res.status(400).json({ success: false, error: 'Vault ID is required' });

      const history = await this.service.getVaultTestHistory(vaultId, limit);

      res.status(200).json({
        success: true,
        data: { vaultId, testHistory: history, totalAttempts: history.length },
        message: 'Vault test history retrieved successfully',
      });
    } catch (error) {
      console.error('[VaultSpacedRepetitionController] Get vault test history error:', error);
      res.status(500).json({ success: false, error: 'Failed to get vault test history', details: error.message });
    }
  };

  // ─────────────────────────────────────────────
  // POST /api/vault-learning/resubmit-test
  // ─────────────────────────────────────────────
  resubmitVaultTest = async (req, res) => {
    try {
      const { vaultId, originalTestId, updatedTestData } = req.body;

      if (!vaultId || !originalTestId || !updatedTestData) {
        return res.status(400).json({ success: false, error: 'Missing required fields: vaultId, originalTestId, updatedTestData' });
      }

      this._validateVaultTestSubmission({ ...updatedTestData, vaultId });
      const card = await this._getVaultCardOrThrow(vaultId);

      const resubmission = await this.service.resubmitAttempt(originalTestId, {
        vaultId,
        domainId: card.domain,
        sectionId: card.section,
        scorePercent: updatedTestData.scorePercent,
        totalQuestions: updatedTestData.totalQuestions,
        correctAnswers: updatedTestData.correctAnswers,
        avgTimePerQuestion: updatedTestData.avgTimePerQuestion ?? 0,
        isResubmission: true,
        originalTestId,
      });

      const stats = await this.service.getVaultStats(vaultId);

      const scoreImprovement = resubmission.originalScore != null
        ? resubmission.scorePercent - resubmission.originalScore
        : null;

      res.status(200).json({
        success: true,
        data: {
          testAttempt: resubmission,
          updatedStats: stats?.spacedRepetitionStats ?? null,
          resubmissionAnalysis: scoreImprovement !== null ? {
            scoreImprovement,
            scoreImprovementPercent: resubmission.originalScore > 0
              ? ((scoreImprovement / resubmission.originalScore) * 100).toFixed(1)
              : null,
            recallQualityImproved: scoreImprovement > 0,
            recommendation: scoreImprovement > 0
              ? 'Good improvement! Continue with current review schedule.'
              : 'Keep reviewing — consistency builds retention.',
          } : null,
        },
        message: 'Vault test resubmitted successfully',
      });
    } catch (error) {
      console.error('[VaultSpacedRepetitionController] Resubmit vault test error:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      if (error.message.includes('Missing required field')) {
        return res.status(400).json({ success: false, error: 'Invalid request data', details: error.message });
      }
      res.status(500).json({ success: false, error: 'Failed to resubmit vault test', details: error.message });
    }
  };

  // ─────────────────────────────────────────────
  // GET /api/vault-learning/resubmission-analytics/:vaultId
  // ─────────────────────────────────────────────
  getVaultResubmissionAnalytics = async (req, res) => {
    try {
      const { vaultId } = req.params;
      if (!vaultId) return res.status(400).json({ success: false, error: 'Vault ID is required' });

      const analytics = await this.service.getResubmissionAnalytics(vaultId);
      if (!analytics) {
        return res.status(404).json({ success: false, error: 'No resubmission data found for this vault item' });
      }

      res.status(200).json({ success: true, data: analytics, message: 'Vault resubmission analytics retrieved successfully' });
    } catch (error) {
      console.error('[VaultSpacedRepetitionController] Get resubmission analytics error:', error);
      res.status(500).json({ success: false, error: 'Failed to get vault resubmission analytics', details: error.message });
    }
  };

  // ─────────────────────────────────────────────
  // POST /api/vault-learning/migrate
  // ─────────────────────────────────────────────
  /**
   * No-op migration endpoint — now that all attempts go into the unified
   * collection automatically there is nothing to migrate.  Kept for
   * backwards compatibility with any existing callers.
   */
  migrateVaultContent = async (req, res) => {
    res.status(200).json({
      success: true,
      data: { migratedCount: 0, items: [], message: 'No migration needed — vault attempts are now stored in the unified attempts collection.' },
      message: 'Migration endpoint is a no-op with the unified service.',
    });
  };
}

module.exports = VaultSpacedRepetitionController;
