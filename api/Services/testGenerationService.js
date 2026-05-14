'use strict';

const VaultService = require('./vaultService');
const PromptBuilder = require('./promptBuilder');
const AIProvider = require('./aiProvider');
const Test = require('../models/Test');

/**
 * Main service for generating short-answer tests using vault content.
 * Orchestrates the entire flow from vault retrieval to Firestore storage.
 */
class TestGenerationService {
  constructor() {
    this.vaultService = new VaultService();
    this.aiProvider = new AIProvider();
  }

  /**
   * Generate a short-answer test from vault study material.
   *
   * @param {Object} params - Test generation parameters
   * @param {string} params.domain - Knowledge domain
   * @param {string|string[]} params.sections - Section(s) within domain, or 'all' for domain-wide
   * @param {string|string[]|Object} [params.topics] - Optional topic filter, or section-to-topics map
   * @param {string} params.difficulty - 'easy', 'medium', 'hard', or 'mixed'
   * @param {number} params.questionCount - Number of questions to generate
   * @param {string} [params.name] - Optional custom name for the test
   * @returns {Promise<Object>} Generated test data
   */
  async generateShortAnswerTest({ domain, sections, topics, difficulty, questionCount, name }) {
    console.log(`[TestGeneration] Starting test generation for ${domain}/${JSON.stringify(sections)} topics=${JSON.stringify(topics || 'all')}`);

    this._validateInput({ domain, sections, topics, difficulty, questionCount, name });

    const notes = await this._retrieveVaultNotes(domain, sections, topics);

    const prompt = PromptBuilder.buildPrompt({
      domain,
      sections,
      topics,
      notes,
      difficulty,
      questionCount,
      testName: name,
    });

    const aiResponse = await this.aiProvider.generateQuestions(prompt);

    const validatedTest = this._validateTestResponse(
      aiResponse,
      questionCount,
      domain,
      sections,
      topics,
      name,
      notes,
    );

    const savedTest = await this._saveTestToDatabase(validatedTest);

    console.log(
      `[TestGeneration] Saved test "${savedTest.name}" with ${savedTest.shortAnswerQuestions.length} questions ` +
      `and ${savedTest.sourceNotes.length} source notes`
    );

    return savedTest;
  }

  // ─── Validation ─────────────────────────────────────────────────────────────

