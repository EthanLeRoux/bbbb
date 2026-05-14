'use strict';

const Attempt = require('../models/Attempt');
const Test = require('../models/Test');
const TestQuestionResult = require('../models/TestQuestionResult');
const ConceptPerformanceState = require('../models/ConceptPerformanceState');
const CritiqueService = require('./critiqueService');
const UnifiedTestService = require('./unifiedTestService');

/**
 * Service layer for test attempt management.
 * Handles business logic for starting, submitting, and scoring test attempts.
 */

class AttemptService {
  constructor() {
    this.critiqueService = new CritiqueService();
    this.unifiedService = new UnifiedTestService();
  }

  /**
   * Start a new test attempt.
   * @param {Object} params - Attempt parameters
   * @param {string} params.testId - Test ID
   * @returns {Promise<Object>} Created attempt document
   * @throws {Error} If test not found or validation fails
   */
  async startAttempt({ testId }) {
    try {
      console.log(`[AttemptService] Starting attempt for test: ${testId}`);

      // Validate input
      this._validateStartAttemptInput({ testId });

      // Check if test exists
      const test = await Test.findById(testId);
      if (!test) {
        throw new Error('Test not found');
      }

      // Create attempt with enhanced tracking fields
      const attempt = await Attempt.create({
        testId: testId,
        domain: test.domain,
        section: test.section,
        vaultId: test.vaultId || null
      });

      console.log(`[AttemptService] Started attempt with ID: ${attempt.id}`);
      return attempt;
    } catch (error) {
      console.error('[AttemptService] Start attempt error:', error);
      throw error;
    }
  }

  /**
   * Submit a test attempt with answers and timing data.
   * @param {Object} params - Submission parameters
   * @param {string} params.attemptId - Attempt ID
   * @param {string} params.testId - Test ID
   * @param {Object} params.answers - User answers {questionId: answer} (legacy)
   * @param {Object} params.timings - Timing data {questionId: seconds} (legacy)
   * @param {Array} params.questionResults - Question-level results (new format)
   * @returns {Promise<Object>} Updated attempt document with scoring
   * @throws {Error} If validation fails or attempt not found
   */
  async submitAttempt({ attemptId, testId, answers, timings, questionResults }) {
    try {
      console.log(`[AttemptService] Submitting attempt: ${attemptId}`);

      // Validate input
      this._validateSubmitAttemptInput({ attemptId, testId, answers, timings, questionResults });

      // Check if attempt exists and is in progress
      const attempt = await Attempt.findById(attemptId);
      if (!attempt) {
        throw new Error('Attempt not found');
      }

      if (attempt.status !== 'in_progress') {
        throw new Error('Attempt cannot be submitted - current status: ' + attempt.status);
      }

      // Verify test ID matches
      if (attempt.testId !== testId) {
        throw new Error('Test ID mismatch');
      }

      // Get test for scoring
      const test = await Test.findById(testId);
      if (!test) {
        throw new Error('Test not found');
      }

      let scoringResults;
      let processedQuestionResults;

      if (questionResults) {
        // New format: use provided question results
        scoringResults = this._calculateScoringFromResults(questionResults, test);
        processedQuestionResults = await this._processQuestionResults(questionResults, test, attemptId);
      } else {
        // Legacy format: calculate from answers and timings
        scoringResults = await this._calculateScoring(test, answers, timings);
        processedQuestionResults = await this._createQuestionResults(test, answers, timings, scoringResults);
      }

      // Update attempt with detailed question results
      await Attempt.updateQuestionResults(attemptId, processedQuestionResults);

      // Update concept performance states
      await this._updateConceptPerformance(processedQuestionResults);

      // Generate AI critiques for incorrect answers
      let critiques = null;
      try {
        const attemptWithResults = { ...attempt, ...scoringResults, questionResults };
        critiques = await this.critiqueService.generateCritiques(attemptWithResults, test);
        console.log(`[AttemptService] Generated critiques for attempt: ${attemptId}`);
      } catch (critiqueError) {
        console.error('[AttemptService] Critique generation failed:', critiqueError);
        // Continue without critiques - don't fail submission
      }

      // Update attempt with final results and critiques
      const updatedAttempt = await Attempt.findByIdAndUpdate(attemptId, {
        answers,
        timings,
        ...scoringResults,
        critiques,
        status: 'completed',
        submittedAt: new Date()
      });

      console.log(`[AttemptService] Submitted attempt: ${attemptId}, Score: ${scoringResults.score}`);

      // Add unified fields to the same attempt document and trigger SR scheduling.
      // AttemptModel and UnifiedTestService both use the "attempts" collection, so
      // this must update by the existing attempt id instead of creating a mirror doc.
      try {
        const totalQuestions = scoringResults.totalQuestions || 0;
        const correctCount = scoringResults.correctCount || 0;
        const avgTime = totalQuestions > 0
          ? (scoringResults.totalTime || 0) / totalQuestions
          : 0;

        await this.unifiedService.submitAttempt({
          attemptId: attempt.id,
          testId: attempt.testId,
          vaultId: attempt.vaultId || null,
          domainId: attempt.domain || null,
          sectionId: attempt.section || null,
          scorePercent: scoringResults.score,
          totalQuestions,
          correctAnswers: correctCount,
          avgTimePerQuestion: avgTime,
          answers,
          timings,
          perQuestionResults: scoringResults.perQuestionResults || {},
          critiques,
          hasAIScoring: true,
          remarkCount: 0,
        });
      } catch (unifiedErr) {
        // Non-fatal: unified write failed, log and continue
        console.error('[AttemptService] Unified submit write failed (non-fatal):', unifiedErr.message);
      }

      return updatedAttempt;
    } catch (error) {
      console.error('[AttemptService] Submit attempt error:', error);
      throw error;
    }
  }

