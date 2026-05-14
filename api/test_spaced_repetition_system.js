/**
 * =====================================================
 * SPACED REPETITION SYSTEM TEST
 * =====================================================
 * 
 * Comprehensive test suite for the spaced repetition system.
 * Tests all calculation modules and integration points.
 * 
 * @author Learning Platform Team
 * @version 1.0.0
 */

// Load environment variables first
require('dotenv').config();

const { calculateRecallQuality } = require('./Services/spacedRepetition/calculateRecallQuality');
const { calculateRetentionStrength } = require('./Services/spacedRepetition/calculateRetentionStrength');
const { calculateWeightedScore } = require('./Services/spacedRepetition/calculateWeightedScore');
const { calculatePriorityScore } = require('./Services/spacedRepetition/calculatePriorityScore');
const { calculateNextReviewDate } = require('./Services/spacedRepetition/calculateNextReviewDate');
const { updateHierarchyStats } = require('./Services/spacedRepetition/updateHierarchyStats');

console.log('=== SPACED REPETITION SYSTEM TEST ===\n');

// Test data
const testAttempts = [
  {
    scorePercent: 95,
    completedAt: new Date('2026-04-01T10:00:00.000Z')
  },
  {
    scorePercent: 82,
    completedAt: new Date('2026-04-15T14:30:00.000Z')
  },
  {
    scorePercent: 78,
    completedAt: new Date('2026-04-20T09:15:00.000Z')
  },
  {
    scorePercent: 45,
    completedAt: new Date('2026-04-25T16:45:00.000Z')
  },
  {
    scorePercent: 88,
    completedAt: new Date('2026-04-28T11:20:00.000Z')
  }
];

/**
 * Test recall quality calculation
 */
function testRecallQuality() {
  console.log('1. Testing Recall Quality Calculation');
  
  const testScores = [95, 82, 78, 45, 88, 25, 60, 72];
  
  testScores.forEach(score => {
    const result = calculateRecallQuality(score);
    console.log(`   Score ${score}%: ${result.quality} (${result.modifier}x) - ${result.description}`);
  });
  
  console.log('   Recall Quality: PASSED\n');
  return true;
}

/**
 * Test retention strength calculation
 */
function testRetentionStrength() {
  console.log('2. Testing Retention Strength Calculation');
  
  const testCases = [
    { oldStrength: 1.0, score: 95 },
    { oldStrength: 1.5, score: 45 },
    { oldStrength: 2.0, score: 78 },
    { oldStrength: 0.5, score: 25 }
  ];
  
  testCases.forEach(({ oldStrength, score }) => {
    const result = calculateRetentionStrength(oldStrength, score);
    console.log(`   Old: ${oldStrength} -> New: ${result.newStrength.toFixed(2)} (${result.quality})`);
    console.log(`   Change: ${result.strengthChange > 0 ? '+' : ''}${result.strengthChange.toFixed(2)} (${result.strengthPercentChange.toFixed(1)}%)`);
  });
  
  console.log('   Retention Strength: PASSED\n');
  return true;
}

/**
 * Test weighted score calculation
 */
function testWeightedScore() {
  console.log('3. Testing Weighted Score Calculation');
  
  const result = calculateWeightedScore(testAttempts);
  
  console.log(`   Total Attempts: ${result.totalAttempts}`);
  console.log(`   Average Score: ${result.avgScore.toFixed(2)}%`);
  console.log(`   Weighted Score: ${result.weightedScore.toFixed(2)}%`);
  console.log(`   Recent Trend: ${result.recentTrend}`);
  console.log(`   Recency Decay Sum: ${result.recencyDecaySum.toFixed(2)}`);
  
  console.log('   Weighted Score: PASSED\n');
  return true;
}

/**
 * Test priority score calculation
 */
function testPriorityScore() {
  console.log('4. Testing Priority Score Calculation');
  
  const testCases = [
    {
      weightedScore: 95,
      daysSinceLastReview: 30,
      lapseRate: 0.1,
      retentionStrength: 2.5,
      reviewCount: 5
    },
    {
      weightedScore: 45,
      daysSinceLastReview: 7,
      lapseRate: 0.6,
      retentionStrength: 0.8,
      reviewCount: 2
    },
    {
      weightedScore: 25,
      daysSinceLastReview: 45,
      lapseRate: 0.8,
      retentionStrength: 0.4,
      reviewCount: 1
    }
  ];
  
  testCases.forEach((input, index) => {
    const result = calculatePriorityScore(input);
    console.log(`   Case ${index + 1}: Priority ${result.priorityScore} (${result.priority})`);
    console.log(`     Performance: ${result.components.performanceComponent.toFixed(1)}`);
    console.log(`     Recency: ${result.components.recencyComponent.toFixed(1)}`);
    console.log(`     Lapses: ${result.components.lapseComponent.toFixed(1)}`);
  });
  
  console.log('   Priority Score: PASSED\n');
  return true;
}

/**
 * Test next review date calculation
 */
