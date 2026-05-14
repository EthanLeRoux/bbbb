/**
 * =====================================================
 * DAILY REVIEW SCHEDULE ROUTES
 * =====================================================
 * 
 * Express routes for daily review schedule endpoints.
 * Provides prioritized study queue generation.
 */

const express = require('express');
const DailyReviewScheduleController = require('../controllers/dailyReviewScheduleController');

const router = express.Router();

// Initialize controller
const dailyReviewScheduleController = new DailyReviewScheduleController();

// Middleware for logging review schedule requests
router.use((req, res, next) => {
  console.log(`[DailyReviewScheduleRoutes] ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// =====================================================
// CORE ENDPOINTS
// =====================================================

/**
 * Generate daily review schedule
 * POST /api/review-schedule/generate
 */
router.post('/generate', dailyReviewScheduleController.generateSchedule);

/**
 * Get domain-specific schedule
 * GET /api/review-schedule/domain/:domain
 */
router.get('/domain/:domain', dailyReviewScheduleController.getDomainSchedule);

/**
 * Get section-specific schedule
 * GET /api/review-schedule/domain/:domain/section/:section
 */
router.get('/domain/:domain/section/:section', dailyReviewScheduleController.getSectionSchedule);

/**
 * Get overdue items only
 * GET /api/review-schedule/overdue
 */
router.get('/overdue', dailyReviewScheduleController.getOverdueItems);

/**
 * Get top priority concepts
 * GET /api/review-schedule/top-priority
 */
router.get('/top-priority', dailyReviewScheduleController.getTopPriorityConcepts);

// =====================================================
// ERROR HANDLING
// =====================================================

// 404 handler
router.use((req, res) => {
   res.status(404).json({ error: 'Route not found' });
});

// Global error handler
router.use((err, req, res, next) => {
  console.error('[DailyReviewScheduleRoutes] Global error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

module.exports = router;
