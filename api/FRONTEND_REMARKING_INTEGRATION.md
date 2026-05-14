# Frontend Integration Guide: Attempt Remarking

## Overview
The backend now supports re-marking old attempts with AI-powered scoring. This allows users to get improved AI evaluations for previously submitted attempts that were scored using basic string comparison.

## New Endpoint

### POST /api/attempts/:attemptId/remark
Re-mark an existing attempt with AI-powered scoring.

```javascript
POST /api/attempts/attempt-123/remark
{
  "success": true,
  "data": {
    "attemptId": "attempt-123",
    "testId": "test-456",
    "testName": "Network Security Fundamentals",
    "testTopic": "Network Security",
    "testDifficulty": "hard",
    "testDomain": "university",
    "testSection": "cybersecurity",
    "score": 75.0,
    "originalScore": 0.0,
    "scoreChange": 75.0,
    "correctCount": 1,
    "totalQuestions": 2,
    "totalTime": 150,
    "perQuestionResults": {
      "q0": {
        "correct": false,
        "expectedAnswer": "A HIDS is security software that monitors a single device...",
        "userAnswer": "An HID is for detecting unusual traffic...",
        "timing": 92,
        "question": "What is the purpose of a Host-Based Intrusion Detection System (HIDS)?",
        "aiScore": 60,
        "confidence": "medium",
        "evaluation": "The student's answer demonstrates a partial understanding...",
        "strengths": "The student correctly identified that HIDS is for detecting intrusion attempts...",
        "improvements": "The student's answer lacks clarity and precision...",
        "keyPointsMatched": ["Detecting intrusion attempts", "Alerting the user"],
        "keyPointsMissed": ["Monitoring a single device", "System activity analysis"]
      }
    },
    "critiques": {
      "perQuestionCritiques": { ... },
      "overallWeaknesses": [ ... ],
      "studyRecommendations": [ ... ],
      "strengths": [ ... ]
    },
    "submittedAt": "2026-04-29T10:00:00.000Z",
    "lastRemarkedAt": "2026-04-30T08:49:01.000Z",
    "remarkCount": 1,
    "status": "completed"
  },
  "message": "Attempt re-marked successfully with AI-powered scoring"
}
```

## Key Features

### Score Comparison
- **originalScore**: The score from the original basic scoring
- **score**: The new AI-powered score
- **scoreChange**: The difference (+/-) between old and new scores

### Enhanced Per-Question Results
- **aiScore**: 0-100 score from AI evaluation
- **confidence**: AI confidence level (high/medium/low)
- **evaluation**: Detailed AI assessment
- **strengths**: What the student got right
- **improvements**: What could be improved
- **keyPointsMatched**: Key concepts correctly identified
- **keyPointsMissed**: Key concepts missed

### Remarking Metadata
- **lastRemarkedAt**: Timestamp of last remarking
- **remarkCount**: Number of times attempt has been re-marked

## Frontend Implementation

