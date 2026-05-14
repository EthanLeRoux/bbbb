# Spaced Repetition System - API Examples

## Overview
This document provides complete examples of how to use the spaced repetition system API endpoints with real request/response data.

## Core API Endpoints

### 1. Submit Test Attempt
**Endpoint**: `POST /api/spaced-repetition/submit-test`

#### Request Example
```javascript
const testSubmission = {
  userId: "user-abc123",
  domainId: "domain-networking",
  sectionId: "section-ip-addressing", 
  materialId: "material-cidr",
  scorePercent: 85,
  totalQuestions: 10,
  correctAnswers: 8,
  avgTimePerQuestion: 45
};

fetch('/api/spaced-repetition/submit-test', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(testSubmission)
})
```

#### Response Example
```json
{
  "success": true,
  "data": {
    "testAttempt": {
      "id": "attempt-xyz789",
      "scorePercent": 85,
      "totalQuestions": 10,
      "correctAnswers": 8,
      "avgTimePerQuestion": 45,
      "completedAt": "2026-04-30T09:30:00.000Z",
      "recallQuality": "good",
      "recallDescription": "Good recall - confident with minor inaccuracies"
    },
    "updatedStats": {
      "material": {
        "entityId": "material-cidr",
        "avgScore": 82.5,
        "weightedScore": 78.3,
        "retentionStrength": 1.7,
        "priorityScore": 35,
        "nextReviewAt": "2026-05-07T09:30:00.000Z",
        "reviewCount": 3,
        "streak": 2,
        "lapseCount": 1
      },
      "section": {
        "entityId": "section-ip-addressing",
        "avgScore": 79.2,
        "weightedScore": 75.8,
        "retentionStrength": 1.5,
        "priorityScore": 42,
        "nextReviewAt": "2026-05-08T09:30:00.000Z",
        "reviewCount": 8,
        "streak": 1,
        "lapseCount": 2
      },
      "domain": {
        "entityId": "domain-networking",
        "avgScore": 81.0,
        "weightedScore": 77.1,
        "retentionStrength": 1.6,
        "priorityScore": 38,
        "nextReviewAt": "2026-05-12T09:30:00.000Z",
        "reviewCount": 15,
        "streak": 3,
        "lapseCount": 3
      }
    },
    "weakAreas": [],
    "nextReviewRecommendations": {
      "material": "2026-05-07T09:30:00.000Z",
      "section": "2026-05-08T09:30:00.000Z", 
      "domain": "2026-05-12T09:30:00.000Z"
    },
    "hierarchyImpact": {
      "materialPriority": 35,
      "sectionPriority": 42,
      "domainPriority": 38
    }
  },
  "message": "Test submitted successfully with spaced repetition analysis"
}
```

### 2. Get Review Schedule
**Endpoint**: `GET /api/spaced-repetition/review-schedule?userId=user-abc123&limit=10`

#### Response Example
```json
{
  "success": true,
  "data": {
    "due": [
      {
        "id": "user-abc123_material-subnetting",
        "userId": "user-abc123",
        "entityType": "material",
        "entityId": "material-subnetting",
        "avgScore": 45.0,
        "weightedScore": 42.3,
        "reviewCount": 2,
        "streak": 0,
        "lapseCount": 3,
        "retentionStrength": 0.8,
        "priorityScore": 78,
        "lastReviewedAt": "2026-04-23T10:15:00.000Z",
        "nextReviewAt": "2026-04-28T10:15:00.000Z",
        "createdAt": "2026-04-15T14:30:00.000Z",
        "updatedAt": "2026-04-23T10:15:00.000Z"
      },
      {
        "id": "user-abc123_section-security-basics",
        "userId": "user-abc123",
        "entityType": "section", 
        "entityId": "section-security-basics",
        "avgScore": 52.0,
        "weightedScore": 48.7,
        "reviewCount": 4,
        "streak": 1,
        "lapseCount": 2,
        "retentionStrength": 1.1,
        "priorityScore": 65,
        "lastReviewedAt": "2026-04-25T16:45:00.000Z",
        "nextReviewAt": "2026-04-30T16:45:00.000Z",
        "createdAt": "2026-04-10T11:20:00.000Z",
        "updatedAt": "2026-04-25T16:45:00.000Z"
      }
    ],
    "upcoming": [
      {
        "id": "user-abc123_material-cidr",
        "userId": "user-abc123",
        "entityType": "material",
        "entityId": "material-cidr",
        "avgScore": 82.5,
        "weightedScore": 78.3,
        "reviewCount": 3,
        "streak": 2,
        "lapseCount": 1,
        "retentionStrength": 1.7,
        "priorityScore": 35,
        "lastReviewedAt": "2026-04-30T09:30:00.000Z",
        "nextReviewAt": "2026-05-07T09:30:00.000Z",
        "createdAt": "2026-04-20T09:30:00.000Z",
        "updatedAt": "2026-04-30T09:30:00.000Z"
      }
    ]
  },
  "message": "Review schedule retrieved successfully"
}
```

