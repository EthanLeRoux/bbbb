'use strict';

const { QuestionAttemptModel } = require('../models/QuestionAttempt');

/**
 * Analytics query utilities for the question_attempts collection.
 *
 * All helpers are read-only and return plain serialisable objects so
 * they can be returned directly from API responses or used in
 * dashboard / AI-tutoring pipelines.
 *
 * Methods:
 *  - getQuestionAttemptsByTopic()
 *  - getQuestionAttemptsByDateRange()
 *  - getWeakTopicHistory()
 *  - getMistakeBreakdown()
 *  - getTopicAccuracyTrend()         (bonus — used by weakness trend charts)
 *  - getDifficultyBreakdown()         (bonus — used by difficulty analytics)
 */

class QuestionAttemptAnalyticsService {
  // ─────────────────────────────────────────────────────────────────────────
  // 1. BY TOPIC
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Fetch and summarise question-attempt records for a given topic hierarchy.
   *
   * @param {Object} params
   * @param {string}  params.domainId
   * @param {string}  [params.sectionId]
   * @param {string}  [params.materialId]
   * @param {number}  [params.limit=200]
   * @returns {Promise<Object>}
   * {
   *   domainId, sectionId, materialId,
   *   totalAttempts, correctAttempts, accuracy,
   *   avgTimeSpentSeconds, avgConfidence,
   *   records: [...],
   * }
   */
  async getQuestionAttemptsByTopic({ domainId, sectionId = null, materialId = null, limit = 200 } = {}) {
    if (!domainId) throw new Error('domainId is required');

    const records = await QuestionAttemptModel.findByTopic({ domainId, sectionId, materialId, limit });
    return {
      domainId,
      sectionId,
      materialId,
      ...this._summarise(records),
      records,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. BY DATE RANGE
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Fetch and summarise records within a date window.
   *
   * @param {Object} params
   * @param {Date|string} params.from
   * @param {Date|string} params.to
   * @param {number}      [params.limit=500]
   * @returns {Promise<Object>}
   */
  async getQuestionAttemptsByDateRange({ from, to, limit = 500 } = {}) {
    const fromDate = new Date(from);
    const toDate   = new Date(to);

    if (isNaN(fromDate) || isNaN(toDate)) {
      throw new Error('Valid from/to dates are required');
    }
    if (fromDate > toDate) {
      throw new Error('from must be before to');
    }

    const records = await QuestionAttemptModel.findByDateRange(fromDate, toDate, limit);
    return {
      from: fromDate,
      to:   toDate,
      ...this._summarise(records),
      records,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. WEAK TOPIC HISTORY
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Identify weak topics (sections / domains where accuracy is below a
   * threshold) and return their historical performance data.
   *
   * @param {Object} params
   * @param {string}  [params.domainId]       - Scope to a single domain
   * @param {number}  [params.threshold=60]   - Accuracy % below which a topic is "weak"
   * @param {number}  [params.minAttempts=3]  - Ignore topics with fewer attempts
   * @param {number}  [params.limit=300]
   * @returns {Promise<Array>}
   * [
   *   {
   *     domainId, sectionId,
   *     totalAttempts, correctAttempts, accuracy,
   *     avgTimeSpentSeconds,
   *     recentTrend: "improving" | "declining" | "stable",
   *     records: [...],
   *   },
   *   ...
   * ]
   */
  async getWeakTopicHistory({ domainId = null, threshold = 60, minAttempts = 3, limit = 300 } = {}) {
    const filters = domainId ? { domainId, limit } : { limit };
    const records = await QuestionAttemptModel.find(filters);

    // Group by domain+section
    const groups = this._groupBy(records, r => `${r.domainId}||${r.sectionId}`);

    const weakTopics = [];

    for (const [key, groupRecords] of Object.entries(groups)) {
      if (groupRecords.length < minAttempts) continue;

      const summary = this._summarise(groupRecords);
      if (summary.accuracy >= threshold) continue;

      const [gDomainId, gSectionId] = key.split('||');

      // Recent vs older trend: split records in half (sorted newest first)
      const sorted  = [...groupRecords].sort((a, b) => new Date(b.answeredAt) - new Date(a.answeredAt));
      const half    = Math.ceil(sorted.length / 2);
      const recent  = this._summarise(sorted.slice(0, half));
      const older   = this._summarise(sorted.slice(half));

      let recentTrend = 'stable';
      if (recent.accuracy > older.accuracy + 5)  recentTrend = 'improving';
      if (recent.accuracy < older.accuracy - 5)  recentTrend = 'declining';

      weakTopics.push({
        domainId:  gDomainId  || null,
        sectionId: gSectionId || null,
        domainName:  groupRecords[0]?.domainName  || null,
        sectionName: groupRecords[0]?.sectionName || null,
        recentTrend,
        ...summary,
        records: groupRecords,
      });
    }

    // Worst topics first
    return weakTopics.sort((a, b) => a.accuracy - b.accuracy);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. MISTAKE BREAKDOWN
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Aggregate mistake type distribution across a set of records.
   *
   * @param {Object} params
   * @param {string}  [params.domainId]
   * @param {string}  [params.sectionId]
   * @param {Date}    [params.from]
   * @param {Date}    [params.to]
   * @param {number}  [params.limit=500]
   * @returns {Promise<Object>}
   * {
   *   totalIncorrect,
   *   unclassified,
   *   breakdown: {
   *     concept_misunderstanding: { count, percent },
   *     careless_error:           { count, percent },
   *     ...
   *   }
   * }
   */
  async getMistakeBreakdown({ domainId = null, sectionId = null, from = null, to = null, limit = 500 } = {}) {
    let records;

    if (from && to) {
      records = await QuestionAttemptModel.findByDateRange(new Date(from), new Date(to), limit);
    } else {
      records = await QuestionAttemptModel.find({ domainId, sectionId, limit });
    }

    // Only count wrong answers
    const incorrect = records.filter(r => !r.correct);
    const total     = incorrect.length;

    const counts = {};
    let unclassified = 0;

    for (const r of incorrect) {
      if (!r.mistakeType) {
        unclassified++;
      } else {
        counts[r.mistakeType] = (counts[r.mistakeType] || 0) + 1;
      }
    }

    const breakdown = {};
    for (const [type, count] of Object.entries(counts)) {
      breakdown[type] = {
        count,
        percent: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      };
    }

    return {
      totalIncorrect: total,
      unclassified,
      breakdown,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. TOPIC ACCURACY TREND  (bonus — useful for chart data)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Return accuracy per calendar day for a topic, useful for line charts.
   *
   * @param {Object} params
   * @param {string}  params.domainId
   * @param {string}  [params.sectionId]
   * @param {number}  [params.days=30]
   * @returns {Promise<Array>} [{ date: "YYYY-MM-DD", accuracy, attempts }, ...]
   */
  async getTopicAccuracyTrend({ domainId, sectionId = null, days = 30 } = {}) {
    if (!domainId) throw new Error('domainId is required');

    const from = new Date();
    from.setDate(from.getDate() - days);

    const records = await QuestionAttemptModel.findByTopic({ domainId, sectionId, limit: 1000 });
    const filtered = records.filter(r => new Date(r.answeredAt) >= from);

    const dayMap = {};
    for (const r of filtered) {
      const date = new Date(r.answeredAt).toISOString().slice(0, 10);
      if (!dayMap[date]) dayMap[date] = { total: 0, correct: 0 };
      dayMap[date].total++;
      if (r.correct) dayMap[date].correct++;
    }

    return Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { total, correct }]) => ({
        date,
        attempts: total,
        accuracy: total > 0 ? Math.round((correct / total) * 1000) / 10 : 0,
      }));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 6. DIFFICULTY BREAKDOWN  (bonus)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Accuracy broken down by difficulty level for a given topic.
   *
   * @param {Object} params
   * @param {string}  params.domainId
   * @param {string}  [params.sectionId]
   * @param {number}  [params.limit=300]
   * @returns {Promise<Object>} { easy: { attempts, accuracy }, medium: {...}, hard: {...} }
   */
  async getDifficultyBreakdown({ domainId, sectionId = null, limit = 300 } = {}) {
    if (!domainId) throw new Error('domainId is required');

    const records = await QuestionAttemptModel.findByTopic({ domainId, sectionId, limit });

    const result = {
      easy:   { attempts: 0, correct: 0, accuracy: 0 },
      medium: { attempts: 0, correct: 0, accuracy: 0 },
      hard:   { attempts: 0, correct: 0, accuracy: 0 },
    };

    for (const r of records) {
      const level = r.difficulty;
      if (!result[level]) continue;
      result[level].attempts++;
      if (r.correct) result[level].correct++;
    }

    for (const level of Object.keys(result)) {
      const { attempts, correct } = result[level];
      result[level].accuracy = attempts > 0 ? Math.round((correct / attempts) * 1000) / 10 : 0;
    }

    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Compute summary statistics for an array of question-attempt records.
   * @private
   */
  _summarise(records) {
    if (!records || records.length === 0) {
      return { totalAttempts: 0, correctAttempts: 0, accuracy: 0, avgTimeSpentSeconds: 0, avgConfidence: null };
    }

    const total   = records.length;
    const correct = records.filter(r => r.correct).length;

    const totalTime = records.reduce((s, r) => s + (r.timeSpentSeconds || 0), 0);

    const confRecords = records.filter(r => r.confidence != null);
    const avgConf = confRecords.length > 0
      ? confRecords.reduce((s, r) => s + r.confidence, 0) / confRecords.length
      : null;

    return {
      totalAttempts:       total,
      correctAttempts:     correct,
      accuracy:            Math.round((correct / total) * 1000) / 10,
      avgTimeSpentSeconds: Math.round((totalTime / total) * 10) / 10,
      avgConfidence:       avgConf !== null ? Math.round(avgConf * 10) / 10 : null,
    };
  }

  /**
   * Group an array of objects by a key function.
   * @private
   */
  _groupBy(array, keyFn) {
    return array.reduce((acc, item) => {
      const key = keyFn(item);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }
}

module.exports = QuestionAttemptAnalyticsService;
