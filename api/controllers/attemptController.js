'use strict';

const AttemptService = require('../Services/attemptService');
const UnifiedTestService = require('../Services/unifiedTestService');

/**
 * Controller for test attempt API endpoints.
 * Handles HTTP requests and responses for attempt management.
 *
 * Write operations (start / submit / remark / delete) still go through
 * AttemptService which keeps the AI-scoring pipeline intact and also
 * mirrors to UnifiedTestService.
 *
 * Read operations (list / recent / stats / by-test) query UnifiedTestService
 * so vault attempts and regular attempts are returned from one place.
 */

class AttemptController {
  constructor() {
    this.attemptService = new AttemptService();
    this.unifiedService = new UnifiedTestService();
  }

  /**
   * Start a new test attempt.
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  startAttempt = async (req, res, next) => {
    try {
      const { testId } = req.body;

      // Validate request body
      const validationError = this._validateStartRequest(req.body);
      if (validationError) {
        return res.status(400).json({
          success: false,
          error: validationError.message
        });
      }

      // Start the attempt
      const attempt = await this.attemptService.startAttempt({ testId });

      res.status(201).json({
        success: true,
        data: {
          attemptId: attempt.id,
          testId: attempt.testId,
          startedAt: attempt.createdAt
        },
        message: 'Test attempt started successfully'
      });

    } catch (error) {
      console.error('[AttemptController] Start attempt error:', error);
      
      // Handle specific error types
      if (error.message === 'Test not found') {
        return res.status(404).json({
          success: false,
          error: 'Test not found'
        });
      }

      if (error.message.includes('required')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to start test attempt. Please try again.'
      });
    }
  };

  /**
   * Submit a test attempt with answers and timing data.
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  submitAttempt = async (req, res, next) => {
    try {
      const { attemptId, testId, answers, timings, questionResults } = req.body;

      // Validate request body
      const validationError = this._validateSubmitRequest(req.body);
      if (validationError) {
        return res.status(400).json({
          success: false,
          error: validationError.message
        });
      }

      // Submit attempt
      const attempt = await this.attemptService.submitAttempt({
        attemptId,
        testId,
        answers,
        timings,
        questionResults
      });

      // Fetch test data to include test name and other test information
      const Test = require('../models/Test');
      const test = await Test.findById(testId);

      // Also update unified attempt with domain/section info for spaced repetition
      try {
        await this.unifiedService.updateAttemptWithDomainInfo(attempt.id, {
          domainId: test?.domain || null,
          sectionId: test?.section || null,
          materialId: testId
        });
      } catch (unifiedErr) {
        console.error('[AttemptController] Unified attempt domain info update failed (non-fatal):', unifiedErr.message);
      }

      res.status(200).json({
        success: true,
        data: {
          attemptId: attempt.id,
          testId: attempt.testId,
          testName: test?.name || 'Unknown Test',
          testTopic: test?.topic || '',
          testDifficulty: test?.difficulty || '',
          testDomain: test?.domain || '',
          testSection: test?.section || '',
          score: attempt.score,
          correctCount: attempt.perQuestionResults ? 
            Object.values(attempt.perQuestionResults).filter(r => r.correct).length : 0,
          totalQuestions: attempt.perQuestionResults ? Object.keys(attempt.perQuestionResults).length : 0,
          totalTime: attempt.totalTime,
          perQuestionResults: attempt.perQuestionResults,
          critiques: attempt.critiques,
          submittedAt: attempt.submittedAt,
          status: attempt.status
        },
        message: 'Test attempt submitted successfully'
      });

    } catch (error) {
      console.error('[AttemptController] Submit attempt error:', error);
      
      // Handle specific error types
      if (error.message === 'Attempt not found') {
        return res.status(404).json({
          success: false,
          error: 'Attempt not found'
        });
      }

      if (error.message === 'Test not found') {
        return res.status(404).json({
          success: false,
          error: 'Test not found'
        });
      }

      if (error.message.includes('cannot be submitted') || error.message.includes('mismatch') || error.message.includes('required')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to submit test attempt. Please try again.'
      });
    }
  };

  /**
   * Get attempts with filters.
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  getAttempts = async (req, res, next) => {
    try {
      const {
        testId,
        vaultId,
        status,
        limit = 20,
        offset = 0,
      } = req.query;

      const options = {
        testId: testId || null,
        vaultId: vaultId || null,
        status: status || null,
        limit: parseInt(limit),
        offset: parseInt(offset),
      };

      const attempts = await this.unifiedService.getAttempts(options);
      const totalCount = await this.unifiedService.countAttempts({
        testId: options.testId,
        vaultId: options.vaultId,
        status: options.status,
      });

      res.status(200).json({
        success: true,
        data: attempts,
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: totalCount > (parseInt(offset) + attempts.length),
        },
        message: `Retrieved ${attempts.length} attempts`,
      });
    } catch (error) {
      console.error('[AttemptController] Get attempts error:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve attempts. Please try again.' });
    }
  };

  /**
   * Get a specific attempt by ID.
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  getAttemptById = async (req, res, next) => {
    try {
      const { attemptId } = req.params;

      if (!attemptId || typeof attemptId !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Valid attempt ID is required'
        });
      }

      const attempt = await this.attemptService.getAttemptById(attemptId);

      res.status(200).json({
        success: true,
        data: attempt
      });

    } catch (error) {
      console.error('[AttemptController] Get attempt by ID error:', error);
      
      // Handle specific error types
      if (error.message === 'Attempt not found') {
        return res.status(404).json({
          success: false,
          error: 'Attempt not found'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve attempt'
      });
    }
  };

  /**
   * Re-mark an existing attempt with AI-powered scoring.
   * POST /api/attempts/:id/remark
   */
  remarkAttempt = async (req, res, next) => {
    try {
      const { attemptId } = req.params;

      if (!attemptId || typeof attemptId !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Valid attempt ID is required'
        });
      }

