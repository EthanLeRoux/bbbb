'use strict';

const OpenAI = require('openai');

/**
 * Handles OpenAI API communication for short-answer question generation.
 * Provides retry logic, error handling, and JSON parsing validation.
 */
class AIProvider {
  constructor() {
    // Initialize OpenAI client with API key from environment
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Configuration
    this.maxRetries = 3;
    this.timeoutMs = 30000; // 30 seconds timeout
  }

  /**
   * Generate short-answer questions using OpenAI API.
   * 
   * @param {string} prompt - The complete prompt for OpenAI
   * @param {Object} options - Additional options
   * @param {string} options.model - OpenAI model to use (default: gpt-3.5-turbo)
   * @param {number} options.temperature - Temperature for response generation (default: 0.3)
   * @returns {Promise<Object>} Parsed JSON response with questions
   * @throws {Error} If API call fails or response is invalid
   */
  async generateQuestions(prompt, options = {}) {
    const {
      model = 'gpt-3.5-turbo',
      temperature = 0.3,
    } = options;

    let lastError;
    
    // Retry logic for API calls
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`[AIProvider] Attempt ${attempt}/${this.maxRetries} to generate questions`);
        
        const response = await this._callOpenAI(prompt, model, temperature);
        const parsedResponse = this._parseAndValidateResponse(response);
        
