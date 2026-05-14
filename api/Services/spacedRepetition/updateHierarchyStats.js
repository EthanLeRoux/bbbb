/**
 * =====================================================
 * SPACED REPETITION: HIERARCHICAL STATS UPDATE
 * =====================================================
 * 
 * Updates hierarchical statistics when a material test is submitted.
 * Bubbles changes upward: Material -> Section -> Domain
 * 
 * @author Learning Platform Team
 * @version 1.0.0
 */

const { calculateWeightedScore } = require('./calculateWeightedScore');
const { calculateRecallQuality } = require('./calculateRecallQuality');
const { calculateRetentionStrength } = require('./calculateRetentionStrength');
const { calculatePriorityScore } = require('./calculatePriorityScore');
const { calculateNextReviewDate } = require('./calculateNextReviewDate');

/**
 * Update hierarchical statistics after test submission
 * 
 * @param {Object} input - Hierarchy update parameters
 * @returns {Object} Updated statistics for all hierarchy levels
 */
async function updateHierarchyStats(input) {
  // 1. Update material stats (directly from test attempt)
  const materialStats = updateMaterialStats(input);
  
  // 2. Update section stats (aggregated from materials)
  const sectionStats = await updateSectionStats(input, materialStats);
  
  // 3. Update domain stats (aggregated from sections)
  const domainStats = await updateDomainStats(input, sectionStats);
  
  // 4. Calculate weak areas and recommendations
  const weakAreas = identifyWeakAreas(materialStats, sectionStats, domainStats);
  const nextReviewRecommendations = calculateReviewRecommendations(materialStats, sectionStats, domainStats);
  
  // 5. Calculate hierarchy impact
  const hierarchyImpact = calculateHierarchyImpact(materialStats, sectionStats, domainStats);

  return {
    updatedStats: {
      material: materialStats,
      section: sectionStats,
      domain: domainStats
    },
    weakAreas,
    nextReviewRecommendations,
    hierarchyImpact
  };
}

/**
 * Update material-level statistics
 */
function updateMaterialStats(input) {
  const current = input.currentStats?.material;
  const test = input.testAttempt;
  
  // Calculate recall quality and retention strength
  const recallQuality = calculateRecallQuality(test.scorePercent);
  const retentionResult = calculateRetentionStrength(
    current?.retentionStrength || 1.0,
    test.scorePercent
  );
  
  // Calculate weighted score including this attempt
  const allAttempts = current ? [test, ...getHistoricalAttempts(current.userId, 'material', input.materialId)] : [test];
  const weightedResult = calculateWeightedScore(allAttempts);
  
  // Update streak and lapse count
  const newStreak = recallQuality.quality !== 'fail' && recallQuality.quality !== 'again' 
    ? (current?.streak || 0) + 1 
    : 0;
  
  const newLapseCount = (recallQuality.quality === 'fail' || recallQuality.quality === 'again')
    ? (current?.lapseCount || 0) + 1
    : (current?.lapseCount || 0);
  
  // Calculate priority score
  const daysSinceLastReview = current?.lastReviewedAt 
    ? calculateDaysSince(current.lastReviewedAt, test.completedAt)
    : 0;
  
  const priorityResult = calculatePriorityScore({
    weightedScore: weightedResult.weightedScore,
    daysSinceLastReview,
    lapseRate: newLapseCount / ((current?.reviewCount || 0) + 1),
    retentionStrength: retentionResult.newStrength,
    reviewCount: (current?.reviewCount || 0) + 1
  });
  
  // Calculate next review date
  const nextReviewResult = calculateNextReviewDate({
    currentScore: test.scorePercent,
    recallQuality: recallQuality.quality,
    currentInterval: current && current.lastReviewedAt ? calculateDaysSince(current.lastReviewedAt, test.completedAt) : undefined,
    retentionStrength: retentionResult.newStrength,
    reviewCount: (current?.reviewCount || 0) + 1,
    lastReviewDate: test.completedAt
  });

  return {
    entityType: 'material',
    entityId: input.materialId,
    avgScore: weightedResult.avgScore,
    weightedScore: weightedResult.weightedScore,
    reviewCount: (current?.reviewCount || 0) + 1,
    streak: newStreak,
    lapseCount: newLapseCount,
    retentionStrength: retentionResult.newStrength,
    priorityScore: priorityResult.priorityScore,
    lastReviewedAt: test.completedAt,
    nextReviewAt: nextReviewResult.nextReviewDate,
    childIds: [], // Materials have no children
    parentId: input.sectionId
  };
}

