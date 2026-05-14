'use strict';

const DailyReviewScheduleService = require('../Services/dailyReviewScheduleService');

/**
 * Controller for daily review schedule endpoints.
 * Handles generation of prioritized study queues.
 */

class DailyReviewScheduleController {
  constructor() {
    this.scheduleService = new DailyReviewScheduleService();
  }

  /**
   * Generate daily review schedule.
   * POST /api/review-schedule/generate
   */
  generateSchedule = async (req, res, next) => {
    try {
      const { domain, section, limit, includeOverdueOnly } = req.body;

      // Validate request body
      const validationError = this._validateGenerateRequest(req.body);
      if (validationError) {
        return res.status(400).json({
          success: false,
          error: validationError.message
        });
      }

      // Generate schedule
      const schedule = await this.scheduleService.generateDailySchedule({
        domain,
        section,
        limit: limit || 50,
        includeOverdueOnly: includeOverdueOnly || false
      });

      res.status(200).json({
        success: true,
        data: schedule,
        message: `Generated review schedule with ${schedule.scheduledItems} prioritized concepts`
      });

    } catch (error) {
      console.error('[DailyReviewScheduleController] Generate schedule error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to generate review schedule. Please try again.'
      });
    }
  };

  /**
   * Get schedule for specific domain.
   * GET /api/review-schedule/domain/:domain
   */
  getDomainSchedule = async (req, res, next) => {
    try {
      const { domain } = req.params;
      const { limit, includeOverdueOnly } = req.query;

      if (!domain) {
        return res.status(400).json({
          success: false,
          error: 'Domain parameter is required'
        });
      }

      const schedule = await this.scheduleService.getDomainSchedule(domain, {
        limit: limit ? parseInt(limit) : 50,
        includeOverdueOnly: includeOverdueOnly === 'true'
      });

      res.status(200).json({
        success: true,
        data: schedule,
        message: `Retrieved ${domain} domain review schedule`
      });

    } catch (error) {
      console.error('[DailyReviewScheduleController] Get domain schedule error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve domain schedule. Please try again.'
      });
    }
  };

  /**
   * Get schedule for specific section.
   * GET /api/review-schedule/domain/:domain/section/:section
   */
  getSectionSchedule = async (req, res, next) => {
    try {
      const { domain, section } = req.params;
      const { limit, includeOverdueOnly } = req.query;

      if (!domain || !section) {
        return res.status(400).json({
          success: false,
          error: 'Domain and section parameters are required'
        });
      }

      const schedule = await this.scheduleService.getSectionSchedule(domain, section, {
        limit: limit ? parseInt(limit) : 50,
        includeOverdueOnly: includeOverdueOnly === 'true'
      });

      res.status(200).json({
        success: true,
        data: schedule,
        message: `Retrieved ${domain}/${section} section review schedule`
      });

    } catch (error) {
      console.error('[DailyReviewScheduleController] Get section schedule error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve section schedule. Please try again.'
      });
    }
  };

  /**
   * Get overdue items only.
   * GET /api/review-schedule/overdue
   */
  getOverdueItems = async (req, res, next) => {
    try {
      const { domain, section, limit } = req.query;

      const schedule = await this.scheduleService.getOverdueItems({
        domain,
        section,
        limit: limit ? parseInt(limit) : 50
      });

      res.status(200).json({
        success: true,
        data: schedule,
        message: `Retrieved ${schedule.scheduledItems} overdue review items`
      });

    } catch (error) {
      console.error('[DailyReviewScheduleController] Get overdue items error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve overdue items. Please try again.'
      });
    }
  };

  /**
   * Get top priority concepts.
   * GET /api/review-schedule/top-priority
   */
  getTopPriorityConcepts = async (req, res, next) => {
    try {
      const { count, domain, section } = req.query;

      const topConcepts = await this.scheduleService.getTopPriorityConcepts(
        count ? parseInt(count) : 10,
        { domain, section }
      );

      res.status(200).json({
        success: true,
        data: topConcepts,
        message: `Retrieved top ${topConcepts.items.length} priority concepts`
      });

    } catch (error) {
      console.error('[DailyReviewScheduleController] Get top priority error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve top priority concepts. Please try again.'
      });
    }
  };

  /**
   * Validate generate schedule request.
   * @param {Object} body - Request body
   * @returns {Error|null} Validation error or null
   * @private
   */
  _validateGenerateRequest(body) {
    const { domain, section, limit, includeOverdueOnly } = body;

    // Optional string parameters
    if (domain && (typeof domain !== 'string' || domain.trim().length === 0)) {
      return new Error('Domain must be a non-empty string if provided');
    }

    if (section && (typeof section !== 'string' || section.trim().length === 0)) {
      return new Error('Section must be a non-empty string if provided');
    }

    // Optional numeric parameters
    if (limit !== undefined) {
      if (typeof limit !== 'number' || limit < 1 || limit > 200) {
        return new Error('Limit must be a number between 1 and 200');
      }
    }

    if (includeOverdueOnly !== undefined && typeof includeOverdueOnly !== 'boolean') {
      return new Error('IncludeOverdueOnly must be a boolean');
    }

    return null;
  }
}

module.exports = DailyReviewScheduleController;
