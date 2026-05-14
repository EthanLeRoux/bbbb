'use strict';

const AIProvider = require('./aiProvider');

/**
 * Service for generating AI-powered critiques of test attempts.
 * Analyzes incorrect answers and provides personalized study recommendations.
 */
class CritiqueService {
  constructor() {
    try {
      this.aiProvider = new AIProvider();
    } catch (error) {
      console.warn('[CritiqueService] AIProvider initialization failed, critiques will be disabled:', error.message);
      this.aiProvider = null;
    }
  }

  /**
   * Generate critiques for an attempt's incorrect answers.
   * @param {Object} attempt - Attempt document with results
   * @param {Object} test - Test document with questions
   * @returns {Promise<Object>} Critiques per question and overall recommendations
   */
  async generateCritiques(attempt, test) {
    try {
      console.log(`[CritiqueService] Generating critiques for attempt: ${attempt.id}`);

      // Check if AI provider is available
      if (!this.aiProvider) {
        console.warn('[CritiqueService] AI provider not available, generating fallback critiques');
        return this._generateFallbackCritiques(attempt, test);
      }

      const critiques = {
        perQuestionCritiques: {},
        overallWeaknesses: [],
        studyRecommendations: [],
        strengths: []
      };

      // Get incorrect answers
      const incorrectAnswers = this._getIncorrectAnswers(attempt, test);
      
      if (incorrectAnswers.length === 0) {
        critiques.perQuestionCritiques = {};
        critiques.overallWeaknesses = ["No incorrect answers to analyze - excellent work!"];
        critiques.studyRecommendations = ["Continue reviewing to maintain your understanding"];
        return critiques;
      }

      // Generate critiques for each incorrect answer
      for (const incorrect of incorrectAnswers) {
        const critique = await this._generateQuestionCritique(incorrect, test);
        critiques.perQuestionCritiques[incorrect.questionId] = critique;
      }

      // Generate overall analysis
      const overallAnalysis = await this._generateOverallAnalysis(incorrectAnswers, test);
      critiques.overallWeaknesses = overallAnalysis.weaknesses;
      critiques.studyRecommendations = overallAnalysis.recommendations;
      critiques.strengths = overallAnalysis.strengths;

      console.log(`[CritiqueService] Generated critiques for ${incorrectAnswers.length} incorrect answers`);
      return critiques;

    } catch (error) {
      console.error('[CritiqueService] Generate critiques error:', error);
      // Fallback to basic critiques on error
      return this._generateFallbackCritiques(attempt, test);
    }
  }

  /**
   * Get all incorrect answers from an attempt.
   * @param {Object} attempt - Attempt document
   * @param {Object} test - Test document
   * @returns {Array} Array of incorrect answer objects
   * @private
   */
  _getIncorrectAnswers(attempt, test) {
    const incorrect = [];
    
    if (!attempt.perQuestionResults || !test.shortAnswerQuestions) {
      return incorrect;
    }

    test.shortAnswerQuestions.forEach((question, index) => {
      const questionId = `q${index}`;
      const result = attempt.perQuestionResults[questionId];
      
      if (result && !result.correct) {
        const sourceNote = this._findSourceNote(test, question);
        incorrect.push({
          questionId,
          question: question.question,
          userAnswer: result.userAnswer,
          expectedAnswer: result.expectedAnswer,
          sourceConcept: question.sourceConcept || result.sourceConcept || '',
          sourceNoteId: question.sourceNoteId || result.sourceNoteId || sourceNote?.noteId || sourceNote?.id || null,
          sourceNoteTitle: question.sourceNoteTitle || sourceNote?.noteTitle || sourceNote?.title || question.sourceConcept || '',
          sourceNoteTopic: question.sourceNoteTopic || sourceNote?.topic || '',
          timing: result.timing
        });
      }
    });

    return incorrect;
  }

