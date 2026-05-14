/**
 * =====================================================
 * SPACED REPETITION CONTROLLER
 * =====================================================
 * 
 * API controller for spaced repetition endpoints.
 * Handles test submission, review scheduling, and statistics.
 * 
 * @author Learning Platform Team
 * @version 1.0.0
 */

const SpacedRepetitionService = require('../Services/spacedRepetitionService');

class SpacedRepetitionController {
  constructor(firestore) {
    this.spacedRepetitionService = new SpacedRepetitionService(firestore);
  }

  /**
   * Submit test attempt and update spaced repetition statistics
   * POST /api/spaced-repetition/submit-test
   */
  submitTest = async (req, res, next) => {
    try {
      console.log('[SpacedRepetitionController] Submitting test');

      // Validate request body
      const testData = this.validateSubmitTestRequest(req.body);

      // Submit test and update statistics
      const results = await this.spacedRepetitionService.submitTest(testData);

      console.log(`[SpacedRepetitionController] Test submitted successfully for user: ${testData.userId}`);

      res.status(200).json({
        success: true,
        data: results,
        message: 'Test submitted successfully with spaced repetition analysis'
      });

    } catch (error) {
      console.error('[SpacedRepetitionController] Submit test error:', error);
      
      // Handle specific error types
      if (error.message.includes('Missing required field')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: error.message
        });
      }

      if (error.message.includes('Invalid scorePercent')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid score data',
          details: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to submit test',
        details: error.message
      });
    }
  };

  /**
   * Get review schedule
   * GET /api/spaced-repetition/review-schedule
   */
  getReviewSchedule = async (req, res, next) => {
    try {
      console.log('[SpacedRepetitionController] Getting review schedule');

      const limit = parseInt(req.query.limit) || 20;

      const schedule = await this.spacedRepetitionService.getReviewSchedule(limit);

      console.log('[SpacedRepetitionController] Retrieved review schedule');

      res.status(200).json({
        success: true,
        data: schedule,
        message: 'Review schedule retrieved successfully'
      });

    } catch (error) {
      console.error('[SpacedRepetitionController] Get review schedule error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to get review schedule',
        details: error.message
      });
    }
  };

  /**
   * Get performance statistics
   * GET /api/spaced-repetition/user-stats
   */
  getUserStats = async (req, res, next) => {
    try {
      console.log('[SpacedRepetitionController] Getting user stats');

      const stats = await this.spacedRepetitionService.getUserStats();

      console.log('[SpacedRepetitionController] Retrieved user stats');

      res.status(200).json({
        success: true,
        data: stats,
        message: 'User statistics retrieved successfully'
      });

    } catch (error) {
      console.error('[SpacedRepetitionController] Get user stats error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to get user statistics',
        details: error.message
      });
    }
  };

  /**
   * Get entity-specific statistics
   * GET /api/spaced-repetition/entity-stats/:entityType/:entityId
   */
  getEntityStats = async (req, res, next) => {
    try {
      console.log('[SpacedRepetitionController] Getting entity stats');

      const { entityType, entityId } = req.params;

      if (!['material', 'section', 'domain'].includes(entityType)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid entity type. Must be: material, section, or domain'
        });
      }

      if (!entityId) {
        return res.status(400).json({
          success: false,
          error: 'Entity ID is required'
        });
      }

      // Get entity stats from Firestore
      const stats = await this.spacedRepetitionService.reviewStatsCollection
        .doc(`${entityType}_${entityId}`)
        .get();

      if (!stats.exists) {
        return res.status(404).json({
          success: false,
          error: 'Entity statistics not found'
        });
      }

      const statsData = stats.data();
      
      // Format response
      const response = {
        entityType,
        entityId,
        avgScore: statsData.avgScore,
        weightedScore: statsData.weightedScore,
        reviewCount: statsData.reviewCount,
        streak: statsData.streak,
        lapseCount: statsData.lapseCount,
        retentionStrength: statsData.retentionStrength,
        priorityScore: statsData.priorityScore,
        lastReviewedAt: statsData.lastReviewedAt?.toDate(),
        nextReviewAt: statsData.nextReviewAt?.toDate(),
        createdAt: statsData.createdAt?.toDate(),
        updatedAt: statsData.updatedAt?.toDate()
      };

      console.log(`[SpacedRepetitionController] Retrieved entity stats for ${entityType}: ${entityId}`);

      res.status(200).json({
        success: true,
        data: response,
        message: 'Entity statistics retrieved successfully'
      });

    } catch (error) {
      console.error('[SpacedRepetitionController] Get entity stats error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to get entity statistics',
        details: error.message
      });
    }
  };

  /**
   * Get test history
   * GET /api/spaced-repetition/test-history
   */
  getTestHistory = async (req, res, next) => {
    try {
      console.log('[SpacedRepetitionController] Getting test history');

      const { limit = 20, offset = 0 } = req.query;
      const { entityType, entityId } = req.query;

      // Build query
      let query = this.spacedRepetitionService.testAttemptsCollection
        .orderBy('completedAt', 'desc')
        .limit(parseInt(limit))
        .offset(parseInt(offset));

      // Add filters if provided
      if (entityType && entityId) {
        if (entityType === 'material') {
          query = query.where('materialTypeId', '==', entityId);
        } else if (entityType === 'section') {
          query = query.where('sectionId', '==', entityId);
        } else if (entityType === 'domain') {
          query = query.where('domainId', '==', entityId);
        }
      }

      const snapshot = await query.get();
      const testHistory = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        completedAt: doc.data().completedAt.toDate(),
        createdAt: doc.data().createdAt.toDate()
      }));

      console.log(`[SpacedRepetitionController] Retrieved ${testHistory.length} test attempts`);

      res.status(200).json({
        success: true,
        data: {
          tests: testHistory,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total: testHistory.length,
            hasMore: testHistory.length === parseInt(limit)
          }
        },
        message: 'Test history retrieved successfully'
      });

    } catch (error) {
      console.error('[SpacedRepetitionController] Get test history error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to get test history',
        details: error.message
      });
    }
  };

  /**
   * Validate submit test request
   */
  validateSubmitTestRequest(body) {
    const required = ['domainId', 'sectionId', 'materialId', 'scorePercent', 'totalQuestions'];
    
    for (const field of required) {
      if (!body[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate numeric fields
    if (typeof body.scorePercent !== 'number' || body.scorePercent < 0 || body.scorePercent > 100) {
      throw new Error('scorePercent must be a number between 0 and 100');
    }

    if (typeof body.totalQuestions !== 'number' || body.totalQuestions <= 0) {
      throw new Error('totalQuestions must be a positive number');
    }

    if (body.correctAnswers !== undefined) {
      if (typeof body.correctAnswers !== 'number' || body.correctAnswers < 0 || body.correctAnswers > body.totalQuestions) {
        throw new Error('correctAnswers must be a number between 0 and totalQuestions');
      }
    }

    if (body.avgTimePerQuestion !== undefined) {
      if (typeof body.avgTimePerQuestion !== 'number' || body.avgTimePerQuestion < 0) {
        throw new Error('avgTimePerQuestion must be a non-negative number');
      }
    }

    return body;
  }
}

module.exports = SpacedRepetitionController;
