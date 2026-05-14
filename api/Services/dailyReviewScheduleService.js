'use strict';

const ConceptPerformanceState = require('../models/ConceptPerformanceState');
const TestQuestionResult = require('../models/TestQuestionResult');
const VaultService = require('./vaultService');

/**
 * Service for generating daily review schedules with prioritized study queues.
 * Dynamically calculates priority scores based on multiple factors.
 */

class DailyReviewScheduleService {
  constructor() {
    this.vaultService = new VaultService();
  }

  /**
   * Generate daily review schedule with prioritized study queue.
   * @param {Object} options - Schedule generation options
   * @returns {Promise<Object>} Prioritized review schedule
   */
  async generateDailySchedule(options = {}) {
    try {
      const {
        domain = null,
        section = null,
        limit = 50,
        includeOverdueOnly = false
      } = options;

      console.log(`[DailyReviewSchedule] Generating schedule for domain: ${domain}, section: ${section}`);

      // Get all concept performance states
      const conceptStates = await this._getConceptStates(domain, section);
      
      // Get recent question results for failure analysis
      const recentResults = await this._getRecentQuestionResults(7); // Last 7 days
      
      // Calculate priority scores and categorize
      const scheduleItems = await this._calculatePriorities(conceptStates, recentResults);
      
      // Filter and sort
      let filteredItems = scheduleItems;
      if (includeOverdueOnly) {
        filteredItems = scheduleItems.filter(item => item.isOverdue);
      }
      
      // Sort by priority score (highest first)
      filteredItems.sort((a, b) => b.priorityScore - a.priorityScore);
      
      // Apply limit
      const limitedItems = filteredItems.slice(0, limit);

      return {
        generatedAt: new Date(),
        totalConcepts: conceptStates.length,
        scheduledItems: limitedItems.length,
        items: limitedItems,
        summary: this._generateSummary(limitedItems)
      };
    } catch (error) {
      console.error('[DailyReviewSchedule] Generate schedule error:', error);
      throw error;
    }
  }

  /**
   * Get concept performance states with optional filtering.
   * @param {string} domain - Optional domain filter
   * @param {string} section - Optional section filter
   * @returns {Promise<Array>} Array of concept performance states
   * @private
   */
  async _getConceptStates(domain, section) {
    try {
      let states;
      
      if (domain && section) {
        states = await ConceptPerformanceState.findByDomainAndSection(domain, section);
      } else if (domain) {
        states = await ConceptPerformanceState.findByDomain(domain);
      } else {
        // Get all states - would need to implement this method or use multiple calls
        const domains = ['networking', 'cybersecurity', 'programming']; // Add more as needed
        const allStates = [];
        for (const d of domains) {
          const domainStates = await ConceptPerformanceState.findByDomain(d);
          allStates.push(...domainStates);
        }
        states = allStates;
      }

      return states;
    } catch (error) {
      console.error('[DailyReviewSchedule] Get concept states error:', error);
      return [];
    }
  }

  /**
   * Get recent question results for failure analysis.
   * @param {number} days - Number of days to look back
   * @returns {Promise<Array>} Array of recent question results
   * @private
   */
  async _getRecentQuestionResults(days) {
    try {
      // Get results from last N days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // This would need to be implemented in TestQuestionResult model
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('[DailyReviewSchedule] Get recent results error:', error);
      return [];
    }
  }

  /**
   * Calculate priority scores for all concepts.
   * @param {Array} conceptStates - Concept performance states
   * @param {Array} recentResults - Recent question results
   * @returns {Promise<Array>} Array of prioritized schedule items
   * @private
   */
  async _calculatePriorities(conceptStates, recentResults) {
    const scheduleItems = [];
    const now = new Date();

    for (const state of conceptStates) {
      const priorityData = await this._calculateConceptPriority(state, recentResults, now);
      
      scheduleItems.push({
        conceptId: state.conceptId,
        domain: state.domain,
        section: state.section,
        vaultId: state.vaultId,
        dueReason: priorityData.dueReason,
        priorityScore: priorityData.priorityScore,
        isOverdue: priorityData.isOverdue,
        lastReviewed: state.lastReviewed,
        nextReviewDate: state.nextReviewDate,
        masteryLevel: state.masteryLevel,
        retentionStrength: state.retentionStrength,
        accuracyRate: state.accuracyRate,
        reviewCount: state.reviewCount,
        explanation: priorityData.explanation
      });
    }

    return scheduleItems;
  }