/**
 * Update section-level statistics (aggregated from materials)
 */
async function updateSectionStats(input, materialStats) {
  const current = input.currentStats?.section;
  
  // Get all material stats for this section
  const childMaterialStats = await getChildEntityStats(input.userId, 'material', input.sectionId);
  
  // Add the updated material stats
  const allMaterialStats = [...childMaterialStats.filter(m => m.entityId !== input.materialId), materialStats];
  
  // Aggregate statistics from materials
  const aggregatedStats = aggregateChildStats(allMaterialStats, 'section');
  
  // Calculate section priority (influenced by weakest child)
  const weakestChild = allMaterialStats.reduce((weakest, current) => 
    current.priorityScore > weakest.priorityScore ? current : weakest
  );
  
  // Boost section priority if any child is weak
  const priorityBoost = weakestChild.priorityScore > 60 ? 15 : 0;
  const sectionPriority = Math.min(100, aggregatedStats.priorityScore + priorityBoost);
  
  // Calculate next review date (earliest of children, but not too soon)
  const materialsWithReviews = allMaterialStats.filter(m => m.nextReviewAt);
  const earliestChildReview = materialsWithReviews.length > 0
    ? materialsWithReviews.reduce((earliest, current) => 
        (current.nextReviewAt < earliest.nextReviewAt) ? current : earliest
      )
    : null;
  
  const nextReviewDate = earliestChildReview && earliestChildReview.nextReviewAt
    ? new Date(earliestChildReview.nextReviewAt.getTime() + 24 * 60 * 60 * 1000) // +1 day from earliest child
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 1 week

  return {
    entityType: 'section',
    entityId: input.sectionId,
    avgScore: aggregatedStats.avgScore,
    weightedScore: aggregatedStats.weightedScore,
    reviewCount: aggregatedStats.reviewCount,
    streak: aggregatedStats.streak,
    lapseCount: aggregatedStats.lapseCount,
    retentionStrength: aggregatedStats.retentionStrength,
    priorityScore: sectionPriority,
    lastReviewedAt: materialStats.lastReviewedAt,
    nextReviewAt: nextReviewDate,
    childIds: allMaterialStats.map(m => m.entityId),
    parentId: input.domainId
  };
}

/**
 * Update domain-level statistics (aggregated from sections)
 */
async function updateDomainStats(input, sectionStats) {
  const current = input.currentStats?.domain;
  
  // Get all section stats for this domain
  const childSectionStats = await getChildEntityStats(input.userId, 'section', input.domainId);
  
  // Add the updated section stats
  const allSectionStats = [...childSectionStats.filter(s => s.entityId !== input.sectionId), sectionStats];
  
  // Aggregate statistics from sections
  const aggregatedStats = aggregateChildStats(allSectionStats, 'domain');
  
  // Calculate domain priority (influenced by weakest section)
  const weakestSection = allSectionStats.reduce((weakest, current) => 
    current.priorityScore > weakest.priorityScore ? current : weakest
  );
  
  // Boost domain priority if any section is weak
  const priorityBoost = weakestSection.priorityScore > 70 ? 20 : 0;
  const domainPriority = Math.min(100, aggregatedStats.priorityScore + priorityBoost);
  
  // Calculate next review date (based on section needs)
  const sectionsWithReviews = allSectionStats.filter(s => s.nextReviewAt);
  const earliestSectionReview = sectionsWithReviews.length > 0
    ? sectionsWithReviews.reduce((earliest, current) => 
        (current.nextReviewAt < earliest.nextReviewAt) ? current : earliest
      )
    : null;
  
  const nextReviewDate = earliestSectionReview && earliestSectionReview.nextReviewAt
    ? new Date(earliestSectionReview.nextReviewAt.getTime() + 2 * 24 * 60 * 60 * 1000) // +2 days from earliest section
    : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // Default 2 weeks

  return {
    entityType: 'domain',
    entityId: input.domainId,
    avgScore: aggregatedStats.avgScore,
    weightedScore: aggregatedStats.weightedScore,
    reviewCount: aggregatedStats.reviewCount,
    streak: aggregatedStats.streak,
    lapseCount: aggregatedStats.lapseCount,
    retentionStrength: aggregatedStats.retentionStrength,
    priorityScore: domainPriority,
    lastReviewedAt: sectionStats.lastReviewedAt,
    nextReviewAt: nextReviewDate,
    childIds: allSectionStats.map(s => s.entityId)
    // parentId omitted for domains (no parent)
  };
}