      // Get the original attempt for comparison
      const originalAttempt = await this.attemptService.getAttemptById(attemptId);
      const originalScore = originalAttempt.score;

      // Re-mark the attempt with AI scoring
      const remarkedAttempt = await this.attemptService.remarkAttempt({ attemptId: attemptId });

      // Mirror the remark result to the unified collection
      try {
        await this.unifiedService.remarkAttempt(
          attemptId,
          remarkedAttempt.score,
          remarkedAttempt.perQuestionResults || {},
          remarkedAttempt.critiques || null,
        );
      } catch (unifiedErr) {
        // Non-fatal — the attempt may only exist in the legacy collection
        console.error('[AttemptController] Unified remark mirror failed (non-fatal):', unifiedErr.message);
      }

      // Fetch test data to include in response
      const Test = require('../models/Test');
      const test = await Test.findById(remarkedAttempt.testId);

      res.status(200).json({
        success: true,
        data: {
          attemptId: remarkedAttempt.id,
          testId: remarkedAttempt.testId,
          testName: test?.name || 'Unknown Test',
          testTopic: test?.topic || '',
          testDifficulty: test?.difficulty || '',
          testDomain: test?.domain || '',
          testSection: test?.section || '',
          score: remarkedAttempt.score,
          originalScore: originalScore,
          scoreChange: remarkedAttempt.score - originalScore,
          correctCount: remarkedAttempt.perQuestionResults ? 
            Object.values(remarkedAttempt.perQuestionResults).filter(r => r.correct).length : 0,
          totalQuestions: remarkedAttempt.perQuestionResults ? Object.keys(remarkedAttempt.perQuestionResults).length : 0,
          totalTime: remarkedAttempt.totalTime,
          perQuestionResults: remarkedAttempt.perQuestionResults,
          critiques: remarkedAttempt.critiques,
          submittedAt: remarkedAttempt.submittedAt,
          lastRemarkedAt: remarkedAttempt.lastRemarkedAt,
          remarkCount: remarkedAttempt.remarkCount || 1,
          status: remarkedAttempt.status
        },
        message: 'Attempt re-marked successfully with AI-powered scoring'
      });

    } catch (error) {
      console.error('[AttemptController] Remark attempt error:', error);
      
      // Handle specific error types
      if (error.message === 'Attempt not found') {
        return res.status(404).json({
          success: false,
          error: 'Attempt not found'
        });
      }

      if (error.message === 'Test not found') {
        return res.status(404).json({
          success: false,
          error: 'Test not found'
        });
      }

      if (error.message === 'Attempt does not have required data for remarking') {
        return res.status(400).json({
          success: false,
          error: 'Attempt cannot be re-marked - missing required data'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to re-mark attempt'
      });
    }
  };

  /**
   * Delete an attempt.
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  deleteAttempt = async (req, res, next) => {
    try {
      const { attemptId } = req.params;

      if (!attemptId || typeof attemptId !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Valid attempt ID is required'
        });
      }

      await this.attemptService.deleteAttempt(attemptId);

      res.status(200).json({
        success: true,
        message: 'Attempt deleted successfully'
      });

    } catch (error) {
      console.error('[AttemptController] Delete attempt error:', error);
      
      if (error.message === 'Attempt not found') {
        return res.status(404).json({
          success: false,
          error: 'Attempt not found'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to delete attempt. Please try again.'
      });
    }
  };

  /**
   * Get attempts by test ID.
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  getAttemptsByTestId = async (req, res, next) => {
    try {
      const { testId } = req.params;
      const { limit = 20 } = req.query;

      if (!testId) {
        return res.status(400).json({ success: false, error: 'Test ID is required' });
      }

      const attempts = await this.unifiedService.getAttempts({ testId, limit: parseInt(limit) });

      res.status(200).json({
        success: true,
        data: attempts,
        message: `Retrieved ${attempts.length} attempts for test ${testId}`,
      });
    } catch (error) {
      console.error('[AttemptController] Get attempts by test ID error:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve attempts. Please try again.' });
    }
  };

  /**
   * Get recent attempts.
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  getRecentAttempts = async (req, res, next) => {
    try {
      const { days = 7, limit = 20 } = req.query;

      const attempts = await this.unifiedService.getAttempts({
        days: parseInt(days),
        limit: parseInt(limit),
      });

      res.status(200).json({
        success: true,
        data: attempts,
        message: `Retrieved ${attempts.length} recent attempts`,
      });
    } catch (error) {
      console.error('[AttemptController] Get recent attempts error:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve recent attempts. Please try again.' });
    }
  };

  /**
   * Get attempt statistics.
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  getAttemptStatistics = async (req, res, next) => {
    try {
      const stats = await this.unifiedService.getUserStats();

      res.status(200).json({
        success: true,
        data: {
          totalAttempts: stats.totalReviews,
          completedAttempts: stats.totalReviews,
          inProgressAttempts: 0,
          averageScore: stats.avgScore,
          averageRetention: stats.avgRetentionStrength,
          testCount: stats.entitiesByType.normalTests || 0,
          vaultItemCount: stats.entitiesByType.material || 0,
          completionRate: 100,
          testIds: [],
        },
        message: 'Attempt statistics retrieved successfully',
      });
    } catch (error) {
      console.error('[AttemptController] Get statistics error:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve statistics. Please try again.' });
    }
  };

  /**
   * Validate start attempt request.
   * @param {Object} body - Request body
   * @returns {Error|null} Validation error or null
   * @private
   */
  _validateStartRequest(body) {
    const { testId } = body;

    if (!testId || typeof testId !== 'string' || testId.trim().length === 0) {
      return new Error('Test ID is required and must be a non-empty string');
    }

    return null;
  }

  /**
   * Validate submit attempt request.
   * @param {Object} body - Request body
   * @returns {Error|null} Validation error or null
   * @private
   */
  _validateSubmitRequest(body) {
    const { attemptId, testId, answers, timings, questionResults } = body;

    if (!attemptId || typeof attemptId !== 'string' || attemptId.trim().length === 0) {
      return new Error('Attempt ID is required and must be a non-empty string');
    }

    if (!testId || typeof testId !== 'string' || testId.trim().length === 0) {
      return new Error('Test ID is required and must be a non-empty string');
    }

    // Support both legacy format (answers/timings) and new format (questionResults)
    if (questionResults) {
      // Validate new questionResults format
      if (!Array.isArray(questionResults)) {
        return new Error('Question results must be an array');
      }

      for (const [index, result] of questionResults.entries()) {
        if (!result.questionId || typeof result.questionId !== 'string') {
          return new Error(`Question result ${index}: questionId is required and must be a string`);
        }

        if (typeof result.isCorrect !== 'boolean') {
          return new Error(`Question result ${index}: correct is required and must be a boolean`);
        }

        if (typeof result.timeSpent !== 'number' || result.timeSpent < 0) {
          return new Error(`Question result ${index}: timeSpent is required and must be a non-negative number`);
        }

        // Optional fields validation
        if (result.conceptId && typeof result.conceptId !== 'string') {
          return new Error(`Question result ${index}: conceptId must be a string if provided`);
        }
      }
    } else {
      // Legacy format validation
      if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
        return new Error('Answers must be a non-empty object');
      }

      if (!timings || typeof timings !== 'object' || Array.isArray(timings)) {
        return new Error('Timings must be a non-empty object');
      }

      // Validate timing values
      for (const [questionId, timing] of Object.entries(timings)) {
        if (typeof timing !== 'number' || timing < 0) {
          return new Error(`Invalid timing for question ${questionId}: must be a non-negative number`);
        }
      }
    }

    return null;
  }

  /**
   * Get total count of attempts matching filters.
   * @private
   */
  async _getAttemptCount(filters) {
    try {
      return await this.unifiedService.countAttempts(filters);
    } catch (error) {
      console.error('[AttemptController] Count error:', error);
      return 0;
    }
  }
}

module.exports = AttemptController;
