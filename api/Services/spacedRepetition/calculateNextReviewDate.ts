/**
 * =====================================================
 * SPACED REPETITION: NEXT REVIEW DATE CALCULATION
 * =====================================================
 * 
 * Calculates when a user should review material again based on performance.
 * Uses spaced repetition intervals optimized for learning.
 * 
 * @author Learning Platform Team
 * @version 1.0.0
 */

export type RecallQuality = 'fail' | 'again' | 'hard' | 'good' | 'easy';

export interface NextReviewDateInput {
  currentScore?: number; // 0-100
  recallQuality?: RecallQuality;
  currentInterval?: number; // Current interval in days
  retentionStrength?: number; // 0.1-10.0
  reviewCount?: number; // Total reviews completed
  lastReviewDate?: Date;
}

export interface NextReviewDateResult {
  nextReviewDate: Date;
  intervalDays: number;
  recallQuality: RecallQuality;
  intervalMultiplier: number;
  schedulingReason: string;
  confidence: number; // 0-100, confidence in interval
}

/**
 * Calculate next review date based on performance quality
 * 
 * @param input - Calculation parameters
 * @returns NextReviewDateResult with scheduling details
 * 
 * MVP Intervals (can be enhanced with FSRS later):
 * - fail (<40): 1 day
 * - again (40-59): 2 days  
 * - hard (60-74): 3 days
 * - good (75-89): 7 days
 * - easy (90+): 14 days
 * 
 * Enhanced intervals with retention strength:
 * - Base interval × strength modifier × review count factor
 */
export function calculateNextReviewDate(input: NextReviewDateInput): NextReviewDateResult {
  // Determine recall quality
  let quality: RecallQuality;
  let score: number;
  
  if (input.recallQuality) {
    quality = input.recallQuality;
    score = input.currentScore || getScoreFromQuality(quality);
  } else if (input.currentScore !== undefined) {
    quality = getQualityFromScore(input.currentScore);
    score = input.currentScore;
  } else {
    throw new Error('Either currentScore or recallQuality must be provided');
  }

  // Get base interval for quality
  const baseInterval = getBaseInterval(quality);
  
  // Calculate enhanced interval with modifiers
  const intervalDays = calculateEnhancedInterval(baseInterval, input);
  
  // Calculate next review date
  const lastReview = input.lastReviewDate || new Date();
  const nextReviewDate = new Date(lastReview.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  
  // Calculate confidence in interval
  const confidence = calculateIntervalConfidence(input, quality);
  
  // Get scheduling reason
  const schedulingReason = getSchedulingReason(quality, intervalDays, input);

  return {
    nextReviewDate,
    intervalDays,
    recallQuality: quality,
    intervalMultiplier: intervalDays / baseInterval,
    schedulingReason,
    confidence
  };
}

/**
 * Get recall quality from score
 */
export function getQualityFromScore(score: number): RecallQuality {
  if (score >= 90) return 'easy';
  if (score >= 75) return 'good';
  if (score >= 60) return 'hard';
  if (score >= 40) return 'again';
  return 'fail';
}

/**
 * Get representative score from quality
 */
export function getScoreFromQuality(quality: RecallQuality): number {
  const scores: Record<RecallQuality, number> = {
    easy: 95,
    good: 82,
    hard: 67,
    again: 50,
    fail: 20
  };
  return scores[quality];
}

/**
 * Get base interval for recall quality (MVP intervals)
 */
export function getBaseInterval(quality: RecallQuality): number {
  const baseIntervals: Record<RecallQuality, number> = {
    fail: 1,    // 1 day
    again: 2,   // 2 days
    hard: 3,    // 3 days
    good: 7,    // 1 week
    easy: 14    // 2 weeks
  };
  
  return baseIntervals[quality];
}

/**
 * Calculate enhanced interval with modifiers
 */
export function calculateEnhancedInterval(baseInterval: number, input: NextReviewDateInput): number {
  let enhancedInterval = baseInterval;
  
  // Apply retention strength modifier (0.5x to 2.0x)
  if (input.retentionStrength) {
    const strengthModifier = calculateStrengthModifier(input.retentionStrength);
    enhancedInterval *= strengthModifier;
  }
  
  // Apply review count modifier (gradually increases intervals)
  if (input.reviewCount && input.reviewCount > 1) {
    const reviewCountModifier = calculateReviewCountModifier(input.reviewCount);
    enhancedInterval *= reviewCountModifier;
  }
  
  // Apply current interval modifier (graduated intervals)
  if (input.currentInterval) {
    const intervalModifier = calculateIntervalModifier(input.currentInterval, baseInterval);
    enhancedInterval *= intervalModifier;
  }
  
  // Ensure reasonable bounds (1 day to 6 months)
  return Math.max(1, Math.min(180, Math.round(enhancedInterval)));
}

/**
 * Calculate retention strength modifier
 */
export function calculateStrengthModifier(strength: number): number {
  // Strength ranges: 0.1 (very weak) to 10.0 (very strong)
  // Modifier ranges: 0.5x (weak) to 2.0x (strong)
  
  if (strength < 0.5) return 0.5;      // Very weak memory
  if (strength < 1.0) return 0.7;      // Weak memory
  if (strength < 2.0) return 1.0;      // Average memory
  if (strength < 4.0) return 1.3;      // Good memory
  if (strength < 6.0) return 1.6;      // Strong memory
  return 2.0;                          // Very strong memory
}

/**
 * Calculate review count modifier
 */
export function calculateReviewCountModifier(reviewCount: number): number {
  // More reviews = longer intervals, but with diminishing returns
  if (reviewCount <= 1) return 1.0;
  if (reviewCount <= 3) return 1.1;
  if (reviewCount <= 5) return 1.2;
  if (reviewCount <= 10) return 1.3;
  if (reviewCount <= 20) return 1.4;
  return 1.5; // Maximum 1.5x for 20+ reviews
}

/**
 * Calculate interval modifier based on current interval
 */
export function calculateIntervalModifier(currentInterval: number, baseInterval: number): number {
  // Graduated intervals: don't jump too drastically
  const ratio = currentInterval / baseInterval;
  
  if (ratio < 0.5) return 1.2;  // Current interval much shorter than base
  if (ratio < 1.0) return 1.1;  // Current interval shorter than base
  if (ratio < 2.0) return 1.0;  // Current interval similar to base
  if (ratio < 3.0) return 0.9;  // Current interval longer than base
  return 0.8;                  // Current interval much longer than base
}

/**
 * Calculate confidence in interval selection
 */
export function calculateIntervalConfidence(input: NextReviewDateInput, quality: RecallQuality): number {
  let confidence = 50; // Base confidence
  
  // More reviews = higher confidence
  if (input.reviewCount) {
    confidence += Math.min(input.reviewCount * 2, 30);
  }
  
  // Higher retention strength = higher confidence
  if (input.retentionStrength) {
    confidence += Math.min(input.retentionStrength * 5, 20);
  }
  
  // Extreme qualities have higher confidence
  if (quality === 'easy' || quality === 'fail') {
    confidence += 10;
  }
  
  return Math.min(100, confidence);
}

/**
 * Get scheduling reason explanation
 */
export function getSchedulingReason(quality: RecallQuality, intervalDays: number, input: NextReviewDateInput): string {
  let reason = `Scheduled ${intervalDays} days from now based on ${quality} performance.`;
  
  if (input.retentionStrength) {
    const strengthDesc = getStrengthDescription(input.retentionStrength);
    reason += ` ${strengthDesc} memory strength.`;
  }
  
  if (input.reviewCount && input.reviewCount > 1) {
    reason += ` Adjusted for ${input.reviewCount} previous reviews.`;
  }
  
  return reason;
}

/**
 * Get strength description
 */
export function getStrengthDescription(strength: number): string {
  if (strength < 1.0) return 'Weak';
  if (strength < 2.5) return 'Average';
  if (strength < 5.0) return 'Good';
  if (strength < 7.5) return 'Strong';
  return 'Excellent';
}

/**
 * Check if review is due
 */
export function isReviewDue(nextReviewDate: Date, currentDate: Date = new Date()): boolean {
  return nextReviewDate <= currentDate;
}

/**
 * Get days until review
 */
export function getDaysUntilReview(nextReviewDate: Date, currentDate: Date = new Date()): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.ceil((nextReviewDate.getTime() - currentDate.getTime()) / msPerDay);
}

