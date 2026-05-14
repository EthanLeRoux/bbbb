/**
 * =====================================================
 * SPACED REPETITION: PRIORITY SCORE CALCULATION
 * =====================================================
 * 
 * Calculates priority scores to determine which topics need review most.
 * Higher priority = needs review sooner.
 * 
 * @author Learning Platform Team
 * @version 1.0.0
 */

export interface PriorityScoreInput {
  weightedScore: number; // 0-100, with recency decay
  daysSinceLastReview: number;
  lapseRate: number; // 0-1, ratio of failures to total attempts
  retentionStrength: number; // 0.1-10.0, memory strength
  reviewCount: number; // total number of reviews
}

export interface PriorityScoreResult {
  priorityScore: number; // 0-100, higher = more urgent
  components: {
    performanceComponent: number; // 0-50, based on weighted score
    recencyComponent: number; // 0-30, based on days since review
    lapseComponent: number; // 0-20, based on failure rate
  };
  priority: 'critical' | 'high' | 'medium' | 'low';
  urgency: number; // 0-100, urgency level
}

/**
 * Calculate priority score for review scheduling
 * 
 * @param input - Priority calculation inputs
 * @returns PriorityScoreResult with detailed breakdown
 * 
 * Priority Formula:
 * priority = (1 - normalizedWeightedScore) * 50
 *          + normalizedDaysSinceLastReview * 30  
 *          + lapseRate * 20
 * 
 * Components:
 * - Performance (50%): Lower scores = higher priority
 * - Recency (30%): Longer since review = higher priority
 * - Lapses (20%): More failures = higher priority
 */
export function calculatePriorityScore(input: PriorityScoreInput): PriorityScoreResult {
  // Input validation
  validatePriorityInput(input);

  // Calculate individual components
  
  // 1. Performance Component (0-50 points)
  // Lower weighted score = higher priority
  const performanceComponent = (1 - input.weightedScore / 100) * 50;
  
  // 2. Recency Component (0-30 points)
  // More days since review = higher priority
  const recencyComponent = calculateRecencyComponent(input.daysSinceLastReview);
  
  // 3. Lapse Component (0-20 points)
  // Higher lapse rate = higher priority
  const lapseComponent = input.lapseRate * 20;
  
  // Calculate total priority score
  const priorityScore = Math.min(100, performanceComponent + recencyComponent + lapseComponent);
  
  // Determine priority level
  const priority = getPriorityLevel(priorityScore);
  
  // Calculate urgency (similar to priority but with different weighting)
  const urgency = calculateUrgency(input);

  return {
    priorityScore: Math.round(priorityScore * 100) / 100,
    components: {
      performanceComponent: Math.round(performanceComponent * 100) / 100,
      recencyComponent: Math.round(recencyComponent * 100) / 100,
      lapseComponent: Math.round(lapseComponent * 100) / 100
    },
    priority,
    urgency: Math.round(urgency * 100) / 100
  };
}

/**
 * Calculate recency component based on days since last review
 */
export function calculateRecencyComponent(daysSinceLastReview: number): number {
  // Normalize days to 0-1 scale (0 days = 0, 90+ days = 1)
  const maxDays = 90;
  const normalizedDays = Math.min(daysSinceLastReview / maxDays, 1);
  
  // Apply to 30-point scale
  return normalizedDays * 30;
}

/**
 * Get priority level based on score
 */
export function getPriorityLevel(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= 75) {
    return 'critical';
  } else if (score >= 50) {
    return 'high';
  } else if (score >= 25) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Calculate urgency with different weighting for immediate attention
 */
export function calculateUrgency(input: PriorityScoreInput): number {
  // Urgency weights more heavily on recent performance and lapses
  const performanceUrgency = (1 - input.weightedScore / 100) * 40;
  const recencyUrgency = calculateRecencyComponent(input.daysSinceLastReview) * 0.8; // Slightly less weight
  const lapseUrgency = input.lapseRate * 30; // More weight on lapses for urgency
  
  return Math.min(100, performanceUrgency + recencyUrgency + lapseUrgency);
}

/**
 * Calculate lapse rate from attempts
 */
export function calculateLapseRate(attempts: { scorePercent: number }[]): number {
  if (attempts.length === 0) return 0;
  
  const failures = attempts.filter(a => a.scorePercent < 40).length;
  return failures / attempts.length;
}

/**
 * Get priority recommendations
 */
