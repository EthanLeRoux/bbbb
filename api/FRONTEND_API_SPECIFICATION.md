# Frontend API Specification: AI-Powered Features

## JSON Response Formats & Request Data

This document provides the exact JSON structures and API endpoints needed for frontend implementation of AI-powered features.

---

## 1. Attempt Submission (Updated with AI Features)

### Endpoint: POST /api/attempts/submit

#### Request Body
```json
{
  "attemptId": "attempt-uuid-123",
  "testId": "test-uuid-456", 
  "answers": {
    "q0": "User's answer to question 1",
    "q1": "User's answer to question 2",
    "q2": "User's answer to question 3"
  },
  "timings": {
    "q0": 92,
    "q1": 58,
    "q2": 45
  }
}
```

#### Response Body
```json
{
  "success": true,
  "data": {
    "attemptId": "attempt-uuid-123",
    "testId": "test-uuid-456",
    "testName": "Network Security Fundamentals",
    "testTopic": "Network Security",
    "testDifficulty": "hard",
    "testDomain": "university", 
    "testSection": "cybersecurity",
    "score": 75.0,
    "correctCount": 1,
    "totalQuestions": 3,
    "totalTime": 195,
    "perQuestionResults": {
      "q0": {
        "correct": false,
        "expectedAnswer": "A HIDS is security software that monitors a single device for suspicious or malicious activity by collecting and analyzing system activity on the host itself.",
        "userAnswer": "An HID is for detecting unusual traffic that indicate intrusion attempts and alert the user,as a safeguard for an individual host device. it contributes to the overall depth in the network defense.",
        "timing": 92,
        "question": "What is the purpose of a Host-Based Intrusion Detection System (HIDS)?",
        "aiScore": 60,
        "confidence": "medium",
        "evaluation": "The student's answer demonstrates a partial understanding of the purpose of a Host-Based Intrusion Detection System (HIDS), but there are inaccuracies and missing key points.",
        "strengths": "The student correctly identified that HIDS is for detecting intrusion attempts and contributes to network defense.",
        "improvements": "The student's answer lacks clarity and precision in defining HIDS and its primary function. The explanation could be more detailed and accurate.",
        "keyPointsMatched": [
          "Detecting intrusion attempts",
          "Contributing to network defense"
        ],
        "keyPointsMissed": [
          "Monitoring a single device",
          "Collecting and analyzing system activity on the host itself",
          "Identifying suspicious or malicious activity"
        ]
      },
      "q1": {
        "correct": true,
        "expectedAnswer": "Defense in Depth is a security strategy that involves using multiple layers of protection instead of relying on a single control mechanism to enhance security resilience.",
        "userAnswer": "Defense in depth is the concept of using multiple layers of security to create a depth in the overall defense system of a network.",
        "timing": 58,
        "question": "Explain the concept of Defense in Depth in network security.",
        "aiScore": 85,
        "confidence": "high",
        "evaluation": "The student's answer demonstrates a good understanding of the concept of Defense in Depth in network security.",
        "strengths": "The student correctly identified the use of multiple layers of security to enhance the overall defense system of a network.",
        "improvements": "The answer could be improved by explicitly mentioning the strategy of using multiple layers of protection and emphasizing the aspect of resilience in security.",
        "keyPointsMatched": [
          "Using multiple layers of security",
          "Creating depth in the defense system"
        ],
        "keyPointsMissed": [
          "Emphasizing the strategy aspect",
          "Mentioning resilience in security"
        ]
      },
      "q2": {
        "correct": false,
        "expectedAnswer": "Firewall configuration sets rules for what traffic is allowed to enter or leave a network, acting as the first filter layer between the network and the outside world to prevent unauthorized access.",
        "userAnswer": "By configuring a firewall and setting its filters, we can prevent unwanted traffic from reaching the netowrk, which includes traffic that pose a risk to data safety, such as malware, ppshiging emails,etc. This ensures that risk is reduced/ mitigated.",
        "timing": 45,
        "question": "How does Firewall configuration contribute to network security?",
        "aiScore": 70,
        "confidence": "medium",
        "evaluation": "The answer provided focuses more on the types of threats blocked by a firewall rather than how firewall configuration contributes to network security.",
        "strengths": "The student understands the protective function of firewalls and mentions specific threat types.",
        "improvements": "Focus more on the configuration aspect and how rules control traffic flow rather than just listing threat types.",
        "keyPointsMatched": [
          "Preventing unwanted traffic",
          "Risk reduction"
        ],
        "keyPointsMissed": [
          "Setting rules for traffic control",
          "First filter layer concept",
          "Preventing unauthorized access"
        ]
      }
    },
    "critiques": {
      "perQuestionCritiques": {
        "q0": {
          "questionId": "q0",
          "question": "What is the purpose of a Host-Based Intrusion Detection System (HIDS)?",
          "userAnswer": "An HID is for detecting unusual traffic that indicate intrusion attempts and alert the user,as a safeguard for an individual host device. it contributes to the overall depth in the network defense.",
          "expectedAnswer": "A HIDS is security software that monitors a single device for suspicious or malicious activity by collecting and analyzing system activity on the host itself.",
          "critique": "Your answer focuses on network traffic detection, but HIDS specifically monitors system activity on the host device itself rather than network traffic.",
          "explanation": "A HIDS operates at the host level, analyzing system calls, file access patterns, and process behavior to detect malicious activities on individual devices.",
          "improvement": "Focus on understanding that HIDS monitors host-based indicators like file integrity, log analysis, and process monitoring rather than network traffic.",
          "confidence": "medium"
        },
        "q1": {
          "questionId": "q1",
          "question": "Explain the concept of Defense in Depth in network security.",
          "userAnswer": "Defense in depth is the concept of using multiple layers of security to create a depth in the overall defense system of a network.",
          "expectedAnswer": "Defense in Depth is a security strategy that involves using multiple layers of protection instead of relying on a single control mechanism to enhance security resilience.",
          "critique": "Your answer correctly identifies the multi-layer concept but could emphasize the strategic aspect and resilience benefits more clearly.",
          "explanation": "Defense in Depth is about creating redundancy in security controls so that if one layer fails, others continue to protect the system.",
          "improvement": "Study real-world examples of how multiple security layers (network, host, application, data) work together to provide comprehensive protection.",
          "confidence": "high"
        }
      },
      "overallWeaknesses": [
        "Misunderstanding the specific purpose of a Host-Based Intrusion Detection System (HIDS)",
        "Confusion between network-level and host-based security measures"
      ],
      "studyRecommendations": [
        "Review and study the specific functionalities and purposes of cybersecurity concepts like HIDS and Defense in Depth",
        "Focus on understanding the roles and importance of host-based security measures",
        "Practice applying these concepts in real-world scenarios to solidify understanding"
      ],
      "strengths": [
        "Demonstrated effort in explaining security concepts",
        "Good understanding of multi-layer security concepts",
        "Ability to connect security concepts to practical outcomes"
      ]
    },
    "submittedAt": "2026-04-30T08:54:00.000Z",
    "status": "completed"
  },
  "message": "Test attempt submitted successfully"
}
```