  /**
   * Get attempts with filters.
   * @param {Object} filters - Query filters
   * @returns {Promise<Array>} Array of attempt documents
   */
  async getAttempts(filters = {}) {
    try {
      const attempts = await Attempt.find(filters);
      return attempts;
    } catch (error) {
      console.error('[AttemptService] Get attempts error:', error);
      throw error;
    }
  }

  /**
   * Get a specific attempt by ID.
   * @param {string} attemptId - Attempt ID
   * @returns {Promise<Object>} Attempt document
   */
  async getAttemptById(attemptId) {
    try {
      const attempt = await Attempt.findById(attemptId);
      
      if (!attempt) {
        throw new Error('Attempt not found');
      }

      return attempt;
    } catch (error) {
      if (error.message === 'Attempt not found') {
        throw error;
      }
      console.error('[AttemptService] Get attempt error:', error);
      throw new Error(`Failed to retrieve attempt: ${error.message}`);
    }
  }

  /**
   * Delete an attempt.
   * @param {string} attemptId - Attempt ID
   * @returns {Promise<boolean>} True if deleted
   */
  async deleteAttempt(attemptId) {
    try {
      const result = await Attempt.findByIdAndDelete(attemptId);
      
      if (!result) {
        throw new Error('Attempt not found');
      }

      console.log(`[AttemptService] Deleted attempt: ${attemptId}`);
      return true;
    } catch (error) {
      if (error.message === 'Attempt not found') {
        throw error;
      }
      console.error('[AttemptService] Delete attempt error:', error);
      throw new Error(`Failed to delete attempt: ${error.message}`);
    }
  }

  /**
   * Get attempts by test ID.
   * @param {string} testId - Test ID
   * @param {number} limit - Maximum results
   * @returns {Promise<Array>} Array of attempt documents
   */
  async getAttemptsByTestId(testId, limit = 20) {
    try {
      const attempts = await Attempt.findByTestId(testId, limit);
      return attempts;
    } catch (error) {
      console.error('[AttemptService] Get attempts by test ID error:', error);
      throw error;
    }
  }

  /**
   * Get recent attempts.
   * @param {number} days - Number of days to look back
   * @param {number} limit - Maximum results
   * @returns {Promise<Array>} Array of attempt documents
   */
  async getRecentAttempts(days = 7, limit = 20) {
    try {
      const attempts = await Attempt.findRecent(days, limit);
      return attempts;
    } catch (error) {
      console.error('[AttemptService] Get recent attempts error:', error);
      throw error;
    }
  }

  /**
   * Get attempt statistics.
   * @returns {Promise<Object>} Statistics object
   */
  async getAttemptStatistics() {
    try {
      const stats = await Attempt.getStatistics();
      return stats;
    } catch (error) {
      console.error('[AttemptService] Get statistics error:', error);
      throw new Error(`Failed to get statistics: ${error.message}`);
    }
  }

