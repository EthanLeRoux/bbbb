/**
 * =====================================================
 * SPACED REPETITION: RECALL QUALITY CALCULATION
 * =====================================================
 * 
 * Determines the quality of recall based on test performance.
 * This is the foundation for all spaced repetition calculations.
 * 
 * @author Learning Platform Team
 * @version 1.0.0
 */

export type RecallQuality = 'fail' | 'again' | 'hard' | 'good' | 'easy';

export interface RecallQualityResult {
  quality: RecallQuality;
  score: number;
  description: string;
  modifier: number;
}

/**
 * Calculate recall quality based on test score
 * 
 * @param score - Test score percentage (0-100)
 * @returns RecallQualityResult with quality classification and metadata
 * 
 * Quality Ranges:
 * - 90-100: easy (2.2x strength modifier)
 * - 75-89:  good (1.7x strength modifier)  
 * - 60-74:  hard (1.3x strength modifier)
 * - 40-59:  again (0.7x strength modifier)
 * - 0-39:   fail (0.4x strength modifier)
 */
export function calculateRecallQuality(score: number): RecallQualityResult {
  // Input validation
  if (typeof score !== 'number' || score < 0 || score > 100) {
    throw new Error(`Invalid score: ${score}. Must be a number between 0 and 100.`);
  }

  let quality: RecallQuality;
  let description: string;
  let modifier: number;

  if (score >= 90) {
    quality = 'easy';
    description = 'Excellent recall - very confident and accurate';
    modifier = 2.2;
  } else if (score >= 75) {
    quality = 'good';
    description = 'Good recall - confident with minor inaccuracies';
    modifier = 1.7;
  } else if (score >= 60) {
    quality = 'hard';
    description = 'Difficult recall - some hesitation or partial knowledge';
    modifier = 1.3;
  } else if (score >= 40) {
    quality = 'again';
    description = 'Poor recall - significant difficulty or gaps';
    modifier = 0.7;
  } else {
    quality = 'fail';
    description = 'Failed recall - little to no knowledge retained';
    modifier = 0.4;
  }

  return {
    quality,
    score,
    description,
    modifier
  };
}

/**
 * Get quality boundaries for testing and UI purposes
 */
export function getQualityBoundaries(): Record<RecallQuality, { min: number; max: number }> {
  return {
    easy: { min: 90, max: 100 },
    good: { min: 75, max: 89 },
    hard: { min: 60, max: 74 },
    again: { min: 40, max: 59 },
    fail: { min: 0, max: 39 }
  };
}

/**
 * Check if a score indicates successful recall (good or better)
 */
export function isSuccessfulRecall(score: number): boolean {
  return score >= 75;
}

/**
 * Check if a score indicates struggling recall (hard or worse)
 */
export function isStrugglingRecall(score: number): boolean {
  return score < 60;
}

/**
 * Get the next recommended review interval multiplier based on quality
 */
export function getReviewIntervalMultiplier(quality: RecallQuality): number {
  const multipliers: Record<RecallQuality, number> = {
    easy: 2.5,    // 2.5x longer interval
    good: 1.8,    // 1.8x longer interval  
    hard: 1.2,    // 1.2x longer interval
    again: 0.8,   // 0.8x interval (shorter)
    fail: 0.5     // 0.5x interval (much shorter)
  };
  
  return multipliers[quality];
}

/**
 * Validate recall quality result
 */
export function validateRecallQualityResult(result: RecallQualityResult): boolean {
  return (
    typeof result.quality === 'string' &&
    ['fail', 'again', 'hard', 'good', 'easy'].includes(result.quality) &&
    typeof result.score === 'number' &&
    result.score >= 0 &&
    result.score <= 100 &&
    typeof result.description === 'string' &&
    typeof result.modifier === 'number' &&
    result.modifier > 0
  );
}
