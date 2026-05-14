# Frontend Implementation Guide: Vault Spaced Repetition System

## Overview
This guide provides complete instructions for implementing the vault-based spaced repetition system in your frontend. The system automatically generates spaced repetition data from vault test submissions and provides flexible review scheduling.

## API Endpoints

### Base URL
```
http://localhost:4000/api/vault-learning
```

### Core Endpoints

#### 1. Submit Vault Test with Spaced Repetition
```javascript
POST /api/vault-learning/submit-test
```

**Request Body:**
```json
{
  "vaultId": "vault-item-123",
  "scorePercent": 85,
  "totalQuestions": 10,
  "correctAnswers": 8,
  "avgTimePerQuestion": 45
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "vaultId": "vault-item-123",
    "spacedRepetitionResult": {
      "testAttempt": {
        "id": "attempt-456",
        "scorePercent": 85,
        "recallQuality": "good",
        "recallDescription": "Good recall - confident with minor inaccuracies",
        "completedAt": "2026-04-30T10:30:00.000Z"
      },
      "updatedStats": {
        "material": {
          "avgScore": 85,
          "weightedScore": 85,
          "priorityScore": 7.5,
          "nextReviewAt": "2026-05-07T10:30:00.000Z",
          "reviewCount": 1,
          "retentionStrength": 1.7
        }
      },
      "weakAreas": [],
      "nextReviewRecommendations": {
        "material": "2026-05-07T10:30:00.000Z",
        "section": "2026-05-08T10:30:00.000Z",
        "domain": "2026-05-10T10:30:00.000Z"
      }
    },
    "hierarchyMapping": {
      "domainId": "networking",
      "sectionId": "ip-addressing",
      "materialId": "vault-item-123"
    }
  },
  "message": "Vault test submitted successfully with spaced repetition tracking"
}
```

#### 2. Get Review Schedule (Flexible Time Filtering)
```javascript
GET /api/vault-learning/review-schedule
```

**Query Parameters:**
- `timeRange`: `day` | `week` | `month` | `all` | `custom` (default: `all`)
- `limit`: Number of items to return (default: 20)
- `startDate`: For custom range (YYYY-MM-DD format)
- `endDate`: For custom range (YYYY-MM-DD format)

**Examples:**
```javascript
// Today's reviews only
GET /api/vault-learning/review-schedule?timeRange=day

// This week's reviews
GET /api/vault-learning/review-schedule?timeRange=week&limit=15

// This month's reviews
GET /api/vault-learning/review-schedule?timeRange=month

// Custom date range
GET /api/vault-learning/review-schedule?timeRange=custom&startDate=2026-04-01&endDate=2026-04-30

// All reviews with limit
GET /api/vault-learning/review-schedule?timeRange=all&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "due": [
      {
        "id": "material_vault-item-123",
        "entityType": "material",
        "entityId": "vault-item-123",
        "avgScore": 85,
        "priorityScore": 7.5,
        "nextReviewAt": "2026-04-30T10:30:00.000Z",
        "vaultInfo": {
          "vaultId": "vault-item-123",
          "title": "CIDR Notation",
          "domain": "networking",
          "section": "ip-addressing",
          "type": "content"
        }
      }
    ],
    "upcoming": [
      {
        "id": "material_vault-item-456",
        "entityType": "material",
        "entityId": "vault-item-456",
        "avgScore": 92,
        "priorityScore": 15,
        "nextReviewAt": "2026-05-05T14:20:00.000Z",
        "vaultInfo": {
          "vaultId": "vault-item-456",
          "title": "Subnetting Basics",
          "domain": "networking",
          "section": "subnetting",
          "type": "content"
        }
      }
    ]
  },
  "message": "Vault review recommendations retrieved successfully for week",
  "filterInfo": {
    "timeRange": "week",
    "limit": 20,
    "startDate": null,
    "endDate": null,
    "totalItems": 2
  }
}
```