  /**
   * Search attempts.
   * @param {string} searchTerm - Search term
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} Array of attempt documents
   */
  async searchAttempts(searchTerm, options = {}) {
    try {
      const attempts = await Attempt.searchAttempts(searchTerm, options);
      return attempts;
    } catch (error) {
      console.error('[AttemptService] Search attempts error:', error);
      throw new Error(`Failed to search attempts: ${error.message}`);
    }
  }

  /**
   * Calculate scoring and results for an attempt using AI evaluation.
   * @param {Object} test - Test document
   * @param {Object} answers - User answers
   * @param {Object} timings - Timing data
   * @returns {Promise<Object>} Scoring results
   * @private
   */
  async _calculateScoring(test, answers, timings) {
    const results = {
      score: null,
      perQuestionResults: {},
      totalTime: null,
      correctCount: 0,
      totalQuestions: test.shortAnswerQuestions?.length || 0
    };

    // Calculate total time
    if (timings && typeof timings === 'object') {
      results.totalTime = Object.values(timings).reduce((sum, time) => sum + (parseFloat(time) || 0), 0);
    }

    // Calculate per-question results using AI scoring
    for (let index = 0; index < test.shortAnswerQuestions?.length; index++) {
      const question = test.shortAnswerQuestions[index];
      const questionId = `q${index}`;
      const userAnswer = answers?.[questionId] || '';
      const expectedAnswer = question.answer || '';
      const timing = timings?.[questionId] || 0;

      let scoringResult;
      
      // Try AI scoring first
      try {
        if (this.critiqueService.aiProvider) {
          scoringResult = await this.critiqueService.aiProvider.scoreAnswer(
            userAnswer, 
            expectedAnswer, 
            question.question
          );
          console.log(`[AttemptService] AI scored question ${questionId}: ${scoringResult.score}/100`);
        } else {
          throw new Error('AI provider not available');
        }
      } catch (error) {
        console.error(`[AttemptService] AI scoring failed for ${questionId}, using fallback:`, error.message);
        // Fallback to basic scoring
        scoringResult = this._fallbackScore(userAnswer, expectedAnswer);
      }

      results.perQuestionResults[questionId] = {
        correct: scoringResult.isCorrect,
        expectedAnswer: expectedAnswer,
        userAnswer: userAnswer,
        timing: parseFloat(timing) || 0,
        question: question.question,
        sourceConcept: question.sourceConcept || '',
        sourceNoteId: question.sourceNoteId || null,
        sourceNoteTitle: question.sourceNoteTitle || question.sourceConcept || '',
        sourceNoteTopic: question.sourceNoteTopic || '',
        aiScore: scoringResult.score,
        confidence: scoringResult.confidence,
        evaluation: scoringResult.evaluation,
        strengths: scoringResult.strengths,
        improvements: scoringResult.improvements,
        keyPointsMatched: scoringResult.keyPointsMatched || [],
        keyPointsMissed: scoringResult.keyPointsMissed || []
      };

      if (scoringResult.isCorrect) {
        results.correctCount++;
      }
    }

    // Calculate percentage score based on AI scores
    if (results.totalQuestions > 0) {
      const totalScore = Object.values(results.perQuestionResults)
        .reduce((sum, result) => sum + (result.aiScore || 0), 0);
      results.score = Math.round((totalScore / results.totalQuestions) * 100) / 100;
    }

    return results;
  }

  /**
   * Fallback scoring method when AI is not available.
   * @param {string} userAnswer - User's answer
   * @param {string} expectedAnswer - Expected answer
   * @returns {Object} Scoring result with basic evaluation
   * @private
   */
  _fallbackScore(userAnswer, expectedAnswer) {
    const isCorrect = this._compareAnswers(userAnswer, expectedAnswer);
    
    return {
      score: isCorrect ? 100 : 0,
      isCorrect: isCorrect,
      confidence: 'low',
      evaluation: isCorrect ? 'Correct answer' : 'Incorrect answer',
      strengths: isCorrect ? 'Answer matches expected response' : '',
      improvements: isCorrect ? '' : 'Review the source material for better understanding',
      keyPointsMatched: [],
      keyPointsMissed: []
    };
  }

