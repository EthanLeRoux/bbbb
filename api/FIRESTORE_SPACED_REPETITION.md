# Firestore Spaced Repetition System Schema

## Database Structure for Firestore

### 1. Test Attempts Collection
**Collection**: `test_attempts`

```typescript
interface TestAttempt {
  id: string; // Firestore document ID
  userId: string;
  domainId: string;
  sectionId: string;
  materialTypeId: string;
  
  // Performance Metrics
  scorePercent: number; // 0-100
  totalQuestions: number;
  correctAnswers: number;
  avgTimePerQuestion: number; // seconds
  
  // Timestamps
  completedAt: Timestamp;
  createdAt: Timestamp;
  
  // Computed fields (optional, for queries)
  recallQuality: 'fail' | 'again' | 'hard' | 'good' | 'easy';
  retentionStrength: number; // 0.1-10.0
}
```

### 2. Review Stats Collection  
**Collection**: `review_stats`

```typescript
interface ReviewStats {
  id: string; // Firestore document ID (composite: userId_entityType_entityId)
  userId: string;
  entityType: 'domain' | 'section' | 'material';
  entityId: string;
  
  // Performance Metrics
  avgScore: number; // 0-100
  weightedScore: number; // 0-100 with recency decay
  
  // Spaced Repetition Metrics
  reviewCount: number;
  streak: number;
  lapseCount: number;
  retentionStrength: number; // 0.1-10.0
  priorityScore: number; // 0-100
  
  // Scheduling
  lastReviewedAt: Timestamp | null;
  nextReviewAt: Timestamp | null;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Hierarchical data (for aggregation)
  childStats?: {
    materials: string[]; // IDs of child materials
    sections: string[]; // IDs of child sections
  };
}
```

### 3. Indexes for Performance

#### Composite Indexes needed:
```javascript
// For user's review schedule
test_attempts
- userId (ascending)
- completedAt (descending)

// For hierarchical queries  
test_attempts
- userId (ascending)
- domainId (ascending)
- sectionId (ascending)
- materialTypeId (ascending)
- completedAt (descending)

// For priority-based review scheduling
review_stats
- userId (ascending)
- priorityScore (descending)
- nextReviewAt (ascending)

// For entity-specific queries
review_stats
- userId (ascending)
- entityType (ascending)
- entityId (ascending)
```

## Firestore Data Structure

### Document ID Strategy
```typescript
// Review Stats document IDs: userId_entityType_entityId
const reviewStatsId = `${userId}_${entityType}_${entityId}`;

// Examples:
// "user123_domain_networking"
// "user123_section_ip-addressing" 
// "user123_material_cidr"
```

### Hierarchical Relationships
```typescript
// Domain -> Section -> Material hierarchy
const hierarchy = {
  domains: {
    "domain-networking": {
      name: "Networking",
      sections: ["section-ip-addressing", "section-subnetting"]
    }
  },
  sections: {
    "section-ip-addressing": {
      name: "IP Addressing", 
      domainId: "domain-networking",
      materials: ["material-cidr", "material-subnetting"]
    }
  },
  materials: {
    "material-cidr": {
      name: "CIDR",
      sectionId: "section-ip-addressing"
    }
  }
};
```

## Query Patterns

### Get User's Due Reviews
```javascript
const dueReviews = await db.collection('review_stats')
  .where('userId', '==', userId)
  .where('nextReviewAt', '<=', new Date())
  .orderBy('priorityScore', 'desc')
  .get();
```

### Get Recent Test Attempts for Entity
```javascript
const recentAttempts = await db.collection('test_attempts')
  .where('userId', '==', userId)
  .where('materialTypeId', '==', materialId)
  .orderBy('completedAt', 'desc')
  .limit(10)
  .get();
```

### Get User Performance Trend
```javascript
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

const recentAttempts = await db.collection('test_attempts')
  .where('userId', '==', userId)
  .where('completedAt', '>=', thirtyDaysAgo)
  .orderBy('completedAt', 'desc')
  .get();
```

## Batch Operations for Hierarchical Updates

### Update Hierarchy After Test Submission
```javascript
const batch = db.batch();

// 1. Save test attempt
const attemptRef = db.collection('test_attempts').doc();
batch.set(attemptRef, testAttemptData);

// 2. Update material stats
const materialStatsRef = db.collection('review_stats').doc(`${userId}_material_${materialId}`);
batch.update(materialStatsRef, materialUpdateData);

// 3. Update section stats (aggregated from materials)
const sectionStatsRef = db.collection('review_stats').doc(`${userId}_section_${sectionId}`);
batch.update(sectionStatsRef, sectionUpdateData);

// 4. Update domain stats (aggregated from sections)
const domainStatsRef = db.collection('review_stats').doc(`${userId}_domain_${domainId}`);
batch.update(domainStatsRef, domainUpdateData);

await batch.commit();
```

## Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /test_attempts/{attemptId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    match /review_stats/{statsId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

## Data Validation Functions

```typescript
// Validate test attempt data
export function validateTestAttempt(data: any): boolean {
  return (
    data.userId &&
    data.domainId &&
    data.sectionId &&
    data.materialTypeId &&
    typeof data.scorePercent === 'number' &&
    data.scorePercent >= 0 &&
    data.scorePercent <= 100 &&
    typeof data.totalQuestions === 'number' &&
    data.totalQuestions > 0 &&
    typeof data.correctAnswers === 'number' &&
    data.correctAnswers >= 0 &&
    data.correctAnswers <= data.totalQuestions
  );
}

// Validate review stats data
export function validateReviewStats(data: any): boolean {
  return (
    data.userId &&
    ['domain', 'section', 'material'].includes(data.entityType) &&
    data.entityId &&
    typeof data.avgScore === 'number' &&
    data.avgScore >= 0 &&
    data.avgScore <= 100 &&
    typeof data.weightedScore === 'number' &&
    data.weightedScore >= 0 &&
    data.weightedScore <= 100
  );
}
```

## Migration Strategy

### From Existing Test Attempts
```typescript
// Migrate existing attempts to new schema
export async function migrateTestAttempts() {
  const attempts = await db.collection('attempts').get();
  
  const batch = db.batch();
  
  attempts.forEach(doc => {
    const data = doc.data();
    const newAttempt = {
      userId: data.userId,
      domainId: data.testId, // Map from existing test structure
      sectionId: extractSectionId(data.testId),
      materialTypeId: extractMaterialId(data.testId),
      scorePercent: data.score,
      totalQuestions: data.totalQuestions,
      correctAnswers: data.correctCount,
      avgTimePerQuestion: data.totalTime / data.totalQuestions,
      completedAt: data.submittedAt,
      createdAt: data.submittedAt
    };
    
    const newRef = db.collection('test_attempts').doc();
    batch.set(newRef, newAttempt);
  });
  
  await batch.commit();
}
```