        console.log(`[AIProvider] Successfully generated ${parsedResponse.shortAnswerQuestions?.length || 0} questions`);
        return parsedResponse;
        
      } catch (error) {
        lastError = error;
        console.error(`[AIProvider] Attempt ${attempt} failed:`, error.message);
        
        // Don't retry on certain errors
        if (this._isNonRetryableError(error)) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < this.maxRetries) {
          const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`[AIProvider] Waiting ${delayMs}ms before retry...`);
          await this._sleep(delayMs);
        }
      }
    }
    
    throw new Error(`Failed to generate questions after ${this.maxRetries} attempts. Last error: ${lastError.message}`);
  }

  /**
   * Make the actual OpenAI API call with timeout.
   * 
   * @param {string} prompt - The prompt to send
   * @param {string} model - OpenAI model
   * @param {number} temperature - Temperature setting
   * @returns {Promise<string>} Raw response from OpenAI
   * @private
   */
  async _callOpenAI(prompt, model, temperature) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('OpenAI API call timeout')), this.timeoutMs);
    });

    const apiCall = this.openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational assessment designer. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const response = await Promise.race([apiCall, timeoutPromise]);
    
    if (!response.choices || !response.choices[0] || !response.choices[0].message) {
      throw new Error('Invalid response structure from OpenAI API');
    }

    return response.choices[0].message.content;
  }

  /**
   * Parse and validate the JSON response from OpenAI.
   * 
   * @param {string} response - Raw response string
   * @returns {Object} Parsed and validated response
   * @throws {Error} If response is invalid
   * @private
   */
  _parseAndValidateResponse(response) {
    if (!response || typeof response !== 'string') {
      throw new Error('Empty or invalid response from OpenAI');
    }

    let parsed;
    try {
      parsed = JSON.parse(response);
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error.message}. Response: ${response.substring(0, 200)}...`);
    }

    // Validate required structure
    if (!parsed.topic || typeof parsed.topic !== 'string') {
      throw new Error('Missing or invalid "topic" field in response');
    }

    if (!parsed.difficulty || typeof parsed.difficulty !== 'string') {
      throw new Error('Missing or invalid "difficulty" field in response');
    }

    if (!Array.isArray(parsed.shortAnswerQuestions)) {
      throw new Error('Missing or invalid "shortAnswerQuestions" array in response');
    }

    // Validate each question
    const questions = parsed.shortAnswerQuestions;
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      if (!q.question || typeof q.question !== 'string') {
        throw new Error(`Question ${i + 1}: Missing or invalid "question" field`);
      }
      
      if (!q.answer || typeof q.answer !== 'string') {
        throw new Error(`Question ${i + 1}: Missing or invalid "answer" field`);
      }
      
      if (!q.sourceConcept || typeof q.sourceConcept !== 'string') {
        throw new Error(`Question ${i + 1}: Missing or invalid "sourceConcept" field`);
      }

      // Validate question format (should be short-answer style)
      if (this._isNonShortAnswerQuestion(q.question)) {
        throw new Error(`Question ${i + 1}: "${q.question}" is not a short-answer question format`);
      }
    }

    return parsed;
  }

  /**
   * Check if a question is NOT in short-answer format.
   * 
   * @param {string} question - The question text
   * @returns {boolean} True if question is not short-answer format
   * @private
   */
  _isNonShortAnswerQuestion(question) {
    const lowerQuestion = question.toLowerCase();
    
    // Check for multiple choice indicators
    if (lowerQuestion.includes('(a)') || lowerQuestion.includes('(b)') || 
        lowerQuestion.includes('(c)') || lowerQuestion.includes('(d)') ||
        lowerQuestion.includes('choose the correct') || lowerQuestion.includes('select the')) {
      return true;
    }

    // Check for true/false indicators
    if (lowerQuestion.includes('true or false') || lowerQuestion.includes('t/f') ||
        lowerQuestion.includes('true/false')) {
      return true;
    }

    // Check for fill-in-the-blank indicators
    if (question.includes('___') || question.includes('____') || 
        lowerQuestion.includes('fill in the') || lowerQuestion.includes('complete the')) {
      return true;
    }

    // Check for matching indicators
    if (lowerQuestion.includes('match the') || lowerQuestion.includes('column a') || 
        lowerQuestion.includes('column b')) {
      return true;
    }

    return false;
  }

  /**
   * Determine if an error should not be retried.
   * 
   * @param {Error} error - The error to check
   * @returns {boolean} True if error is non-retryable
   * @private
   */
  _isNonRetryableError(error) {
    const message = error.message.toLowerCase();
    
    // Don't retry on authentication errors
    if (message.includes('authentication') || message.includes('unauthorized') || 
        message.includes('invalid api key')) {
      return true;
    }

    // Don't retry on quota exceeded
    if (message.includes('quota') || message.includes('rate limit') || 
        message.includes('insufficient quota')) {
      return true;
    }

    // Don't retry on token limit errors
    if (message.includes('context length') || message.includes('maximum context') ||
        message.includes('too many tokens') || message.includes('token limit')) {
      return true;
    }

    // Don't retry on invalid request format
    if (message.includes('invalid request') || message.includes('bad request')) {
      return true;
    }

    // Don't retry on validation errors (our own validation)
    if (message.includes('missing or invalid') || message.includes('not a short-answer')) {
      return true;
    }

    return false;
  }

  /**
   * Simple sleep utility for retry delays.
   * 
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   * @private
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate critique using OpenAI API.
   * 
   * @param {string} prompt - The critique prompt for OpenAI
   * @param {Object} options - Additional options
   * @param {string} options.model - OpenAI model to use (default: gpt-3.5-turbo)
   * @param {number} options.temperature - Temperature for response generation (default: 0.3)
   * @returns {Promise<Object>} Parsed JSON response with critique
   * @throws {Error} If API call fails or response is invalid
   */
  async generateCritique(prompt, options = {}) {
    const {
      model = 'gpt-3.5-turbo',
      temperature = 0.3,
    } = options;

    let lastError;
    
    // Retry logic for API calls
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`[AIProvider] Attempt ${attempt}/${this.maxRetries} to generate critique`);
        
        const response = await this._callOpenAI(prompt, model, temperature);
        const parsedResponse = this._parseAndValidateCritiqueResponse(response);
        
        console.log(`[AIProvider] Successfully generated critique`);
        return parsedResponse;
        
      } catch (error) {
        lastError = error;
        console.error(`[AIProvider] Attempt ${attempt} failed:`, error.message);
        
        // Don't retry on certain errors
        if (this._isNonRetryableError(error)) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < this.maxRetries) {
          const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`[AIProvider] Waiting ${delayMs}ms before retry...`);
          await this._sleep(delayMs);
        }
      }
    }
    
    throw new Error(`Failed to generate critique after ${this.maxRetries} attempts. Last error: ${lastError.message}`);
  }

  /**
   * Parse and validate the JSON response from OpenAI for critiques.
   * 
   * @param {string} response - Raw response string
   * @returns {Object} Parsed and validated response
   * @throws {Error} If response is invalid
   * @private
   */
  _parseAndValidateCritiqueResponse(response) {
    if (!response || typeof response !== 'string') {
      throw new Error('Empty or invalid response from OpenAI');
    }

    let parsed;
    try {
      parsed = JSON.parse(response);
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error.message}. Response: ${response.substring(0, 200)}...`);
    }

    // For critiques, we're more flexible with validation
    // Just ensure it's a valid JSON object
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Response must be a valid JSON object');
    }

    return parsed;
  }

  /**
   * Score answer using AI evaluation.
   * 
   * @param {string} userAnswer - User's answer
   * @param {string} expectedAnswer - Expected correct answer
   * @param {string} question - The question being asked
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Scoring result with detailed evaluation
   * @throws {Error} If API call fails or response is invalid
   */
  async scoreAnswer(userAnswer, expectedAnswer, question, options = {}) {
    const {
      model = 'gpt-3.5-turbo',
      temperature = 0.1,
    } = options;

    const prompt = `As an expert educational assessor, evaluate the student's answer to this question.

Question: "${question}"
Expected Answer: "${expectedAnswer}"
Student's Answer: "${userAnswer}"

Please provide a JSON response with the following fields:
{
  "score": number (0-100, where 100 is perfect match),
  "isCorrect": boolean (true if score >= 70, false otherwise),
  "confidence": string ("high", "medium", or "low"),
  "evaluation": string (brief assessment of the answer),
  "strengths": string (what the student got right),
  "improvements": string (what could be improved),
  "keyPointsMatched": array of strings (key concepts the student correctly identified),
  "keyPointsMissed": array of strings (key concepts the student missed or got wrong)
}

Consider:
- Semantic similarity and conceptual understanding
- Key terminology accuracy
- Completeness of the answer
- Any partial credit for correct concepts
- Overall understanding demonstrated

Be fair but thorough in your evaluation.`;

    let lastError;
    
    // Retry logic for API calls
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`[AIProvider] Attempt ${attempt}/${this.maxRetries} to score answer`);
        
        const response = await this._callOpenAI(prompt, model, temperature);
        const parsedResponse = this._parseAndValidateScoreResponse(response);
        
        console.log(`[AIProvider] Successfully scored answer: ${parsedResponse.score}/100`);
        return parsedResponse;
        
      } catch (error) {
        lastError = error;
        console.error(`[AIProvider] Attempt ${attempt} failed:`, error.message);
        
        // Don't retry on certain errors
        if (this._isNonRetryableError(error)) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < this.maxRetries) {
          const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`[AIProvider] Waiting ${delayMs}ms before retry...`);
          await this._sleep(delayMs);
        }
      }
    }
    
    throw new Error(`Failed to score answer after ${this.maxRetries} attempts. Last error: ${lastError.message}`);
  }

  /**
   * Parse and validate the JSON response from OpenAI for scoring.
   * 
   * @param {string} response - Raw response string
   * @returns {Object} Parsed and validated response
   * @throws {Error} If response is invalid
   * @private
   */
  _parseAndValidateScoreResponse(response) {
    if (!response || typeof response !== 'string') {
      throw new Error('Empty or invalid response from OpenAI');
    }

    let parsed;
    try {
      parsed = JSON.parse(response);
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error.message}. Response: ${response.substring(0, 200)}...`);
    }

    // Validate required fields for scoring
    if (typeof parsed.score !== 'number' || parsed.score < 0 || parsed.score > 100) {
      throw new Error('Invalid or missing "score" field (must be number 0-100)');
    }

    if (typeof parsed.isCorrect !== 'boolean') {
      throw new Error('Missing or invalid "isCorrect" field (must be boolean)');
    }

    if (!parsed.confidence || !['high', 'medium', 'low'].includes(parsed.confidence)) {
      throw new Error('Missing or invalid "confidence" field (must be "high", "medium", or "low")');
    }

    return parsed;
  }

  /**
   * Health check for the AI provider.
   * 
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return { status: 'error', message: 'OPENAI_API_KEY not configured' };
      }

      // Simple test call
      const testPrompt = 'Respond with JSON: {"status": "ok"}';
      const response = await this._callOpenAI(testPrompt, 'gpt-3.5-turbo', 0.1);
      const parsed = JSON.parse(response);
      
      return { 
        status: parsed.status === 'ok' ? 'healthy' : 'error',
        message: 'OpenAI API is accessible'
      };
    } catch (error) {
      return { 
        status: 'error', 
        message: `OpenAI API error: ${error.message}`
      };
    }
  }
}

module.exports = AIProvider;