  /**
   * Generate fallback critiques when AI is not available.
   * @param {Object} attempt - Attempt document
   * @param {Object} test - Test document
   * @returns {Object} Basic fallback critiques
   * @private
   */
  _generateFallbackCritiques(attempt, test) {
    const critiques = {
      perQuestionCritiques: {},
      overallWeaknesses: [],
      studyRecommendations: [],
      strengths: []
    };

    const incorrectAnswers = this._getIncorrectAnswers(attempt, test);
    
    if (incorrectAnswers.length === 0) {
      critiques.overallWeaknesses = ["No incorrect answers to analyze - excellent work!"];
      critiques.studyRecommendations = ["Continue reviewing to maintain your understanding"];
      critiques.strengths = ["Perfect score achieved"];
      return critiques;
    }

    // Generate basic critiques for incorrect answers
    incorrectAnswers.forEach(incorrect => {
      critiques.perQuestionCritiques[incorrect.questionId] = {
        questionId: incorrect.questionId,
        question: incorrect.question,
        userAnswer: incorrect.userAnswer,
        expectedAnswer: incorrect.expectedAnswer,
        critique: 'Your answer differs from the expected answer.',
        explanation: `The correct answer is: "${incorrect.expectedAnswer}"`,
        improvement: `Review ${incorrect.sourceNoteTitle || incorrect.sourceConcept} and try to understand the key terminology.`,
        confidence: 'low'
      };
    });

    // Generate overall analysis
    const concepts = [...new Set(incorrectAnswers.map(a => a.sourceNoteTitle || a.sourceConcept).filter(Boolean))];
    critiques.overallWeaknesses = concepts.map(concept => `Difficulty with ${concept} concepts`);
    critiques.studyRecommendations = concepts.map(concept => `Focus study on ${concept} topics`);
    critiques.strengths = ['Attempted all questions', 'Showed effort in responses'];

    return critiques;
  }

  /**
   * Generate critique for a specific incorrect answer.
   * @param {Object} incorrect - Incorrect answer object
   * @param {Object} test - Test document
   * @returns {Promise<Object>} Question-specific critique
   * @private
   */
  async _generateQuestionCritique(incorrect, test) {
    const prompt = this._buildQuestionCritiquePrompt(incorrect);
    
    try {
      const response = await this.aiProvider.generateCritique(prompt, {
        model: 'gpt-3.5-turbo',
        temperature: 0.3
      });

      return {
        questionId: incorrect.questionId,
        question: incorrect.question,
        userAnswer: incorrect.userAnswer,
        expectedAnswer: incorrect.expectedAnswer,
        sourceNoteId: incorrect.sourceNoteId,
        sourceNoteTitle: incorrect.sourceNoteTitle,
        sourceNoteTopic: incorrect.sourceNoteTopic,
        critique: response.critique || 'No critique available',
        explanation: response.explanation || 'No explanation available',
        improvement: response.improvement || 'No improvement suggestions available',
        confidence: response.confidence || 'medium'
      };

    } catch (error) {
      console.error(`[CritiqueService] Question critique generation failed for ${incorrect.questionId}:`, error);
      
      // Fallback critique
      return {
        questionId: incorrect.questionId,
        question: incorrect.question,
        userAnswer: incorrect.userAnswer,
        expectedAnswer: incorrect.expectedAnswer,
        sourceNoteId: incorrect.sourceNoteId,
        sourceNoteTitle: incorrect.sourceNoteTitle,
        sourceNoteTopic: incorrect.sourceNoteTopic,
        critique: 'Unable to generate detailed critique due to technical issues.',
        explanation: `Your answer "${incorrect.userAnswer}" differs from the expected answer "${incorrect.expectedAnswer}".`,
        improvement: 'Review the source material and try to understand the key concepts better.',
        confidence: 'low'
      };
    }
  }