  _validateInput({ domain, sections, topics, difficulty, questionCount, name }) {
    if (!domain || typeof domain !== 'string' || domain.trim().length === 0) {
      throw new Error('Domain is required and must be a non-empty string');
    }

    if (!sections) throw new Error('Sections parameter is required');

    if (sections === 'all') {
      // valid
    } else if (typeof sections === 'string') {
      if (sections.trim().length === 0) throw new Error('Section cannot be empty string');
    } else if (Array.isArray(sections)) {
      if (sections.length === 0) throw new Error('Sections array cannot be empty');
      if (!sections.every(s => typeof s === 'string' && s.trim().length > 0)) {
        throw new Error('All sections in array must be non-empty strings');
      }
    } else {
      throw new Error('Sections must be a string, array of strings, or "all"');
    }

    this._normalizeTopicSelection(topics);

    const validDifficulties = ['easy', 'medium', 'hard', 'mixed'];
    if (!validDifficulties.includes(difficulty)) {
      throw new Error(`Difficulty must be one of: ${validDifficulties.join(', ')}`);
    }

    if (!Number.isInteger(questionCount) || questionCount < 1 || questionCount > 50) {
      throw new Error('Question count must be an integer between 1 and 50');
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        throw new Error('Test name must be a non-empty string if provided');
      }
      if (name.trim().length > 100) {
        throw new Error('Test name cannot exceed 100 characters');
      }
    }
  }

  // ─── Note retrieval ──────────────────────────────────────────────────────────

  async _retrieveVaultNotes(domain, sections, topics) {
    try {
      let notes = [];
      let scopeDescription = '';

      if (sections === 'all') {
        const domainSections = await this.vaultService.getSectionsByDomain(domain);
        for (const sectionData of domainSections) {
          const sectionNotes = this._filterNotesByTopics(
            sectionData.notes || [],
            this._getTopicsForSection(topics, sectionData.name)
          );
          if (sectionNotes.length > 0) notes.push(...sectionNotes);
        }
        scopeDescription = this._describeScope(domain, sections, topics);
      } else if (typeof sections === 'string') {
        const sectionNotes = await this.vaultService.getNotesBySection(domain, sections);
        notes = this._filterNotesByTopics(sectionNotes, this._getTopicsForSection(topics, sections));
        scopeDescription = this._describeScope(domain, sections, topics);
      } else if (Array.isArray(sections)) {
        for (const section of sections) {
          const sectionNotes = await this.vaultService.getNotesBySection(domain, section);
          notes.push(...this._filterNotesByTopics(sectionNotes, this._getTopicsForSection(topics, section)));
        }
        scopeDescription = this._describeScope(domain, sections, topics);
      }

      if (!notes || notes.length === 0) {
        throw new Error(`No notes found for ${scopeDescription}`);
      }

      console.log(`[TestGeneration] Retrieved ${notes.length} notes from ${scopeDescription}`);
      return notes;
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new Error(`Domain "${domain}" or specified sections not found in vault`);
      }
      throw error;
    }
  }

  _normalizeTopicSelection(topics) {
    if (topics === undefined || topics === null) return null;

    const normalizeList = value => {
      if (value === 'all') return null;
      if (typeof value === 'string') {
        if (value.trim().length === 0) throw new Error('Topic cannot be an empty string');
        return [value.trim()];
      }
      if (Array.isArray(value)) {
        if (value.length === 0) throw new Error('Topics array cannot be empty');
        if (!value.every(t => typeof t === 'string' && t.trim().length > 0)) {
          throw new Error('All topics must be non-empty strings');
        }
        return value.map(t => t.trim());
      }
      throw new Error('Topics must be a string, array of strings, or section-to-topics object');
    };

    if (typeof topics === 'string' || Array.isArray(topics)) {
      return normalizeList(topics);
    }

    if (typeof topics === 'object') {
      const normalized = {};
      for (const [section, selectedTopics] of Object.entries(topics)) {
        if (!section || section.trim().length === 0) {
          throw new Error('Topic map section keys must be non-empty strings');
        }
        normalized[section] = normalizeList(selectedTopics);
      }
      return normalized;
    }

    throw new Error('Topics must be a string, array of strings, or section-to-topics object');
  }

  _getTopicsForSection(topics, section) {
    const normalized = this._normalizeTopicSelection(topics);
    if (!normalized) return null;
    if (Array.isArray(normalized)) return normalized;

    const selected = normalized[section] || normalized['*'] || normalized._all;
    return selected || null;
  }

  _filterNotesByTopics(notes, topics) {
    if (!topics || topics.length === 0) return notes;

    const selected = new Set(topics.map(topic => this._normalizeComparable(topic)));
    return notes.filter(note => selected.has(this._normalizeComparable(note.topic || 'Uncategorized')));
  }

  _describeScope(domain, sections, topics) {
    const sectionDescription = sections === 'all'
      ? `all sections in domain "${domain}"`
      : Array.isArray(sections)
        ? `sections [${sections.join(', ')}] in domain "${domain}"`
        : `section "${sections}" in domain "${domain}"`;

    const topicSummary = this._topicSelectionLabel(topics);
    return topicSummary ? `${sectionDescription}, topics ${topicSummary}` : sectionDescription;
  }

  _topicSelectionLabel(topics) {
    const normalized = this._normalizeTopicSelection(topics);
    if (!normalized) return '';
    if (Array.isArray(normalized)) return `[${normalized.join(', ')}]`;

    const parts = Object.entries(normalized)
      .filter(([, selectedTopics]) => selectedTopics && selectedTopics.length > 0)
      .map(([section, selectedTopics]) => `${section}: [${selectedTopics.join(', ')}]`);
    return parts.length ? `{ ${parts.join('; ')} }` : '';
  }

  _normalizeComparable(value) {
    return `${value || ''}`.trim().toLowerCase();
  }

  // ─── Response validation & source-note resolution ────────────────────────────

  /**
   * Validate the AI response and resolve sourceNotes to only the notes
   * actually used for the generated questions.
   *
   * Resolution priority:
   *   1. Exact match on sourceNoteId (the slug the AI was told to use)
   *   2. Fuzzy match on sourceConcept vs note title (fallback if AI drifted)
   *   3. Minimal synthetic note objects built from sourceConcept strings
   *      (last resort so sourceNotes is never the entire section)
   */
  _validateTestResponse(aiResponse, expectedQuestionCount, domain, sections, topics, name, notes) {
    const actualQuestionCount = aiResponse.shortAnswerQuestions.length;
    if (actualQuestionCount !== expectedQuestionCount) {
      console.warn(
        `[TestGeneration] Expected ${expectedQuestionCount} questions, got ${actualQuestionCount}`
      );
    }

    const invalidQuestions = aiResponse.shortAnswerQuestions.filter(q =>
      this._isInvalidShortAnswerQuestion(q)
    );
    if (invalidQuestions.length > 0) {
      throw new Error(`Generated ${invalidQuestions.length} invalid short-answer questions`);
    }

    const sectionForStorage = Array.isArray(sections) ? sections.join(', ') : sections;
    const topicForStorage = this._topicSelectionLabel(topics) || aiResponse.topic;

    // ── 1. Exact match via sourceNoteId slug ───────────────────────────────
    const usedNoteIds = new Set(
      aiResponse.shortAnswerQuestions.map(q => q.sourceNoteId).filter(Boolean)
    );

    let sourceNotes = notes.filter(n => usedNoteIds.has(n.id));

    // ── 2. Fuzzy match via sourceConcept vs note title ─────────────────────
    if (sourceNotes.length === 0) {
      console.warn(
        '[TestGeneration] No exact sourceNoteId matches — falling back to sourceConcept fuzzy match'
      );

      const usedConcepts = aiResponse.shortAnswerQuestions
        .map(q => (q.sourceConcept || '').toLowerCase().trim())
        .filter(Boolean);

      sourceNotes = notes.filter(note => {
        const title = (note.title || '').toLowerCase();
        const id    = (note.id    || '').toLowerCase();
        return usedConcepts.some(
          concept =>
            title.includes(concept) ||
            concept.includes(title) ||
            id.includes(concept) ||
            concept.includes(id)
        );
      });
    }

    // ── 3. Synthetic fallback — one entry per unique sourceConcept ─────────
    if (sourceNotes.length === 0) {
      console.warn(
        '[TestGeneration] Fuzzy match also failed — building synthetic sourceNotes from sourceConcepts'
      );

      sourceNotes = [
        ...new Map(
          aiResponse.shortAnswerQuestions
            .filter(q => q.sourceConcept)
            .map(q => {
              // Try to find any partial match first
              const matched = notes.find(n =>
                (n.title || '').toLowerCase().includes(q.sourceConcept.toLowerCase()) ||
                q.sourceConcept.toLowerCase().includes((n.title || '').toLowerCase())
              );
              return [
                q.sourceConcept,
                matched || {
                  id: q.sourceNoteId || q.sourceConcept,
                  title: q.sourceConcept,
                  section: sectionForStorage,
                  domain,
                },
              ];
            })
        ).values(),
      ];
    }

    const resolvedQuestions = aiResponse.shortAnswerQuestions.map(q => ({
      ...q,
      _sourceNote: this._resolveQuestionSourceNote(q, notes),
    }));

    const unresolvedCount = resolvedQuestions.filter(q => !q._sourceNote).length;
    if (unresolvedCount > 0) {
      console.warn(`[TestGeneration] ${unresolvedCount} generated question(s) could not be resolved to a vault note`);
    }

    sourceNotes = [
      ...new Map(
        resolvedQuestions
          .filter(q => q._sourceNote)
          .map(q => [q._sourceNote.id, q._sourceNote])
      ).values(),
    ];

    if (sourceNotes.length === 0) {
      throw new Error('Generated questions could not be linked to any vault source notes');
    }

    console.log(
      `[TestGeneration] Resolved ${sourceNotes.length} source note(s) from ${aiResponse.shortAnswerQuestions.length} question(s)`
    );

    return {
      domain,
      section: sectionForStorage,
      topic: topicForStorage,
      difficulty: aiResponse.difficulty,
      name,
      shortAnswerQuestions: resolvedQuestions.map(q => ({
        question:     q.question.trim(),
        answer:       q.answer.trim(),
        sourceConcept: q._sourceNote?.title || q.sourceConcept?.trim() || '',
        sourceNoteId:  q._sourceNote?.id || null,
        sourceNoteTitle: q._sourceNote?.title || q.sourceConcept?.trim() || '',
        sourceNoteTopic: q._sourceNote?.topic || '',
      })),
      sourceNotes,
      createdAt: new Date(),
    };
  }

  // ─── Question format checks ──────────────────────────────────────────────────

  _resolveQuestionSourceNote(question, notes) {
    const requestedId = question.sourceNoteId?.trim();
    if (requestedId) {
      const exact = notes.find(note => note.id === requestedId);
      if (exact) return exact;
    }

    const concept = question.sourceConcept?.trim().toLowerCase();
    if (!concept) return null;

    return notes.find(note => {
      const title = (note.title || '').toLowerCase();
      const id = (note.id || '').toLowerCase();
      return title === concept || id === concept;
    }) || notes.find(note => {
      const title = (note.title || '').toLowerCase();
      const id = (note.id || '').toLowerCase();
      return title.includes(concept) ||
        concept.includes(title) ||
        id.includes(concept) ||
        concept.includes(id);
    }) || null;
  }

  _isInvalidShortAnswerQuestion(question) {
    const { question: qText, answer } = question;

    if (
      qText.includes('(A)') ||
      qText.includes('(B)') ||
      qText.includes('(C)') ||
      qText.includes('(D)')
    ) return true;

    if (
      qText.toLowerCase().includes('true or false') ||
      qText.toLowerCase().includes('t/f')
    ) return true;

    if (qText.includes('___') || qText.toLowerCase().includes('fill in')) return true;

    if (answer.length > 500) return true;

    return false;
  }

  // ─── Database ────────────────────────────────────────────────────────────────

  async _saveTestToDatabase(testData) {
    try {
      const savedTest = await Test.create(testData);
      console.log(`[TestGeneration] Saved test with ID: ${savedTest.id}`);
      return savedTest;
    } catch (error) {
      console.error('[TestGeneration] Database save error:', error);
      throw new Error(`Failed to save test to database: ${error.message}`);
    }
  }

  // ─── Query helpers ───────────────────────────────────────────────────────────

  async getGeneratedTests(filters = {}) {
    const limit  = filters.limit  || 20;
    const offset = filters.offset || 0;
    try {
      return await Test.find({
        domain:     filters.domain,
        section:    filters.section,
        difficulty: filters.difficulty,
        limit,
        offset,
      });
    } catch (error) {
      console.error('[TestGeneration] Database query error:', error);
      throw new Error(`Failed to retrieve tests: ${error.message}`);
    }
  }

  async getTestById(testId) {
    try {
      const test = await Test.findById(testId);
      if (!test) throw new Error('Test not found');
      return test;
    } catch (error) {
      if (error.message === 'Test not found') throw error;
      console.error('[TestGeneration] Database query error:', error);
      throw new Error(`Failed to retrieve test: ${error.message}`);
    }
  }

  async updateTest(testId, updateData) {
    try {
      const allowedFields = ['name'];
      const updateFields  = {};

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined) updateFields[key] = value;
      }

      if (Object.keys(updateFields).length === 0) {
        throw new Error('No valid fields to update. Only name updates are currently supported.');
      }

      const updatedTest = await Test.findByIdAndUpdate(testId, updateFields);
      if (!updatedTest) throw new Error('Test not found');

      console.log(`[TestGeneration] Updated test "${updatedTest.name}" with ID: ${testId}`);
      return updatedTest;
    } catch (error) {
      if (error.message === 'Test not found') throw error;
      console.error('[TestGeneration] Database update error:', error);
      throw new Error(`Failed to update test: ${error.message}`);
    }
  }

  async deleteTest(testId) {
    try {
      const result = await Test.findByIdAndDelete(testId);
      if (!result) throw new Error('Test not found');
      console.log(`[TestGeneration] Deleted test with ID: ${testId}`);
      return true;
    } catch (error) {
      if (error.message === 'Test not found') throw error;
      console.error('[TestGeneration] Database delete error:', error);
      throw new Error(`Failed to delete test: ${error.message}`);
    }
  }

  async getTestStatistics() {
    try {
      const tests = await Test.find({});
      const stats = {
        totalTests:     tests.length,
        totalQuestions: 0,
        domains:        new Set(),
        sections:       new Set(),
        difficulties:   new Set(),
      };

      tests.forEach(test => {
        stats.totalQuestions += test.shortAnswerQuestions?.length || 0;
        stats.domains.add(test.domain);
        stats.sections.add(test.section);
        stats.difficulties.add(test.difficulty);
      });

      return {
        totalTests:          stats.totalTests,
        totalQuestions:      stats.totalQuestions,
        avgQuestionsPerTest: stats.totalTests > 0
          ? Math.round((stats.totalQuestions / stats.totalTests) * 10) / 10
          : 0,
        domains:       Array.from(stats.domains),
        sections:      Array.from(stats.sections),
        difficulties:  Array.from(stats.difficulties),
        domainCount:   stats.domains.size,
        sectionCount:  stats.sections.size,
        difficultyCount: stats.difficulties.size,
      };
    } catch (error) {
      console.error('[TestGeneration] Statistics query error:', error);
      throw new Error(`Failed to get statistics: ${error.message}`);
    }
  }
}

module.exports = TestGenerationService;
