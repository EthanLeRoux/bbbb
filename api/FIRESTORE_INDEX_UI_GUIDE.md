# Firestore Index Creation UI Guide

## Step-by-Step Instructions

### 1. Go to Firebase Console
- Open: https://console.firebase.google.com/
- Select project: **benkyozk**
- Go to **Firestore Database** (in left sidebar)

### 2. Navigate to Indexes
- In Firestore Database, click the **Indexes** tab
- Click the **+ Add Index** button

### 3. Configure the Index

Fill in the form exactly as shown below:

| Field | Value | Action |
|-------|-------|--------|
| **Collection ID** | `review_stats` | Type this exactly |
| **Query Scope** | `Collection` | Select from dropdown |
| **Field 1** | `userId` | Type this exactly |
| **Order 1** | `Ascending` | Select from dropdown |
| **Field 2** | `priorityScore` | Type this exactly |
| **Order 2** | `Descending` | Select from dropdown |
| **Field 3** | `nextReviewAt` | Type this exactly |
| **Order 3** | `Ascending` | Select from dropdown |

### 4. Visual Form Layout

```
Collection ID: [ review_stats           ]
Query Scope:  [ Collection         ]

=== Fields ===

Field 1: [ userId      ] [ Ascending  ]
Field 2: [ priorityScore ] [ Descending ]
Field 3: [ nextReviewAt ] [ Ascending  ]

[ + Add Field ]  [ - Remove ]
```

### 5. Create the Index
- Click **Create** button
- Wait for index to build (usually 1-2 minutes)

## Alternative: Quick Auto-Create Link

If you want to skip the manual setup, click this link:
```
https://console.firebase.google.com/v1/r/project/benkyozk/firestore/indexes?create_composite=Ck1wcm9qZWN0cy9iZW5reW96ay9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvcmV2aWV3X3N0YXRzL2luZGV4ZXMvXxABGgoKBnVzZXJJZBABGhEKDXByaW9yaXR5U2NvcmUQAhoQCgxuZXh0UmV2aWV3QXQQAhoMCghfX25hbWVfXxAC
```

This will pre-fill the form with the exact values above.

## Verification

After creating the index, you should see it in the indexes list:

| Collection | Fields | Status | Size |
|------------|--------|--------|------|
| review_stats | userId (Asc), priorityScore (Desc), nextReviewAt (Asc) | Enabled | ~1KB |

## Test the API

Once the index shows "Enabled", test the API:

```bash
node test_spaced_repetition_api.js
```

Expected result: All endpoints should return 200 OK.

## Troubleshooting

**If you get an error:**
- Double-check field names are spelled exactly: `userId`, `priorityScore`, `nextReviewAt`
- Ensure the order is correct: Ascending, Descending, Ascending
- Wait 2-3 minutes for index to become fully active

**If the link doesn't work:**
- Make sure you're logged into the correct Google account
- Ensure you have access to the `benkyozk` Firebase project

## Additional Indexes (Optional)

For optimal performance, you may also want to create these additional indexes:

### Test Attempts Index
| Collection ID | Field 1 | Order 1 | Field 2 | Order 2 |
|---------------|---------|---------|---------|---------|
| test_attempts | userId | Ascending | completedAt | Descending |

### Hierarchy Query Index  
| Collection ID | Field 1 | Order 1 | Field 2 | Order 2 | Field 3 | Order 3 | Field 4 | Order 4 | Field 5 | Order 5 |
|---------------|---------|---------|---------|---------|---------|---------|---------|---------|---------|---------|
| test_attempts | userId | Ascending | domainId | Ascending | sectionId | Ascending | materialTypeId | Ascending | completedAt | Descending |

These are optional - the main spaced repetition functionality only needs the first index.