  /**
   * Generate overall analysis of weaknesses and recommendations.
   * @param {Array} incorrectAnswers - Array of incorrect answers
   * @param {Object} test - Test document
   * @returns {Promise<Object>} Overall analysis
   * @private
   */
  async _generateOverallAnalysis(incorrectAnswers, test) {
    const prompt = this._buildOverallAnalysisPrompt(incorrectAnswers, test);
    
    try {
      const response = await this.aiProvider.generateCritique(prompt, {
        model: 'gpt-3.5-turbo',
        temperature: 0.3
      });

      return {
        weaknesses: response.weaknesses || ['Unable to analyze weaknesses'],
        recommendations: response.recommendations || ['Review the test material thoroughly'],
        strengths: response.strengths || ['Unable to identify strengths']
      };

    } catch (error) {
      console.error('[CritiqueService] Overall analysis generation failed:', error);
      
      // Fallback analysis
      const concepts = [...new Set(incorrectAnswers.map(a => a.sourceNoteTitle || a.sourceConcept).filter(Boolean))];
      
      return {
        weaknesses: concepts.map(concept => `Difficulty with ${concept} concepts`),
        recommendations: concepts.map(concept => `Focus study on ${concept} topics`),
        strengths: ['Attempted all questions', 'Showed effort in responses']
      };
    }
  }

  /**
   * Build prompt for question-specific critique.
   * @param {Object} incorrect - Incorrect answer object
   * @returns {string} Prompt for AI
   * @private
   */
  _buildQuestionCritiquePrompt(incorrect) {
    return `As an expert educational tutor, analyze this incorrect answer and provide constructive feedback.

Question: "${incorrect.question}"
User's Answer: "${incorrect.userAnswer}"
Expected Answer: "${incorrect.expectedAnswer}"
Source Concept: "${incorrect.sourceConcept}"
Source Note: "${incorrect.sourceNoteTitle || 'Unknown'}" (${incorrect.sourceNoteId || 'no note id'})
Source Topic: "${incorrect.sourceNoteTopic || 'Unknown'}"

Please provide a JSON response with the following fields:
{
  "critique": "Brief, encouraging critique of why the answer is incorrect",
  "explanation": "Clear explanation of the correct answer and why it's right",
  "improvement": "Specific suggestions for how to improve understanding of this concept",
  "confidence": "high/medium/low confidence in this analysis"
}

Keep responses concise but helpful. Focus on learning rather than just pointing out mistakes.`;
  }

  /**
   * Build prompt for overall analysis.
   * @param {Array} incorrectAnswers - Array of incorrect answers
   * @param {Object} test - Test document
   * @returns {string} Prompt for AI
   * @private
   */
  _buildOverallAnalysisPrompt(incorrectAnswers, test) {
    const incorrectSummary = incorrectAnswers.map((answer, index) => 
      `${index + 1}. Question: "${answer.question.substring(0, 100)}..." 
       User Answer: "${answer.userAnswer}"
       Concept: "${answer.sourceConcept}"
       Source Note: "${answer.sourceNoteTitle || 'Unknown'}" (${answer.sourceNoteId || 'no note id'})
       Topic: "${answer.sourceNoteTopic || 'Unknown'}"`
    ).join('\n');

    return `As an educational assessment expert, analyze these incorrect answers from a test and provide overall learning guidance.

Test Topic: ${test.topic || 'Unknown'}
Difficulty: ${test.difficulty || 'Unknown'}
Total Incorrect Answers: ${incorrectAnswers.length}

Incorrect Answers Summary:
${incorrectSummary}

Please provide a JSON response with the following fields:
{
  "weaknesses": ["List of 3-5 main knowledge gaps or weaknesses identified"],
  "recommendations": ["List of 3-5 specific study recommendations to address these weaknesses"],
  "strengths": ["List of 2-3 areas where the student showed good understanding or effort"]
}

Focus on actionable study advice and be encouraging while identifying areas for improvement.`;
  }

  _findSourceNote(test, question) {
    if (!test?.sourceNotes?.length) return null;

    const sourceNoteId = question.sourceNoteId;
    if (sourceNoteId) {
      const byId = test.sourceNotes.find(note =>
        note.noteId === sourceNoteId ||
        note.id === sourceNoteId
      );
      if (byId) return byId;
    }

    const sourceTitle = (question.sourceNoteTitle || question.sourceConcept || '').toLowerCase();
    if (!sourceTitle) return null;

    return test.sourceNotes.find(note =>
      (note.noteTitle || note.title || '').toLowerCase() === sourceTitle
    ) || null;
  }
}

module.exports = CritiqueService;