---

## 2. Attempt Remarking

### Endpoint: POST /api/attempts/:attemptId/remark

#### URL Parameters
- `attemptId` (string): The ID of the attempt to re-mark

#### Request Body
```json
{}
```

#### Response Body
```json
{
  "success": true,
  "data": {
    "attemptId": "attempt-uuid-123",
    "testId": "test-uuid-456",
    "testName": "Network Security Fundamentals",
    "testTopic": "Network Security",
    "testDifficulty": "hard",
    "testDomain": "university",
    "testSection": "cybersecurity",
    "score": 75.0,
    "originalScore": 0.0,
    "scoreChange": 75.0,
    "correctCount": 1,
    "totalQuestions": 3,
    "totalTime": 195,
    "perQuestionResults": {
      // Same structure as above with AI scoring
    },
    "critiques": {
      // Same structure as above with AI critiques
    },
    "submittedAt": "2026-04-29T10:00:00.000Z",
    "lastRemarkedAt": "2026-04-30T08:54:00.000Z",
    "remarkCount": 1,
    "status": "completed"
  },
  "message": "Attempt re-marked successfully with AI-powered scoring"
}
```

---

## 3. Get Attempt by ID

### Endpoint: GET /api/attempts/:attemptId

#### URL Parameters
- `attemptId` (string): The ID of the attempt

#### Response Body
```json
{
  "success": true,
  "data": {
    "id": "attempt-uuid-123",
    "testId": "test-uuid-456",
    "answers": {
      "q0": "User's answer to question 1",
      "q1": "User's answer to question 2"
    },
    "timings": {
      "q0": 92,
      "q1": 58
    },
    "score": 75.0,
    "correctCount": 1,
    "totalQuestions": 2,
    "totalTime": 150,
    "perQuestionResults": {
      // Same structure as above
    },
    "critiques": {
      // Same structure as above
    },
    "submittedAt": "2026-04-30T08:54:00.000Z",
    "lastRemarkedAt": "2026-04-30T08:54:00.000Z",
    "remarkCount": 1,
    "status": "completed"
  }
}
```

---

## 4. Get Attempts List

### Endpoint: GET /api/attempts

#### Query Parameters (Optional)
- `testId` (string): Filter by test ID
- `status` (string): Filter by status
- `limit` (number): Maximum results (default: 20)
- `offset` (number): Results offset (default: 0)
- `search` (string): Search in attempts

#### Response Body
```json
{
  "success": true,
  "data": [
    {
      "id": "attempt-uuid-123",
      "testId": "test-uuid-456",
      "score": 75.0,
      "correctCount": 1,
      "totalQuestions": 2,
      "submittedAt": "2026-04-30T08:54:00.000Z",
      "status": "completed",
      "remarkCount": 1,
      "lastRemarkedAt": "2026-04-30T08:54:00.000Z",
      "hasAIScoring": true
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 1,
    "hasMore": false
  }
}
```

