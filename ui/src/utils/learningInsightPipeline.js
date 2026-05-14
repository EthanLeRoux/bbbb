const DECAY_HALF_LIFE_DAYS = 21;
const MS_PER_DAY = 86400000;

export const RECOMMENDATION_WEIGHTS = {
  accuracy: 0.25,
  decay: 0.18,
  confidence: 0.12,
  streakGap: 0.15,
  mistakeFrequency: 0.18,
  improvementVelocity: 0.12,
};

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function average(values) {
  const nums = values.filter((v) => Number.isFinite(v));
  return nums.length ? nums.reduce((sum, value) => sum + value, 0) / nums.length : 0;
}

function dateOf(value) {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  if (typeof value === 'object' && Number.isFinite(value.seconds)) {
    return new Date(value.seconds * 1000);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetween(a, b) {
  const first = dateOf(a);
  const second = dateOf(b);
  if (!first || !second) return 0;
  return Math.abs(second.getTime() - first.getTime()) / MS_PER_DAY;
}

function daysSince(value, now = Date.now()) {
  const date = dateOf(value);
  return date ? Math.max(0, (now - date.getTime()) / MS_PER_DAY) : 999;
}

function retentionAfterDays(days) {
  return Math.exp((-Math.log(2) * days) / DECAY_HALF_LIFE_DAYS) * 100;
}

function normalizeConfidence(value) {
  if (typeof value === 'number') {
    return value <= 1 ? value * 100 : clamp(value, 0, 100);
  }

  if (typeof value !== 'string') return null;
  const normalized = value.toLowerCase();
  if (normalized === 'high') return 90;
  if (normalized === 'medium') return 65;
  if (normalized === 'low') return 35;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? normalizeConfidence(parsed) : null;
}

function slope(values) {
  if (values.length < 3) return 0;
  const avgY = average(values);
  const avgX = (values.length - 1) / 2;
  const numerator = values.reduce((sum, value, index) => sum + (index - avgX) * (value - avgY), 0);
  const denominator = values.reduce((sum, _, index) => sum + (index - avgX) ** 2, 0);
  return denominator ? numerator / denominator : 0;
}

function getStudyWindow(dateValue) {
  const date = dateOf(dateValue);
  if (!date) return null;
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'late-night';
}

function topicLabel(topic) {
  return topic || 'Untitled topic';
}

function scoreFactor(value, invert = false) {
  const normalized = clamp(value / 100, 0, 1);
  return invert ? 1 - normalized : normalized;
}

export function scoreTopicRecommendations(questions = []) {
  const byTopic = new Map();
  const now = Date.now();

  questions.forEach((question) => {
    const topic = topicLabel(question.topic);
    const entry = byTopic.get(topic) || [];
    entry.push(question);
    byTopic.set(topic, entry);
  });

  return Array.from(byTopic.entries())
    .map(([topic, topicQuestions]) => {
      const sorted = [...topicQuestions].sort((a, b) => (dateOf(a.date)?.getTime() || 0) - (dateOf(b.date)?.getTime() || 0));
      const scores = sorted.map((q) => q.score).filter(Number.isFinite);
      if (!scores.length) return null;

      const confidenceValues = sorted.map((q) => normalizeConfidence(q.confidence)).filter(Number.isFinite);
      const avgScore = average(scores);
      const last = sorted[sorted.length - 1];
      const lastScore = last?.score ?? avgScore;
      const inactiveDays = daysSince(last?.date, now);
      const estimatedRetention = retentionAfterDays(inactiveDays) * (lastScore / 100);

      const gaps = sorted.slice(1).map((q, index) => daysBetween(sorted[index].date, q.date));
      const maxGap = gaps.length ? Math.max(...gaps) : inactiveDays;
      const mistakeCount = scores.filter((score) => score < 60).length;
      const mistakeFrequency = mistakeCount / scores.length;
      const velocity = slope(scores);
      const avgConfidence = confidenceValues.length ? average(confidenceValues) : null;

      const factors = {
        accuracy: scoreFactor(avgScore, true),
        decay: clamp((100 - estimatedRetention) / 100, 0, 1),
        confidence: avgConfidence == null ? 0.35 : scoreFactor(avgConfidence, true),
        streakGap: clamp(Math.max(maxGap, inactiveDays) / 30, 0, 1),
        mistakeFrequency,
        improvementVelocity: clamp((2 - velocity) / 4, 0, 1),
      };

      const score = Object.entries(RECOMMENDATION_WEIGHTS).reduce(
        (sum, [key, weight]) => sum + weight * factors[key],
        0
      ) * 100;

      return {
        topic,
        score: clamp(score, 0, 100),
        factors,
        avgScore,
        avgConfidence,
        estimatedRetention: clamp(estimatedRetention, 0, 100),
        daysSince: inactiveDays,
        maxGap,
        mistakeCount,
        mistakeFrequency,
        improvementVelocity: velocity,
        questionCount: topicQuestions.length,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);
}

function buildTopicCards(recommendations) {
  const byScoreAsc = [...recommendations].sort((a, b) => a.avgScore - b.avgScore);
  const byVelocityDesc = [...recommendations].sort((a, b) => b.improvementVelocity - a.improvementVelocity);
  const byRetentionAsc = [...recommendations].sort((a, b) => a.estimatedRetention - b.estimatedRetention);
  const strongest = [...recommendations].sort((a, b) => b.avgScore - a.avgScore)[0];

  return {
    strongestTopic: strongest ? { label: strongest.topic, value: `${Math.round(strongest.avgScore)}%` } : null,
    weakestTopic: byScoreAsc[0] ? { label: byScoreAsc[0].topic, value: `${Math.round(byScoreAsc[0].avgScore)}%` } : null,
    fastestImprovement: byVelocityDesc[0] ? {
      label: byVelocityDesc[0].topic,
      value: `${byVelocityDesc[0].improvementVelocity >= 0 ? '+' : ''}${Math.round(byVelocityDesc[0].improvementVelocity * 10)}%`,
    } : null,
    highestDecay: byRetentionAsc[0] ? { label: byRetentionAsc[0].topic, value: `${Math.round(byRetentionAsc[0].estimatedRetention)}% retained` } : null,
  };
}

function buildConsistency(tests) {
  const dates = Array.from(new Set(tests.map((test) => dateOf(test.date)).filter(Boolean).map((date) => date.toISOString().slice(0, 10)))).sort();
  if (!dates.length) return 0;
  const spanDays = Math.max(1, daysBetween(dates[0], dates[dates.length - 1]) + 1);
  const activeRatio = dates.length / Math.min(spanDays, 30);
  const gaps = dates.slice(1).map((date, index) => daysBetween(dates[index], date));
  const averageGap = gaps.length ? average(gaps) : 1;
  return clamp((activeRatio * 65) + ((1 / Math.max(1, averageGap)) * 35), 0, 100);
}

function detectTrends(recommendations, tests) {
  const trends = [];
  const improving = recommendations.filter((r) => r.questionCount >= 4 && r.improvementVelocity >= 1.5);
  const plateauing = recommendations.filter((r) => r.questionCount >= 4 && Math.abs(r.improvementVelocity) < 0.35 && r.avgScore >= 55 && r.avgScore <= 85);
  const regressing = recommendations.filter((r) => r.questionCount >= 4 && r.improvementVelocity <= -1);

  if (improving.length) {
    trends.push({ type: 'sustained-improvement', tone: 'positive', title: 'Sustained improvement', text: `${improving[0].topic} is climbing steadily across recent attempts.` });
  }
  if (plateauing.length) {
    trends.push({ type: 'plateauing', tone: 'neutral', title: 'Plateauing', text: `${plateauing[0].topic} is steady but not moving much. Try a different question style or review source.` });
  }
  if (regressing.length) {
    trends.push({ type: 'regression', tone: 'risk', title: 'Regression', text: `${regressing[0].topic} is trending downward and should be reviewed before the next test.` });
  }

  const orderedTests = [...tests].sort((a, b) => (dateOf(a.date)?.getTime() || 0) - (dateOf(b.date)?.getTime() || 0));
  if (orderedTests.length >= 6) {
    const recent = orderedTests.slice(-3);
    const previous = orderedTests.slice(-6, -3);
    const scoreDrop = average(previous.map((t) => t.score)) - average(recent.map((t) => t.score));
    const timeJump = average(recent.map((t) => t.totalTime || 0)) - average(previous.map((t) => t.totalTime || 0));
    if (scoreDrop >= 8 && timeJump > 0) {
      trends.push({ type: 'burnout-indicator', tone: 'risk', title: 'Burnout indicator', text: 'Recent attempts are taking longer while scores are dropping. Shorter sessions may protect retention.' });
    }
  }

  return trends;
}

function buildInsights(recommendations, tests) {
  const insights = [];
  const priority = recommendations[0];
  const inactivityWeakness = recommendations.find((r) => r.daysSince >= 14 && r.avgScore < 70);
  const fastImprover = [...recommendations].sort((a, b) => b.improvementVelocity - a.improvementVelocity)[0];
  const decay = [...recommendations].sort((a, b) => a.estimatedRetention - b.estimatedRetention)[0];

  if (inactivityWeakness) {
    insights.push(`You consistently struggle with ${inactivityWeakness.topic} after long inactivity periods.`);
  } else if (priority) {
    insights.push(`${priority.topic} is the highest-value focus area based on accuracy, decay, confidence, gaps, mistakes, and velocity.`);
  }

  const byWindow = new Map();
  tests.forEach((test) => {
    const window = getStudyWindow(test.date);
    if (!window) return;
    const bucket = byWindow.get(window) || [];
    bucket.push(test.score);
    byWindow.set(window, bucket);
  });
  const bestWindow = Array.from(byWindow.entries())
    .filter(([, scores]) => scores.length >= 2)
    .map(([window, scores]) => ({ window, score: average(scores) }))
    .sort((a, b) => b.score - a.score)[0];
  if (bestWindow) {
    insights.push(`Your best performance occurs during ${bestWindow.window} study sessions.`);
  }

  if (fastImprover && fastImprover.improvementVelocity > 0.8) {
    insights.push(`${fastImprover.topic} is improving rapidly (+${Math.round(fastImprover.improvementVelocity * 10)}% trend velocity).`);
  }

  if (decay && decay.estimatedRetention < 55) {
    insights.push(`${decay.topic} has the highest decay risk at about ${Math.round(decay.estimatedRetention)}% estimated retention.`);
  }

  return insights.slice(0, 5);
}

export function buildLearningInsightPipeline({ questions = [], tests = [] } = {}) {
  // raw attempts -> aggregation -> analytics engine -> insight generation -> dashboard rendering
  const recommendations = scoreTopicRecommendations(questions);
  const summary = buildTopicCards(recommendations);
  const consistencyScore = buildConsistency(tests);
  const retentionScore = recommendations.length ? average(recommendations.map((r) => r.estimatedRetention)) : 0;
  const trends = detectTrends(recommendations, tests);
  const insights = buildInsights(recommendations, tests);

  return {
    aggregation: {
      questionCount: questions.length,
      testCount: tests.length,
      topicCount: recommendations.length,
    },
    recommendations,
    summaryCards: [
      { key: 'strongest-topic', title: 'Strongest topic', ...summary.strongestTopic },
      { key: 'weakest-topic', title: 'Weakest topic', ...summary.weakestTopic },
      { key: 'fastest-improvement', title: 'Fastest improvement', ...summary.fastestImprovement },
      { key: 'highest-decay', title: 'Highest decay', ...summary.highestDecay },
      { key: 'consistency-score', title: 'Consistency score', label: 'Study rhythm', value: `${Math.round(consistencyScore)}%` },
      { key: 'retention-score', title: 'Retention score', label: 'Estimated recall', value: `${Math.round(retentionScore)}%` },
    ],
    trends,
    insights,
  };
}
