'use strict';

const express = require('express');
const TestController = require('../controllers/testController');

/**
 * Express router for short-answer test generation endpoints.
 * Provides RESTful API for test generation, retrieval, and management.
 */
const router = express.Router();

// Initialize controller
const testController = new TestController();

// Middleware for request logging
const requestLogger = (req, res, next) => {
  console.log(`[TestRoutes] ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
};

// Apply logging middleware to all routes
router.use(requestLogger);

// Helper for async error handling
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// === MAIN ENDPOINTS ===

// POST /api/tests/generate - Generate new short-answer test
router.post('/generate', asyncHandler(testController.generateTest));

// GET /api/tests - Get list of generated tests with filtering
router.get('/', asyncHandler(testController.getTests));

// === UTILITY ENDPOINTS ===

// GET /api/tests/stats - Get test generation statistics
router.get('/stats', asyncHandler(testController.getTestStats));

// GET /api/tests/health - Health check for test generation service
router.get('/health', asyncHandler(testController.healthCheck));

// GET /api/tests/docs - API documentation
router.get('/docs', (req, res) => {
  const docs = {
    title: 'Short-Answer Test Generation API',
    version: '1.0.0',
    description: 'AI-powered short-answer question generation using vault study material',
    baseUrl: `${req.protocol}://${req.get('host')}/api/tests`,
    endpoints: {
      generate: {
        method: 'POST',
        path: '/api/tests/generate',
        description: 'Generate a new short-answer test from vault material',
        requestBody: {
          domain: 'string (required) - Knowledge domain (e.g., "network-security")',
          sections: 'string|array|string "all" (required) - Section(s) within domain, or "all" for domain-wide',
          difficulty: 'string (required) - "easy", "medium", "hard", or "mixed"',
          questionCount: 'number (required) - Number of questions (1-50)',
          name: 'string (optional) - Custom name for the test (max 100 characters)'
        },
        examples: {
          singleSection: {
            domain: 'network-security',
            sections: 'dns',
            difficulty: 'medium',
            questionCount: 10,
            name: 'DNS Fundamentals Quiz'
          },
          multipleSections: {
            domain: 'network-security',
            sections: ['dns', 'firewalls', 'encryption'],
            difficulty: 'mixed',
            questionCount: 15,
            name: 'Security Essentials Test'
          },
          domainWide: {
            domain: 'network-security',
            sections: 'all',
            difficulty: 'hard',
            questionCount: 20
          }
        },
        response: {
          success: 'boolean',
          data: 'Generated test object',
          message: 'string'
        }
      },
      list: {
        method: 'GET',
        path: '/api/tests',
        description: 'Get list of generated tests with optional filtering',
        queryParameters: {
          domain: 'string - Filter by domain',
          section: 'string - Filter by section',
          difficulty: 'string - Filter by difficulty',
          limit: 'number - Maximum results (default: 20, max: 100)',
          offset: 'number - Results offset (default: 0)',
          search: 'string - Search in questions and answers'
        },
        response: {
          success: 'boolean',
          data: 'Array of test objects',
          pagination: {
            limit: 'number',
            offset: 'number',
            total: 'number',
            hasMore: 'boolean'
          }
        }
      },
      getById: {
        method: 'GET',
        path: '/api/tests/:id',
        description: 'Get a specific test by ID',
        response: {
          success: 'boolean',
          data: 'Test object'
        }
      },
      update: {
        method: 'PATCH',
        path: '/api/tests/:id',
        description: 'Update a test (currently only name updates supported)',
        requestBody: {
          name: 'string (required) - New name for the test (max 100 characters)'
        },
        example: {
          name: 'Updated Test Name'
        },
        response: {
          success: 'boolean',
          data: 'Updated test object',
          message: 'string'
        }
      },
      delete: {
        method: 'DELETE',
        path: '/api/tests/:id',
        description: 'Delete a test',
        response: {
          success: 'boolean',
          message: 'string'
        }
      },
      stats: {
        method: 'GET',
        path: '/api/tests/stats',
        description: 'Get test generation statistics',
        response: {
          success: 'boolean',
          data: {
            totalTests: 'number',
            totalQuestions: 'number',
            avgQuestionsPerTest: 'number',
            domainCount: 'number',
            sectionCount: 'number',
            difficultyCount: 'number'
          }
        }
      },
      health: {
        method: 'GET',
        path: '/api/tests/health',
        description: 'Health check for test generation service',
        response: {
          success: 'boolean',
          data: {
            testService: 'string',
            aiProvider: 'string',
            timestamp: 'string'
          }
        }
      }
    },
    errorCodes: {
      400: 'Bad Request - Invalid input parameters',
      404: 'Not Found - Test or vault content not found',
      500: 'Internal Server Error - Service error',
      503: 'Service Unavailable - AI service issues'
    },
    notes: [
      'All questions are short-answer format only',
      'Questions are generated exclusively from vault study material',
      'No outside knowledge is used in question generation',
      'Each test includes question answers and source concepts',
      'Tests are automatically saved to Firestore for future reference',
      'Tests can have custom names or use auto-generated names based on content',
      'Test names can be edited after generation using the PATCH endpoint'
    ]
  };

  res.json(docs);
});

// === PARAMETERIZED ENDPOINTS ===

// GET /api/tests/:id - Get specific test by ID
router.get('/:id', asyncHandler(testController.getTestById));

// PATCH /api/tests/:id - Update a test (currently only name updates supported)
router.patch('/:id', asyncHandler(testController.updateTest));

// DELETE /api/tests/:id - Delete a test
router.delete('/:id', asyncHandler(testController.deleteTest));

// === ERROR HANDLING ===

// 404 for unknown test routes
router.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Test endpoint ${req.method} ${req.originalUrl} not found`,
    availableEndpoints: [
      'POST /api/tests/generate',
      'GET /api/tests',
      'GET /api/tests/:id',
      'PATCH /api/tests/:id',
      'DELETE /api/tests/:id',
      'GET /api/tests/stats',
      'GET /api/tests/health',
      'GET /api/tests/docs'
    ]
  });
});

// Global error handler for test routes
router.use((err, req, res, next) => {
  console.error('[TestRoutes] Error:', err);
  
  // Don't send error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    success: false,
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
});

module.exports = router;
