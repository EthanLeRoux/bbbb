# AI Short-Answer Test Generation System

A production-ready Node.js backend system that generates short-answer questions exclusively from vault study material using OpenAI API.

## Features

- **Vault Integration**: Retrieves notes from existing vault system by domain/section
- **AI-Powered Generation**: Uses OpenAI to generate short-answer questions only
- **Content-Only**: Questions generated exclusively from supplied vault material
- **MongoDB Storage**: Saves generated tests with full metadata
- **RESTful API**: Complete API for generation, retrieval, and management
- **Production Ready**: Error handling, retries, validation, and logging

## File Structure

```
benkyozk/
Services/
  promptBuilder.js      # Builds optimized OpenAI prompts
  aiProvider.js        # Handles OpenAI API communication
  testGenerationService.js  # Main orchestration service
  vaultService.js      # Existing vault system (unchanged)
models/
  Test.js              # MongoDB schema for generated tests
controllers/
  testController.js    # HTTP request/response handling
Routes/
  testRoutes.js        # Express routes for test endpoints
  vaultRoutes.js       # Existing vault routes (unchanged)
index.js               # Main application (updated)
```

## Core Components

### 1. Prompt Builder (`Services/promptBuilder.js`)

Builds optimized prompts for OpenAI with strict instructions:
- Extracts key concepts and definitions
- Cleans note content (removes metadata, links)
- Provides difficulty-specific instructions
- Enforces short-answer format only

### 2. AI Provider (`Services/aiProvider.js`)

Handles OpenAI API communication:
- Retry logic with exponential backoff
- JSON parsing and validation
- Short-answer format verification
- Error handling and timeouts

### 3. Test Generation Service (`Services/testGenerationService.js`)

Main orchestration service:
- Retrieves vault notes by domain/section
- Builds prompts and sends to AI
- Validates responses
- Saves to MongoDB
- Provides test management methods

### 4. Test Model (`models/Test.js`)

MongoDB schema with:
- Full test metadata (domain, section, difficulty)
- Array of short-answer questions
- Indexes for performance
- Validation and helper methods

### 5. Controller & Routes

RESTful API endpoints:
- Generate tests
- Retrieve tests (with filtering)
- Get specific tests
- Delete tests
- Statistics and health checks

## API Endpoints

### Generate Test
```
POST /api/tests/generate
Content-Type: application/json

{
  "domain": "network-security",
  "section": "dns",
  "difficulty": "medium",
  "questionCount": 10
}
```

### Response
```json
{
  "success": true,
  "data": {
    "_id": "64b8f9a1b2c3d4e5f6a7b8c9",
    "domain": "network-security",
    "section": "DNS",
    "topic": "DNS",
    "difficulty": "medium",
    "shortAnswerQuestions": [
      {
        "question": "What is DNS and what is its primary function?",
        "answer": "DNS (Domain Name System) is a hierarchical distributed naming system that translates human-readable domain names into machine-readable IP addresses.",
        "sourceConcept": "DNS definition"
      }
    ],
    "questionCount": 1,
    "createdAt": "2023-07-20T10:30:00.000Z"
  },
  "message": "Successfully generated 1 short-answer questions"
}
```

### List Tests
```
GET /api/tests?domain=network-security&difficulty=medium&limit=10&offset=0
```

### Get Test by ID
```
GET /api/tests/64b8f9a1b2c3d4e5f6a7b8c9
```

### Delete Test
```
DELETE /api/tests/64b8f9a1b2c3d4e5f6a7b8c9
```

### Statistics
```
GET /api/tests/stats
```

### Health Check
```
GET /api/tests/health
```

### API Documentation
```
GET /api/tests/docs
```

## Environment Variables

Required in `.env` file:
```
# Existing variables
MONGO_URI=mongodb://localhost:27017/benkyozk
VAULT_PATH=/path/to/obsidian/vault

# New required variable
OPENAI_API_KEY=sk-your-openai-api-key-here

# Optional
PORT=4000
NODE_ENV=development
```

## Integration Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create/update `.env` with OpenAI API key:
```
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 3. Start Server
```bash
npm start
```

### 4. Verify Integration
```bash
# Check health
curl http://localhost:4000/api/health

# Check test service health
curl http://localhost:4000/api/tests/health

# View API documentation
curl http://localhost:4000/api/tests/docs
```

## Usage Examples

### Basic Test Generation
```bash
curl -X POST http://localhost:4000/api/tests/generate \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "network-security",
    "section": "dns",
    "difficulty": "medium",
    "questionCount": 5
  }'