---

## 5. Error Response Formats

### Standard Error Response
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### Validation Errors (400)
```json
{
  "success": false,
  "error": "Attempt ID is required and must be a non-empty string"
}
```

### Not Found Errors (404)
```json
{
  "success": false,
  "error": "Attempt not found"
}
```

### Service Errors (500)
```json
{
  "success": false,
  "error": "Failed to submit attempt"
}
```

---

## 6. Data Type Specifications

### Core Data Types
```typescript
interface AttemptData {
  attemptId: string;
  testId: string;
  testName: string;
  testTopic: string;
  testDifficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  testDomain: string;
  testSection: string;
  score: number; // 0-100 with AI scoring
  correctCount: number;
  totalQuestions: number;
  totalTime: number; // in seconds
  perQuestionResults: Record<string, QuestionResult>;
  critiques: CritiqueData | null;
  submittedAt: string; // ISO date string
  lastRemarkedAt?: string; // ISO date string
  remarkCount?: number;
  status: 'in_progress' | 'completed';
}

interface QuestionResult {
  correct: boolean;
  expectedAnswer: string;
  userAnswer: string;
  timing: number;
  question: string;
  aiScore?: number; // 0-100, present if AI scored
  confidence?: 'high' | 'medium' | 'low'; // present if AI scored
  evaluation?: string; // AI evaluation, present if AI scored
  strengths?: string; // AI identified strengths, present if AI scored
  improvements?: string; // AI improvement suggestions, present if AI scored
  keyPointsMatched?: string[]; // AI identified correct concepts, present if AI scored
  keyPointsMissed?: string[]; // AI identified missed concepts, present if AI scored
}

interface CritiqueData {
  perQuestionCritiques: Record<string, QuestionCritique>;
  overallWeaknesses: string[];
  studyRecommendations: string[];
  strengths: string[];
}

interface QuestionCritique {
  questionId: string;
  question: string;
  userAnswer: string;
  expectedAnswer: string;
  critique: string;
  explanation: string;
  improvement: string;
  confidence: 'high' | 'medium' | 'low';
}
```

---

## 7. Frontend Implementation Notes

### Detecting AI-Scored Attempts
```javascript
// Check if attempt has AI scoring
const hasAIScoring = attempt.perQuestionResults?.q0?.aiScore !== undefined;

// Check if attempt needs remarking
const needsRemarking = !hasAIScoring && attempt.status === 'completed';

// Check if attempt has been remarked
const hasBeenRemarked = attempt.remarkCount > 0;
```

### Score Comparison
```javascript
// Calculate score improvement
const scoreImprovement = attempt.scoreChange || 0;
const improved = scoreImprovement > 0;
const declined = scoreImprovement < 0;

// Format score display
const formatScore = (score) => `${score.toFixed(1)}%`;
const formatChange = (change) => `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
```

### Confidence Level Styling
```javascript
const getConfidenceColor = (confidence) => {
  switch (confidence) {
    case 'high': return '#28a745';
    case 'medium': return '#ffc107';
    case 'low': return '#dc3545';
    default: return '#6c757d';
  }
};

const getConfidenceIcon = (confidence) => {
  switch (confidence) {
    case 'high': return 'check-circle';
    case 'medium': return 'minus-circle';
    case 'low': return 'x-circle';
    default: return 'question-circle';
  }
};
```

### API Call Examples
```javascript
// Submit attempt
const submitAttempt = async (attemptId, testId, answers, timings) => {
  const response = await fetch('/api/attempts/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attemptId, testId, answers, timings })
  });
  return response.json();
};

// Re-mark attempt
const remarkAttempt = async (attemptId) => {
  const response = await fetch(`/api/attempts/${attemptId}/remark`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  return response.json();
};

// Get attempt details
const getAttempt = async (attemptId) => {
  const response = await fetch(`/api/attempts/${attemptId}`);
  return response.json();
};
```

---

## 8. Implementation Checklist

### Required Frontend Components
- [ ] AI Score Badge Component
- [ ] Confidence Level Indicator
- [ ] Question Result Component (with AI data)
- [ ] Critiques Section Component
- [ ] Study Recommendations Component
- [ ] Remark Button Component
- [ ] Score Improvement Display
- [ ] Test Header Component

### API Integration Points
- [ ] Update attempt submission handler
- [ ] Add remarking functionality
- [ ] Update attempt list display
- [ ] Handle AI scoring data in results
- [ ] Display critiques and recommendations

### Error Handling
- [ ] AI service unavailable fallback
- [ ] Remarking failure handling
- [ ] Network error handling
- [ ] Loading states for AI operations

---

This specification provides everything needed for frontend implementation of all AI-powered features. Use these exact JSON structures and API endpoints for seamless integration with the backend.
