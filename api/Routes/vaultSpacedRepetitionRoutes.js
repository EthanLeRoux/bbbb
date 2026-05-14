/**
 * =====================================================
 * VAULT SPACED REPETITION ROUTES
 * =====================================================
 * 
 * Express routes for vault-based spaced repetition endpoints.
 * Integrates vault test submissions with spaced repetition system.
 * 
 * @author Learning Platform Team
 * @version 1.0.0
 */

const express = require('express');
const VaultSpacedRepetitionController = require('../controllers/vaultSpacedRepetitionController');

const router = express.Router();

// Initialize controller
const vaultSpacedRepetitionController = new VaultSpacedRepetitionController();

// Middleware for logging vault spaced repetition requests
router.use((req, res, next) => {
  console.log(`[VaultSpacedRepetitionRoutes] ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// =====================================================
// CORE ENDPOINTS
// =====================================================

/**
 * POST /api/vault/spaced-repetition/submit-test
 * Submit vault test and auto-generate spaced repetition data
 */
router.post('/submit-test', vaultSpacedRepetitionController.submitVaultTest);

/**
 * GET /api/vault/spaced-repetition/review-schedule
 * Get vault-based review recommendations
 */
router.get('/review-schedule', vaultSpacedRepetitionController.getVaultReviewSchedule);

/**
 * GET /api/vault/spaced-repetition/vault-stats/:vaultId
 * Get spaced repetition stats for specific vault item
 */
router.get('/vault-stats/:vaultId', vaultSpacedRepetitionController.getVaultItemStats);

/**
 * GET /api/vault/spaced-repetition/test-history/:vaultId
 * Get vault test history
 */
router.get('/test-history/:vaultId', vaultSpacedRepetitionController.getVaultTestHistory);

/**
 * POST /api/vault-learning/resubmit-test
 * Resubmit vault test for spaced repetition analysis
 */
router.post('/resubmit-test', vaultSpacedRepetitionController.resubmitVaultTest);

/**
 * GET /api/vault-learning/resubmission-analytics/:vaultId
 * Get vault resubmission analytics
 */
router.get('/resubmission-analytics/:vaultId', vaultSpacedRepetitionController.getVaultResubmissionAnalytics);

/**
 * POST /api/vault/spaced-repetition/migrate
 * Migrate existing vault content to spaced repetition
 */
router.post('/migrate', vaultSpacedRepetitionController.migrateVaultContent);

// =====================================================
// UTILITY ENDPOINTS
// =====================================================

/**
 * GET /api/vault/spaced-repetition/health
 * Health check for vault spaced repetition service
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    message: 'Vault spaced repetition service is operational',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/vault/spaced-repetition/docs
 * API documentation for vault spaced repetition endpoints
 */
router.get('/docs', (req, res) => {
  const docs = {
    title: 'Vault Spaced Repetition API Documentation',
    version: '1.0.0',
    description: 'Auto-generates spaced repetition data from vault test submissions',
    endpoints: [
      {
        method: 'POST',
        path: '/api/vault-learning/submit-test',
        description: 'Submit vault test and auto-generate spaced repetition data',
        parameters: {
          vaultId: 'string (required) - Vault item ID',
          scorePercent: 'number (required) - Test score percentage (0-100)',
          totalQuestions: 'number (required) - Total questions',
          correctAnswers: 'number (optional) - Correct answers',
          avgTimePerQuestion: 'number (optional) - Average time per question'
        },
        response: {
          success: 'boolean',
          data: {
            vaultId: 'string',
            spacedRepetitionResult: 'object - Spaced repetition analysis',
            hierarchyMapping: 'object - Vault to hierarchy mapping'
          }
        }
      },
      {
        method: 'GET',
        path: '/api/vault-learning/review-schedule',
        description: 'Get vault-based review recommendations with flexible time filtering',
        parameters: {
          timeRange: 'string (optional) - day, week, month, all, custom (default: all)',
          limit: 'number (optional) - Maximum results (default: 20)',
          startDate: 'string (optional) - For custom range (YYYY-MM-DD)',
          endDate: 'string (optional) - For custom range (YYYY-MM-DD)'
        },
        response: {
          success: 'boolean',
          data: {
            due: 'array - Due vault items',
            upcoming: 'array - Upcoming vault items'
          }
        }
      },
      {
        method: 'GET',
        path: '/api/vault-learning/vault-stats/:vaultId',
        description: 'Get spaced repetition stats for specific vault item',
        parameters: {
          vaultId: 'string (required) - Vault item ID'
        },
        response: {
          success: 'boolean',
          data: {
            vaultId: 'string',
            hierarchy: 'object - Domain/section/material mapping',
            spacedRepetitionStats: 'object - Performance and scheduling data'
          }
        }
      },
      {
        method: 'GET',
        path: '/api/vault-learning/test-history/:vaultId',
        description: 'Get vault test history',
        parameters: {
          vaultId: 'string (required) - Vault item ID',
          limit: 'number (optional) - Max attempts (default: 10)'
        },
        response: {
          success: 'boolean',
          data: {
            vaultId: 'string',
            testHistory: 'array of test attempts',
            totalAttempts: 'number'
          }
        }
      },
      {
        method: 'POST',
        path: '/api/vault-learning/resubmit-test',
        description: 'Resubmit vault test for spaced repetition analysis (allows older attempts to count)',
        parameters: {
          vaultId: 'string (required) - Vault item ID',
          originalTestId: 'string (required) - Original test attempt ID to resubmit',
          updatedTestData: 'object (required) - Updated test data with scorePercent, totalQuestions, correctAnswers, avgTimePerQuestion'
        },
        response: {
          success: 'boolean',
          data: {
            testAttempt: 'object - New test attempt',
            updatedStats: 'object - Updated spaced repetition stats',
            resubmissionAnalysis: 'object - Improvement analysis'
          }
        }
      },
      {
        method: 'GET',
        path: '/api/vault-learning/resubmission-analytics/:vaultId',
        description: 'Get vault resubmission analytics',
        parameters: {
          vaultId: 'string (required) - Vault item ID'
        },
        response: {
          success: 'boolean',
          data: {
            totalResubmissions: 'number',
            averageScoreImprovement: 'number',
            improvementRate: 'string (percentage)',
            recentResubmissions: 'array'
          }
        }
      },
      {
        method: 'POST',
        path: '/api/vault-learning/migrate',
        description: 'Migrate existing vault content to spaced repetition',
        response: {
          success: 'boolean',
          data: {
            migratedCount: 'number',
            items: 'array - Migrated vault items'
          }
        }
      }
    ],
    concepts: {
      vaultIntegration: 'Automatic mapping of vault structure to spaced repetition hierarchy',
      autoGeneration: 'Spaced repetition data created automatically from test submissions',
      hierarchyMapping: 'Domain -> Section -> Material mapping from vault structure',
      vaultBasedReviews: 'Review recommendations based on vault content performance',
      testResubmission: 'Resubmit tests to retroactively update spaced repetition history'
    },
    examples: {
      submitVaultTest: {
        request: {
          vaultId: 'vault-item-123',
          scorePercent: 85,
          totalQuestions: 10,
          correctAnswers: 8,
          avgTimePerQuestion: 45
        },
        response: {
          success: true,
          data: {
            vaultId: 'vault-item-123',
            spacedRepetitionResult: {
              testAttempt: {
                recallQuality: 'good',
                recallDescription: 'Good recall - confident with minor inaccuracies'
              },
              updatedStats: {
                material: {
                  avgScore: 85,
                  priorityScore: 7.5,
                  nextReviewAt: '2026-05-07T10:00:00Z'
                }
              }
            },
            hierarchyMapping: {
              domainId: 'networking',
              sectionId: 'ip-addressing',
              materialId: 'vault-item-123'
            }
          }
        }
      },
      resubmitVaultTest: {
        request: {
          vaultId: 'networking__ip-addressing__cidr',
          originalTestId: 'attempt_abc123',
          updatedTestData: {
            scorePercent: 95,
            totalQuestions: 10,
            correctAnswers: 9,
            avgTimePerQuestion: 30
          }
        },
        response: {
          success: true,
          data: {
            testAttempt: { id: 'new_attempt_id', scorePercent: 95, recallQuality: 'easy' },
            updatedStats: { material: { priorityScore: 2.1, nextReviewAt: '2026-06-01T00:00:00Z' } },
            resubmissionAnalysis: {
              scoreImprovement: 10,
              scoreImprovementPercent: '11.8',
              recallQualityImproved: true,
              recommendation: 'Good improvement! Continue with current review schedule.'
            }
          }
        }
      }
    }
  };

  res.json(docs);
});

module.exports = router;
