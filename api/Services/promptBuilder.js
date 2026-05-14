'use strict';

/**
 * Builds optimized OpenAI prompts for short-answer question generation
 * using only vault study material.
 */
class PromptBuilder {
  /**
   * Build a comprehensive prompt for OpenAI to generate short-answer questions.
   *
   * @param {Object} params - Prompt parameters
   * @param {string} params.domain - Knowledge domain
   * @param {string|string[]} params.sections - Section(s) within domain, or 'all' for domain-wide
   * @param {string|string[]|Object} [params.topics] - Optional topic filter, or section-to-topics map
   * @param {Array} params.notes - Array of vault notes with content
   * @param {string} params.difficulty - 'easy', 'medium', 'hard', or 'mixed'
   * @param {number} params.questionCount - Number of questions to generate
   * @param {string} [params.testName] - Optional custom name for the test
   * @returns {string} Optimized prompt for OpenAI
   */
  static buildPrompt({ domain, sections, topics, notes, difficulty, questionCount, testName }) {
    const cleanedContent = this._cleanAndAggregateNotes(notes);
    const keyConcepts = this._extractKeyConcepts(cleanedContent);
    const scopeDescription = this._getScopeDescription(sections, topics);
    const difficultyInstructions = this._getDifficultyInstructions(difficulty);
    const topic = this._getTopic(sections, topics);
    const nameContext = testName ? `\n- Test Name: "${testName}"` : '';

    // Build a structured note index so the AI can reference exact vault IDs.
    const noteIndex = notes
      .map(n => `  - id:"${n.id}" title:"${n.title}"`)
      .join('\n');

    const prompt = `You are an expert educational assessment designer specialising in short-answer question generation.

CONTEXT:
- Domain: ${domain}
- Scope: ${scopeDescription}
- Difficulty Level: ${difficulty}
- Questions Required: ${questionCount}${nameContext}

AVAILABLE NOTES (you MUST reference these exact IDs in your response):
${noteIndex}

STUDY MATERIAL:
${cleanedContent}

KEY CONCEPTS IDENTIFIED:
${keyConcepts}

INSTRUCTIONS:
Using ONLY the supplied vault study material above, generate exactly ${questionCount} short-answer questions that test conceptual understanding and recall.

${difficultyInstructions}

CRITICAL REQUIREMENTS:
1. Generate ONLY short-answer questions.
2. Do NOT use multiple choice, true/false, fill-in-the-blank, or matching formats.
3. Base EVERYTHING exclusively on the provided study material.
4. Do NOT use outside knowledge or invent concepts not present in the notes.
5. Focus on "What is...", "Why does...", "How does...", "Explain..." type questions.
6. Each question must have a clear, concise answer based on the provided material.
7. For "sourceNoteId" use the EXACT id value from the AVAILABLE NOTES list above.
   Never invent, paraphrase, or derive an id from a filename.
8. For "sourceConcept" use the human-readable title of the same note.

RESPONSE FORMAT:
Return valid JSON ONLY with this exact structure — no commentary, no markdown fences:
{
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "shortAnswerQuestions": [
    {
      "question": "What is [concept]?",
      "answer": "[Clear, concise answer from the material]",
      "sourceConcept": "[Note title from AVAILABLE NOTES]",
      "sourceNoteId": "[Exact note id from AVAILABLE NOTES]"
    }
  ]
}`;

    return prompt;
  }

  /**
   * Clean and aggregate note content by removing metadata and formatting.
   * Implements token limits to prevent exceeding OpenAI context limits.
   *
   * @param {Array} notes - Array of vault notes
   * @returns {string} Cleaned, aggregated content
   */
  static _cleanAndAggregateNotes(notes) {
    if (!notes || !notes.length) {
      return 'No study material available.';
    }

    const MAX_TOKENS = 12000;
    const APPROX_CHARS_PER_TOKEN = 4;
    const MAX_CHARS = MAX_TOKENS * APPROX_CHARS_PER_TOKEN;

    let totalChars = 0;
    const processedNotes = [];

    for (const note of notes) {
      let content = note.content.replace(/^---\r?\n[\s\S]*?\r?\n---/, '');

      content = content
        .replace(/\[\[([^\]]+)\]\]/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/^id:\s*.*$/gm, '')
        .replace(/^tags:\s*.*$/gm, '')
        .replace(/^created:\s*.*$/gm, '')
        .replace(/^modified:\s*.*$/gm, '')
        .trim();

      if (content.length > 50) {
        // Label each block with the note's slug id so the AI can cross-reference
        const noteWithHeader = `## ${note.title} [id:${note.id}]\n\n${content}`;
        const noteChars = noteWithHeader.length;

        if (totalChars + noteChars > MAX_CHARS) {
          const remainingChars = MAX_CHARS - totalChars;
          if (remainingChars > 500) {
            const truncatedContent = this._truncateContent(content, remainingChars - 100);
            processedNotes.push(
              `## ${note.title} [id:${note.id}]\n\n${truncatedContent}\n\n[Content truncated due to length limits...]`
            );
            totalChars = MAX_CHARS;
          }
          break;
        }

        processedNotes.push(noteWithHeader);
        totalChars += noteChars;
      }
    }

    if (processedNotes.length === 0) {
      return 'No study material available after processing.';
    }

