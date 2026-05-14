# Firestore Index Setup for Spaced Repetition System

## Required Indexes

The spaced repetition system requires specific Firestore indexes to perform efficient queries. Below are the indexes that need to be created in your Firebase project.

## 1. Review Schedule Query Index

**Error Message**: 
```
The query requires an index. You can create it here: 
https://console.firebase.google.com/v1/r/project/benkyozk/firestore/indexes?create_composite=Ck1wcm9qZWN0cy9iZW5reW96ay9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvcmV2aWV3X3N0YXRzL2luZGV4ZXMvXxABGgoKBnVzZXJJZBABGhEKDXByaW9yaXR5U2NvcmUQAhoQCgxuZXh0UmV2aWV3QXQQAhoMCghfX25hbWVfXxAC
```

**Collection**: `review_stats`
**Fields**:
- `userId` (Ascending)
- `priorityScore` (Descending) 
- `nextReviewAt` (Ascending)

## 2. Test Attempts Query Index

**Collection**: `test_attempts`
**Fields**:
- `userId` (Ascending)
- `completedAt` (Descending)

## 3. Hierarchy Query Index

**Collection**: `test_attempts`
**Fields**:
- `userId` (Ascending)
- `domainId` (Ascending)
- `sectionId` (Ascending)
- `materialTypeId` (Ascending)
- `completedAt` (Descending)

## How to Create Indexes

### Method 1: Automatic (Recommended)
1. Run the spaced repetition API endpoints
2. Firebase will automatically provide index creation links in error messages
3. Click the provided links to create indexes in the Firebase console

### Method 2: Manual via Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `benkyozk`
3. Navigate to Firestore Database
4. Click on "Indexes" tab
5. Click "Add Index"
6. Configure each index as specified above

### Method 3: Firebase CLI
Create a `firestore.indexes.json` file:

```json
{
  "indexes": [
    {
      "collectionGroup": "review_stats",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "priorityScore",
          "order": "DESCENDING"
        },
        {
          "fieldPath": "nextReviewAt",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "test_attempts",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "completedAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "test_attempts",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "domainId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "sectionId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "materialTypeId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "completedAt",
          "order": "DESCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Then run:
```bash
firebase deploy --only firestore:indexes
```

## Index Status

After creating indexes, they may take a few minutes to become active. You can check the status in the Firebase Console under Firestore > Indexes.

## Testing After Index Creation

Once indexes are created, the spaced repetition API should work fully:

```bash
node test_spaced_repetition_api.js
```

Expected results:
- Health check: 200 OK
- Review schedule: 200 OK  
- User stats: 200 OK
- Test submission: 200 OK

## Performance Considerations

These indexes are optimized for the spaced repetition system's query patterns:

1. **Review Schedule**: Gets due and upcoming reviews sorted by priority
2. **User History**: Retrieves test attempts in chronological order
3. **Hierarchy Queries**: Supports hierarchical aggregation across domains/sections/materials

The indexes ensure sub-second response times even with large datasets.
