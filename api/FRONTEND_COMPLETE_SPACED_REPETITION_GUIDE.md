# Frontend Implementation Guide: Complete Vault Spaced Repetition System

## Overview
This guide provides complete instructions for implementing the vault-based spaced repetition system in your frontend. The system automatically generates spaced repetition data from test submissions, provides flexible review scheduling, supports test resubmission for improvement tracking, and works without requiring vault items to exist first.

## System Features
- **Test Submission**: Submit tests for any vault ID without creating vault items
- **Spaced Repetition**: Automatic review interval calculation based on performance
- **Time-Based Filtering**: Review schedules by day/week/month/custom ranges
- **Test Resubmission**: Resubmit tests for improvement analysis and tracking
- **Analytics**: Comprehensive performance and improvement analytics
- **Review Dashboard**: Priority-based review recommendations

## API Endpoints

### Base URL
```
http://localhost:4000/api/vault-learning
```

### Core Endpoints

#### 1. Submit Test with Spaced Repetition
```javascript
POST /api/vault-learning/submit-test
```

**Request Body:**
```json
{
  "vaultId": "any-vault-id-123",
  "scorePercent": 75,
  "totalQuestions": 10,
  "correctAnswers": 7,
  "avgTimePerQuestion": 45
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "vaultId": "any-vault-id-123",
    "spacedRepetitionResult": {
      "data": {
        "testAttempt": {
          "id": "attempt-456",
          "scorePercent": 75,
          "recallQuality": "good",
          "recallDescription": "Good recall - confident with minor inaccuracies",
          "completedAt": "2026-04-30T10:30:00.000Z"
        },
        "updatedStats": {
          "material": {
            "avgScore": 75,
            "priorityScore": 12.5,
            "nextReviewAt": "2026-05-07T10:30:00.000Z",
            "retentionStrength": 2.89
          }
        }
      }
    },
    "hierarchyMapping": {
      "domainId": "general",
      "sectionId": "main", 
      "materialId": "any-vault-id-123"
    },
    "submissionType": "new"
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
        "id": "material_any-vault-id-123",
        "entityType": "material",
        "entityId": "any-vault-id-123",
        "avgScore": 75,
        "priorityScore": 12.5,
        "nextReviewAt": "2026-04-30T10:30:00.000Z",
        "vaultInfo": {
          "vaultId": "any-vault-id-123",
          "title": "Vault Item any-vault-id-123",
          "domain": "general",
          "section": "main",
          "type": "content"
        }
      }
    ],
    "upcoming": [
      {
        "id": "material_any-vault-id-456",
        "entityType": "material", 
        "entityId": "any-vault-id-456",
        "avgScore": 85,
        "priorityScore": 7.5,
        "nextReviewAt": "2026-05-05T14:20:00.000Z",
        "vaultInfo": {
          "vaultId": "any-vault-id-456",
          "title": "Vault Item any-vault-id-456",
          "domain": "general",
          "section": "main",
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
    "vaultId": "any-vault-id-123",
    "hierarchy": {
      "domainId": "general",
      "sectionId": "main",
      "materialId": "any-vault-id-123"
    },
    "spacedRepetitionStats": {
      "avgScore": 75,
      "weightedScore": 75,
      "reviewCount": 3,
      "streak": 2,
      "lapseCount": 1,
      "retentionStrength": 2.89,
      "priorityScore": 12.5,
      "lastReviewedAt": "2026-04-30T10:30:00.000Z",
      "nextReviewAt": "2026-05-07T10:30:00.000Z"
    }
  },
  "message": "Vault item statistics retrieved successfully"
}
```

#### 4. Get Test History
```javascript
GET /api/vault-learning/test-history/{vaultId}
```