#### 3. Get Vault Item Statistics
```javascript
GET /api/vault-learning/vault-stats/{vaultId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "vaultId": "vault-item-123",
    "hierarchy": {
      "domainId": "networking",
      "sectionId": "ip-addressing",
      "materialId": "vault-item-123"
    },
    "spacedRepetitionStats": {
      "avgScore": 85,
      "weightedScore": 85,
      "reviewCount": 3,
      "streak": 2,
      "lapseCount": 1,
      "retentionStrength": 2.89,
      "priorityScore": 7.5,
      "lastReviewedAt": "2026-04-30T10:30:00.000Z",
      "nextReviewAt": "2026-05-07T10:30:00.000Z"
    }
  },
  "message": "Vault item statistics retrieved successfully"
}
```

## Frontend Implementation

### 1. React Component: Review Dashboard

```jsx
import React, { useState, useEffect } from 'react';

const ReviewDashboard = () => {
  const [schedule, setSchedule] = useState({ due: [], upcoming: [] });
  const [timeRange, setTimeRange] = useState('week');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReviewSchedule();
  }, [timeRange]);

  const fetchReviewSchedule = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `/api/vault-learning/review-schedule?timeRange=${timeRange}&limit=20`
      );
      const data = await response.json();
      
      if (data.success) {
        setSchedule(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch review schedule');
    } finally {
      setLoading(false);
    }
  };

  const TimeRangeSelector = () => (
    <div className="time-range-selector">
      <button 
        onClick={() => setTimeRange('day')}
        className={timeRange === 'day' ? 'active' : ''}
      >
        Today
      </button>
      <button 
        onClick={() => setTimeRange('week')}
        className={timeRange === 'week' ? 'active' : ''}
      >
        This Week
      </button>
      <button 
        onClick={() => setTimeRange('month')}
        className={timeRange === 'month' ? 'active' : ''}
      >
        This Month
      </button>
      <button 
        onClick={() => setTimeRange('all')}
        className={timeRange === 'all' ? 'active' : ''}
      >
        All
      </button>
    </div>
  );

  const ReviewItem = ({ item, isDue }) => (
    <div className={`review-item ${isDue ? 'due' : 'upcoming'}`}>
      <div className="item-header">
        <h4>{item.vaultInfo?.title || 'Unknown'}</h4>
        <span className={`priority ${item.priorityScore >= 50 ? 'high' : item.priorityScore >= 25 ? 'medium' : 'low'}`}>
          Priority: {item.priorityScore}
        </span>
      </div>
      <div className="item-details">
        <p><strong>Domain:</strong> {item.vaultInfo?.domain}</p>
        <p><strong>Section:</strong> {item.vaultInfo?.section}</p>
        <p><strong>Average Score:</strong> {item.avgScore}%</p>
        <p><strong>Next Review:</strong> {new Date(item.nextReviewAt).toLocaleDateString()}</p>
      </div>
      <button className="start-review-btn">
        Start Review
      </button>
    </div>
  );

  if (loading) return <div>Loading review schedule...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="review-dashboard">
      <h2>Review Dashboard</h2>
      
      <TimeRangeSelector />
      
      <div className="review-sections">
        <div className="due-reviews">
          <h3>Due Now ({schedule.due.length})</h3>
          {schedule.due.length === 0 ? (
            <p>No reviews due right now!</p>
          ) : (
            schedule.due.map(item => (
              <ReviewItem key={item.id} item={item} isDue={true} />
            ))
          )}
        </div>
        
        <div className="upcoming-reviews">
          <h3>Upcoming ({schedule.upcoming.length})</h3>
          {schedule.upcoming.length === 0 ? (
            <p>No upcoming reviews scheduled.</p>
          ) : (
            schedule.upcoming.map(item => (
              <ReviewItem key={item.id} item={item} isDue={false} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewDashboard;
```

### 2. React Component: Test Submission with Spaced Repetition