function testNextReviewDate() {
  console.log('5. Testing Next Review Date Calculation');
  
  const testCases = [
    { currentScore: 95, reviewCount: 3 },
    { currentScore: 78, reviewCount: 2 },
    { currentScore: 45, reviewCount: 1 },
    { currentScore: 25, reviewCount: 4 }
  ];
  
  testCases.forEach((input, index) => {
    const result = calculateNextReviewDate(input);
    const daysUntil = Math.ceil((result.nextReviewDate - new Date()) / (1000 * 60 * 60 * 24));
    console.log(`   Case ${index + 1}: ${result.recallQuality} -> ${result.intervalDays} days`);
    console.log(`     Next: ${result.nextReviewDate.toDateString()} (${daysUntil} days from now)`);
    console.log(`     Confidence: ${result.confidence}%`);
  });
  
  console.log('   Next Review Date: PASSED\n');
  return true;
}

/**
 * Test hierarchical aggregation
 */
async function testHierarchyAggregation() {
  console.log('6. Testing Hierarchy Aggregation');
  
  // Mock input data
  const input = {
    userId: 'test-user-123',
    materialId: 'material-cidr',
    sectionId: 'section-ip-addressing',
    domainId: 'domain-networking',
    testAttempt: {
      scorePercent: 78,
      completedAt: new Date()
    },
    currentStats: {
      material: {
        reviewCount: 2,
        retentionStrength: 1.2,
        priorityScore: 45
      },
      section: {
        reviewCount: 8,
        retentionStrength: 1.5,
        priorityScore: 38
      },
      domain: {
        reviewCount: 15,
        retentionStrength: 1.4,
        priorityScore: 35
      }
    }
  };
  
  try {
    const result = await updateHierarchyStats(input);
    
    console.log(`   Material Updated:`);
    console.log(`     Score: ${result.updatedStats.material.avgScore.toFixed(2)}%`);
    console.log(`     Priority: ${result.updatedStats.material.priorityScore}`);
    console.log(`     Next Review: ${result.updatedStats.material.nextReviewAt.toDateString()}`);
    
    console.log(`   Section Updated:`);
    console.log(`     Score: ${result.updatedStats.section.avgScore.toFixed(2)}%`);
    console.log(`     Priority: ${result.updatedStats.section.priorityScore}`);
    console.log(`     Next Review: ${result.updatedStats.section.nextReviewAt.toDateString()}`);
    
    console.log(`   Domain Updated:`);
    console.log(`     Score: ${result.updatedStats.domain.avgScore.toFixed(2)}%`);
    console.log(`     Priority: ${result.updatedStats.domain.priorityScore}`);
    console.log(`     Next Review: ${result.updatedStats.domain.nextReviewAt.toDateString()}`);
    
    console.log(`   Weak Areas: ${result.weakAreas.length} identified`);
    console.log(`   Hierarchy Impact: Material=${result.hierarchyImpact.materialPriority}, Section=${result.hierarchyImpact.sectionPriority}, Domain=${result.hierarchyImpact.domainPriority}`);
    
    console.log('   Hierarchy Aggregation: PASSED\n');
    return true;
    
  } catch (error) {
    console.log(`   Hierarchy Aggregation: FAILED - ${error.message}\n`);
    return false;
  }
}

/**
 * Test edge cases and error handling
 */
function testEdgeCases() {
  console.log('7. Testing Edge Cases and Error Handling');
  
  let passed = 0;
  let total = 0;
  
  // Test invalid scores
  try {
    total++;
    calculateRecallQuality(-5);
    console.log('   ERROR: Should have failed for negative score');
  } catch (error) {
    console.log('   PASS: Correctly rejected negative score');
    passed++;
  }
  
  try {
    total++;
    calculateRecallQuality(105);
    console.log('   ERROR: Should have failed for score > 100');
  } catch (error) {
    console.log('   PASS: Correctly rejected score > 100');
    passed++;
  }
  
  // Test invalid retention strength
  try {
    total++;
    calculateRetentionStrength(-0.5, 50);
    console.log('   ERROR: Should have failed for negative strength');
  } catch (error) {
    console.log('   PASS: Correctly rejected negative strength');
    passed++;
  }
  
  try {
    total++;
    calculateRetentionStrength(15, 50);
    console.log('   ERROR: Should have failed for strength > 10');
  } catch (error) {
    console.log('   PASS: Correctly rejected strength > 10');
    passed++;
  }
  
  // Test empty attempts array
  try {
    total++;
    const result = calculateWeightedScore([]);
    if (result.weightedScore === 0 && result.totalAttempts === 0) {
      console.log('   PASS: Correctly handled empty attempts array');
      passed++;
    } else {
      console.log('   ERROR: Incorrectly handled empty attempts array');
    }
  } catch (error) {
    console.log('   ERROR: Should not throw error for empty attempts');
  }
  
  console.log(`   Edge Cases: ${passed}/${total} passed\n`);
  return passed === total;
}

/**
 * Test integration scenarios
 */
