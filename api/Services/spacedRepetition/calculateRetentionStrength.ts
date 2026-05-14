/**
 * =====================================================
 * SPACED REPETITION: RETENTION STRENGTH CALCULATION
 * =====================================================
 * 
 * Calculates memory retention strength based on performance quality.
 * Higher strength means longer retention and better recall.
 * 
 * @author Learning Platform Team
 * @version 1.0.0
 */

import { calculateRecallQuality, RecallQuality } from './calculateRecallQuality';

export interface RetentionStrengthResult {
  oldStrength: number;
  newStrength: number;
  quality: RecallQuality;
  strengthChange: number;
  strengthPercentChange: number;
}

/**
 * Calculate retention strength based on previous strength and recall quality
 * 
 * @param oldStrength - Current retention strength (0.1 - 10.0)
 * @param score - Test score percentage (0-100)
 * @returns RetentionStrengthResult with updated strength and change metrics
 * 
 * Strength Modifiers:
 * - easy: 2.2x (very strong retention)
 * - good: 1.7x (strong retention)
 * - hard: 1.3x (moderate retention)
 * - again: 0.7x (weak retention)
 * - fail: 0.4x (very weak retention)
 */
export function calculateRetentionStrength(oldStrength: number, score: number): RetentionStrengthResult {
  // Input validation
  if (typeof oldStrength !== 'number' || oldStrength < 0.1 || oldStrength > 10.0) {
    throw new Error(`Invalid oldStrength: ${oldStrength}. Must be between 0.1 and 10.0.`);
  }

  // Get recall quality and modifier
  const qualityResult = calculateRecallQuality(score);
  const { quality, modifier } = qualityResult;

  // Calculate new strength with bounds checking
  let newStrength = oldStrength * modifier;
  
  // Ensure strength stays within reasonable bounds
  newStrength = Math.max(0.1, Math.min(10.0, newStrength));

  // Calculate change metrics
  const strengthChange = newStrength - oldStrength;
  const strengthPercentChange = oldStrength > 0 ? (strengthChange / oldStrength) * 100 : 0;

  return {
    oldStrength,
    newStrength,
    quality,
    strengthChange,
    strengthPercentChange
  };
}

/**
 * Initialize retention strength for first-time learners
 * 
 * @param score - Initial test score (0-100)
 * @returns Initial retention strength (0.5 - 2.0)
 */
export function initializeRetentionStrength(score: number): number {
  const qualityResult = calculateRecallQuality(score);
  
  // Initial strength based on first performance
  const initialStrengths: Record<RecallQuality, number> = {
    easy: 2.0,    // Start strong if first attempt is excellent
    good: 1.5,    // Good starting point
    hard: 1.0,    // Average starting point
    again: 0.7,   // Weak starting point
    fail: 0.5     // Very weak starting point
  };

  return initialStrengths[qualityResult.quality];
}

/**
 * Calculate strength decay over time (for when reviews are missed)
 * 
 * @param currentStrength - Current retention strength
 * @param daysSinceLastReview - Days since last review
 * @returns Decayed retention strength
 */
export function calculateStrengthDecay(currentStrength: number, daysSinceLastReview: number): number {
  // Decay formula: strength * e^(-days/30)
  // Strength halves approximately every 20 days without review
  const decayRate = 1 / 30; // 30-day half-life approximation
  const decayFactor = Math.exp(-daysSinceLastReview * decayRate);
  
  let decayedStrength = currentStrength * decayFactor;
  
  // Ensure minimum strength
  return Math.max(0.1, decayedStrength);
}

/**
 * Predict retention strength at future time
 * 
 * @param currentStrength - Current retention strength
 * @param daysInFuture - Days to predict ahead
 * @returns Predicted retention strength
 */
export function predictFutureStrength(currentStrength: number, daysInFuture: number): number {
  return calculateStrengthDecay(currentStrength, daysInFuture);
}

/**
 * Get strength category for UI display
 * 
 * @param strength - Retention strength value
 * @returns Strength category and description
 */
export function getStrengthCategory(strength: number): { category: string; description: string; color: string } {
  if (strength >= 4.0) {
    return {
      category: 'Excellent',
      description: 'Very strong retention, ready for longer intervals',
      color: '#10b981' // green
    };
  } else if (strength >= 2.5) {
    return {
      category: 'Good',
      description: 'Strong retention, good for standard intervals',
      color: '#3b82f6' // blue
    };
  } else if (strength >= 1.5) {
    return {
      category: 'Fair',
      description: 'Moderate retention, needs regular review',
      color: '#f59e0b' // amber
    };
  } else if (strength >= 0.8) {
    return {
      category: 'Poor',
      description: 'Weak retention, needs frequent review',
      color: '#f97316' // orange
    };
  } else {
    return {
      category: 'Very Poor',
      description: 'Very weak retention, needs immediate review',
      color: '#ef4444' // red
    };
  }
}

/**
 * Calculate strength needed for target interval
 * 
 * @param targetDays - Desired review interval in days
 * @returns Minimum strength needed for target interval
 */
export function calculateStrengthForInterval(targetDays: number): number {
  // Inverse of decay formula: target_strength = log(target_days) / decay_rate
  const decayRate = 1 / 30;
  return Math.log(targetDays) / decayRate;
}

/**
 * Validate retention strength result
 */
export function validateRetentionStrengthResult(result: RetentionStrengthResult): boolean {
  return (
    typeof result.oldStrength === 'number' &&
    result.oldStrength >= 0.1 &&
    result.oldStrength <= 10.0 &&
    typeof result.newStrength === 'number' &&
    result.newStrength >= 0.1 &&
    result.newStrength <= 10.0 &&
    typeof result.strengthChange === 'number' &&
    typeof result.strengthPercentChange === 'number' &&
    ['fail', 'again', 'hard', 'good', 'easy'].includes(result.quality)
  );
}