```jsx
import React, { useState } from 'react';

const VaultTestComponent = ({ vaultId, vaultTitle }) => {
  const [testData, setTestData] = useState({
    vaultId,
    scorePercent: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    avgTimePerQuestion: 0
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/vault-learning/submit-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to submit test');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setTestData(prev => ({
      ...prev,
      [field]: field === 'scorePercent' || field === 'totalQuestions' || 
               field === 'correctAnswers' || field === 'avgTimePerQuestion' 
        ? Number(value) : value
    }));
  };

  if (result) {
    return (
      <div className="test-result">
        <h3>Test Results for {vaultTitle}</h3>
        <div className="result-summary">
          <p><strong>Score:</strong> {result.spacedRepetitionResult.testAttempt.scorePercent}%</p>
          <p><strong>Recall Quality:</strong> {result.spacedRepetitionResult.testAttempt.recallQuality}</p>
          <p><strong>Priority Score:</strong> {result.spacedRepetitionResult.data.updatedStats.material.priorityScore}</p>
          <p><strong>Next Review:</strong> {new Date(result.spacedRepetitionResult.data.updatedStats.material.nextReviewAt).toLocaleDateString()}</p>
        </div>
        
        {result.spacedRepetitionResult.data.weakAreas.length > 0 && (
          <div className="weak-areas">
            <h4>Areas to Improve:</h4>
            <ul>
              {result.spacedRepetitionResult.data.weakAreas.map((area, index) => (
                <li key={index}>{area}</li>
              ))}
            </ul>
          </div>
        )}
        
        <button onClick={() => setResult(null)}>
          Take Another Test
        </button>
      </div>
    );
  }

  return (
    <div className="vault-test">
      <h3>Test: {vaultTitle}</h3>
      
      <form onSubmit={handleSubmit} className="test-form">
        <div className="form-group">
          <label>Total Questions:</label>
          <input
            type="number"
            value={testData.totalQuestions}
            onChange={(e) => handleInputChange('totalQuestions', e.target.value)}
            min="1"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Correct Answers:</label>
          <input
            type="number"
            value={testData.correctAnswers}
            onChange={(e) => handleInputChange('correctAnswers', e.target.value)}
            min="0"
            max={testData.totalQuestions}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Average Time per Question (seconds):</label>
          <input
            type="number"
            value={testData.avgTimePerQuestion}
            onChange={(e) => handleInputChange('avgTimePerQuestion', e.target.value)}
            min="0"
            step="0.1"
          />
        </div>
        
        {testData.totalQuestions > 0 && (
          <div className="auto-calc">
            <p><strong>Auto-calculated Score:</strong> {Math.round((testData.correctAnswers / testData.totalQuestions) * 100)}%</p>
          </div>
        )}
        
        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Test'}
        </button>
      </form>
      
      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default VaultTestComponent;
```

### 3. React Component: Vault Item Statistics

```jsx
import React, { useState, useEffect } from 'react';

const VaultItemStats = ({ vaultId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, [vaultId]);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/vault-learning/vault-stats/${vaultId}`);
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch vault statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading statistics...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!stats) return <div>No statistics available</div>;

  const { spacedRepetitionStats } = stats;

  return (
    <div className="vault-stats">
      <h3>Learning Statistics</h3>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h4>Performance</h4>
          <p><strong>Average Score:</strong> {spacedRepetitionStats.avgScore}%</p>
          <p><strong>Weighted Score:</strong> {spacedRepetitionStats.weightedScore}%</p>
          <p><strong>Review Count:</strong> {spacedRepetitionStats.reviewCount}</p>
        </div>
        
        <div className="stat-card">
          <h4>Memory Strength</h4>
          <p><strong>Retention:</strong> {spacedRepetitionStats.retentionStrength.toFixed(2)}</p>
          <p><strong>Streak:</strong> {spacedRepetitionStats.streak}</p>
          <p><strong>Lapses:</strong> {spacedRepetitionStats.lapseCount}</p>
        </div>
        
        <div className="stat-card">
          <h4>Scheduling</h4>
          <p><strong>Priority:</strong> {spacedRepetitionStats.priorityScore}</p>
          <p><strong>Last Review:</strong> {spacedRepetitionStats.lastReviewedAt ? 
            new Date(spacedRepetitionStats.lastReviewedAt).toLocaleDateString() : 'Never'}</p>
          <p><strong>Next Review:</strong> {new Date(spacedRepetitionStats.nextReviewAt).toLocaleDateString()}</p>
        </div>
      </div>
      
      <div className="progress-indicators">
        <div className="progress-bar">
          <label>Average Score</label>
          <div className="bar">
            <div 
              className="fill" 
              style={{ width: `${spacedRepetitionStats.avgScore}%` }}
            />
          </div>
          <span>{spacedRepetitionStats.avgScore}%</span>
        </div>
        
        <div className="progress-bar">
          <label>Retention Strength</label>
          <div className="bar">
            <div 
              className="fill" 
              style={{ width: `${(spacedRepetitionStats.retentionStrength / 10) * 100}%` }}
            />
          </div>
          <span>{spacedRepetitionStats.retentionStrength.toFixed(2)}/10</span>
        </div>
      </div>
    </div>
  );
};

