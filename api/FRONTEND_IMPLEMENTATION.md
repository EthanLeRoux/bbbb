# Frontend Implementation Instructions
## Daily Review Schedule System Integration

### Overview
The backend now provides a comprehensive daily review schedule system that generates prioritized study queues. Frontend integration requires implementing the following:

---

## 1. API Endpoints

### Generate Daily Schedule
```
POST /api/review-schedule/generate
Content-Type: application/json

Request Body:
{
  "domain": "networking",           // Optional: filter by domain
  "section": "dns",                // Optional: filter by section  
  "limit": 50,                     // Optional: max items (default: 50)
  "includeOverdueOnly": false        // Optional: only overdue items
}

Response:
{
  "success": true,
  "data": {
    "generatedAt": "2026-04-30T19:56:00.000Z",
    "totalConcepts": 45,
    "scheduledItems": 15,
    "items": [
      {
        "conceptId": "dns-basics",
        "domain": "networking",
        "section": "dns", 
        "vaultId": "networking__dns__dns-basics",
        "dueReason": "overdue-recent-failures",
        "priorityScore": 25.5,
        "isOverdue": true,
        "explanation": "Overdue by 3 days; Failed 2 times recently",
        "lastReviewed": "2026-04-25T10:30:00.000Z",
        "nextReviewDate": "2026-04-27T10:30:00.000Z",
        "masteryLevel": "beginner",
        "retentionStrength": 0.3,
        "accuracyRate": 45.0,
        "reviewCount": 5
      }
    ],
    "summary": {
      "overdueCount": 8,
      "recentFailureCount": 12,
      "weaknessCount": 6,
      "domainBreakdown": {
        "networking": 10,
        "cybersecurity": 5
      }
    }
  }
}
```

### Domain-Specific Schedule
```
GET /api/review-schedule/domain/:domain?limit=50&includeOverdueOnly=false

Response: Same format as above, filtered by domain
```

### Section-Specific Schedule  
```
GET /api/review-schedule/domain/:domain/section/:section?limit=50

Response: Same format as above, filtered by domain and section
```

### Overdue Items Only
```
GET /api/review-schedule/overdue?domain=networking&section=dns&limit=50

Response: Same format, only overdue items
```

### Top Priority Concepts
```
GET /api/review-schedule/top-priority?count=10&domain=networking

Response: Same format, top N concepts by priority score
```

---

## 2. Frontend Component Structure

### ReviewScheduleService.js
```javascript
class ReviewScheduleService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
  }

  async generateSchedule(options = {}) {
    const response = await fetch(`${this.baseURL}/review-schedule/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });
    return response.json();
  }

  async getDomainSchedule(domain, options = {}) {
    const params = new URLSearchParams(options).toString();
    const response = await fetch(`${this.baseURL}/review-schedule/domain/${domain}?${params}`);
    return response.json();
  }

  async getSectionSchedule(domain, section, options = {}) {
    const params = new URLSearchParams(options).toString();
    const response = await fetch(`${this.baseURL}/review-schedule/domain/${domain}/section/${section}?${params}`);
    return response.json();
  }

  async getOverdueItems(options = {}) {
    const params = new URLSearchParams(options).toString();
    const response = await fetch(`${this.baseURL}/review-schedule/overdue?${params}`);
    return response.json();
  }

  async getTopPriorityConcepts(count = 10, options = {}) {
    const params = new URLSearchParams({ ...options, count }).toString();
    const response = await fetch(`${this.baseURL}/review-schedule/top-priority?${params}`);
    return response.json();
  }
}
```

### ReviewSchedule.jsx Component
```jsx
import React, { useState, useEffect } from 'react';
import { ReviewScheduleService } from '../services/ReviewScheduleService';

