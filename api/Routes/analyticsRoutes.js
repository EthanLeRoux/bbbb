'use strict';

const express             = require('express');
const AnalyticsController = require('../controllers/analyticsController');

const router     = express.Router();
const controller = new AnalyticsController();

// Request logger
router.use((req, _res, next) => {
  console.log(`[AnalyticsRoutes] ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

/**
 * GET /api/analytics/question-attempts/by-topic
 * Returns question-attempt records + summary for a given domain/section.
 * Query: domainId (required), sectionId?, materialId?, limit?
 */
router.get('/question-attempts/by-topic', controller.getByTopic);

/**
 * GET /api/analytics/question-attempts/by-date-range
 * Returns question-attempt records + summary for a date window.
 * Query: from (ISO date, required), to (ISO date, required), limit?
 */
router.get('/question-attempts/by-date-range', controller.getByDateRange);

/**
 * GET /api/analytics/question-attempts/weak-topics
 * Returns topics where accuracy is below the given threshold, sorted worst-first.
 * Query: domainId?, threshold? (default 60), minAttempts? (default 3), limit?
 */
router.get('/question-attempts/weak-topics', controller.getWeakTopics);

/**
 * GET /api/analytics/question-attempts/mistake-breakdown
 * Returns a mistake-type distribution across incorrect answers.
 * Query: domainId?, sectionId?, from?, to?, limit?
 */
router.get('/question-attempts/mistake-breakdown', controller.getMistakeBreakdown);

/**
 * GET /api/analytics/question-attempts/accuracy-trend
 * Returns daily accuracy data for chart rendering.
 * Query: domainId (required), sectionId?, days? (default 30)
 */
router.get('/question-attempts/accuracy-trend', controller.getAccuracyTrend);

/**
 * GET /api/analytics/question-attempts/difficulty-breakdown
 * Returns accuracy broken down by difficulty level.
 * Query: domainId (required), sectionId?, limit?
 */
router.get('/question-attempts/difficulty-breakdown', controller.getDifficultyBreakdown);

// 404 catch-all
router.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.path} — Analytics endpoint not found`,
  });
});

module.exports = router;