  /**
   * Compare user answer with expected answer.
   * @param {string} userAnswer - User's answer
   * @param {string} expectedAnswer - Expected answer
   * @returns {boolean} Whether answer is correct
   * @private
   */
  _compareAnswers(userAnswer, expectedAnswer) {
    if (!userAnswer || !expectedAnswer) {
      return false;
    }

    // Normalize both answers for comparison
    const normalizeAnswer = (answer) => {
      return answer
        .toLowerCase()
        .trim()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .replace(/\s+/g, ' '); // Normalize whitespace
    };

    const normalizedUser = normalizeAnswer(userAnswer);
    const normalizedExpected = normalizeAnswer(expectedAnswer);

    // Check for exact match
    if (normalizedUser === normalizedExpected) {
      return true;
    }

    // Check if user answer contains key parts of expected answer
    const expectedWords = normalizedExpected.split(' ').filter(word => word.length > 2);
    const userWords = normalizedUser.split(' ');
    
    // If user answer contains at least 60% of the key words, consider it correct
    const matchingWords = expectedWords.filter(word => userWords.includes(word));
    const matchRatio = matchingWords.length / expectedWords.length;
    
    return matchRatio >= 0.6;
  }

  /**
   * Validate start attempt input.
   * @param {Object} params - Input parameters
   * @private
   */
  _validateStartAttemptInput({ testId }) {
    if (!testId || typeof testId !== 'string' || testId.trim().length === 0) {
      throw new Error('Test ID is required and must be a non-empty string');
    }
  }

  /**
   * Re-mark an existing attempt with AI-powered scoring.
   * @param {Object} params - Remark parameters
   * @param {string} params.attemptId - Attempt ID to re-mark
   * @returns {Promise<Object>} Updated attempt with new AI scoring
   * @throws {Error} If validation fails or attempt not found
   */
  async remarkAttempt({ attemptId }) {
    try {
      console.log(`[AttemptService] Re-marking attempt: ${attemptId}`);

      // Validate input
      this._validateRemarkAttemptInput({ attemptId });

      // Get the existing attempt
      const attempt = await Attempt.findById(attemptId);
      if (!attempt) {
        throw new Error('Attempt not found');
      }

      // Check if attempt has required data for remarking
      if (!attempt.answers || !attempt.testId) {
        throw new Error('Attempt does not have required data for remarking');
      }

      // Get the test for re-scoring
      const test = await Test.findById(attempt.testId);
      if (!test) {
        throw new Error('Test not found');
      }

      // Re-calculate scoring using AI evaluation
      const newScoringResults = await this._calculateScoring(test, attempt.answers, attempt.timings || {});

      // Generate new AI critiques
      let newCritiques = null;
      try {
        const attemptWithNewResults = { ...attempt, ...newScoringResults };
        newCritiques = await this.critiqueService.generateCritiques(attemptWithNewResults, test);
        console.log(`[AttemptService] Generated new critiques for remark: ${attemptId}`);
      } catch (critiqueError) {
        console.error('[AttemptService] New critique generation failed during remark:', critiqueError);
        // Continue without critiques - don't fail the remark
      }

      // Update attempt with new scoring and critiques
      const updatedAttempt = await Attempt.findByIdAndUpdate(attemptId, {
        ...newScoringResults,
        critiques: newCritiques,
        lastRemarkedAt: new Date(),
        remarkCount: (attempt.remarkCount || 0) + 1
      });

      console.log(`[AttemptService] Re-marked attempt: ${attemptId}, Old Score: ${attempt.score}%, New Score: ${newScoringResults.score}%`);
      return updatedAttempt;

    } catch (error) {
      console.error('[AttemptService] Remark attempt error:', error);
      throw error;
    }
  }

  /**
   * Validate remark attempt input.
   * @param {Object} params - Input parameters
   * @private
   */
  _validateRemarkAttemptInput({ attemptId }) {
    if (!attemptId || typeof attemptId !== 'string' || attemptId.trim().length === 0) {
      throw new Error('Attempt ID is required and must be a non-empty string');
    }
  }

