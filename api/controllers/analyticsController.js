'use strict';

const QuestionAttemptAnalyticsService = require('../Services/questionAttemptAnalyticsService');

/**
 * Controller for the /api/analytics/question-attempts endpoints.
 * All methods are read-only — they query the question_attempts collection
 * and return aggregated data for dashboards and AI-tutoring features.
 */
class AnalyticsController {
  constructor() {
    this.analyticsService = new QuestionAttemptAnalyticsService();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/analytics/question-attempts/by-topic
  // Query: domainId (required), sectionId?, materialId?, limit?
  // ─────────────────────────────────────────────────────────────────────────
  getByTopic = async (req, res) => {
    try {
      const { domainId, sectionId, materialId, limit } = req.query;

      if (!domainId) {
        return res.status(400).json({ success: false, error: 'domainId is required' });
      }

      const result = await this.analyticsService.getQuestionAttemptsByTopic({
        domainId,
        sectionId:  sectionId  || null,
        materialId: materialId || null,
        limit:      limit ? parseInt(limit, 10) : 200,
      });

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error('[AnalyticsController] getByTopic error:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve question attempts by topic' });
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/analytics/question-attempts/by-date-range
  // Query: from (ISO), to (ISO), limit?
  // ─────────────────────────────────────────────────────────────────────────
  getByDateRange = async (req, res) => {
    try {
      const { from, to, limit } = req.query;

      if (!from || !to) {
        return res.status(400).json({ success: false, error: 'from and to date params are required' });
      }

      const result = await this.analyticsService.getQuestionAttemptsByDateRange({
        from,
        to,
        limit: limit ? parseInt(limit, 10) : 500,
      });

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error('[AnalyticsController] getByDateRange error:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve question attempts by date range' });
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/analytics/question-attempts/weak-topics
  // Query: domainId?, threshold?, minAttempts?, limit?
  // ─────────────────────────────────────────────────────────────────────────
  getWeakTopics = async (req, res) => {
    try {
      const { domainId, threshold, minAttempts, limit } = req.query;

      const result = await this.analyticsService.getWeakTopicHistory({
        domainId:    domainId    || null,
        threshold:   threshold   ? parseFloat(threshold)       : 60,
        minAttempts: minAttempts ? parseInt(minAttempts, 10)   : 3,
        limit:       limit       ? parseInt(limit, 10)         : 300,
      });

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error('[AnalyticsController] getWeakTopics error:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve weak topic history' });
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/analytics/question-attempts/mistake-breakdown
  // Query: domainId?, sectionId?, from?, to?, limit?
  // ─────────────────────────────────────────────────────────────────────────
  getMistakeBreakdown = async (req, res) => {
    try {
      const { domainId, sectionId, from, to, limit } = req.query;

      const result = await this.analyticsService.getMistakeBreakdown({
        domainId:  domainId  || null,
        sectionId: sectionId || null,
        from:      from      || null,
        to:        to        || null,
        limit:     limit     ? parseInt(limit, 10) : 500,
      });

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error('[AnalyticsController] getMistakeBreakdown error:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve mistake breakdown' });
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/analytics/question-attempts/accuracy-trend
  // Query: domainId (required), sectionId?, days?
  // ─────────────────────────────────────────────────────────────────────────
  getAccuracyTrend = async (req, res) => {
    try {
      const { domainId, sectionId, days } = req.query;

      if (!domainId) {
        return res.status(400).json({ success: false, error: 'domainId is required' });
      }

      const result = await this.analyticsService.getTopicAccuracyTrend({
        domainId,
        sectionId: sectionId || null,
        days:      days ? parseInt(days, 10) : 30,
      });

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error('[AnalyticsController] getAccuracyTrend error:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve accuracy trend' });
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/analytics/question-attempts/difficulty-breakdown
  // Query: domainId (required), sectionId?, limit?
  // ─────────────────────────────────────────────────────────────────────────
  getDifficultyBreakdown = async (req, res) => {
    try {
      const { domainId, sectionId, limit } = req.query;

      if (!domainId) {
        return res.status(400).json({ success: false, error: 'domainId is required' });
      }

      const result = await this.analyticsService.getDifficultyBreakdown({
        domainId,
        sectionId: sectionId || null,
        limit:     limit ? parseInt(limit, 10) : 300,
      });

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error('[AnalyticsController] getDifficultyBreakdown error:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve difficulty breakdown' });
    }
  };
}

module.exports = AnalyticsController;
