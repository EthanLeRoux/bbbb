# Frontend Implementation Guide: Test Resubmission Feature

## Overview
This guide provides complete instructions for implementing the test resubmission feature in your frontend. The feature allows users to resubmit tests for improved spaced repetition analysis, track progress, and receive personalized learning recommendations.

## API Endpoints

### Base URL
```
http://localhost:4000/api/vault-learning
```

### Core Resubmission Endpoints

#### 1. Get Vault Test History
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
    "vaultId": "vault-item-123",
    "testHistory": [
      {
        "id": "attempt-456",
        "scorePercent": 65,
        "recallQuality": "hard",
        "completedAt": "2026-04-30T10:30:00.000Z",
        "isResubmission": false,
        "vaultId": "vault-item-123"
      },
      {
        "id": "attempt-789",
        "scorePercent": 85,
        "recallQuality": "good",
        "completedAt": "2026-05-02T14:20:00.000Z",
        "isResubmission": true,
        "originalTestId": "attempt-456",
        "vaultId": "vault-item-123"
      }
    ],
    "totalAttempts": 2
  },
  "message": "Vault test history retrieved successfully"
}
```

#### 2. Resubmit Test with Analysis
```javascript
POST /api/vault-learning/resubmit-test
```

**Request Body:**
```json
{
  "vaultId": "vault-item-123",
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
    "vaultId": "vault-item-123",
    "spacedRepetitionResult": {
      "testAttempt": {
        "id": "attempt-789",
        "scorePercent": 85,
        "recallQuality": "good",
        "recallDescription": "Good recall - confident with minor inaccuracies",
        "completedAt": "2026-05-02T14:20:00.000Z"
      },
      "updatedStats": {
        "material": {
          "avgScore": 75,
          "priorityScore": 12.5,
          "nextReviewAt": "2026-05-09T14:20:00.000Z",
          "retentionStrength": 2.1
        }
      }
    },
    "hierarchyMapping": {
      "domainId": "networking",
      "sectionId": "ip-addressing",
      "materialId": "vault-item-123"
    },
    "submissionType": "resubmission",
    "resubmissionAnalysis": {
      "scoreImprovement": 20,
      "scoreImprovementPercent": "30.8",
      "recallQualityImproved": true,
      "retentionStrengthChange": 0.4,
      "priorityScoreChange": -5,
      "timeSinceOriginal": 2,
      "recommendation": "Good improvement! Continue with current review schedule."
    }
  },
  "message": "Vault test resubmitted successfully with spaced repetition analysis"
}
```

#### 3. Get Resubmission Analytics
```javascript
GET /api/vault-learning/resubmission-analytics/{vaultId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalResubmissions": 3,
    "averageScoreImprovement": "15.2",
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

### 1. React Component: Test Resubmission Dashboard

```jsx
import React, { useState, useEffect } from 'react';

const TestResubmissionDashboard = ({ vaultId, vaultTitle }) => {
  const [testHistory, setTestHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [showResubmitForm, setShowResubmitForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTestHistory();
    fetchAnalytics();
  }, [vaultId]);

  const fetchTestHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/vault-learning/test-history/${vaultId}?limit=20`);
      const data = await response.json();
      
      if (data.success) {
        setTestHistory(data.data.testHistory);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch test history');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/vault-learning/resubmission-analytics/${vaultId}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (err) {
      // Analytics might not exist for new vault items
      console.log('No analytics available yet');
    }
  };

  const handleResubmitTest = async (originalTestId, updatedTestData) => {
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

      const data = await response.json();

      if (data.success) {
        // Refresh data
        await fetchTestHistory();
        await fetchAnalytics();
        setShowResubmitForm(false);
        setSelectedTest(null);
        
        // Show success message
        alert(`Test resubmitted successfully! Score improved by ${data.data.resubmissionAnalysis.scoreImprovement}%`);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to resubmit test');
    } finally {
      setLoading(false);
    }
  };

  const TestHistoryItem = ({ test }) => (
    <div className={`test-item ${test.isResubmission ? 'resubmission' : 'original'}`}>
      <div className="test-header">
        <h4>
          {test.isResubmission ? 'Resubmitted Test' : 'Original Test'}
          {test.isResubmission && <span className="resubmission-badge">Improved</span>}
        </h4>
        <span className={`quality ${test.recallQuality}`}>
          {test.recallQuality}
        </span>
      </div>
      
      <div className="test-details">
        <p><strong>Score:</strong> {test.scorePercent}%</p>
        <p><strong>Date:</strong> {new Date(test.completedAt).toLocaleDateString()}</p>
        {test.isResubmission && (
          <p><strong>Original:</strong> Test #{test.originalTestId?.slice(-6)}</p>
        )}
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
            Resubmit Test
          </button>
        )}
      </div>
    </div>
  );

  const ResubmissionForm = () => (
    <div className="resubmission-form">
      <h3>Resubmit Test for {vaultTitle}</h3>
      
      {selectedTest && (
        <div className="original-info">
          <h4>Original Test Results</h4>
          <p><strong>Score:</strong> {selectedTest.scorePercent}%</p>
          <p><strong>Quality:</strong> {selectedTest.recallQuality}</p>
          <p><strong>Date:</strong> {new Date(selectedTest.completedAt).toLocaleDateString()}</p>
        </div>
      )}
      
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const updatedTestData = {
          scorePercent: parseInt(formData.get('scorePercent')),
          totalQuestions: parseInt(formData.get('totalQuestions')),
          correctAnswers: parseInt(formData.get('correctAnswers')),
          avgTimePerQuestion: parseFloat(formData.get('avgTimePerQuestion')) || 0
        };
        
        handleResubmitTest(selectedTest.id, updatedTestData);
      }}>
        <div className="form-group">
          <label>Updated Score (%):</label>
          <input
            type="number"
            name="scorePercent"
            min="0"
            max="100"
            defaultValue={selectedTest?.scorePercent || ''}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Total Questions:</label>
          <input
            type="number"
            name="totalQuestions"
            min="1"
            defaultValue={selectedTest?.totalQuestions || 10}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Correct Answers:</label>
          <input
            type="number"
            name="correctAnswers"
            min="0"
            defaultValue={Math.round((selectedTest?.scorePercent || 0) * (selectedTest?.totalQuestions || 10) / 100)}
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
          <button 
            type="button" 
            onClick={() => {
              setShowResubmitForm(false);
              setSelectedTest(null);
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );

  const AnalyticsSection = () => {
    if (!analytics || analytics.totalResubmissions === 0) {
      return (
        <div className="analytics-empty">
          <h3>Resubmission Analytics</h3>
          <p>No resubmissions yet. Complete and resubmit tests to see your improvement analytics!</p>
        </div>
      );
    }

    return (
      <div className="analytics-section">
        <h3>Resubmission Analytics</h3>
        
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
        
        {analytics.recentResubmissions.length > 0 && (
          <div className="recent-resubmissions">
            <h4>Recent Resubmissions</h4>
            {analytics.recentResubmissions.map((sub, index) => (
              <div key={index} className="resubmission-item">
                <span className="scores">
                  {sub.originalScore}% <span className="arrow">-></span> {sub.newScore}%
                </span>
                <span className={`change ${sub.scoreChange > 0 ? 'positive' : 'negative'}`}>
                  {sub.scoreChange > 0 ? '+' : ''}{sub.scoreChange}%
                </span>
                <span className="quality-change">
                  {sub.recallQualityChange.original} <span className="arrow">-></span> {sub.recallQualityChange.new}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading && testHistory.length === 0) return <div>Loading test history...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="resubmission-dashboard">
      <h2>Test Resubmission Dashboard: {vaultTitle}</h2>
      
      <AnalyticsSection />
      
      <div className="test-history">
        <h3>Test History ({testHistory.length} attempts)</h3>
        
        {testHistory.length === 0 ? (
          <p>No tests yet. Take your first test to get started!</p>
        ) : (
          testHistory.map(test => (
            <TestHistoryItem key={test.id} test={test} />
          ))
        )}
      </div>
      
      {showResubmitForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <ResubmissionForm />
          </div>
        </div>
      )}
    </div>
  );
};

export default TestResubmissionDashboard;
```

### 2. React Component: Improvement Analysis Display

```jsx
import React from 'react';

const ImprovementAnalysis = ({ analysis, originalTest, newTest }) => {
  if (!analysis) return null;

  const getImprovementLevel = (improvement) => {
    if (improvement >= 20) return { level: 'excellent', color: '#28a745' };
    if (improvement >= 10) return { level: 'good', color: '#17a2b8' };
    if (improvement >= 0) return { level: 'slight', color: '#ffc107' };
    return { level: 'none', color: '#dc3545' };
  };

  const improvementLevel = getImprovementLevel(analysis.scoreImprovement);

  return (
    <div className="improvement-analysis">
      <h3>Improvement Analysis</h3>
      
      <div className="improvement-summary">
        <div className="score-improvement">
          <div className="improvement-value" style={{ color: improvementLevel.color }}>
            +{analysis.scoreImprovement}%
          </div>
          <div className="improvement-label">Score Improvement</div>
          <div className="improvement-level">{improvementLevel.level}</div>
        </div>
        
        <div className="percentage-improvement">
          <div className="improvement-value">
            +{analysis.scoreImprovementPercent}%
          </div>
          <div className="improvement-label">Relative Improvement</div>
        </div>
      </div>
      
      <div className="detailed-analysis">
        <div className="analysis-item">
          <h4>Recall Quality</h4>
          <div className="quality-comparison">
            <span className="original">{originalTest.recallQuality}</span>
            <span className="arrow">-></span>
            <span className="new">{newTest.recallQuality}</span>
            {analysis.recallQualityImproved && (
              <span className="improved-badge">Improved</span>
            )}
          </div>
        </div>
        
        <div className="analysis-item">
          <h4>Retention Strength</h4>
          <div className="strength-change">
            <span>+{analysis.retentionStrengthChange.toFixed(2)}</span>
            <span className="change-label">strength gained</span>
          </div>
        </div>
        
        <div className="analysis-item">
          <h4>Priority Score</h4>
          <div className="priority-change">
            <span>{analysis.priorityScoreChange > 0 ? '+' : ''}{analysis.priorityScoreChange}</span>
            <span className="change-label">priority change</span>
          </div>
        </div>
        
        <div className="analysis-item">
          <h4>Time Since Original</h4>
          <div className="time-gap">
            <span>{analysis.timeSinceOriginal}</span>
            <span className="change-label">days between tests</span>
          </div>
        </div>
      </div>
      
      <div className="recommendation">
        <h4>Recommendation</h4>
        <p className="recommendation-text">{analysis.recommendation}</p>
      </div>
    </div>
  );
};

export default ImprovementAnalysis;
```

### 3. React Component: Resubmission Button with Analysis

```jsx
import React, { useState } from 'react';
import ImprovementAnalysis from './ImprovementAnalysis';

const ResubmitButton = ({ vaultId, testHistory, onResubmitSuccess }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [formData, setFormData] = useState({
    scorePercent: '',
    totalQuestions: '',
    correctAnswers: '',
    avgTimePerQuestion: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const originalTests = testHistory.filter(test => !test.isResubmission);

  const handleResubmit = async (testId) => {
    const originalTest = testHistory.find(t => t.id === testId);
    setSelectedTest(originalTest);
    setFormData({
      scorePercent: originalTest.scorePercent,
      totalQuestions: originalTest.totalQuestions,
      correctAnswers: originalTest.correctAnswers,
      avgTimePerQuestion: ''
    });
    setShowModal(true);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/vault-learning/resubmit-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vaultId,
          originalTestId: selectedTest.id,
          updatedTestData: {
            scorePercent: parseInt(formData.scorePercent),
            totalQuestions: parseInt(formData.totalQuestions),
            correctAnswers: parseInt(formData.correctAnswers),
            avgTimePerQuestion: parseFloat(formData.avgTimePerQuestion) || 0
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        onResubmitSuccess && onResubmitSuccess();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to resubmit test');
    } finally {
      setSubmitting(false);
    }
  };

  if (originalTests.length === 0) {
    return (
      <div className="no-resubmit-options">
        <p>No original tests available for resubmission.</p>
      </div>
    );
  }

  return (
    <div className="resubmit-feature">
      <h3>Resubmit Tests for Improvement</h3>
      <p>Choose a test to resubmit with updated scores:</p>
      
      <div className="original-tests-list">
        {originalTests.map(test => (
          <div key={test.id} className="original-test-item">
            <div className="test-info">
              <h4>Test #{test.id.slice(-6)}</h4>
              <p>Score: {test.scorePercent}% | Quality: {test.recallQuality}</p>
              <p>Date: {new Date(test.completedAt).toLocaleDateString()}</p>
            </div>
            <button 
              onClick={() => handleResubmit(test.id)}
              className="resubmit-btn"
            >
              Resubmit
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Resubmit Test</h3>
            
            <div className="original-test-info">
              <h4>Original Test</h4>
              <p>Score: {selectedTest.scorePercent}%</p>
              <p>Quality: {selectedTest.recallQuality}</p>
            </div>

            {!result ? (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Updated Score (%):</label>
                  <input
                    type="number"
                    value={formData.scorePercent}
                    onChange={(e) => setFormData({...formData, scorePercent: e.target.value})}
                    min="0"
                    max="100"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Total Questions:</label>
                  <input
                    type="number"
                    value={formData.totalQuestions}
                    onChange={(e) => setFormData({...formData, totalQuestions: e.target.value})}
                    min="1"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Correct Answers:</label>
                  <input
                    type="number"
                    value={formData.correctAnswers}
                    onChange={(e) => setFormData({...formData, correctAnswers: e.target.value})}
                    min="0"
                    max={formData.totalQuestions}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Average Time per Question (seconds):</label>
                  <input
                    type="number"
                    value={formData.avgTimePerQuestion}
                    onChange={(e) => setFormData({...formData, avgTimePerQuestion: e.target.value})}
                    min="0"
                    step="0.1"
                  />
                </div>
                
                <div className="form-actions">
                  <button type="submit" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Resubmission'}
                  </button>
                  <button type="button" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="resubmission-result">
                <h4>Resubmission Successful!</h4>
                <ImprovementAnalysis 
                  analysis={result.resubmissionAnalysis}
                  originalTest={selectedTest}
                  newTest={result.spacedRepetitionResult.data.testAttempt}
                />
                
                <div className="result-actions">
                  <button onClick={() => {
                    setShowModal(false);
                    setResult(null);
                    setSelectedTest(null);
                  }}>
                    Close
                  </button>
                </div>
              </div>
            )}
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResubmitButton;
```

### 4. CSS Styles

```css
/* Resubmission Dashboard Styles */
.resubmission-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.test-item {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  background: white;
}

.test-item.resubmission {
  border-left: 4px solid #28a745;
  background: #f8fff8;
}

.test-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.resubmission-badge {
  background: #28a745;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.quality {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.quality.easy { background: #28a745; color: white; }
.quality.good { background: #17a2b8; color: white; }
.quality.hard { background: #ffc107; color: black; }
.quality.again { background: #fd7e14; color: white; }
.quality.fail { background: #dc3545; color: white; }

.resubmit-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.resubmit-btn:hover {
  background: #0056b3;
}

/* Modal Styles */
.modal-overlay {
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

.original-info {
  background: #e9ecef;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
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

/* Analytics Styles */
.analytics-section {
  margin-bottom: 30px;
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.analytics-card {
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

.recent-resubmissions {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
}

.resubmission-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.resubmission-item:last-child {
  border-bottom: none;
}

.scores {
  font-weight: bold;
}

.arrow {
  margin: 0 10px;
  color: #6c757d;
}

.change.positive {
  color: #28a745;
  font-weight: bold;
}

.change.negative {
  color: #dc3545;
  font-weight: bold;
}

.quality-change {
  font-size: 12px;
  text-transform: uppercase;
}

/* Improvement Analysis Styles */
.improvement-analysis {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.improvement-summary {
  display: flex;
  justify-content: space-around;
  margin-bottom: 30px;
  text-align: center;
}

.improvement-value {
  font-size: 2em;
  font-weight: bold;
}

.improvement-label {
  color: #6c757d;
  font-size: 0.9em;
}

.improvement-level {
  text-transform: uppercase;
  font-size: 0.8em;
  font-weight: bold;
  margin-top: 5px;
}

.detailed-analysis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.analysis-item h4 {
  margin-bottom: 10px;
  color: #333;
}

.quality-comparison {
  display: flex;
  align-items: center;
  gap: 10px;
}

.improved-badge {
  background: #28a745;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.recommendation {
  background: #e9ecef;
  padding: 15px;
  border-radius: 4px;
}

.recommendation h4 {
  margin-bottom: 10px;
}

.recommendation-text {
  margin: 0;
  font-style: italic;
  color: #495057;
}

/* Responsive Design */
@media (max-width: 768px) {
  .improvement-summary {
    flex-direction: column;
    gap: 20px;
  }
  
  .analytics-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
  
  .detailed-analysis {
    grid-template-columns: 1fr;
  }
  
  .resubmission-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
}
```

## Integration Steps

### 1. Add to Existing Vault Components

```jsx
// In your existing vault item component
import TestResubmissionDashboard from './TestResubmissionDashboard';

const VaultItemDetail = ({ vaultId, vaultTitle }) => {
  return (
    <div>
      {/* Existing vault content */}
      
      {/* Add resubmission dashboard */}
      <TestResubmissionDashboard 
        vaultId={vaultId} 
        vaultTitle={vaultTitle} 
      />
    </div>
  );
};
```

### 2. Update API Service

```javascript
// services/vaultSpacedRepetition.js
export const vaultSpacedRepetitionAPI = {
  // ... existing methods
  
  getTestHistory: async (vaultId, limit = 10) => {
    const response = await axios.get(`/api/vault-learning/test-history/${vaultId}?limit=${limit}`);
    return response.data;
  },

  resubmitTest: async (vaultId, originalTestId, updatedTestData) => {
    const response = await axios.post('/api/vault-learning/resubmit-test', {
      vaultId,
      originalTestId,
      updatedTestData
    });
    return response.data;
  },

  getResubmissionAnalytics: async (vaultId) => {
    const response = await axios.get(`/api/vault-learning/resubmission-analytics/${vaultId}`);
    return response.data;
  }
};
```

### 3. Add Navigation

```jsx
// Add to your navigation or vault item page
const VaultItemTabs = ({ vaultId, vaultTitle }) => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div>
      <div className="tabs">
        <button onClick={() => setActiveTab('overview')}>Overview</button>
        <button onClick={() => setActiveTab('resubmission')}>Resubmit Tests</button>
        <button onClick={() => setActiveTab('analytics')}>Analytics</button>
      </div>
      
      {activeTab === 'resubmission' && (
        <TestResubmissionDashboard vaultId={vaultId} vaultTitle={vaultTitle} />
      )}
    </div>
  );
};
```

## Best Practices

### 1. User Experience
- Show clear improvement metrics
- Provide contextual recommendations
- Allow easy navigation between tests
- Display progress over time

### 2. Performance
- Cache test history locally
- Use debouncing for form inputs
- Lazy load analytics data

### 3. Error Handling
- Handle network errors gracefully
- Validate form inputs
- Show clear error messages
- Provide retry options

### 4. Data Visualization
- Use charts for improvement trends
- Color-code quality improvements
- Show progress indicators
- Display analytics summaries

This implementation provides a complete, production-ready frontend for the test resubmission feature with comprehensive analysis, improvement tracking, and user-friendly interfaces for enhancing spaced repetition learning.