  /**
   * Calculate scoring from provided question results.
   * @param {Array} questionResults - Array of question result objects
   * @returns {Object} Scoring results
   * @private
   */
  _calculateScoringFromResults(questionResults, test = null) {
    const correctCount = questionResults.filter(r => r.isCorrect).length;
    const totalCount = questionResults.length;
    const totalTime = questionResults.reduce((sum, r) => sum + (r.timeSpent || 0), 0);
    const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 10000) / 100 : 0;

    // Create perQuestionResults for backward compatibility
    const perQuestionResults = {};
    questionResults.forEach(result => {
      const testQuestion = this._findTestQuestionForResult(result, test);
      perQuestionResults[result.questionId] = {
        correct: result.isCorrect,
        timing: result.timeSpent,
        question: result.questionText || testQuestion?.question || '',
        questionText: result.questionText || testQuestion?.question || '',
        userAnswer: result.userAnswer || '',
        expectedAnswer: result.expectedAnswer || testQuestion?.answer || '',
        sourceConcept: testQuestion?.sourceConcept || result.conceptId || '',
        sourceNoteId: testQuestion?.sourceNoteId || result.sourceNoteId || null,
        sourceNoteTitle: testQuestion?.sourceNoteTitle || testQuestion?.sourceConcept || '',
        sourceNoteTopic: testQuestion?.sourceNoteTopic || '',
        confidence: result.confidence || null
      };
    });