### 1. Add Remark Button
```javascript
// In attempt results component
const AttemptResults = ({ attempt }) => {
  const [isRemarking, setIsRemarking] = useState(false);
  const [remarkedAttempt, setRemarkedAttempt] = useState(null);

  const handleRemark = async () => {
    setIsRemarking(true);
    try {
      const response = await fetch(`/api/attempts/${attempt.id}/remark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setRemarkedAttempt(data.data);
        // Update the UI with new results
        updateAttemptResults(data.data);
      }
    } catch (error) {
      console.error('Remark failed:', error);
      // Show error message
    } finally {
      setIsRemarking(false);
    }
  };

  return (
    <div className="attempt-results">
      <div className="score-section">
        <h2>Score: {attempt.score}%</h2>
        
        {/* Show remark button if attempt has no AI scoring */}
        {!attempt.perQuestionResults?.q0?.aiScore && (
          <button 
            onClick={handleRemark}
            disabled={isRemarking}
            className="remark-button"
          >
            {isRemarking ? 'Re-marking...' : 'Re-mark with AI'}
          </button>
        )}
        
        {/* Show score improvement if remarked */}
        {remarkedAttempt && (
          <div className="score-improvement">
            <span className="old-score">Original: {remarkedAttempt.originalScore}%</span>
            <span className="new-score">New: {remarkedAttempt.score}%</span>
            <span className="improvement">
              {remarkedAttempt.scoreChange > 0 ? '+' : ''}{remarkedAttempt.scoreChange}%
            </span>
          </div>
        )}
      </div>
      
      {/* Enhanced question results */}
      <div className="questions-section">
        {Object.entries(remarkedAttempt?.perQuestionResults || attempt.perQuestionResults).map(([questionId, result]) => (
          <QuestionResult key={questionId} result={result} />
        ))}
      </div>
    </div>
  );
};
```

### 2. Enhanced Question Result Component
```javascript
const QuestionResult = ({ result }) => {
  const hasAIScoring = result.aiScore !== undefined;
  
  return (
    <div className={`question-result ${result.correct ? 'correct' : 'incorrect'}`}>
      <h3>Question {result.question}</h3>
      
      <div className="answer-section">
        <div className="user-answer">
          <strong>Your Answer:</strong> {result.userAnswer}
        </div>
        <div className="expected-answer">
          <strong>Expected Answer:</strong> {result.expectedAnswer}
        </div>
      </div>
      
      {/* AI Scoring Information */}
      {hasAIScoring && (
        <div className="ai-scoring">
          <div className="score-badge">
            AI Score: {result.aiScore}/100
            <span className={`confidence ${result.confidence}`}>
              {result.confidence}
            </span>
          </div>
          
          <div className="evaluation">
            <strong>AI Evaluation:</strong> {result.evaluation}
          </div>
          
          <div className="strengths">
            <strong>Strengths:</strong> {result.strengths}
          </div>
          
          <div className="improvements">
            <strong>Improvements:</strong> {result.improvements}
          </div>
          
          {(result.keyPointsMatched.length > 0 || result.keyPointsMissed.length > 0) && (
            <div className="key-points">
              {result.keyPointsMatched.length > 0 && (
                <div className="matched">
                  <strong>Key Points Matched:</strong>
                  <ul>
                    {result.keyPointsMatched.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {result.keyPointsMissed.length > 0 && (
                <div className="missed">
                  <strong>Key Points Missed:</strong>
                  <ul>
                    {result.keyPointsMissed.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Basic scoring for non-AI attempts */}
      {!hasAIScoring && (
        <div className="basic-scoring">
          <span className="result-badge">
            {result.correct ? 'CORRECT' : 'INCORRECT'}
          </span>
        </div>
      )}
    </div>
  );
};
```

### 3. Attempt List with Remark Indicators
```javascript
const AttemptList = ({ attempts }) => {
  return (
    <div className="attempt-list">
      {attempts.map(attempt => (
        <div key={attempt.id} className="attempt-item">
          <div className="attempt-header">
            <h3>{attempt.testName}</h3>
            <div className="attempt-meta">
              <span className="score">{attempt.score}%</span>
              
              {/* Show remark indicator */}
              {attempt.remarkCount > 0 && (
                <span className="remark-indicator" title={`Re-marked ${attempt.remarkCount} times`}>
                  AI-Scored
                </span>
              )}
              
              {/* Show remark button if not AI-scored */}
              {!attempt.perQuestionResults?.q0?.aiScore && (
                <button 
                  onClick={() => handleRemark(attempt.id)}
                  className="small-remark-button"
                >
                  Re-mark
                </button>
              )}
            </div>
          </div>
          
          <div className="attempt-details">
            <span>{new Date(attempt.submittedAt).toLocaleDateString()}</span>
            {attempt.lastRemarkedAt && (
              <span>Re-marked: {new Date(attempt.lastRemarkedAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
```

## CSS Styling

### Remark Button Styles
```css
.remark-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.remark-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.remark-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.small-remark-button {
  background: #667eea;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}
```

### Score Improvement Display
```css
.score-improvement {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-top: 10px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
}

.old-score {
  color: #6c757d;
  text-decoration: line-through;
}

.new-score {
  color: #28a745;
  font-weight: bold;
}

.improvement {
  color: #28a745;
  font-weight: bold;
  font-size: 1.1em;
}

.improvement.negative {
  color: #dc3545;
}
```

### AI Scoring Badges
```css
.ai-scoring {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-top: 15px;
}

.score-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.confidence {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.confidence.high {
  background: #d4edda;
  color: #155724;
}

.confidence.medium {
  background: #fff3cd;
  color: #856404;
}

.confidence.low {
  background: #f8d7da;
  color: #721c24;
}

.key-points {
  margin-top: 10px;
}

.key-points .matched {
  color: #28a745;
}

.key-points .missed {
  color: #dc3545;
}
```

## User Experience Flow

### 1. Identify Attempts for Remarking
- Show "Re-mark with AI" button for attempts without AI scoring
- Display "AI-Scored" indicator for already remarked attempts

### 2. Remarking Process
- Show loading state during AI processing
- Display score improvement after remarking
- Update all question results with AI evaluation

### 3. Enhanced Results Display
- Show AI scores alongside basic correct/incorrect
- Display confidence levels and detailed feedback
- Highlight key points matched vs missed

## Error Handling

```javascript
const handleRemark = async (attemptId) => {
  try {
    const response = await fetch(`/api/attempts/${attemptId}/remark`, {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Attempt not found');
      } else if (response.status === 400) {
        throw new Error('Attempt cannot be re-marked - missing required data');
      } else {
        throw new Error('Failed to re-mark attempt');
      }
    }
    
    // Handle success
    updateAttemptResults(data.data);
    
  } catch (error) {
    console.error('Remark failed:', error);
    // Show user-friendly error message
    setErrorMessage(error.message);
  }
};
```

## Benefits

1. **Fair Scoring**: Students get partial credit for partially correct answers
2. **Detailed Feedback**: AI provides specific strengths and improvement areas
3. **Score Transparency**: Shows before/after comparison
4. **Progressive Enhancement**: Old attempts can be upgraded without retaking tests
5. **User Choice**: Users can choose when to re-mark their attempts

## Testing Scenarios

1. **First-time remarking**: Attempt with basic scoring gets AI evaluation
2. **Multiple remarks**: Track remark count and timestamps
3. **Error handling**: Invalid attempt IDs, missing data
4. **Score comparison**: Display improvement/regression
5. **UI updates**: Replace old results with new AI-powered results

The remarking feature provides a seamless way to upgrade old attempts with modern AI-powered evaluation, giving users fairer scoring and detailed feedback without requiring them to retake tests.