    const result = processedNotes.join('\n\n---\n\n');
    const estimatedTokens = Math.ceil(totalChars / APPROX_CHARS_PER_TOKEN);
    console.log(`[PromptBuilder] Processed ${processedNotes.length} notes, ~${estimatedTokens} tokens`);

    return result;
  }

  /**
   * Truncate content intelligently to fit within character limits.
   *
   * @param {string} content - Content to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated content
   * @private
   */
  static _truncateContent(content, maxLength) {
    if (content.length <= maxLength) return content;

    const sentences = content.split(/[.!?]+/);
    let truncated = '';

    for (const sentence of sentences) {
      const testLength = truncated.length + sentence.length + 1;
      if (testLength > maxLength) break;
      truncated += (truncated ? '. ' : '') + sentence.trim();
    }

    if (truncated.length === 0) {
      truncated = content.substring(0, maxLength - 3) + '...';
    }

    return truncated;
  }

  /**
   * Extract key concepts and definitions from cleaned content.
   *
   * @param {string} content - Cleaned note content
   * @returns {string} Formatted key concepts
   */
  static _extractKeyConcepts(content) {
    if (!content || content === 'No study material available.') {
      return 'No key concepts identified.';
    }

    const concepts = [];

    const definitionPatterns = [
      /(.+?)\s+is\s+(.+?)(?:\.|\n|$)/g,
      /(.+?)\s+refers\s+to\s+(.+?)(?:\.|\n|$)/g,
      /(.+?)\s+can\s+be\s+defined\s+as\s+(.+?)(?:\.|\n|$)/g,
      /(.+?)\s+means\s+(.+?)(?:\.|\n|$)/g,
    ];

    definitionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const concept = match[1].trim();
        const definition = match[2].trim();
        if (concept.length > 2 && definition.length > 10) {
          concepts.push(
            `- ${concept}: ${definition.substring(0, 100)}${definition.length > 100 ? '...' : ''}`
          );
        }
      }
    });

    const headings = content.match(/^#{1,3}\s+(.+)$/gm) || [];
    headings.forEach(heading => {
      const title = heading.replace(/^#{1,3}\s+/, '').trim();
      if (title.length > 2) concepts.push(`- Topic: ${title}`);
    });

    return concepts.length > 0
      ? concepts.slice(0, 15).join('\n')
      : 'Key concepts not explicitly identified.';
  }

  /**
   * Get difficulty-specific instructions for question generation.
   *
   * @param {string} difficulty - Difficulty level
   * @returns {string} Difficulty instructions
   */
  static _getDifficultyInstructions(difficulty) {
    const instructions = {
      easy: `
DIFFICULTY: Easy
- Focus on basic definitions and simple recall
- Use straightforward "What is..." questions
- Answers should be 1-2 sentences maximum
- Test fundamental concepts only`,

      medium: `
DIFFICULTY: Medium
- Include both definitions and explanations
- Use "Why does..." and "How does..." questions
- Answers may require 2-3 sentences
- Test understanding of relationships between concepts`,

      hard: `
DIFFICULTY: Hard
- Focus on complex explanations and analysis
- Use questions that require deeper understanding
- Answers may require 3-4 sentences with examples
- Test application and synthesis of concepts`,

      mixed: `
DIFFICULTY: Mixed
- Include a balance of easy, medium, and hard questions
- Vary question types: definitions, explanations, analysis
- Mix of short and more detailed answers required
- Test both recall and deeper understanding`,
    };

    return instructions[difficulty] || instructions.mixed;
  }

  /**
   * Get a human-readable description of the test scope.
   *
   * @param {string|string[]} sections - Section(s) or 'all'
   * @returns {string} Scope description
   * @private
   */
  static _getScopeDescription(sections, topics) {
    let sectionScope = 'Unknown scope';
    if (sections === 'all') sectionScope = 'All sections in the domain';
    else if (typeof sections === 'string') sectionScope = `Section: ${sections}`;
    else if (Array.isArray(sections)) sectionScope = `Sections: ${sections.join(', ')}`;

    const topicScope = this._getTopicSelectionLabel(topics);
    return topicScope ? `${sectionScope}; Topics: ${topicScope}` : sectionScope;
  }

  /**
   * Get the topic name for the response JSON.
   *
   * @param {string|string[]} sections - Section(s) or 'all'
   * @returns {string} Topic name
   * @private
   */
  static _getTopic(sections, topics) {
    const topicScope = this._getTopicSelectionLabel(topics);
    if (topicScope) return topicScope;
    if (sections === 'all') return 'Domain-wide';
    if (typeof sections === 'string') return sections;
    if (Array.isArray(sections)) return sections.length === 1 ? sections[0] : `${sections.length} sections`;
    return 'Unknown';
  }

  static _getTopicSelectionLabel(topics) {
    if (!topics) return '';
    if (typeof topics === 'string') return topics;
    if (Array.isArray(topics)) return topics.join(', ');
    if (typeof topics === 'object') {
      return Object.entries(topics)
        .map(([section, selectedTopics]) => {
          if (selectedTopics === 'all') return `${section}: all topics`;
          if (Array.isArray(selectedTopics)) return `${section}: ${selectedTopics.join(', ')}`;
          return `${section}: ${selectedTopics}`;
        })
        .join('; ');
    }
    return '';
  }
}

module.exports = PromptBuilder;