    return {
      score,
      correctCount,
      totalQuestions: totalCount,
      totalTime,
      perQuestionResults
    };
  }

  _findTestQuestionForResult(result, test) {
    if (!test?.shortAnswerQuestions?.length) return null;

    const indexMatch = `${result.questionId || ''}`.match(/^q(\d+)$/);
    if (indexMatch) {
      const byIndex = test.shortAnswerQuestions[Number(indexMatch[1])];
      if (byIndex) return byIndex;
    }

    return test.shortAnswerQuestions.find(q =>
      q.question === result.questionText ||
      q.id === result.questionId ||
      q.sourceNoteId === result.sourceNoteId
    ) || null;
  }

  /**
   * Process question results for persistence.
   * @param {Array} questionResults - Array of question result objects
   * @param {Object} test - Test document
   * @param {string} attemptId - Attempt ID
   * @returns {Promise<Array>} Processed question results
   * @private
   */
  async _processQuestionResults(questionResults, test, attemptId) {
    const processedResults = [];

    for (const result of questionResults) {
      // Find corresponding question in test to get additional metadata
      const testQuestion = this._findTestQuestionForResult(result, test);

      const processedResult = {
        attemptId,
        testId: test.id,
        questionId: result.questionId,
        conceptId: result.conceptId || testQuestion?.sourceNoteId || testQuestion?.sourceConcept || null,
        sourceConcept: testQuestion?.sourceConcept || result.conceptId || '',
        sourceNoteId: testQuestion?.sourceNoteId || result.sourceNoteId || null,
        sourceNoteTitle: testQuestion?.sourceNoteTitle || testQuestion?.sourceConcept || '',
        sourceNoteTopic: testQuestion?.sourceNoteTopic || '',
        vaultId: testQuestion?.sourceNoteId || test.vaultId || null,
        domain: test.domain,
        section: test.section,
        questionText: result.questionText || testQuestion?.question || '',
        expectedAnswer: result.expectedAnswer || testQuestion?.answer || '',
        userAnswer: result.userAnswer || '',
        isCorrect: result.isCorrect,
        timeSpent: result.timeSpent,
        difficulty: result.difficulty || testQuestion?.difficulty || test.difficulty || 'medium',
        confidence: result.confidence || null
      };

      // Persist to TestQuestionResult collection
      await TestQuestionResult.create(processedResult);
      processedResults.push(processedResult);
    }

    return processedResults;
  }

  /**
   * Validate submit attempt input.
   * @param {Object} params - Input parameters
   * @private
   */
  _validateSubmitAttemptInput({ attemptId, testId, answers, timings, questionResults }) {
    // Validate attemptId
    if (!attemptId || typeof attemptId !== 'string' || attemptId.trim().length === 0) {
      throw new Error('Attempt ID is required and must be a non-empty string');
    }

    // Validate testId
    if (!testId || typeof testId !== 'string' || testId.trim().length === 0) {
      throw new Error('Test ID is required and must be a non-empty string');
    }

    // Support both legacy and new formats
    if (questionResults) {
      // New format validation
      if (!Array.isArray(questionResults)) {
        throw new Error('Question results must be an array');
      }
    } else {
      // Legacy format validation
      if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
        throw new Error('Answers must be a non-empty object');
      }

      if (!timings || typeof timings !== 'object' || Array.isArray(timings)) {
        throw new Error('Timings must be a non-empty object');
      }

      // Validate timing values are numbers
      Object.values(timings).forEach(timing => {
        if (typeof timing !== 'number' || timing < 0) {
          throw new Error('All timing values must be non-negative numbers');
        }
      });
    }
  }

  /**
   * Create detailed question results for enhanced tracking.
   * @param {Object} test - Test document
   * @param {Object} answers - User answers
   * @param {Object} timings - Timing data
   * @param {Object} scoringResults - Scoring results from _calculateScoring
   * @returns {Promise<Array>} Array of question result objects
   * @private
   */
  async _createQuestionResults(test, answers, timings, scoringResults) {
    const questionResults = [];

    for (let index = 0; index < test.shortAnswerQuestions?.length; index++) {
      const question = test.shortAnswerQuestions[index];
      const questionId = `q${index}`;
      const perQuestionResult = scoringResults.perQuestionResults[questionId];

      if (!perQuestionResult) continue;

      const questionResult = {
        attemptId: scoringResults.attemptId || null,
        testId: test.id,
        questionId: questionId,
        conceptId: question.sourceNoteId || question.sourceConcept || null,
        sourceConcept: question.sourceConcept || '',
        sourceNoteId: question.sourceNoteId || null,
        sourceNoteTitle: question.sourceNoteTitle || question.sourceConcept || '',
        sourceNoteTopic: question.sourceNoteTopic || '',
        vaultId: question.sourceNoteId || test.vaultId || null,
        domain: test.domain,
        section: test.section,
        questionText: question.question,
        expectedAnswer: question.answer,
        userAnswer: perQuestionResult.userAnswer,
        isCorrect: perQuestionResult.correct,
        timeSpent: perQuestionResult.timing,
        difficulty: question.difficulty || test.difficulty || 'medium',
        confidence: perQuestionResult.confidence || null,
        aiScore: perQuestionResult.aiScore,
        evaluation: perQuestionResult.evaluation,
        strengths: perQuestionResult.strengths || [],
        improvements: perQuestionResult.improvements || [],
        keyPointsMatched: perQuestionResult.keyPointsMatched || [],
        keyPointsMissed: perQuestionResult.keyPointsMissed || []
      };

      questionResults.push(questionResult);
    }

    return questionResults;
  }

  /**
   * Update concept performance states based on question results.
   * @param {Array} questionResults - Array of question result objects
   * @returns {Promise<void>}
   * @private
   */
  async _updateConceptPerformance(questionResults) {
    try {
      // Group results by conceptId
      const conceptResults = {};
      questionResults.forEach(result => {
        if (result.conceptId) {
          if (!conceptResults[result.conceptId]) {
            conceptResults[result.conceptId] = [];
          }
          conceptResults[result.conceptId].push(result);
        }
      });

      // Update each concept's performance state
      for (const [conceptId, results] of Object.entries(conceptResults)) {
        // Calculate aggregate performance for this concept in this attempt
        const correctCount = results.filter(r => r.isCorrect).length;
        const totalTime = results.reduce((sum, r) => sum + r.timeSpent, 0);
        const averageTime = totalTime / results.length;
        const confidenceScores = results.filter(r => r.confidence !== null).map(r => r.confidence);
        const averageConfidence = confidenceScores.length > 0 ? 
          confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length : null;

        // Update concept performance state for each question result
        for (const result of results) {
          await ConceptPerformanceState.updateAfterAttempt(conceptId, {
            isCorrect: result.isCorrect,
            timeSpent: result.timeSpent,
            confidence: result.confidence,
            difficulty: result.difficulty,
            domain: result.domain,
            section: result.section,
            vaultId: result.vaultId
          });
        }

        console.log(`[AttemptService] Updated concept performance for ${conceptId}: ${correctCount}/${results.length} correct`);
      }
    } catch (error) {
      console.error('[AttemptService] Update concept performance error:', error);
      // Don't fail the entire submission if concept tracking fails
    }
  }
}

module.exports = AttemptService;