  /**
   * Calculate priority score for a single concept.
   * @param {Object} state - Concept performance state
   * @param {Array} recentResults - Recent question results
   * @param {Date} now - Current timestamp
   * @returns {Promise<Object>} Priority calculation data
   * @private
   */
  async _calculateConceptPriority(state, recentResults, now) {
    let priorityScore = 0;
    const dueReasons = [];
    const explanations = [];

    // 1. Overdue priority (highest weight)
    const isOverdue = state.nextReviewDate && state.nextReviewDate.toDate() <= now;
    if (isOverdue) {
      const daysOverdue = Math.floor((now - state.nextReviewDate.toDate()) / (1000 * 60 * 60 * 24));
      priorityScore += daysOverdue * 10; // 10 points per day overdue
      dueReasons.push('overdue');
      explanations.push(`Overdue by ${daysOverdue} days`);
    }

    // 2. Recent failures priority
    const recentFailures = this._getRecentFailures(state.conceptId, recentResults);
    if (recentFailures.count > 0) {
      const failureScore = recentFailures.count * 5; // 5 points per recent failure
      priorityScore += failureScore;
      dueReasons.push('recent-failures');
      explanations.push(`Failed ${recentFailures.count} times recently`);
    }

    // 3. Weakness score priority (low accuracy)
    if (state.accuracyRate < 70) {
      const weaknessScore = (70 - state.accuracyRate) * 0.5; // Up to 15 points
      priorityScore += weaknessScore;
      dueReasons.push('weakness');
      explanations.push(`Low accuracy rate: ${state.accuracyRate}%`);
    }

    // 4. Slow recall priority (high average time)
    if (state.averageTimeSpent > 120) { // Over 2 minutes
      const slowRecallScore = Math.min((state.averageTimeSpent - 120) * 0.1, 10); // Up to 10 points
      priorityScore += slowRecallScore;
      dueReasons.push('slow-recall');
      explanations.push(`Slow recall: ${Math.round(state.averageTimeSpent)}s average`);
    }

    // 5. Low retention strength priority
    if (state.retentionStrength < 0.5) {
      const retentionScore = (0.5 - state.retentionStrength) * 20; // Up to 10 points
      priorityScore += retentionScore;
      dueReasons.push('low-retention');
      explanations.push(`Low retention strength: ${Math.round(state.retentionStrength * 100)}%`);
    }

    // 6. Mastery level bonus (beginner concepts get priority)
    if (state.masteryLevel === 'beginner') {
      priorityScore += 8;
      dueReasons.push('beginner');
      explanations.push('Beginner mastery level');
    }

    return {
      priorityScore: Math.round(priorityScore * 100) / 100,
      isOverdue,
      dueReason: dueReasons.join('-') || 'scheduled',
      explanation: explanations.join('; ') || 'Scheduled review'
    };
  }

  /**
   * Get recent failures for a concept.
   * @param {string} conceptId - Concept ID
   * @param {Array} recentResults - Recent question results
   * @returns {Object} Failure analysis
   * @private
   */
  _getRecentFailures(conceptId, recentResults) {
    const conceptResults = recentResults.filter(result => result.conceptId === conceptId);
    const failures = conceptResults.filter(result => !result.isCorrect);
    
    return {
      count: failures.length,
      total: conceptResults.length,
      rate: conceptResults.length > 0 ? (failures.length / conceptResults.length) * 100 : 0
    };
  }

  /**
   * Generate summary statistics for the schedule.
   * @param {Array} items - Scheduled items
   * @returns {Object} Summary statistics
   * @private
   */
  _generateSummary(items) {
    const summary = {
      overdueCount: 0,
      recentFailureCount: 0,
      weaknessCount: 0,
      slowRecallCount: 0,
      lowRetentionCount: 0,
      beginnerCount: 0,
      domainBreakdown: {},
      sectionBreakdown: {}
    };

    items.forEach(item => {
      if (item.isOverdue) summary.overdueCount++;
      if (item.dueReason.includes('recent-failures')) summary.recentFailureCount++;
      if (item.dueReason.includes('weakness')) summary.weaknessCount++;
      if (item.dueReason.includes('slow-recall')) summary.slowRecallCount++;
      if (item.dueReason.includes('low-retention')) summary.lowRetentionCount++;
      if (item.dueReason.includes('beginner')) summary.beginnerCount++;

      // Domain breakdown
      if (!summary.domainBreakdown[item.domain]) {
        summary.domainBreakdown[item.domain] = 0;
      }
      summary.domainBreakdown[item.domain]++;

      // Section breakdown
      if (!summary.sectionBreakdown[item.section]) {
        summary.sectionBreakdown[item.section] = 0;
      }
      summary.sectionBreakdown[item.section]++;
    });

    return summary;
  }

  /**
   * Get schedule for a specific domain.
   * @param {string} domain - Domain name
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Domain-specific schedule
   */
  async getDomainSchedule(domain, options = {}) {
    return this.generateDailySchedule({ ...options, domain });
  }

  /**
   * Get schedule for a specific section.
   * @param {string} domain - Domain name
   * @param {string} section - Section name
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Section-specific schedule
   */
  async getSectionSchedule(domain, section, options = {}) {
    return this.generateDailySchedule({ ...options, domain, section });
  }

  /**
   * Get overdue items only.
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Overdue items schedule
   */
  async getOverdueItems(options = {}) {
    return this.generateDailySchedule({ ...options, includeOverdueOnly: true });
  }

  /**
   * Get concepts that need review most urgently (top N).
   * @param {number} count - Number of top concepts to return
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Top priority concepts
   */
  async getTopPriorityConcepts(count = 10, options = {}) {
    const schedule = await this.generateDailySchedule({ ...options, limit: count });
    return {
      ...schedule,
      items: schedule.items.slice(0, count)
    };
  }
}

module.exports = DailyReviewScheduleService;
