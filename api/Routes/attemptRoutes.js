'use strict';

const express = require('express');
const AttemptController = require('../controllers/attemptController');

const router = express.Router();
const attemptController = new AttemptController();

// Middleware for logging attempt requests
router.use((req, res, next) => {
  console.log(`[AttemptRoutes] ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Middleware for async error handling
router.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    if (res.statusCode >= 400) {
      console.error(`[AttemptRoutes] Error response: ${res.statusCode} - ${data}`);
    }
    originalSend.call(this, data);
  };
  next();
});

// === CORE ATTEMPT ENDPOINTS ===

/**
 * POST /attempt/start
 * Start a new test attempt
 */
router.post('/start', attemptController.startAttempt);

/**
 * POST /attempt/submit
 * Submit a test attempt with answers and timing data
 */
router.post('/submit', attemptController.submitAttempt);

// === ATTEMPT MANAGEMENT ENDPOINTS ===

/**
 * GET /attempt
 * Get attempts with optional filters
 * Query params: testId, status, limit, offset, search
 */
router.get('/', attemptController.getAttempts);

/**
 * GET /attempt/recent
 * Get recent attempts
 * Query params: days, limit
 */
router.get('/recent', attemptController.getRecentAttempts);

/**
 * GET /attempt/stats
 * Get attempt statistics
 */
router.get('/stats', attemptController.getAttemptStatistics);

/**
 * GET /attempt/:attemptId
 * Get a specific attempt by ID
 */
router.get('/:attemptId', attemptController.getAttemptById);

/**
 * POST /attempt/:attemptId/remark
 * Re-mark an existing attempt with AI-powered scoring
 */
router.post('/:attemptId/remark', attemptController.remarkAttempt);

/**
 * DELETE /attempt/:attemptId
 * Delete a specific attempt by ID
 */
router.delete('/:attemptId', attemptController.deleteAttempt);

/**
 * GET /attempt/test/:testId
 * Get all attempts for a specific test
 * Query params: limit
 */
router.get('/test/:testId', attemptController.getAttemptsByTestId);

// === UTILITY ENDPOINTS ===

/**
 * GET /attempt/docs
 * Get API documentation for attempt endpoints
 */
router.get('/docs', (req, res) => {
  const docs = {
    title: 'Test Attempt API Documentation',
    version: '1.0.0',
    description: 'API for managing test attempts with scoring and timing',
    baseUrl: `${req.protocol}://${req.get('host')}/api/attempt`,
    endpoints: {
      start: {
        method: 'POST',
        path: '/api/attempt/start',
        description: 'Start a new test attempt',
        requestBody: {
          testId: 'string (required) - Test ID to attempt'
        },
        example: {
          testId: 'WrtJfKLsVHHeA5MfHkHc'
        },
        response: {
          success: 'boolean',
          data: {
            attemptId: 'string',
            testId: 'string',
            startedAt: 'timestamp'
          },
          message: 'string'
        }
      },
      submit: {
        method: 'POST',
        path: '/api/attempt/submit',
        description: 'Submit a test attempt with answers and timing data',
        requestBody: {
          attemptId: 'string (required) - Attempt ID',
          testId: 'string (required) - Test ID',
          answers: 'object (required) - User answers {questionId: answer}',
          timings: 'object (required) - Timing data {questionId: seconds}'
        },
        example: {
          attemptId: 'abc123def456',
          testId: 'WrtJfKLsVHHeA5MfHkHc',
          answers: {
            'q0': 'Single Loss Expectancy measures potential loss from a single security incident',
            'q1': 'Firewall is a network security system that monitors and controls traffic'
          },
          timings: {
            'q0': 45.2,
            'q1': 32.8
          }
        },
        response: {
          success: 'boolean',
          data: {
            attemptId: 'string',
            testId: 'string',
            score: 'number (0-100)',
            correctCount: 'number',
            totalQuestions: 'number',
            totalTime: 'number (seconds)',
            perQuestionResults: 'object',
            submittedAt: 'timestamp',
            status: 'string'
          },
          message: 'string'
        }
      },
      list: {
        method: 'GET',
        path: '/api/attempt',
        description: 'Get attempts with optional filters',
        queryParams: {
          testId: 'string - Filter by test ID',
          status: 'string - Filter by status (in_progress, completed)',
          limit: 'number - Maximum results (default: 20)',
          offset: 'number - Results offset (default: 0)',
          search: 'string - Search in answers and test ID'
        },
        response: {
          success: 'boolean',
          data: 'array of attempt objects',
          pagination: {
            total: 'number',
            limit: 'number',
            offset: 'number',
            hasMore: 'boolean'
          },
          message: 'string'
        }
      },
      getById: {
        method: 'GET',
        path: '/api/attempt/:attemptId',
        description: 'Get a specific attempt by ID',
        response: {
          success: 'boolean',
          data: 'attempt object',
          message: 'string'
        }
      },
      delete: {
        method: 'DELETE',
        path: '/api/attempt/:attemptId',
        description: 'Delete a specific attempt by ID',
        response: {
          success: 'boolean',
          message: 'string'
        }
      },
      getByTestId: {
        method: 'GET',
        path: '/api/attempt/test/:testId',
        description: 'Get all attempts for a specific test',
        queryParams: {
          limit: 'number - Maximum results (default: 20)'
        },
        response: {
          success: 'boolean',
          data: 'array of attempt objects',
          message: 'string'
        }
      },
      recent: {
        method: 'GET',
        path: '/api/attempt/recent',
        description: 'Get recent attempts',
        queryParams: {
          days: 'number - Days to look back (default: 7)',
          limit: 'number - Maximum results (default: 20)'
        },
        response: {
          success: 'boolean',
          data: 'array of attempt objects',
          message: 'string'
        }
      },
      stats: {
        method: 'GET',
        path: '/api/attempt/stats',
        description: 'Get attempt statistics',
        response: {
          success: 'boolean',
          data: {
            totalAttempts: 'number',
            completedAttempts: 'number',
            inProgressAttempts: 'number',
            averageScore: 'number',
            averageTime: 'number',
            testCount: 'number',
            completionRate: 'number',
            testIds: 'array of strings'
          },
          message: 'string'
        }
      }
    },
    examples: {
      workflow: {
        step1: 'POST /api/attempt/start with testId',
        step2: 'User takes the test (frontend tracks timing)',
        step3: 'POST /api/attempt/submit with answers and timings',
        step4: 'GET /api/attempt/:attemptId to view results'
      }
    }
  };

  res.status(200).json(docs);
});

// 404 for unknown attempt routes
router.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.path} - Attempt endpoint not found`
  });
});

module.exports = router;