export function getPriorityRecommendations(priorityScore: PriorityScoreResult): string[] {
  const recommendations: string[] = [];
  
  if (priorityScore.priority === 'critical') {
    recommendations.push('Review immediately - performance is poor and/or haven\'t reviewed recently');
    recommendations.push('Consider foundational review before advanced topics');
  } else if (priorityScore.priority === 'high') {
    recommendations.push('Review within 1-2 days');
    recommendations.push('Focus on weak areas identified in recent attempts');
  } else if (priorityScore.priority === 'medium') {
    recommendations.push('Review within 3-7 days');
    recommendations.push('Maintain regular review schedule');
  } else {
    recommendations.push('Review within 1-2 weeks');
    recommendations.push('Continue with current study plan');
  }
  
  // Add specific recommendations based on components
  if (priorityScore.components.performanceComponent > 30) {
    recommendations.push('Focus on improving performance - review fundamentals');
  }
  
  if (priorityScore.components.recencyComponent > 20) {
    recommendations.push('Haven\'t reviewed recently - schedule review soon');
  }
  
  if (priorityScore.components.lapseComponent > 10) {
    recommendations.push('High failure rate - consider alternative study methods');
  }
  
  return recommendations;
}

/**
 * Get priority color for UI
 */
export function getPriorityColor(priority: 'critical' | 'high' | 'medium' | 'low'): string {
  const colors = {
    critical: '#ef4444', // red
    high: '#f97316',     // orange
    medium: '#f59e0b',   // amber
    low: '#10b981'       // green
  };
  
  return colors[priority];
}

/**
 * Get priority icon for UI
 */
export function getPriorityIcon(priority: 'critical' | 'high' | 'medium' | 'low'): string {
  const icons = {
    critical: 'exclamation-triangle',
    high: 'alert',
    medium: 'clock',
    low: 'check-circle'
  };
  
  return icons[priority];
}

/**
 * Sort entities by priority
 */
export function sortByPriority(entities: { priorityScore: number }[]): void {
  entities.sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Filter entities by priority level
 */
export function filterByPriority(
  entities: PriorityScoreResult[], 
  minPriority: 'critical' | 'high' | 'medium' | 'low'
): PriorityScoreResult[] {
  const priorityLevels = ['critical', 'high', 'medium', 'low'];
  const minIndex = priorityLevels.indexOf(minPriority);
  
  return entities.filter(entity => {
    const entityIndex = priorityLevels.indexOf(entity.priority);
    return entityIndex <= minIndex;
  });
}

/**
 * Validate priority input
 */
export function validatePriorityInput(input: PriorityScoreInput): void {
  if (typeof input.weightedScore !== 'number' || input.weightedScore < 0 || input.weightedScore > 100) {
    throw new Error(`Invalid weightedScore: ${input.weightedScore}. Must be 0-100.`);
  }
  
  if (typeof input.daysSinceLastReview !== 'number' || input.daysSinceLastReview < 0) {
    throw new Error(`Invalid daysSinceLastReview: ${input.daysSinceLastReview}. Must be >= 0.`);
  }
  
  if (typeof input.lapseRate !== 'number' || input.lapseRate < 0 || input.lapseRate > 1) {
    throw new Error(`Invalid lapseRate: ${input.lapseRate}. Must be 0-1.`);
  }
  
  if (typeof input.retentionStrength !== 'number' || input.retentionStrength < 0.1 || input.retentionStrength > 10.0) {
    throw new Error(`Invalid retentionStrength: ${input.retentionStrength}. Must be 0.1-10.0.`);
  }
  
  if (typeof input.reviewCount !== 'number' || input.reviewCount < 0) {
    throw new Error(`Invalid reviewCount: ${input.reviewCount}. Must be >= 0.`);
  }
}

/**
 * Validate priority score result
 */
export function validatePriorityScoreResult(result: PriorityScoreResult): boolean {
  return (
    typeof result.priorityScore === 'number' &&
    result.priorityScore >= 0 &&
    result.priorityScore <= 100 &&
    typeof result.components.performanceComponent === 'number' &&
    result.components.performanceComponent >= 0 &&
    result.components.performanceComponent <= 50 &&
    typeof result.components.recencyComponent === 'number' &&
    result.components.recencyComponent >= 0 &&
    result.components.recencyComponent <= 30 &&
    typeof result.components.lapseComponent === 'number' &&
    result.components.lapseComponent >= 0 &&
    result.components.lapseComponent <= 20 &&
    ['critical', 'high', 'medium', 'low'].includes(result.priority) &&
    typeof result.urgency === 'number' &&
    result.urgency >= 0 &&
    result.urgency <= 100
  );
}
