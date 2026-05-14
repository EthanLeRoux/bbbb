/**
 * =====================================================
 * SPACED REPETITION ROUTES
 * =====================================================
 * 
 * Express routes for spaced repetition endpoints.
 * Integrates with the spaced repetition controller.
 * 
 * @author Learning Platform Team
 * @version 1.0.0
 */

const express = require('express');
const SpacedRepetitionController = require('../controllers/spacedRepetitionController');
const { getFirestore } = require('firebase-admin/firestore');

const router = express.Router();

// Initialize controller with Firestore
const spacedRepetitionController = new SpacedRepetitionController(getFirestore());

// Middleware for logging spaced repetition requests
router.use((req, res, next) => {
  console.log(`[SpacedRepetitionRoutes] ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Middleware for async error handling
router.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    if (res.statusCode >= 400) {
      console.error(`[SpacedRepetitionRoutes] Error response: ${res.statusCode} - ${data}`);
    }
    originalSend.call(this, data);
  };
  next();
});

// =====================================================
// CORE ENDPOINTS
// =====================================================

/**
 * POST /api/spaced-repetition/submit-test
 * Submit a test attempt and update spaced repetition statistics
 */
router.post('/submit-test', spacedRepetitionController.submitTest);

/**
 * GET /api/spaced-repetition/review-schedule
 * Get user's review schedule (due and upcoming reviews)
 */
router.get('/review-schedule', spacedRepetitionController.getReviewSchedule);

/**
 * GET /api/spaced-repetition/user-stats
 * Get user's overall performance statistics
 */
router.get('/user-stats', spacedRepetitionController.getUserStats);

/**
 * GET /api/spaced-repetition/entity-stats/:entityType/:entityId
 * Get statistics for a specific entity (material, section, or domain)
 */
router.get('/entity-stats/:entityType/:entityId', spacedRepetitionController.getEntityStats);

/**
 * GET /api/spaced-repetition/test-history
 * Get user's test attempt history with optional filters
 */
router.get('/test-history', spacedRepetitionController.getTestHistory);

// =====================================================
// UTILITY ENDPOINTS
// =====================================================

/**
 * GET /api/spaced-repetition/health
 * Health check for spaced repetition service
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    message: 'Spaced repetition service is operational',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/spaced-repetition/docs
 * API documentation for spaced repetition endpoints
 */
router.get('/docs', (req, res) => {
  const docs = {
    title: 'Spaced Repetition API Documentation',
    version: '1.0.0',
    description: 'Anki-style hierarchical active recall scheduling system',
    endpoints: [
      {
        method: 'POST',
        path: '/api/spaced-repetition/submit-test',
        description: 'Submit a test attempt and update spaced repetition statistics',
        parameters: {
          userId: 'string (required) - User ID',
          domainId: 'string (required) - Domain ID',
          sectionId: 'string (required) - Section ID',
          materialId: 'string (required) - Material ID',
          scorePercent: 'number (required) - Score percentage (0-100)',
          totalQuestions: 'number (required) - Total questions',
          correctAnswers: 'number (optional) - Correct answers',
          avgTimePerQuestion: 'number (optional) - Average time per question'
        },
        response: {
          success: 'boolean',
          data: {
            testAttempt: 'object - Test attempt details',
            updatedStats: 'object - Updated hierarchy statistics',
            weakAreas: 'array - Identified weak areas',
            nextReviewRecommendations: 'object - Review recommendations',
            hierarchyImpact: 'object - Priority impact scores'
          },
          message: 'string'
        }
      },
      {
        method: 'GET',
        path: '/api/spaced-repetition/review-schedule',
        description: 'Get user\'s review schedule',
        parameters: {
          userId: 'string (required) - User ID',
          limit: 'number (optional) - Maximum results (default: 20)'
        },
        response: {
          success: 'boolean',
          data: {
            due: 'array - Reviews that are due now',
            upcoming: 'array - Scheduled upcoming reviews'
          }
        }
      },
      {
        method: 'GET',
        path: '/api/spaced-repetition/user-stats',
        description: 'Get user\'s overall performance statistics',
        parameters: {
          userId: 'string (required) - User ID'
        },
        response: {
          success: 'boolean',
          data: {
            totalReviews: 'number',
            avgScore: 'number',
            avgWeightedScore: 'number',
            avgRetentionStrength: 'number',
            totalLapses: 'number',
            entitiesByType: 'object - Count by entity type',
            priorityDistribution: 'object - Priority level distribution'
          }
        }
      },
      {
        method: 'GET',
        path: '/api/spaced-repetition/entity-stats/:entityType/:entityId',
        description: 'Get statistics for a specific entity',
        parameters: {
          userId: 'string (required) - User ID',
          entityType: 'string (required) - Entity type (material|section|domain)',
          entityId: 'string (required) - Entity ID'
        },
        response: {
          success: 'boolean',
          data: {
            entityType: 'string',
            entityId: 'string',
            avgScore: 'number',
            weightedScore: 'number',
            reviewCount: 'number',
            streak: 'number',
            lapseCount: 'number',
            retentionStrength: 'number',
            priorityScore: 'number',
            lastReviewedAt: 'date',
            nextReviewAt: 'date'
          }
        }
      },
      {
        method: 'GET',
        path: '/api/spaced-repetition/test-history',
        description: 'Get user\'s test attempt history',
        parameters: {
          userId: 'string (required) - User ID',
          limit: 'number (optional) - Maximum results (default: 20)',
          offset: 'number (optional) - Results offset (default: 0)',
          entityType: 'string (optional) - Filter by entity type',
          entityId: 'string (optional) - Filter by entity ID'
        },
        response: {
          success: 'boolean',
          data: {
            tests: 'array - Test attempt history',
            pagination: 'object - Pagination info'
          }
        }
      }
    ],
    concepts: {
      recallQuality: {
        easy: '90-100% score, 2.2x strength modifier, 14-day interval',
        good: '75-89% score, 1.7x strength modifier, 7-day interval',
        hard: '60-74% score, 1.3x strength modifier, 3-day interval',
        again: '40-59% score, 0.7x strength modifier, 2-day interval',
        fail: '0-39% score, 0.4x strength modifier, 1-day interval'
      },
      retentionStrength: '0.1-10.0, higher = longer retention',
      priorityScore: '0-100, higher = needs review sooner',
      hierarchy: 'Domain -> Section -> Material aggregation'
    },
    examples: {
      submitTest: {
        request: {
          userId: 'user-123',
          domainId: 'domain-networking',
          sectionId: 'section-ip-addressing',
          materialId: 'material-cidr',
          scorePercent: 85,
          totalQuestions: 10,
          correctAnswers: 8,
          avgTimePerQuestion: 45
        },
        response: {
          success: true,
          data: {
            testAttempt: {
              id: 'attempt-456',
              scorePercent: 85,
              recallQuality: 'good',
              recallDescription: 'Good recall - confident with minor inaccuracies'
            },
            updatedStats: {
              material: {
                avgScore: 82.5,
                weightedScore: 78.3,
                retentionStrength: 1.7,
                priorityScore: 35,
                nextReviewAt: '2026-05-07T10:00:00Z'
              }
            },
            weakAreas: [],
            nextReviewRecommendations: {
              material: '2026-05-07T10:00:00Z',
              section: '2026-05-10T10:00:00Z',
              domain: '2026-05-14T10:00:00Z'
            }
          }
        }
      }
    }
  };
  
  res.json(docs);
});

module.exports = router;
