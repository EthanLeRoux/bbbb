'use strict';

const fs = require('fs/promises');
const path = require('path');

// ─── Constants ────────────────────────────────────────────────────────────────

/** Folders at vault root that are NOT domains and should be skipped during scanning. */
const EXCLUDED_ROOT_FOLDERS = new Set(['templates']);

/** Regex for YAML front-matter block. */
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/;

/**
 * Expected format for the `id` field: YYYYMMDDHHmm (12 digits).
 * Example: 202605141947
 */
const ID_FORMAT_RE = /^\d{12}$/;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse YAML front-matter into a plain object.
 * Handles only simple `key: value` pairs (sufficient for this vault schema).
 *
 * @param {string} raw - Full file content.
 * @returns {Record<string, string>}
 */
function parseFrontmatter(raw) {
  const match = raw.match(FRONTMATTER_RE);
  if (!match) return {};

  return Object.fromEntries(
    match[1]
      .split(/\r?\n/)
      .map(line => {
        const colon = line.indexOf(':');
        if (colon === -1) return null;
        const key = line.slice(0, colon).trim();
        const value = line.slice(colon + 1).trim();
        return key ? [key, value] : null;
      })
      .filter(Boolean)
  );
}

/**
 * Derive a human-readable title from a note.
 * Priority: frontmatter `title:` → first `# Heading` → filename stem.
 *
 * @param {string} content
 * @param {string} fileName
 * @param {Record<string, string>} meta
 * @returns {string}
 */