```

### Mixed Difficulty Test
```bash
curl -X POST http://localhost:4000/api/tests/generate \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "web-development",
    "section": "javascript",
    "difficulty": "mixed",
    "questionCount": 15
  }'
```

### List All Tests for Domain
```bash
curl "http://localhost:4000/api/tests?domain=network-security&limit=20"
```

### Search Tests
```bash
curl "http://localhost:4000/api/tests?search=authentication&limit=10"
```

## Question Generation Rules

### Strict Short-Answer Format Only
- **Allowed**: "What is...", "Why does...", "How does...", "Explain..."
- **Forbidden**: Multiple choice, true/false, fill-in-the-blank, matching

### Content Rules
- **Only** uses supplied vault study material
- **No** outside knowledge or hallucination
- **No** concepts not present in notes
- **No** trivial details unless explicitly supported

### Educational Focus
- Concept understanding
- Explanation and recall
- "What is" and "Why does" questions
- Clear, concise answers

## Error Handling

### HTTP Status Codes
- `200` - Success
- `400` - Bad request (invalid parameters)
- `404` - Not found (test or vault content)
- `500` - Internal server error
- `503` - Service unavailable (AI issues)

### Common Errors
```json
{
  "success": false,
  "error": "Domain \"invalid-domain\" not found in vault"
}
```

```json
{
  "success": false,
  "error": "No notes found for domain \"network-security\" and section \"empty-section\""
}
```

## Database Schema

### Generated Tests Collection
```javascript
{
  _id: ObjectId,
  domain: String,           // "network-security"
  section: String,          // "dns"
  topic: String,            // "DNS"
  difficulty: String,       // "easy" | "medium" | "hard" | "mixed"
  shortAnswerQuestions: [{
    question: String,       // The question text
    answer: String,         // The answer text
    sourceConcept: String   // Related concept from notes
  }],
  createdAt: Date,
  updatedAt: Date
}
```

## Performance Considerations

### Indexes
- `domain + section`
- `difficulty + createdAt`
- `domain + difficulty`
- `shortAnswerQuestions.sourceConcept`
- Full-text search on questions/answers

### Caching
- Vault structure cached in VaultService
- AI responses validated before storage
- MongoDB queries optimized with indexes

### Rate Limiting
- OpenAI API calls have retry logic
- Timeout protection (30 seconds)
- Exponential backoff on failures

## Security

### API Key Protection
- OpenAI API key read from `.env` only
- Never exposed in responses
- Server-side only

### Input Validation
- All request parameters validated
- Prompt injection protection
- SQL injection prevention via Mongoose

### Error Information
- Development: Full error details
- Production: Generic error messages

## Testing

### Manual Testing
```bash
# Test health endpoints
curl http://localhost:4000/api/health
curl http://localhost:4000/api/tests/health

# Test documentation
curl http://localhost:4000/api/tests/docs

# Test generation (requires valid vault content)
curl -X POST http://localhost:4000/api/tests/generate \
  -H "Content-Type: application/json" \
  -d '{"domain":"test","section":"test","difficulty":"easy","questionCount":1}'
```

### Automated Testing
Consider adding tests for:
- Prompt building logic
- AI provider error handling
- Service orchestration
- API endpoints
- Database operations

## Production Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure proper MongoDB connection
3. Set OpenAI API key
4. Configure logging

### Monitoring
- Monitor OpenAI API usage
- Track test generation success rates
- Monitor database performance
- Log errors appropriately

### Scaling
- Consider OpenAI rate limits
- Database connection pooling
- Load balancing for high traffic

## Troubleshooting

### Common Issues

**"OPENAI_API_KEY not configured"**
- Add API key to `.env` file
- Restart server

**"Domain not found in vault"**
- Check VAULT_PATH environment variable
- Verify domain exists in vault structure
- Use `/api/vault/domains` to list available domains

**"No notes found for section"**
- Verify section exists within domain
- Use `/api/vault/:domain/:section` to check notes

**"Failed to parse JSON response"**
- OpenAI returned malformed JSON
- Usually temporary, retry may work
- Check OpenAI API status

**"Quota exceeded"**
- OpenAI API limit reached
- Check billing status
- May need to wait or upgrade plan

### Debug Mode
Set `NODE_ENV=development` for detailed error messages and stack traces.

## Support

For issues with:
- **Vault integration**: Check existing vault service documentation
- **OpenAI API**: Verify API key and billing status
- **Database**: Check MongoDB connection and permissions
- **General**: Review logs and error messages

---

This system provides a complete, production-ready solution for generating short-answer questions from vault study material while maintaining strict content-only generation and proper error handling.
