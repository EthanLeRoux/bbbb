/**
 * =====================================================
 * SPACED REPETITION: WEIGHTED SCORE CALCULATION
 * =====================================================
 * 
 * Calculates weighted scores using recency decay.
 * Recent performance has more weight than older performance.
 * 
 * @author Learning Platform Team
 * @version 1.0.0
 */

export interface TestAttempt {
  scorePercent: number;
  completedAt: Date;
}

export interface WeightedScoreResult {
  weightedScore: number;
  avgScore: number;
  totalAttempts: number;
  recencyDecaySum: number;
  recentTrend: 'improving' | 'declining' | 'stable';
}

/**
 * Calculate weighted score using recency decay
 * 
 * @param attempts - Array of test attempts with scores and completion dates
 * @param referenceDate - Reference date for decay calculation (default: now)
 * @returns WeightedScoreResult with weighted score and trend analysis
 * 
 * Decay Formula:
 * decay = e^(-daysAgo / 30)
 * weightedScore = sum(score * decay) / sum(decay)
 * 
 * - Recent attempts (last 30 days) have high weight
 * - Attempts 30+ days ago have exponentially less weight
 * - Attempts 90+ days ago have minimal weight
 */
export function calculateWeightedScore(
  attempts: TestAttempt[], 
  referenceDate: Date = new Date()
): WeightedScoreResult {
  // Input validation
  if (!Array.isArray(attempts)) {
    throw new Error('Attempts must be an array');
  }

  if (attempts.length === 0) {
    return {
      weightedScore: 0,
      avgScore: 0,
      totalAttempts: 0,
      recencyDecaySum: 0,
      recentTrend: 'stable'
    };
  }

  // Validate each attempt
  attempts.forEach((attempt, index) => {
    if (typeof attempt.scorePercent !== 'number' || attempt.scorePercent < 0 || attempt.scorePercent > 100) {
      throw new Error(`Invalid score at index ${index}: ${attempt.scorePercent}. Must be 0-100.`);
    }
    if (!(attempt.completedAt instanceof Date)) {
      throw new Error(`Invalid completedAt at index ${index}. Must be Date object.`);
    }
  });

  // Calculate weighted score with recency decay
  let weightedSum = 0;
  let decaySum = 0;
  let regularSum = 0;

  attempts.forEach(attempt => {
    const daysAgo = calculateDaysAgo(attempt.completedAt, referenceDate);
    const decay = calculateRecencyDecay(daysAgo);
    
    weightedSum += attempt.scorePercent * decay;
    decaySum += decay;
    regularSum += attempt.scorePercent;
  });

  const weightedScore = decaySum > 0 ? weightedSum / decaySum : 0;
  const avgScore = regularSum / attempts.length;

  // Analyze recent trend (last 5 attempts or last 30 days)
  const recentTrend = analyzeRecentTrend(attempts, referenceDate);

  return {
    weightedScore: Math.round(weightedScore * 100) / 100, // Round to 2 decimal places
    avgScore: Math.round(avgScore * 100) / 100,
    totalAttempts: attempts.length,
    recencyDecaySum: Math.round(decaySum * 100) / 100,
    recentTrend
  };
}

/**
 * Calculate recency decay factor based on days ago
 * 
 * @param daysAgo - Number of days since the attempt
 * @returns Decay factor (0-1, where 1 is most recent)
 */
export function calculateRecencyDecay(daysAgo: number): number {
  // Clamp negative days (future dates) to 0
  const clampedDays = Math.max(0, daysAgo);
  
  // Decay formula: e^(-days/30)
  // - 0 days ago: 1.0 (full weight)
  // - 30 days ago: ~0.37 (37% weight)
  // - 60 days ago: ~0.14 (14% weight)
  // - 90 days ago: ~0.05 (5% weight)
  const decayRate = 1 / 30;
  return Math.exp(-clampedDays * decayRate);
}

/**
 * Calculate days between two dates
 */
export function calculateDaysAgo(date: Date, referenceDate: Date = new Date()): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return (referenceDate.getTime() - date.getTime()) / msPerDay;
}

/**
 * Analyze recent performance trend
 * 
 * @param attempts - All attempts
 * @param referenceDate - Reference date
 * @returns Trend direction
 */
export function analyzeRecentTrend(attempts: TestAttempt[], referenceDate: Date = new Date()): 'improving' | 'declining' | 'stable' {
  if (attempts.length < 3) {
    return 'stable';
  }

  // Get recent attempts (last 5 or last 30 days)
  const thirtyDaysAgo = new Date(referenceDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentAttempts = attempts
    .filter(a => a.completedAt >= thirtyDaysAgo)
    .slice(-5);

  if (recentAttempts.length < 3) {
    return 'stable';
  }

  // Calculate trend using linear regression on recent scores
  const trend = calculateLinearTrend(recentAttempts.map((a, i) => ({
    x: i,
    y: a.scorePercent
  })));

  // Determine trend direction
  if (trend > 2) {
    return 'improving';
  } else if (trend < -2) {
    return 'declining';
  } else {
    return 'stable';
  }
}

/**
 * Calculate linear trend slope
 */
export function calculateLinearTrend(points: { x: number; y: number }[]): number {
  if (points.length < 2) return 0;

  const n = points.length;
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return slope;
}

/**
 * Get recency weight for UI display
 */
export function getRecencyWeight(daysAgo: number): { weight: number; label: string; color: string } {
  const weight = calculateRecencyDecay(daysAgo);
  
  if (daysAgo <= 7) {
    return { weight, label: 'This Week', color: '#10b981' };
  } else if (daysAgo <= 30) {
    return { weight, label: 'This Month', color: '#3b82f6' };
  } else if (daysAgo <= 90) {
    return { weight, label: 'Last Quarter', color: '#f59e0b' };
  } else {
    return { weight, label: 'Old', color: '#6b7280' };
  }
}

/**
 * Calculate confidence score for weighted score
 */
export function calculateWeightedScoreConfidence(attempts: TestAttempt[]): number {
  if (attempts.length === 0) return 0;
  
  // More recent attempts = higher confidence
  const recentAttempts = attempts.filter(a => calculateDaysAgo(a.completedAt) <= 30);
  
  let confidence = 0;
  
  // Base confidence from total attempts
  confidence += Math.min(attempts.length * 10, 50); // Max 50 points from quantity
  
  // Additional confidence from recent attempts
  confidence += Math.min(recentAttempts.length * 15, 50); // Max 50 points from recency
  
  return Math.min(confidence, 100);
}

/**
 * Validate weighted score result
 */
export function validateWeightedScoreResult(result: WeightedScoreResult): boolean {
  return (
    typeof result.weightedScore === 'number' &&
    result.weightedScore >= 0 &&
    result.weightedScore <= 100 &&
    typeof result.avgScore === 'number' &&
    result.avgScore >= 0 &&
    result.avgScore <= 100 &&
    typeof result.totalAttempts === 'number' &&
    result.totalAttempts >= 0 &&
    typeof result.recencyDecaySum === 'number' &&
    result.recencyDecaySum >= 0 &&
    ['improving', 'declining', 'stable'].includes(result.recentTrend)
  );
}