export default VaultItemStats;
```

### 4. CSS Styles

```css
/* Review Dashboard Styles */
.review-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.time-range-selector {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
}

.time-range-selector button {
  padding: 10px 20px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 5px;
}

.time-range-selector button.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.review-sections {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.review-item {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
}

.review-item.due {
  border-left: 4px solid #dc3545;
  background: #fff5f5;
}

.review-item.upcoming {
  border-left: 4px solid #28a745;
  background: #f8fff8;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.priority {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.priority.high {
  background: #dc3545;
  color: white;
}

.priority.medium {
  background: #ffc107;
  color: black;
}

.priority.low {
  background: #28a745;
  color: white;
}

.start-review-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

/* Test Form Styles */
.test-form {
  max-width: 500px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.auto-calc {
  background: #e9ecef;
  padding: 10px;
  border-radius: 4px;
  margin: 15px 0;
}

/* Stats Styles */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
}

.stat-card h4 {
  margin-bottom: 15px;
  color: #333;
}

.progress-bar {
  margin-bottom: 20px;
}

.progress-bar label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.progress-bar .bar {
  width: 100%;
  height: 20px;
  background: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
}

.progress-bar .fill {
  height: 100%;
  background: #007bff;
  transition: width 0.3s ease;
}

.progress-bar span {
  margin-left: 10px;
  font-weight: bold;
}
```

## Integration Steps

### 1. Install Dependencies
```bash
npm install axios  # or use fetch API
```

### 2. Create API Service
```javascript
// services/vaultSpacedRepetition.js
import axios from 'axios';

const API_BASE = '/api/vault-learning';

export const vaultSpacedRepetitionAPI = {
  submitTest: async (testData) => {
    const response = await axios.post(`${API_BASE}/submit-test`, testData);
    return response.data;
  },

  getReviewSchedule: async (options = {}) => {
    const params = new URLSearchParams(options);
    const response = await axios.get(`${API_BASE}/review-schedule?${params}`);
    return response.data;
  },

  getVaultStats: async (vaultId) => {
    const response = await axios.get(`${API_BASE}/vault-stats/${vaultId}`);
    return response.data;
  }
};
```

### 3. Integrate with Existing Components
- Replace existing test submission with spaced repetition integration
- Add review dashboard to navigation
- Include stats components in vault item views

### 4. Handle Error States
- Network errors
- Invalid data
- Missing vault items
- API rate limiting

## Best Practices

### 1. Performance
- Implement caching for review schedules
- Use debouncing for time range changes
- Lazy load review items

### 2. User Experience
- Show loading states
- Provide clear feedback
- Handle offline scenarios
- Auto-refresh due reviews

### 3. Data Management
- Store local cache of review schedules
- Sync with server periodically
- Handle conflicts gracefully

### 4. Accessibility
- Keyboard navigation
- Screen reader support
- High contrast mode
- Responsive design

## Testing

### 1. Unit Tests
```javascript
// Test API service
describe('Vault Spaced Repetition API', () => {
  test('should submit test successfully', async () => {
    const testData = {
      vaultId: 'test-123',
      scorePercent: 85,
      totalQuestions: 10,
      correctAnswers: 8
    };
    
    const result = await vaultSpacedRepetitionAPI.submitTest(testData);
    expect(result.success).toBe(true);
  });
});
```

### 2. Integration Tests
- Test complete user flows
- Verify time range filtering
- Test error scenarios

### 3. E2E Tests
- Full review cycle testing
- Multiple vault item testing
- Performance testing

This implementation provides a complete, production-ready frontend for the vault-based spaced repetition system with flexible time filtering, comprehensive statistics, and seamless integration with your existing vault content.