### 3. Get User Statistics
**Endpoint**: `GET /api/spaced-repetition/user-stats?userId=user-abc123`

#### Response Example
```json
{
  "success": true,
  "data": {
    "totalReviews": 47,
    "avgScore": 73.2,
    "avgWeightedScore": 69.8,
    "avgRetentionStrength": 1.4,
    "totalLapses": 8,
    "entitiesByType": {
      "material": 12,
      "section": 4,
      "domain": 2
    },
    "priorityDistribution": {
      "critical": 2,
      "high": 5,
      "medium": 8,
      "low": 3
    }
  },
  "message": "User statistics retrieved successfully"
}
```

### 4. Get Entity Statistics
**Endpoint**: `GET /api/spaced-repetition/entity-stats/material/material-cidr?userId=user-abc123`

#### Response Example
```json
{
  "success": true,
  "data": {
    "entityType": "material",
    "entityId": "material-cidr",
    "userId": "user-abc123",
    "avgScore": 82.5,
    "weightedScore": 78.3,
    "reviewCount": 3,
    "streak": 2,
    "lapseCount": 1,
    "retentionStrength": 1.7,
    "priorityScore": 35,
    "lastReviewedAt": "2026-04-30T09:30:00.000Z",
    "nextReviewAt": "2026-05-07T09:30:00.000Z",
    "createdAt": "2026-04-20T09:30:00.000Z",
    "updatedAt": "2026-04-30T09:30:00.000Z"
  },
  "message": "Entity statistics retrieved successfully"
}
```

### 5. Get Test History
**Endpoint**: `GET /api/spaced-repetition/test-history?userId=user-abc123&limit=5&entityType=material&entityId=material-cidr`

#### Response Example
```json
{
  "success": true,
  "data": {
    "tests": [
      {
        "id": "attempt-xyz789",
        "userId": "user-abc123",
        "domainId": "domain-networking",
        "sectionId": "section-ip-addressing",
        "materialTypeId": "material-cidr",
        "scorePercent": 85,
        "totalQuestions": 10,
        "correctAnswers": 8,
        "avgTimePerQuestion": 45,
        "completedAt": "2026-04-30T09:30:00.000Z",
        "createdAt": "2026-04-30T09:30:00.000Z",
        "recallQuality": "good",
        "retentionStrength": 1.7
      },
      {
        "id": "attempt-abc456",
        "userId": "user-abc123",
        "domainId": "domain-networking",
        "sectionId": "section-ip-addressing",
        "materialTypeId": "material-cidr",
        "scorePercent": 78,
        "totalQuestions": 10,
        "correctAnswers": 8,
        "avgTimePerQuestion": 52,
        "completedAt": "2026-04-23T10:15:00.000Z",
        "createdAt": "2026-04-23T10:15:00.000Z",
        "recallQuality": "good",
        "retentionStrength": 1.4
      },
      {
        "id": "attempt-def123",
        "userId": "user-abc123",
        "domainId": "domain-networking",
        "sectionId": "section-ip-addressing",
        "materialTypeId": "material-cidr",
        "scorePercent": 65,
        "totalQuestions": 10,
        "correctAnswers": 6,
        "avgTimePerQuestion": 61,
        "completedAt": "2026-04-15T14:30:00.000Z",
        "createdAt": "2026-04-15T14:30:00.000Z",
        "recallQuality": "hard",
        "retentionStrength": 1.0
      }
    ],
    "pagination": {
      "limit": 5,
      "offset": 0,
      "total": 3,
      "hasMore": false
    }
  },
  "message": "Test history retrieved successfully"
}
```

## Real-World Usage Scenarios

### Scenario 1: First Test Submission (New User)
```javascript
// User takes first test on CIDR
const firstTest = {
  userId: "user-new123",
  domainId: "domain-networking",
  sectionId: "section-ip-addressing",
  materialId: "material-cidr",
  scorePercent: 45,
  totalQuestions: 8,
  correctAnswers: 4,
  avgTimePerQuestion: 89
};

// Response will show:
// - recallQuality: "again"
// - retentionStrength: 0.7 (initial weak strength)
// - priorityScore: 68 (high priority due to poor performance)
// - nextReviewAt: 2 days from now
// - weakAreas: ["Material: material-cidr (Score: 45%)"]
```

### Scenario 2: Good Performance (Experienced User)
```javascript
// Experienced user gets good score
const goodTest = {
  userId: "user-exp456",
  domainId: "domain-networking", 
  sectionId: "section-ip-addressing",
  materialId: "material-cidr",
  scorePercent: 92,
  totalQuestions: 10,
  correctAnswers: 9,
  avgTimePerQuestion: 32
};

// Response will show:
// - recallQuality: "easy"
// - retentionStrength: 3.2 (strong retention)
// - priorityScore: 15 (low priority)
// - nextReviewAt: 14 days from now
// - No weak areas identified
```