const ReviewSchedule = () => {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    domain: '',
    section: '',
    limit: 50,
    includeOverdueOnly: false
  });

  useEffect(() => {
    loadSchedule();
  }, [filters]);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const result = await ReviewScheduleService.generateSchedule(filters);
      setSchedule(result.data);
    } catch (error) {
      console.error('Failed to load schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (score) => {
    if (score >= 30) return 'red';
    if (score >= 20) return 'orange'; 
    if (score >= 10) return 'yellow';
    return 'green';
  };

  const getDueReasonBadge = (reason) => {
    const reasons = reason.split('-');
    return reasons.map(r => (
      <span key={r} className={`badge badge-${r}`}>
        {r.replace('-', ' ')}
      </span>
    ));
  };

  return (
    <div className="review-schedule">
      <div className="schedule-header">
        <h2>Daily Review Schedule</h2>
        <div className="filters">
          <select 
            value={filters.domain} 
            onChange={(e) => setFilters({...filters, domain: e.target.value})}
          >
            <option value="">All Domains</option>
            <option value="networking">Networking</option>
            <option value="cybersecurity">Cybersecurity</option>
            <option value="programming">Programming</option>
          </select>
          
          <select 
            value={filters.section}
            onChange={(e) => setFilters({...filters, section: e.target.value})}
            disabled={!filters.domain}
          >
            <option value="">All Sections</option>
            {/* Sections populated based on selected domain */}
          </select>
          
          <label>
            <input 
              type="checkbox" 
              checked={filters.includeOverdueOnly}
              onChange={(e) => setFilters({...filters, includeOverdueOnly: e.target.checked})}
            />
            Overdue Only
          </label>
        </div>
      </div>

      {loading && <div className="loading">Loading schedule...</div>}
      
      {schedule && (
        <>
          <div className="schedule-summary">
            <h3>Summary</h3>
            <div className="summary-stats">
              <div className="stat">
                <span className="stat-value">{schedule.scheduledItems}</span>
                <span className="stat-label">Scheduled</span>
              </div>
              <div className="stat">
                <span className="stat-value overdue">{schedule.summary.overdueCount}</span>
                <span className="stat-label">Overdue</span>
              </div>
              <div className="stat">
                <span className="stat-value">{schedule.summary.recentFailureCount}</span>
                <span className="stat-label">Recent Failures</span>
              </div>
            </div>
          </div>

          <div className="schedule-items">
            <h3>Prioritized Concepts</h3>
            {schedule.items.map((item, index) => (
              <div key={item.conceptId} className={`schedule-item priority-${getPriorityColor(item.priorityScore)}`}>
                <div className="item-header">
                  <span className="priority-score">{item.priorityScore}</span>
                  <span className="concept-name">{item.conceptId}</span>
                  <div className="due-reasons">
                    {getDueReasonBadge(item.dueReason)}
                  </div>
                </div>
                
                <div className="item-details">
                  <div className="location">
                    <span className="domain">{item.domain}</span>
                    <span className="separator">/</span>
                    <span className="section">{item.section}</span>
                  </div>
                  
                  <div className="performance">
                    <div className="metric">
                      <span className="label">Accuracy:</span>
                      <span className="value">{item.accuracyRate}%</span>
                    </div>
                    <div className="metric">
                      <span className="label">Mastery:</span>
                      <span className="value">{item.masteryLevel}</span>
                    </div>
                    <div className="metric">
                      <span className="label">Reviews:</span>
                      <span className="value">{item.reviewCount}</span>
                    </div>
                  </div>
                  
                  <div className="explanation">
                    <strong>Why:</strong> {item.explanation}
                  </div>
                  
                  <div className="dates">
                    <div className="date">
                      <span className="label">Last Reviewed:</span>
                      <span className="value">{new Date(item.lastReviewed).toLocaleDateString()}</span>
                    </div>
                    {item.isOverdue && (
                      <div className="date overdue">
                        <span className="label">Due:</span>
                        <span className="value">{new Date(item.nextReviewDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="item-actions">
                  <button className="btn btn-primary" onClick={() => startReview(item)}>
                    Start Review
                  </button>
                  <button className="btn btn-secondary" onClick={() => viewDetails(item)}>
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
```

---

## 3. CSS Styling

### ReviewSchedule.css
```css
.review-schedule {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.schedule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.filters {
  display: flex;
  gap: 15px;
  align-items: center;
}

.filters select, .filters label {
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.schedule-summary {
  background: #e9ecef;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.summary-stats {
  display: flex;
  gap: 30px;
}

.stat {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 2em;
  font-weight: bold;
  color: #495057;
}

.stat-value.overdue {
  color: #dc3545;
}

.stat-label {
  display: block;
  font-size: 0.9em;
  color: #6c757d;
  margin-top: 5px;
}

.schedule-items {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.schedule-item {
  border: 1px solid #dee2e6;
  border-left: 4px solid #28a745;
  margin-bottom: 15px;
  transition: all 0.3s ease;
}

.schedule-item.priority-red {
  border-left-color: #dc3545;
}

.schedule-item.priority-orange {
  border-left-color: #fd7e14;
}

.schedule-item.priority-yellow {
  border-left-color: #ffc107;
}

.schedule-item.priority-green {
  border-left-color: #28a745;
}

.schedule-item:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.priority-score {
  background: #007bff;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: bold;
  font-size: 0.9em;
}

.concept-name {
  font-weight: bold;
  font-size: 1.1em;
  color: #495057;
}

.due-reasons {
  display: flex;
  gap: 5px;
}

.badge {
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.7em;
  font-weight: 500;
  text-transform: lowercase;
}

.badge-overdue {
  background: #dc3545;
  color: white;
}

.badge-recent-failures {
  background: #fd7e14;
  color: white;
}

.badge-weakness {
  background: #ffc107;
  color: #212529;
}

.badge-slow-recall {
  background: #17a2b8;
  color: white;
}

.item-details {
  padding: 20px;
}

.location {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
  color: #6c757d;
}

.separator {
  color: #adb5bd;
}

.performance {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.metric {
  text-align: center;
}

.metric .label {
  display: block;
  font-size: 0.8em;
  color: #6c757d;
  margin-bottom: 5px;
}

.metric .value {
  font-weight: bold;
  color: #495057;
}

.explanation {
  background: #e7f3ff;
  padding: 15px;
  border-radius: 6px;
  border-left: 4px solid #007bff;
  margin-bottom: 15px;
}

.dates {
  display: flex;
  gap: 20px;
  font-size: 0.9em;
}

.date.overdue .value {
  color: #dc3545;
  font-weight: bold;
}

.item-actions {
  padding: 15px 20px;
  background: #f8f9fa;
  border-top: 1px solid #dee2e6;
  display: flex;
  gap: 10px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

.loading {
  text-align: center;
  padding: 40px;
  font-size: 1.1em;
  color: #6c757d;
}
```

---

## 4. Integration Points

### Navigation Integration
```javascript
// Add to main navigation
const Navigation = () => {
  return (
    <nav>
      <Link to="/review-schedule">Review Schedule</Link>
      {/* Other navigation items */}
    </nav>
  );
};
```

### Route Configuration
```javascript
// Add to main router
import ReviewSchedule from './components/ReviewSchedule';

const AppRouter = () => {
  return (
    <Router>
      <Route path="/review-schedule" component={ReviewSchedule} />
      {/* Other routes */}
    </Router>
  );
};
```

### Study Session Integration
```javascript
const startReview = (concept) => {
  // Navigate to study session with concept data
  history.push(`/study/${concept.domain}/${concept.section}/${concept.conceptId}`, {
    conceptData: concept,
    fromReviewSchedule: true
  });
};

const viewDetails = (concept) => {
  // Show detailed concept performance modal
  setSelectedConcept(concept);
  setShowDetailsModal(true);
};
```

---

## 5. Error Handling

### API Error Handling
```javascript
const loadSchedule = async () => {
  setLoading(true);
  try {
    const result = await ReviewScheduleService.generateSchedule(filters);
    if (result.success) {
      setSchedule(result.data);
    } else {
      setError(result.error || 'Failed to load schedule');
    }
  } catch (error) {
    console.error('API Error:', error);
    setError('Network error. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

### User Feedback
```javascript
// Show loading states
{loading && <LoadingSpinner />}

// Show error messages
{error && <Alert type="error" message={error} />}

// Show empty state
{schedule?.items.length === 0 && (
  <EmptyState 
    title="No items scheduled"
    message="Try adjusting filters or check back later."
  />
)}
```

---

## 6. Testing

### Test Scenarios
1. **Load Schedule**: Verify schedule loads with default filters
2. **Domain Filter**: Test domain-specific filtering works
3. **Section Filter**: Test section-specific filtering works  
4. **Overdue Only**: Test overdue-only filter works
5. **Priority Sorting**: Verify items sorted by priority score
6. **Error Handling**: Test network errors and invalid responses
7. **Empty States**: Test behavior when no items match filters

### Mock Data for Testing
```javascript
const mockScheduleResponse = {
  success: true,
  data: {
    generatedAt: new Date().toISOString(),
    totalConcepts: 10,
    scheduledItems: 5,
    items: [
      {
        conceptId: "test-concept",
        domain: "networking",
        section: "dns",
        vaultId: "networking__dns__test-concept",
        dueReason: "overdue",
        priorityScore: 25.5,
        isOverdue: true,
        explanation: "Overdue by 3 days",
        lastReviewed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        nextReviewDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        masteryLevel: "beginner",
        retentionStrength: 0.3,
        accuracyRate: 45.0,
        reviewCount: 5
      }
    ],
    summary: {
      overdueCount: 3,
      recentFailureCount: 5,
      weaknessCount: 2,
      domainBreakdown: { networking: 5 }
    }
  }
};
```

---

## 7. Performance Considerations

### Optimization Tips
1. **Caching**: Cache schedule data for 5-10 minutes
2. **Pagination**: Implement virtual scrolling for large schedules
3. **Debouncing**: Debounce filter changes (300ms)
4. **Lazy Loading**: Load concept details on demand
5. **Background Refresh**: Auto-refresh schedule every 30 minutes

### User Experience
1. **Visual Priority**: Use color coding for priority levels
2. **Quick Actions**: One-click start review buttons
3. **Progress Tracking**: Show review completion progress
4. **Responsive Design**: Mobile-friendly layout
5. **Keyboard Navigation**: Support keyboard shortcuts

---

## 8. Deployment Notes

### Environment Variables
```bash
REACT_APP_API_URL=http://localhost:4000/api
REACT_APP_REFRESH_INTERVAL=300000  # 5 minutes in ms
```

### Build Considerations
1. **API Base URL**: Configure for different environments
2. **Error Boundaries**: Implement error boundaries for error handling
3. **Service Workers**: Consider offline functionality
4. **Analytics**: Track user interactions with schedule system

This implementation provides a complete frontend solution for the daily review schedule system with proper error handling, user feedback, and performance optimization.