function deriveTitle(content, fileName, meta) {
  if (meta.title) return meta.title;

  // First ATX heading that appears after the front-matter block
  const headingMatch = content.replace(FRONTMATTER_RE, '').match(/^#\s+(.+)$/m);
  if (headingMatch) return headingMatch[1].trim();

  return path.basename(fileName, '.md');
}

/**
 * Validate a card's `id` field.
 * Returns an object describing whether the id is valid and why if not.
 *
 * @param {string | undefined} id
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateCardId(id) {
  if (!id || id.trim() === '') {
    return { valid: false, reason: 'missing id field' };
  }
  if (!ID_FORMAT_RE.test(id.trim())) {
    return { valid: false, reason: `malformed id "${id}" — expected YYYYMMDDHHmm (12 digits)` };
  }
  return { valid: true };
}

// ─── Types (JSDoc) ────────────────────────────────────────────────────────────

/**
 * @typedef {Object} Note
 * @property {string} id          - Stable canonical identifier from frontmatter (YYYYMMDDHHmm).
 * @property {string} domain      - Domain folder name.
 * @property {string} section     - Section folder name. Empty string for root-level domain notes.
 * @property {string} title       - Derived display title.
 * @property {string} content     - Full raw markdown content.
 * @property {string} filePath    - Absolute path on disk (informational only; NOT used as identity).
 * @property {string} fileName    - Filename (informational only; NOT used as identity).
 * @property {Record<string, string>} meta  - Parsed front-matter fields.
 */

/**
 * @typedef {Object} InvalidNote
 * @property {string} filePath
 * @property {string} fileName
 * @property {string} reason
 */

/**
 * @typedef {Object} SectionMap
 * @property {Note[]} notes
 */

/**
 * @typedef {Object} DomainMap
 * @property {Record<string, SectionMap>} sections
 * @property {number} noteCount
 */

/**
 * @typedef {Object} VaultStructure
 * @property {Record<string, DomainMap>} domains
 * @property {number} totalNotes
 * @property {InvalidNote[]} invalidNotes   - Cards excluded due to missing/malformed/duplicate id.
 */

// ─── Service ──────────────────────────────────────────────────────────────────

class VaultService {
  constructor() {
    const vaultPath = process.env.VAULT_PATH;
    if (!vaultPath) throw new Error('VAULT_PATH environment variable is required');

    /** @type {string} Absolute path to the Obsidian vault root. */
    this.vaultPath = vaultPath;

    /** @type {VaultStructure | null} In-process cache; cleared on demand. */
    this._cache = null;
  }

  // ── Cache management ────────────────────────────────────────────────────────

  /** Invalidate the in-memory scan cache (call after writing notes). */
  invalidateCache() {
    this._cache = null;
  }

  /**
   * Return a cached scan or run a fresh one.
   * @returns {Promise<VaultStructure>}
   */
  async _getStructure() {
    if (!this._cache) {
      this._cache = await this._scanKnowledge();
    }
    return this._cache;
  }

  // ── Scanning ────────────────────────────────────────────────────────────────

  /**
   * Scan `01 Knowledge/` and build the full vault structure.
   * Layout expected:
   *   01 Knowledge/<domain>/<section>/<note>.md
   *   01 Knowledge/<domain>/<note>.md          (section = '')
   *
   * @returns {Promise<VaultStructure>}
   */
  async _scanKnowledge() {
    /** @type {VaultStructure} */
    const structure = { domains: {}, totalNotes: 0, invalidNotes: [] };

    /** @type {Set<string>} Track seen ids to detect duplicates. */
    const seenIds = new Set();

    let domainEntries;
    try {
      domainEntries = await fs.readdir(this.vaultPath, { withFileTypes: true });
    } catch (err) {
      throw new Error(`Cannot read vault root "${this.vaultPath}": ${err.message}`);
    }

    for (const entry of domainEntries) {
      if (!entry.isDirectory()) continue;
      if (EXCLUDED_ROOT_FOLDERS.has(entry.name.toLowerCase())) continue;

      const domainName = entry.name;
      const domainPath = path.join(this.vaultPath, domainName);
      const { domain, invalidNotes } = await this._scanDomain(domainPath, domainName, seenIds);

      structure.domains[domainName] = domain;
      structure.totalNotes += domain.noteCount;
      structure.invalidNotes.push(...invalidNotes);
    }

    return structure;
  }

  /**
   * Scan one domain directory.
   * @param {string} domainPath
   * @param {string} domainName
   * @param {Set<string>} seenIds
   * @returns {Promise<{ domain: DomainMap, invalidNotes: InvalidNote[] }>}
   */
  async _scanDomain(domainPath, domainName, seenIds) {
    /** @type {DomainMap} */
    const domain = { sections: {}, noteCount: 0 };
    /** @type {InvalidNote[]} */
    const invalidNotes = [];

    let entries;
    try {
      entries = await fs.readdir(domainPath, { withFileTypes: true });
    } catch (err) {
      throw new Error(`Failed to scan domain "${domainName}": ${err.message}`);
    }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const sectionName = entry.name;
        const sectionPath = path.join(domainPath, sectionName);
        const result = await this._scanSection(sectionPath, domainName, sectionName, seenIds);
        domain.sections[sectionName] = result.section;
        invalidNotes.push(...result.invalidNotes);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        // Root-level note (no subsection)
        const result = await this._readNote(domainPath, entry.name, domainName, '', seenIds);
        if (result.note) {
          if (!domain.sections['_root']) domain.sections['_root'] = { notes: [] };
          domain.sections['_root'].notes.push(result.note);
        } else if (result.invalid) {
          invalidNotes.push(result.invalid);
        }
      }
    }

    // Single pass to tally all notes (avoids double-counting)
    for (const section of Object.values(domain.sections)) {
      domain.noteCount += section.notes.length;
    }

    return { domain, invalidNotes };
  }

  /**
   * Scan one section directory.
   * @param {string} sectionPath
   * @param {string} domainName
   * @param {string} sectionName
   * @param {Set<string>} seenIds
   * @returns {Promise<{ section: SectionMap, invalidNotes: InvalidNote[] }>}
   */
  async _scanSection(sectionPath, domainName, sectionName, seenIds) {
    /** @type {SectionMap} */
    const section = { notes: [] };
    /** @type {InvalidNote[]} */
    const invalidNotes = [];

    let entries;
    try {
      entries = await fs.readdir(sectionPath, { withFileTypes: true });
    } catch (err) {
      throw new Error(`Failed to scan section "${sectionName}" in "${domainName}": ${err.message}`);
    }

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const result = await this._readNote(sectionPath, entry.name, domainName, sectionName, seenIds);
        if (result.note) {
          section.notes.push(result.note);
        } else if (result.invalid) {
          invalidNotes.push(result.invalid);
        }
      }
    }

    return { section, invalidNotes };
  }

  /**
   * Read and parse a single markdown note.
   * Validates the frontmatter `id` field and checks for duplicates.
   * Returns `{ note }` on success, `{ invalid }` on failure, or `{ error }` on read failure.
   *
   * @param {string} dirPath
   * @param {string} fileName
   * @param {string} domainName
   * @param {string} sectionName
   * @param {Set<string>} seenIds
   * @returns {Promise<{ note?: Note, invalid?: InvalidNote }>}
   */
  async _readNote(dirPath, fileName, domainName, sectionName, seenIds) {
    const filePath = path.join(dirPath, fileName);

    let content;
    try {
      content = await fs.readFile(filePath, 'utf8');
    } catch (err) {
      console.error(`[VaultService] Could not read "${filePath}": ${err.message}`);
      return {};
    }

    const meta = parseFrontmatter(content);

    // ── ID validation ──────────────────────────────────────────────────────
    const idCheck = validateCardId(meta.id);
    if (!idCheck.valid) {
      const reason = idCheck.reason;
      console.error(`[VaultService] Invalid card excluded — ${reason}: "${filePath}"`);
      return { invalid: { filePath, fileName, reason } };
    }

    const cardId = meta.id.trim();

    // ── Duplicate detection ────────────────────────────────────────────────
    if (seenIds.has(cardId)) {
      const reason = `duplicate id "${cardId}"`;
      console.error(`[VaultService] CRITICAL — ${reason}: "${filePath}"`);
      return { invalid: { filePath, fileName, reason } };
    }
    seenIds.add(cardId);

    // ── Hierarchy warning ──────────────────────────────────────────────────
    // If frontmatter declares domain/section/topic, warn on mismatch (non-fatal).
    if (meta.domain && meta.domain !== domainName) {
      console.warn(
        `[VaultService] Hierarchy mismatch in "${filePath}": ` +
        `frontmatter domain="${meta.domain}" but folder domain="${domainName}"`
      );
    }
    if (meta.section && sectionName && meta.section !== sectionName) {
      console.warn(
        `[VaultService] Hierarchy mismatch in "${filePath}": ` +
        `frontmatter section="${meta.section}" but folder section="${sectionName}"`
      );
    }

    return {
      note: {
        id: cardId,          // ← canonical stable identity; frontmatter id ONLY
        domain: domainName,
        section: sectionName,
        title: deriveTitle(content, fileName, meta),
        content,
        filePath,            // informational; NOT used as identity
        fileName,            // informational; NOT used as identity
        meta,
      },
    };
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Return a summary of every domain in the vault.
   * @returns {Promise<Array<{ name: string, noteCount: number, sections: string[] }>>}
   */
  async getAllDomains() {
    const { domains } = await this._getStructure();
    return Object.entries(domains).map(([name, domain]) => ({
      name,
      noteCount: domain.noteCount,
      sections: Object.keys(domain.sections),
    }));
  }

  /**
   * Return all sections (with their notes) within a domain.
   * @param {string} domainName
   * @returns {Promise<Array<{ name: string, noteCount: number, notes: Note[] }>>}
   */
  async getSectionsByDomain(domainName) {
    const { domains } = await this._getStructure();
    const domain = domains[domainName];
    if (!domain) throw new Error(`Domain "${domainName}" not found`);

    return Object.entries(domain.sections).map(([name, section]) => ({
      name,
      noteCount: section.notes.length,
      notes: section.notes,
    }));
  }

  /**
   * Return all notes in a specific section.
   * @param {string} domainName
   * @param {string} sectionName
   * @returns {Promise<Note[]>}
   */
  async getNotesBySection(domainName, sectionName) {
    const { domains } = await this._getStructure();
    const domain = domains[domainName];
    if (!domain) throw new Error(`Domain "${domainName}" not found`);

    const section = domain.sections[sectionName];
    if (!section) throw new Error(`Section "${sectionName}" not found in domain "${domainName}"`);

    return section.notes;
  }

  /**
   * Return all notes, optionally paginated.
   * @param {number | null} limit
   * @param {number} offset
   * @returns {Promise<Note[]>}
   */
  async getAllNotes(limit = null, offset = 0) {
    const { domains } = await this._getStructure();
    const all = [];

    for (const domain of Object.values(domains)) {
      for (const section of Object.values(domain.sections)) {
        all.push(...section.notes);
      }
    }

    return limit !== null ? all.slice(offset, offset + limit) : all;
  }

  /**
   * Look up a single note by its stable frontmatter `id`.
   * This is the canonical lookup method — use this everywhere history/analytics
   * need to resolve a card, even if the file has been moved or renamed.
   *
   * @param {string} id - YYYYMMDDHHmm frontmatter id.
   * @returns {Promise<Note | null>}
   */
  async getNoteById(id) {
    if (!id) return null;
    const all = await this.getAllNotes();
    return all.find(note => note.id === id) ?? null;
  }

  /**
   * Full-text search across title and content.
   * Title matches rank above content matches.
   *
   * @param {string} keyword
   * @returns {Promise<Array<Note & { matchType: 'title' | 'content', relevance: number }>>}
   */
  async searchVault(keyword) {
    if (!keyword?.trim()) throw new Error('Search keyword is required');

    const term = keyword.toLowerCase().trim();
    const all = await this.getAllNotes();

    return all
      .reduce((acc, note) => {
        const inTitle = note.title.toLowerCase().includes(term);
        const inContent = note.content.toLowerCase().includes(term);
        if (inTitle || inContent) {
          acc.push({ ...note, matchType: inTitle ? 'title' : 'content', relevance: inTitle ? 2 : 1 });
        }
        return acc;
      }, [])
      .sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * High-level stats about the vault, including invalid card count.
   * @returns {Promise<{ totalDomains: number, totalNotes: number, invalidNoteCount: number, domains: Array }>}
   */
  async getVaultStats() {
    const { domains, totalNotes, invalidNotes } = await this._getStructure();
    return {
      totalDomains: Object.keys(domains).length,
      totalNotes,
      invalidNoteCount: invalidNotes.length,
      domains: Object.entries(domains).map(([name, domain]) => ({
        name,
        noteCount: domain.noteCount,
        sectionCount: Object.keys(domain.sections).length,
      })),
    };
  }

  /**
   * Return all notes that failed validation (missing id, malformed id, duplicate id).
   * Use this to surface errors to the user or admin dashboard.
   *
   * @returns {Promise<InvalidNote[]>}
   */
  async getInvalidNotes() {
    const { invalidNotes } = await this._getStructure();
    return invalidNotes;
  }
}

module.exports = VaultService;