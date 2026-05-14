'use strict';

const { MISTAKE_TYPES } = require('../models/QuestionAttempt');

/**
 * Rule-based mistake classifier.
 *
 * Classifies why a user got a question wrong based on observable signals:
 *   - timeSpentSeconds  (how long they spent)
 *   - difficulty        ("easy" | "medium" | "hard")
 *   - confidence        (0-100 self-reported, or null)
 *   - score             (0-100 partial credit)
 *
 * All rules are heuristics. They are intentionally conservative so that
 * the classifier avoids mis-labelling — it returns null when uncertain
 * rather than forcing a category.
 *
 * Future upgrade path:
 *   Replace or augment classifyRuleBased() with classifyWithAI() which can
 *   send the question text + user answer to the Anthropic API for a richer
 *   classification. The method signature is kept identical so callers need
 *   no changes.
 */

// Time thresholds (seconds)
const TIME = {
  VERY_FAST:  8,   // answered almost instantly
  FAST:       15,
  SLOW:       60,
  VERY_SLOW:  120,
};

class MistakeClassifier {
  // ─────────────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Classify a single question attempt.
   *
   * @param {Object} params
   * @param {boolean} params.correct
   * @param {number}  params.timeSpentSeconds
   * @param {string}  [params.difficulty]   "easy" | "medium" | "hard"
   * @param {number}  [params.confidence]   0-100 or null
   * @param {number}  [params.score]        0-100 (partial credit)
   * @returns {string|null} One of MISTAKE_TYPES, or null if correct / unclassifiable
   */
  static classify({ correct, timeSpentSeconds, difficulty, confidence, score } = {}) {
    // Only classify incorrect answers
    if (correct) return null;

    return MistakeClassifier.classifyRuleBased({
      timeSpentSeconds,
      difficulty,
      confidence,
      score,
    });
  }

  /**
   * Classify an array of question-attempt objects in bulk.
   * Mutates each object by adding a `mistakeType` field.
   *
   * @param {Array<Object>} records
   * @returns {Array<Object>} Same array with mistakeType populated
   */
  static classifyBatch(records) {
    return records.map(r => ({
      ...r,
      mistakeType: MistakeClassifier.classify(r),
    }));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RULE-BASED ENGINE
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Core rule-based classifier. Rules are applied in priority order;
   * the first matching rule wins.
   *
   * @param {Object} params
   * @returns {string|null}
   */
  static classifyRuleBased({ timeSpentSeconds = 0, difficulty, confidence, score } = {}) {
    const t    = Number(timeSpentSeconds) || 0;
    const conf = confidence != null ? Number(confidence) : null;
    const sc   = score      != null ? Number(score)      : 0;

    // ── Partial knowledge ─────────────────────────────────────────────────
    // Score between 20-79 suggests the user knew something but not enough
    if (sc > 0 && sc < 80) {
      return 'partial_knowledge';
    }

    // ── Guessing ─────────────────────────────────────────────────────────
    // Very fast answer + wrong + low / null confidence
    if (t <= TIME.VERY_FAST && (conf === null || conf < 30)) {
      return 'guessing';
    }

    // ── Rushed answer ─────────────────────────────────────────────────────
    // Fast answer (but not suspiciously instant) that came out wrong
    if (t <= TIME.FAST) {
      return 'rushed_answer';
    }

    // ── Careless error ────────────────────────────────────────────────────
    // Spent a reasonable amount of time + high confidence but still wrong
    // → they thought they knew the answer
    if (conf !== null && conf >= 70 && t >= TIME.FAST) {
      return 'careless_error';
    }

    // ── Misread question ──────────────────────────────────────────────────
    // Fast answer on a hard question (suggests they misread / skimmed)
    if (t <= TIME.FAST && difficulty === 'hard') {
      return 'misread_question';
    }

    // ── Memory failure ────────────────────────────────────────────────────
    // Spent a long time but still got it wrong → struggled to recall
    if (t >= TIME.VERY_SLOW) {
      return 'memory_failure';
    }

    // ── Terminology confusion ─────────────────────────────────────────────
    // Medium time, medium confidence → plausible mix-up of terms
    if (t >= TIME.FAST && t < TIME.SLOW && conf !== null && conf >= 40 && conf < 70) {
      return 'terminology_confusion';
    }

    // ── Concept misunderstanding ──────────────────────────────────────────
    // Default for wrong answers that took a normal amount of time
    if (t >= TIME.FAST) {
      return 'concept_misunderstanding';
    }

    // Unclassifiable
    return null;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // AI UPGRADE STUB
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Classify using the Anthropic API (future implementation).
   *
   * Stub method — ready to be implemented when AI classification is desired.
   * Signature mirrors classifyRuleBased() so callers are unaffected.
   *
   * @param {Object} params - Same as classifyRuleBased, plus:
   * @param {string} [params.questionText]
   * @param {string} [params.userAnswer]
   * @param {string} [params.correctAnswer]
   * @returns {Promise<string|null>}
   */
  static async classifyWithAI({
    /* eslint-disable no-unused-vars */
    questionText,
    userAnswer,
    correctAnswer,
    timeSpentSeconds,
    difficulty,
    confidence,
    score,
    /* eslint-enable no-unused-vars */
  } = {}) {
    // TODO: call Anthropic API with question/answer context
    // Fall back to rule-based until implemented
    console.warn('[MistakeClassifier] classifyWithAI not yet implemented — falling back to rule-based');
    return MistakeClassifier.classifyRuleBased({ timeSpentSeconds, difficulty, confidence, score });
  }

  /**
   * Return all valid mistake type strings (useful for validation / docs).
   * @returns {string[]}
   */
  static getMistakeTypes() {
    return [...MISTAKE_TYPES];
  }
}

module.exports = MistakeClassifier;