**Query Parameters:**
- `limit`: Number of attempts to return (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "vaultId": "any-vault-id-123",
    "testHistory": [
      {
        "id": "attempt-456",
        "scorePercent": 75,
        "recallQuality": "good",
        "completedAt": "2026-04-30T10:30:00.000Z",
        "isResubmission": false,
        "vaultId": "any-vault-id-123"
      },
      {
        "id": "attempt-789",
        "scorePercent": 85,
        "recallQuality": "good",
        "completedAt": "2026-05-02T14:20:00.000Z",
        "isResubmission": true,
        "originalTestId": "attempt-456",
        "vaultId": "any-vault-id-123"
      }
    ],
    "totalAttempts": 2
  },
  "message": "Vault test history retrieved successfully"
}
```

#### 5. Resubmit Test for Improvement Analysis
```javascript
POST /api/vault-learning/resubmit-test
```

**Request Body:**
```json
{
  "vaultId": "any-vault-id-123",
  "originalTestId": "attempt-456",
  "updatedTestData": {
    "scorePercent": 85,
    "totalQuestions": 10,
    "correctAnswers": 8,
    "avgTimePerQuestion": 45
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "vaultId": "any-vault-id-123",
    "spacedRepetitionResult": {
      "data": {
        "testAttempt": {
          "id": "attempt-789",
          "scorePercent": 85,
          "recallQuality": "good",
          "completedAt": "2026-05-02T14:20:00.000Z"
        },
        "updatedStats": {
          "material": {
            "avgScore": 80,
            "priorityScore": 10,
            "nextReviewAt": "2026-05-09T14:20:00.000Z",
            "retentionStrength": 3.2
          }
        }
      }
    },
    "submissionType": "resubmission",
    "resubmissionAnalysis": {
      "scoreImprovement": 10,
      "scoreImprovementPercent": "13.3",
      "recallQualityImproved": false,
      "retentionStrengthChange": 0.31,
      "priorityScoreChange": -2.5,
      "timeSinceOriginal": 2,
      "recommendation": "Good improvement! Continue with current review schedule."
    }
  },
  "message": "Vault test resubmitted successfully with spaced repetition analysis"
}
```

#### 6. Get Resubmission Analytics
```javascript
GET /api/vault-learning/resubmission-analytics/{vaultId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalResubmissions": 3,
    "averageScoreImprovement": "12.5",
    "averageRetentionGain": "0.8",
    "improvementRate": "66.7",
    "recentResubmissions": [
      {
        "originalScore": 65,
        "newScore": 85,
        "scoreChange": 20,
        "resubmittedAt": "2026-05-02T14:20:00.000Z",
        "recallQualityChange": {
          "original": "hard",
          "new": "good"
        }
      }
    ]
  },
  "message": "Vault resubmission analytics retrieved successfully"
}
```

## Frontend Implementation

### 1. Main Spaced Repetition Dashboard Component

```jsx
import React, { useState, useEffect } from 'react';