### Scenario 3: Struggling Material (Needs Intervention)
```javascript
// User struggling with subnetting
const strugglingTest = {
  userId: "user-str789",
  domainId: "domain-networking",
  sectionId: "section-subnetting", 
  materialId: "material-vlsm",
  scorePercent: 28,
  totalQuestions: 12,
  correctAnswers: 3,
  avgTimePerQuestion: 124
};

// Response will show:
// - recallQuality: "fail"
// - retentionStrength: 0.4 (very weak)
// - priorityScore: 85 (critical priority)
// - nextReviewAt: 1 day from now
// - weakAreas: [
//   "Material: material-vlsm (Score: 28%)",
//   "Material: material-vlsm (High failure rate: 4 lapses)"
// ]
// - hierarchyImpact: section priority boosted to 72 due to weak child
```

### Scenario 4: Getting Review Schedule
```javascript
// Get user's review schedule
const response = await fetch('/api/spaced-repetition/review-schedule?userId=user-abc123');

// Response will show:
// - due: Materials and sections that need review now
// - upcoming: Future scheduled reviews
// - Priority-sorted by urgency
```

## Integration Examples

### React Component Example
```javascript
// Test submission component
const TestSubmission = ({ userId, materialData }) => {
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);

  const handleSubmit = async (testData) => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/spaced-repetition/submit-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...materialData,
          ...testData
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setResults(data.data);
      }
    } catch (error) {
      console.error('Submission failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Test form */}
      <TestForm onSubmit={handleSubmit} disabled={submitting} />
      
      {/* Results display */}
      {results && (
        <div>
          <h3>Test Results</h3>
          <p>Score: {results.testAttempt.scorePercent}%</p>
          <p>Quality: {results.testAttempt.recallQuality}</p>
          
          <h4>Next Reviews</h4>
          <p>Material: {new Date(results.nextReviewRecommendations.material).toLocaleDateString()}</p>
          <p>Section: {new Date(results.nextReviewRecommendations.section).toLocaleDateString()}</p>
          
          {results.weakAreas.length > 0 && (
            <div>
              <h4>Areas to Improve</h4>
              <ul>
                {results.weakAreas.map((area, index) => (
                  <li key={index}>{area}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

### Review Dashboard Component
```javascript
const ReviewDashboard = ({ userId }) => {
  const [schedule, setSchedule] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const [scheduleRes, statsRes] = await Promise.all([
        fetch(`/api/spaced-repetition/review-schedule?userId=${userId}`),
        fetch(`/api/spaced-repetition/user-stats?userId=${userId}`)
      ]);
      
      const scheduleData = await scheduleRes.json();
      const statsData = await statsRes.json();
      
      setSchedule(scheduleData.data);
      setStats(statsData.data);
    };
    
    loadData();
  }, [userId]);

  return (
    <div>
      <h2>Review Dashboard</h2>
      
      {/* Statistics Overview */}
      {stats && (
        <div>
          <h3>Performance Overview</h3>
          <p>Average Score: {stats.avgScore.toFixed(1)}%</p>
          <p>Total Reviews: {stats.totalReviews}</p>
          <p>Retention Strength: {stats.avgRetentionStrength.toFixed(2)}</p>
        </div>
      )}
      
      {/* Due Reviews */}
      {schedule && (
        <div>
          <h3>Due Now ({schedule.due.length})</h3>
          {schedule.due.map(item => (
            <div key={item.id}>
              <p>{item.entityType}: {item.entityId}</p>
              <p>Priority: {item.priorityScore}</p>
              <button>Start Review</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

## Error Handling Examples

### Validation Errors
```json
{
  "success": false,
  "error": "Invalid request data",
  "details": "Missing required field: userId"
}
```

### Not Found Errors
```json
{
  "success": false,
  "error": "Entity statistics not found"
}
```

### Server Errors
```json
{
  "success": false,
  "error": "Failed to submit test",
  "details": "Failed to save test attempt: Connection timeout"
}
```

## Performance Considerations

### Batch Operations
```javascript
// Submit multiple tests efficiently
const batchSubmitTests = async (tests) => {
  const results = await Promise.all(
    tests.map(test => 
      fetch('/api/spaced-repetition/submit-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(test)
      })
    )
  );
  
  return results.map(res => res.json());
};
```

### Caching Strategy
```javascript
// Cache user stats for 5 minutes
const getUserStatsWithCache = async (userId) => {
  const cacheKey = `user_stats_${userId}`;
  const cached = localStorage.getItem(cacheKey);
  
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < 5 * 60 * 1000) {
      return data;
    }
  }
  
  const response = await fetch(`/api/spaced-repetition/user-stats?userId=${userId}`);
  const data = await response.json();
  
  localStorage.setItem(cacheKey, JSON.stringify({
    data: data.data,
    timestamp: Date.now()
  }));
  
  return data.data;
};
```

This comprehensive example documentation shows how to integrate the spaced repetition system into real applications with practical code examples and error handling.