/**
 * Aggregate statistics from child entities
 */
function aggregateChildStats(childStats, parentType) {
  if (childStats.length === 0) {
    return {
      avgScore: 0,
      weightedScore: 0,
      reviewCount: 0,
      streak: 0,
      lapseCount: 0,
      retentionStrength: 1.0,
      priorityScore: 0
    };
  }

  // Weighted averages based on review count
  const totalReviews = childStats.reduce((sum, stat) => sum + stat.reviewCount, 0);
  
  const avgScore = childStats.reduce((sum, stat) => sum + stat.avgScore * stat.reviewCount, 0) / totalReviews;
  const weightedScore = childStats.reduce((sum, stat) => sum + stat.weightedScore * stat.reviewCount, 0) / totalReviews;
  const retentionStrength = childStats.reduce((sum, stat) => sum + stat.retentionStrength * stat.reviewCount, 0) / totalReviews;
  
  // Take minimum for streak (weakest link)
  const streak = Math.min(...childStats.map(s => s.streak));
  
  // Sum for counts
  const reviewCount = childStats.reduce((sum, stat) => sum + stat.reviewCount, 0);
  const lapseCount = childStats.reduce((sum, stat) => sum + stat.lapseCount, 0);
  
  // Priority is influenced by worst child
  const priorityScore = Math.max(...childStats.map(s => s.priorityScore));

  return {
    avgScore: Math.round(avgScore * 100) / 100,
    weightedScore: Math.round(weightedScore * 100) / 100,
    reviewCount,
    streak,
    lapseCount,
    retentionStrength: Math.round(retentionStrength * 1000) / 1000,
    priorityScore: Math.round(priorityScore * 100) / 100
  };
}

/**
 * Identify weak areas in the hierarchy
 */
function identifyWeakAreas(materialStats, sectionStats, domainStats) {
  const weakAreas = [];
  
  // Material-level weaknesses
  if (materialStats.weightedScore < 60) {
    weakAreas.push(`Material: ${materialStats.entityId} (Score: ${materialStats.weightedScore}%)`);
  }
  
  if (materialStats.lapseCount > 3) {
    weakAreas.push(`Material: ${materialStats.entityId} (High failure rate: ${materialStats.lapseCount} lapses)`);
  }
  
  // Section-level weaknesses
  if (sectionStats.priorityScore > 70) {
    weakAreas.push(`Section: ${sectionStats.entityId} (High priority for review)`);
  }
  
  // Domain-level weaknesses
  if (domainStats.priorityScore > 80) {
    weakAreas.push(`Domain: ${domainStats.entityId} (Critical review needed)`);
  }
  
  return weakAreas;
}

/**
 * Calculate review recommendations for all hierarchy levels
 */
function calculateReviewRecommendations(materialStats, sectionStats, domainStats) {
  return {
    material: materialStats.nextReviewAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    section: sectionStats.nextReviewAt || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    domain: domainStats.nextReviewAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  };
}

/**
 * Calculate hierarchy impact scores
 */
function calculateHierarchyImpact(materialStats, sectionStats, domainStats) {
  return {
    materialPriority: materialStats.priorityScore,
    sectionPriority: sectionStats.priorityScore,
    domainPriority: domainStats.priorityScore
  };
}

// Helper functions (would be implemented with actual database calls)

async function getChildEntityStats(userId, childType, parentId) {
  // This would query Firestore for child entity stats
  // Implementation depends on your data structure
  return [];
}

function getHistoricalAttempts(userId, entityType, entityId) {
  // This would query Firestore for historical test attempts
  // Implementation depends on your data structure
  return [];
}

function calculateDaysSince(date1, date2) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.abs(date2.getTime() - date1.getTime()) / msPerDay;
}

module.exports = {
  updateHierarchyStats,
  updateMaterialStats,
  updateSectionStats,
  updateDomainStats,
  aggregateChildStats,
  identifyWeakAreas,
  calculateReviewRecommendations,
  calculateHierarchyImpact,
  getChildEntityStats,
  getHistoricalAttempts,
  calculateDaysSince
};