const SpacedRepetitionDashboard = () => {
  const [schedule, setSchedule] = useState({ due: [], upcoming: [] });
  const [timeRange, setTimeRange] = useState('week');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showTestForm, setShowTestForm] = useState(false);

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

  const submitTest = async (testData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/vault-learning/submit-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });

      const result = await response.json();

      if (result.success) {
        setShowTestForm(false);
        await fetchReviewSchedule(); // Refresh schedule
        alert(`Test submitted! Next review: ${new Date(result.data.spacedRepetitionResult.data.updatedStats.material.nextReviewAt).toLocaleDateString()}`);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to submit test');
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
        <h4>{item.vaultInfo?.title || `Vault ${item.vaultInfo?.vaultId}`}</h4>
        <span className={`priority ${item.priorityScore >= 50 ? 'high' : item.priorityScore >= 25 ? 'medium' : 'low'}`}>
          Priority: {item.priorityScore}
        </span>
      </div>
      <div className="item-details">
        <p><strong>Average Score:</strong> {item.avgScore}%</p>
        <p><strong>Next Review:</strong> {new Date(item.nextReviewAt).toLocaleDateString()}</p>
        <p><strong>Domain:</strong> {item.vaultInfo?.domain}</p>
        <p><strong>Section:</strong> {item.vaultInfo?.section}</p>
      </div>
      <div className="item-actions">
        <button className="start-review-btn">
          Start Review
        </button>
        <button className="test-btn" onClick={() => setShowTestForm(true)}>
          Take Test
        </button>
      </div>
    </div>
  );

  const TestForm = () => (
    <div className="test-form-modal">
      <div className="modal-content">
        <h3>Submit Test</h3>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          submitTest({
            vaultId: formData.get('vaultId'),
            scorePercent: parseInt(formData.get('scorePercent')),
            totalQuestions: parseInt(formData.get('totalQuestions')),
            correctAnswers: parseInt(formData.get('correctAnswers')),
            avgTimePerQuestion: parseFloat(formData.get('avgTimePerQuestion')) || 0
          });
        }}>
          <div className="form-group">
            <label>Vault ID:</label>
            <input name="vaultId" required placeholder="any-vault-id-123" />
          </div>
          <div className="form-group">
            <label>Score (%):</label>
            <input type="number" name="scorePercent" min="0" max="100" required />
          </div>
          <div className="form-group">
            <label>Total Questions:</label>
            <input type="number" name="totalQuestions" min="1" required />
          </div>
          <div className="form-group">
            <label>Correct Answers:</label>
            <input type="number" name="correctAnswers" min="0" required />
          </div>
          <div className="form-group">
            <label>Avg Time per Question (seconds):</label>
            <input type="number" name="avgTimePerQuestion" min="0" step="0.1" />
          </div>
          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Test'}
            </button>
            <button type="button" onClick={() => setShowTestForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (loading && schedule.due.length === 0 && schedule.upcoming.length === 0) {
    return <div>Loading spaced repetition data...</div>;
  }

  if (error) return <div>Error: {error}</div>;

  return (
    <div className="spaced-repetition-dashboard">
      <div className="dashboard-header">
        <h2>Spaced Repetition Dashboard</h2>
        <button className="add-test-btn" onClick={() => setShowTestForm(true)}>
          + Submit Test
        </button>
      </div>
      
      <TimeRangeSelector />
      
      <div className="review-sections">
        <div className="due-reviews">
          <h3>Due Now ({schedule.due.length})</h3>
          {schedule.due.length === 0 ? (
            <p>No reviews due right now! Great job staying on top of your learning.</p>
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

      {showTestForm && <TestForm />}
    </div>
  );
};

export default SpacedRepetitionDashboard;
```

### 2. Vault Item Detail Component with Full Features

```jsx
import React, { useState, useEffect } from 'react';

const VaultItemDetail = ({ vaultId }) => {
  const [stats, setStats] = useState(null);
  const [testHistory, setTestHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [showResubmitForm, setShowResubmitForm] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVaultStats();
    fetchTestHistory();
    fetchAnalytics();
  }, [vaultId]);

  const fetchVaultStats = async () => {
    try {
      const response = await fetch(`/api/vault-learning/vault-stats/${vaultId}`);
      const data = await response.json();
      if (data.success) setStats(data.data);
    } catch (err) {
      console.error('Failed to fetch vault stats');
    }
  };

  const fetchTestHistory = async () => {
    try {
      const response = await fetch(`/api/vault-learning/test-history/${vaultId}`);
      const data = await response.json();
      if (data.success) setTestHistory(data.data.testHistory);
    } catch (err) {
      console.error('Failed to fetch test history');
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/vault-learning/resubmission-analytics/${vaultId}`);
      const data = await response.json();
      if (data.success) setAnalytics(data.data);
    } catch (err) {
      // Analytics might not exist yet
      console.log('No analytics available');
    }
  };

  const resubmitTest = async (originalTestId, updatedTestData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/vault-learning/resubmit-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vaultId,
          originalTestId,
          updatedTestData
        })
      });

      const result = await response.json();

      if (result.success) {
        setShowResubmitForm(false);
        setSelectedTest(null);
        await fetchTestHistory();
        await fetchAnalytics();
        await fetchVaultStats();
        
        const analysis = result.data.resubmissionAnalysis;
        alert(`Resubmission successful! Score improved by ${analysis.scoreImprovement}%`);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to resubmit test');
    } finally {
      setLoading(false);
    }
  };

  const StatsSection = () => {
    if (!stats) return null;

    return (
      <div className="stats-section">
        <h3>Learning Statistics</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <h4>Performance</h4>
            <p><strong>Average Score:</strong> {stats.spacedRepetitionStats.avgScore}%</p>
            <p><strong>Review Count:</strong> {stats.spacedRepetitionStats.reviewCount}</p>
            <p><strong>Streak:</strong> {stats.spacedRepetitionStats.streak}</p>
          </div>
          <div className="stat-card">
            <h4>Memory</h4>
            <p><strong>Retention:</strong> {stats.spacedRepetitionStats.retentionStrength.toFixed(2)}</p>
            <p><strong>Lapses:</strong> {stats.spacedRepetitionStats.lapseCount}</p>
            <p><strong>Priority:</strong> {stats.spacedRepetitionStats.priorityScore}</p>
          </div>
          <div className="stat-card">
            <h4>Scheduling</h4>
            <p><strong>Last Review:</strong> {stats.spacedRepetitionStats.lastReviewedAt ? 
              new Date(stats.spacedRepetitionStats.lastReviewedAt).toLocaleDateString() : 'Never'}</p>
            <p><strong>Next Review:</strong> {new Date(stats.spacedRepetitionStats.nextReviewAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    );
  };

  const TestHistorySection = () => (
    <div className="test-history-section">
      <h3>Test History ({testHistory.length} attempts)</h3>
      {testHistory.length === 0 ? (
        <p>No tests yet. Submit your first test to get started!</p>
      ) : (
        <div className="history-list">
          {testHistory.map(test => (
            <div key={test.id} className={`history-item ${test.isResubmission ? 'resubmission' : 'original'}`}>
              <div className="test-info">
                <h4>
                  {test.isResubmission ? 'Resubmitted Test' : 'Original Test'}
                  {test.isResubmission && <span className="improved-badge">Improved</span>}
                </h4>
                <p>Score: {test.scorePercent}% | Quality: {test.recallQuality}</p>
                <p>Date: {new Date(test.completedAt).toLocaleDateString()}</p>
              </div>
              <div className="test-actions">
                {!test.isResubmission && (
                  <button 
                    onClick={() => {
                      setSelectedTest(test);
                      setShowResubmitForm(true);
                    }}
                    className="resubmit-btn"
                  >
                    Resubmit
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const AnalyticsSection = () => {
    if (!analytics || analytics.totalResubmissions === 0) {
      return (
        <div className="analytics-empty">
          <h3>Improvement Analytics</h3>
          <p>No resubmissions yet. Complete and resubmit tests to see your improvement analytics!</p>
        </div>
      );
    }

    return (
      <div className="analytics-section">
        <h3>Improvement Analytics</h3>
        <div className="analytics-grid">
          <div className="analytics-card">
            <h4>Total Resubmissions</h4>
            <p className="big-number">{analytics.totalResubmissions}</p>
          </div>
          <div className="analytics-card">
            <h4>Average Improvement</h4>
            <p className="big-number">+{analytics.averageScoreImprovement}%</p>
          </div>
          <div className="analytics-card">
            <h4>Success Rate</h4>
            <p className="big-number">{analytics.improvementRate}%</p>
            <small>showed improvement</small>
          </div>
          <div className="analytics-card">
            <h4>Retention Gain</h4>
            <p className="big-number">+{analytics.averageRetentionGain}</p>
          </div>
        </div>
      </div>
    );
  };

  const ResubmitForm = () => {
    if (!selectedTest) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>Resubmit Test</h3>
          
          <div className="original-info">
            <h4>Original Test Results</h4>
            <p>Score: {selectedTest.scorePercent}%</p>
            <p>Quality: {selectedTest.recallQuality}</p>
            <p>Date: {new Date(selectedTest.completedAt).toLocaleDateString()}</p>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            resubmitTest(selectedTest.id, {
              scorePercent: parseInt(formData.get('scorePercent')),
              totalQuestions: parseInt(formData.get('totalQuestions')),
              correctAnswers: parseInt(formData.get('correctAnswers')),
              avgTimePerQuestion: parseFloat(formData.get('avgTimePerQuestion')) || 0
            });
          }}>
            <div className="form-group">
              <label>Updated Score (%):</label>
              <input
                type="number"
                name="scorePercent"
                min="0"
                max="100"
                defaultValue={selectedTest.scorePercent}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Total Questions:</label>
              <input
                type="number"
                name="totalQuestions"
                min="1"
                defaultValue={selectedTest.totalQuestions || 10}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Correct Answers:</label>
              <input
                type="number"
                name="correctAnswers"
                min="0"
                defaultValue={selectedTest.correctAnswers || Math.round(selectedTest.scorePercent * 10 / 100)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Average Time per Question (seconds):</label>
              <input
                type="number"
                name="avgTimePerQuestion"
                min="0"
                step="0.1"
                defaultValue=""
              />
            </div>
            
            <div className="form-actions">
              <button type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Resubmission'}
              </button>
              <button type="button" onClick={() => {
                setShowResubmitForm(false);
                setSelectedTest(null);
              }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="vault-item-detail">
      <h2>Vault Item: {vaultId}</h2>
      
      <StatsSection />
      <AnalyticsSection />
      <TestHistorySection />
      
      {showResubmitForm && <ResubmitForm />}
      
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default VaultItemDetail;
```

### 3. API Service

```javascript
// services/spacedRepetitionAPI.js
import axios from 'axios';

const API_BASE = '/api/vault-learning';

export const spacedRepetitionAPI = {
  // Test submission
  submitTest: async (testData) => {
    const response = await axios.post(`${API_BASE}/submit-test`, testData);
    return response.data;
  },

  // Review schedule with time filtering
  getReviewSchedule: async (options = {}) => {
    const params = new URLSearchParams(options);
    const response = await axios.get(`${API_BASE}/review-schedule?${params}`);
    return response.data;
  },

  // Vault item statistics
  getVaultStats: async (vaultId) => {
    const response = await axios.get(`${API_BASE}/vault-stats/${vaultId}`);
    return response.data;
  },

  // Test history
  getTestHistory: async (vaultId, limit = 10) => {
    const response = await axios.get(`${API_BASE}/test-history/${vaultId}?limit=${limit}`);
    return response.data;
  },

  // Test resubmission
  resubmitTest: async (vaultId, originalTestId, updatedTestData) => {
    const response = await axios.post(`${API_BASE}/resubmit-test`, {
      vaultId,
      originalTestId,
      updatedTestData
    });
    return response.data;
  },

  // Resubmission analytics
  getResubmissionAnalytics: async (vaultId) => {
    const response = await axios.get(`${API_BASE}/resubmission-analytics/${vaultId}`);
    return response.data;
  }
};
```

### 4. CSS Styles

```css
/* Spaced Repetition Dashboard Styles */
.spaced-repetition-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.add-test-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
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
  transition: transform 0.2s ease;
}

.review-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
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

.item-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.start-review-btn, .test-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.start-review-btn {
  background: #007bff;
  color: white;
}

.test-btn {
  background: #6c757d;
  color: white;
}

/* Test Form Modal */
.test-form-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
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
  font-size: 16px;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.form-actions button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.form-actions button[type="submit"] {
  background: #007bff;
  color: white;
}

.form-actions button[type="button"] {
  background: #6c757d;
  color: white;
}

/* Vault Item Detail Styles */
.vault-item-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.stats-section, .analytics-section, .test-history-section {
  margin-bottom: 30px;
}

.stats-grid, .analytics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card, .analytics-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
}

.big-number {
  font-size: 2em;
  font-weight: bold;
  color: #007bff;
  margin: 10px 0;
}

.history-item {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-item.resubmission {
  border-left: 4px solid #28a745;
  background: #f8fff8;
}

.improved-badge {
  background: #28a745;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  margin-left: 10px;
}

.resubmit-btn {
  background: #17a2b8;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .review-sections {
    grid-template-columns: 1fr;
  }
  
  .stats-grid, .analytics-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
  
  .dashboard-header {
    flex-direction: column;
    gap: 15px;
  }
  
  .history-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
```

## Integration Steps

### 1. Add to Your Application

```jsx
// App.js
import React from 'react';
import SpacedRepetitionDashboard from './components/SpacedRepetitionDashboard';
import VaultItemDetail from './components/VaultItemDetail';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedVaultId, setSelectedVaultId] = useState(null);

  return (
    <div className="app">
      <nav>
        <button onClick={() => setCurrentView('dashboard')}>
          Review Dashboard
        </button>
        <button onClick={() => setCurrentView('detail')}>
          Vault Detail
        </button>
      </nav>
      
      {currentView === 'dashboard' && (
        <SpacedRepetitionDashboard />
      )}
      
      {currentView === 'detail' && selectedVaultId && (
        <VaultItemDetail vaultId={selectedVaultId} />
      )}
    </div>
  );
}

export default App;
```

### 2. Error Handling

```jsx
// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Spaced Repetition Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong with the spaced repetition system.</h2>
          <p>Please refresh the page and try again.</p>
          <details>
            {this.state.error && this.state.error.toString()}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrap your components
<ErrorBoundary>
  <SpacedRepetitionDashboard />
</ErrorBoundary>
```

### 3. Performance Optimization

```jsx
// Custom hook for API calls with caching
import { useState, useEffect, useCallback } from 'react';

const useSpacedRepetition = () => {
  const [cache, setCache] = useState(new Map());

  const cachedFetch = useCallback(async (url, options = {}) => {
    const cacheKey = `${url}${JSON.stringify(options)}`;
    
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    try {
      const response = await fetch(url, options);
      const data = await response.json();
      
      // Cache for 5 minutes
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.set(cacheKey, data);
        setTimeout(() => {
          setCache(prevCache => {
            const updatedCache = new Map(prevCache);
            updatedCache.delete(cacheKey);
            return updatedCache;
          });
        }, 5 * 60 * 1000);
        return newCache;
      });
      
      return data;
    } catch (error) {
      throw error;
    }
  }, [cache]);

  return { cachedFetch };
};
```

## Best Practices

### 1. User Experience
- Show loading states for all API calls
- Provide clear feedback for test submissions
- Use progress indicators for improvement tracking
- Implement optimistic updates where appropriate

### 2. Data Management
- Implement local caching for review schedules
- Use debouncing for time range changes
- Store user preferences locally
- Handle offline scenarios gracefully

### 3. Performance
- Lazy load analytics data
- Use virtual scrolling for large lists
- Implement pagination for test history
- Optimize API calls with proper caching

### 4. Accessibility
- Ensure keyboard navigation
- Provide screen reader support
- Use semantic HTML elements
- Implement high contrast mode support

This complete implementation provides a production-ready frontend for the vault-based spaced repetition system with all features working seamlessly without requiring vault items to exist first!
