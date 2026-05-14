'use strict';

const TestGenerationService = require('../Services/testGenerationService');

/**
 * Controller for short-answer test generation endpoints.
 * Handles HTTP requests and responses for test generation.
 */
class TestController {
  constructor() {
    this.testService = new TestGenerationService();
  }

  /**
   * Generate a new short-answer test.
   * POST /api/tests/generate
   */
  generateTest = async (req, res, next) => {
    try {
      const { domain, sections, topics, difficulty, questionCount, name } = req.body;

      // Validate request body
      const validationError = this._validateGenerateRequest(req.body);
      if (validationError) {
        return res.status(400).json({
          success: false,
          error: validationError.message
        });
      }

      // Generate the test (service now handles saving)
      const savedTest = await this.testService.generateShortAnswerTest({
        domain,
        sections,
        topics,
        difficulty,
        questionCount,
        name
      });

      res.status(201).json({
        success: true,
        data: savedTest.toJSON(),
        message: `Successfully generated test "${savedTest.name}" with ${savedTest.shortAnswerQuestions.length} short-answer questions`
      });

    } catch (error) {
      console.error('[TestController] Generate test error:', error);
      
      // Handle specific error types
      if (error.message.includes('not found') || error.message.includes('No notes found')) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('required') || error.message.includes('invalid') || error.message.includes('could not be linked')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('quota') || error.message.includes('API key')) {
        return res.status(503).json({
          success: false,
          error: 'AI service temporarily unavailable. Please try again later.'
        });
      }

      if (error.message.includes('context length') || error.message.includes('maximum context') ||
          error.message.includes('too many tokens') || error.message.includes('token limit')) {
        return res.status(413).json({
          success: false,
          error: 'Too much study material provided. Please try with a smaller section or fewer notes.'
        });
      }

      // Generic error
      res.status(500).json({
        success: false,
        error: 'Failed to generate test. Please try again.'
      });
    }
  };

  /**
   * Get list of generated tests.
   * GET /api/tests
   */
  getTests = async (req, res, next) => {
    try {
      const {
        domain,
        section,
        difficulty,
        limit,
        offset,
        search
      } = req.query;

      // Parse pagination parameters
      const parsedLimit = limit ? Math.min(parseInt(limit, 10), 100) : 20;
      const parsedOffset = offset ? parseInt(offset, 10) : 0;

      if (isNaN(parsedLimit) || parsedLimit < 1) {
        return res.status(400).json({
          success: false,
          error: 'Limit must be a positive integer'
        });
      }

      if (isNaN(parsedOffset) || parsedOffset < 0) {
        return res.status(400).json({
          success: false,
          error: 'Offset must be a non-negative integer'
        });
      }

      let tests;
      if (search) {
        // Use search functionality
        tests = await this.testService.getGeneratedTests({
          domain,
          section,
          difficulty,
          limit: parsedLimit,
          offset: parsedOffset
        });
      } else {
        // Use regular filtering
        tests = await this.testService.getGeneratedTests({
          domain,
          section,
          difficulty,
          limit: parsedLimit,
          offset: parsedOffset
        });
      }

      const totalCount = await this._getTestCount({ domain, section, difficulty });

      // Add questions field alias for frontend compatibility
      const testsWithAliases = tests.map(test => {
        const testData = test.toJSON();
        if (testData.shortAnswerQuestions && !testData.questions) {
          testData.questions = testData.shortAnswerQuestions;
        }
        return testData;
      });

      res.json({
        success: true,
        data: testsWithAliases,
        pagination: {
          limit: parsedLimit,
          offset: parsedOffset,
          total: totalCount,
          hasMore: parsedOffset + tests.length < totalCount
        }
      });

    } catch (error) {
      console.error('[TestController] Get tests error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve tests'
      });
    }
  };

  /**
   * Get a specific test by ID.
   * GET /api/tests/:id
   */
  getTestById = async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Valid test ID is required'
        });
      }

      const test = await this.testService.getTestById(id);

      // Prepare test data with field aliases for frontend compatibility
      const testData = test.toJSON();
      
      // Add questions field as alias for shortAnswerQuestions for frontend compatibility
      if (testData.shortAnswerQuestions && !testData.questions) {
        testData.questions = testData.shortAnswerQuestions;
      }

      // Debug: Log the exact structure being sent to frontend
      console.log('[TestController] Test data being sent:', JSON.stringify(testData, null, 2));

      res.json({
        success: true,
        data: testData
      });

    } catch (error) {
      console.error('[TestController] Get test by ID error:', error);
      
      if (error.message === 'Test not found') {
        return res.status(404).json({
          success: false,
          error: 'Test not found'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve test'
      });
    }
  };

  /**
   * Update a test (currently only name updates supported).
   * PATCH /api/tests/:id
   */
  updateTest = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name } = req.body;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Valid test ID is required'
        });
      }

      // Validate name if provided
      if (name !== undefined) {
        if (typeof name !== 'string' || name.trim().length === 0) {
          return res.status(400).json({
            success: false,
            error: 'Test name must be a non-empty string'
          });
        }
        if (name.trim().length > 100) {
          return res.status(400).json({
            success: false,
            error: 'Test name cannot exceed 100 characters'
          });
        }
      }

      // Update the test
      const updatedTest = await this.testService.updateTest(id, { name: name?.trim() });

      res.json({
        success: true,
        data: updatedTest.toJSON(),
        message: `Test renamed to "${updatedTest.name}"`
      });

    } catch (error) {
      console.error('[TestController] Update test error:', error);
      
      if (error.message === 'Test not found') {
        return res.status(404).json({
          success: false,
          error: 'Test not found'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update test'
      });
    }
  };

  /**
   * Delete a test.
   * DELETE /api/tests/:id
   */
  deleteTest = async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Valid test ID is required'
        });
      }

      await this.testService.deleteTest(id);

      res.json({
        success: true,
        message: 'Test deleted successfully'
      });

    } catch (error) {
      console.error('[TestController] Delete test error:', error);
      
      if (error.message === 'Test not found') {
        return res.status(404).json({
          success: false,
          error: 'Test not found'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to delete test'
      });
    }
  };

  /**
   * Get test statistics.
   * GET /api/tests/stats
   */
  getTestStats = async (req, res, next) => {
    try {
      const stats = await this.testService.getTestStatistics();

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('[TestController] Get stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve statistics'
      });
    }
  };

  /**
   * Health check for test generation service.
   * GET /api/tests/health
   */
  healthCheck = async (req, res, next) => {
    try {
      const aiHealth = await this.testService.aiProvider.healthCheck();
      
      res.json({
        success: true,
        data: {
          testService: 'healthy',
          aiProvider: aiHealth.status,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('[TestController] Health check error:', error);
      res.status(503).json({
        success: false,
        error: 'Service health check failed'
      });
    }
  };

  /**
   * Validate the generate test request body.
   * @private
   */
  _validateGenerateRequest(body) {
    const { domain, sections, topics, difficulty, questionCount, name } = body;

    if (!domain || typeof domain !== 'string' || domain.trim().length === 0) {
      return new Error('Domain is required and must be a non-empty string');
    }

    // Validate sections parameter
    if (!sections) {
      return new Error('Sections parameter is required');
    }

    if (sections === 'all') {
      // Valid for domain-wide tests
    } else if (typeof sections === 'string') {
      // Single section
      if (sections.trim().length === 0) {
        return new Error('Section cannot be empty string');
      }
    } else if (Array.isArray(sections)) {
      // Multiple sections
      if (sections.length === 0) {
        return new Error('Sections array cannot be empty');
      }
      if (!sections.every(s => typeof s === 'string' && s.trim().length > 0)) {
        return new Error('All sections in array must be non-empty strings');
      }
    } else {
      return new Error('Sections must be a string, array of strings, or "all"');
    }

    if (topics !== undefined) {
      if (typeof topics === 'string') {
        if (topics.trim().length === 0) {
          return new Error('Topic cannot be an empty string');
        }
      } else if (Array.isArray(topics)) {
        if (topics.length === 0) {
          return new Error('Topics array cannot be empty');
        }
        if (!topics.every(t => typeof t === 'string' && t.trim().length > 0)) {
          return new Error('All topics in array must be non-empty strings');
        }
      } else if (typeof topics === 'object' && topics !== null) {
        const entries = Object.entries(topics);
        if (entries.length === 0) {
          return new Error('Topics object cannot be empty');
        }
        for (const [section, selectedTopics] of entries) {
          if (!section || section.trim().length === 0) {
            return new Error('Topic map section keys must be non-empty strings');
          }
          if (selectedTopics === 'all') continue;
          if (typeof selectedTopics === 'string') {
            if (selectedTopics.trim().length === 0) {
              return new Error('Topic map values must be non-empty strings, arrays, or "all"');
            }
          } else if (Array.isArray(selectedTopics)) {
            if (selectedTopics.length === 0) {
              return new Error('Topic arrays cannot be empty');
            }
            if (!selectedTopics.every(t => typeof t === 'string' && t.trim().length > 0)) {
              return new Error('All mapped topics must be non-empty strings');
            }
          } else {
            return new Error('Topic map values must be strings, arrays, or "all"');
          }
        }
      } else {
        return new Error('Topics must be a string, array of strings, or section-to-topics object');
      }
    }

    const validDifficulties = ['easy', 'medium', 'hard', 'mixed'];
    if (!difficulty || !validDifficulties.includes(difficulty)) {
      return new Error(`Difficulty is required and must be one of: ${validDifficulties.join(', ')}`);
    }

    if (!Number.isInteger(questionCount) || questionCount < 1 || questionCount > 50) {
      return new Error('Question count must be an integer between 1 and 50');
    }

    // Validate optional name parameter
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return new Error('Test name must be a non-empty string if provided');
      }
      if (name.trim().length > 100) {
        return new Error('Test name cannot exceed 100 characters');
      }
    }

    return null;
  }

  /**
   * Get total count of tests matching filters.
   * @private
   */
  async _getTestCount(filters) {
    try {
      const Test = require('../models/Test');
      
      return await Test.countDocuments(filters);
    } catch (error) {
      console.error('[TestController] Count error:', error);
      return 0;
    }
  }
}

module.exports = TestController;