/**
 * Get review status
 */
export function getReviewStatus(nextReviewDate: Date, currentDate: Date = new Date()): {
  status: 'overdue' | 'due' | 'due-soon' | 'scheduled';
  daysUntil: number;
  description: string;
} {
  const daysUntil = getDaysUntilReview(nextReviewDate, currentDate);
  
  if (daysUntil < 0) {
    return {
      status: 'overdue',
      daysUntil,
      description: `${Math.abs(daysUntil)} days overdue`
    };
  } else if (daysUntil === 0) {
    return {
      status: 'due',
      daysUntil,
      description: 'Due today'
    };
  } else if (daysUntil <= 3) {
    return {
      status: 'due-soon',
      daysUntil,
      description: `Due in ${daysUntil} days`
    };
  } else {
    return {
      status: 'scheduled',
      daysUntil,
      description: `Scheduled in ${daysUntil} days`
    };
  }
}

/**
 * Validate next review date result
 */
export function validateNextReviewDateResult(result: NextReviewDateResult): boolean {
  return (
    result.nextReviewDate instanceof Date &&
    typeof result.intervalDays === 'number' &&
    result.intervalDays > 0 &&
    ['fail', 'again', 'hard', 'good', 'easy'].includes(result.recallQuality) &&
    typeof result.intervalMultiplier === 'number' &&
    result.intervalMultiplier > 0 &&
    typeof result.schedulingReason === 'string' &&
    typeof result.confidence === 'number' &&
    result.confidence >= 0 &&
    result.confidence <= 100
  );
}