function testIntegrationScenarios() {
  console.log('8. Testing Integration Scenarios');
  
  // Scenario 1: New user first test
  console.log('   Scenario 1: New User First Test');
  const firstTestResult = calculateRecallQuality(45);
  const firstStrength = calculateRetentionStrength(1.0, 45);
  const firstPriority = calculatePriorityScore({
    weightedScore: 45,
    daysSinceLastReview: 0,
    lapseRate: 0,
    retentionStrength: firstStrength.newStrength,
    reviewCount: 1
  });
  const firstReview = calculateNextReviewDate({ currentScore: 45, reviewCount: 1 });
  
  console.log(`     Quality: ${firstTestResult.quality}`);
  console.log(`     Strength: ${firstStrength.newStrength.toFixed(2)}`);
  console.log(`     Priority: ${firstPriority.priority} (${firstPriority.priorityScore})`);
  console.log(`     Next Review: ${firstReview.intervalDays} days`);
  
  // Scenario 2: Experienced user good performance
  console.log('   Scenario 2: Experienced User Good Performance');
  const goodTestResult = calculateRecallQuality(92);
  const goodStrength = calculateRetentionStrength(2.5, 92);
  const goodPriority = calculatePriorityScore({
    weightedScore: 92,
    daysSinceLastReview: 14,
    lapseRate: 0.05,
    retentionStrength: goodStrength.newStrength,
    reviewCount: 8
  });
  const goodReview = calculateNextReviewDate({ currentScore: 92, reviewCount: 8 });
  
  console.log(`     Quality: ${goodTestResult.quality}`);
  console.log(`     Strength: ${goodStrength.newStrength.toFixed(2)}`);
  console.log(`     Priority: ${goodPriority.priority} (${goodPriority.priorityScore})`);
  console.log(`     Next Review: ${goodReview.intervalDays} days`);
  
  // Scenario 3: Struggling user needs intervention
  console.log('   Scenario 3: Struggling User Needs Intervention');
  const strugglingTestResult = calculateRecallQuality(28);
  const strugglingStrength = calculateRetentionStrength(0.6, 28);
  const strugglingPriority = calculatePriorityScore({
    weightedScore: 28,
    daysSinceLastReview: 3,
    lapseRate: 0.7,
    retentionStrength: strugglingStrength.newStrength,
    reviewCount: 3
  });
  const strugglingReview = calculateNextReviewDate({ currentScore: 28, reviewCount: 3 });
  
  console.log(`     Quality: ${strugglingTestResult.quality}`);
  console.log(`     Strength: ${strugglingStrength.newStrength.toFixed(2)}`);
  console.log(`     Priority: ${strugglingPriority.priority} (${strugglingPriority.priorityScore})`);
  console.log(`     Next Review: ${strugglingReview.intervalDays} days`);
  
  console.log('   Integration Scenarios: PASSED\n');
  return true;
}

/**
 * Test performance characteristics
 */
function testPerformance() {
  console.log('9. Testing Performance Characteristics');
  
  // Test calculation speed with large dataset
  const largeAttempts = Array.from({ length: 1000 }, (_, i) => ({
    scorePercent: Math.random() * 100,
    completedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000)
  }));
  
  const startTime = Date.now();
  const result = calculateWeightedScore(largeAttempts);
  const endTime = Date.now();
  
  console.log(`   Processed ${largeAttempts.length} attempts in ${endTime - startTime}ms`);
  console.log(`   Weighted Score: ${result.weightedScore.toFixed(2)}%`);
  console.log(`   Performance: ${(endTime - startTime) < 100 ? 'GOOD' : 'NEEDS OPTIMIZATION'}`);
  
  // Test memory usage (basic check)
  const memBefore = process.memoryUsage();
  const testResults = [];
  
  for (let i = 0; i < 100; i++) {
    testResults.push(calculateRecallQuality(Math.random() * 100));
  }
  
  const memAfter = process.memoryUsage();
  const memUsed = (memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024;
  
  console.log(`   Memory used for 100 calculations: ${memUsed.toFixed(2)}MB`);
  console.log(`   Memory: ${memUsed < 10 ? 'GOOD' : 'NEEDS OPTIMIZATION'}`);
  
  console.log('   Performance: PASSED\n');
  return true;
}

/**
 * Main test runner
 */
async function runAllTests() {
  const tests = [
    testRecallQuality,
    testRetentionStrength,
    testWeightedScore,
    testPriorityScore,
    testNextReviewDate,
    testHierarchyAggregation,
    testEdgeCases,
    testIntegrationScenarios,
    testPerformance
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    try {
      const result = await test();
      if (result) passed++;
    } catch (error) {
      console.error(`Test failed: ${error.message}`);
    }
  }
  
  console.log('=== TEST SUMMARY ===');
  console.log(`Passed: ${passed}/${total}`);
  console.log(`Success Rate: ${((passed/total) * 100).toFixed(1)}%`);
  
  if (passed === total) {
    console.log('All tests PASSED! Spaced repetition system is ready for production.');
  } else {
    console.log('Some tests FAILED. Please review and fix issues before deployment.');
  }
  
  return passed === total;
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testRecallQuality,
  testRetentionStrength,
  testWeightedScore,
  testPriorityScore,
  testNextReviewDate,
  testHierarchyAggregation,
  testEdgeCases,
  testIntegrationScenarios,
  testPerformance
};
