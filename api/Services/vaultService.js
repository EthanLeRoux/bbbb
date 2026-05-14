'use strict';

const fs = require('fs/promises');
const path = require('path');

const EXCLUDED_ROOT_FOLDERS = new Set(['templates']);
const TOPIC_MAP_FILE = '_index.md';
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/;
const ID_FORMAT_RE = /^\d{12}$/;

function parseFrontmatter(raw) {
  const match = raw.match(FRONTMATTER_RE);
  if (!match) return {};

  const lines = match[1].split(/\r?\n/);
  const meta = {};

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const colon = line.indexOf(':');
    if (colon === -1) continue;

    const key = line.slice(0, colon).trim();
    let value = line.slice(colon + 1).trim();
    if (!key) continue;

    if (value === '') {
      const items = [];
      let j = i + 1;
      while (j < lines.length) {
        const itemLine = lines[j].trim();
        if (!itemLine.startsWith('- ')) break;
        items.push(itemLine.slice(2).trim());
        j += 1;
      }
      if (items.length > 0) {
        meta[key] = items;
        i = j - 1;
        continue;
      }
    }

    if (value.startsWith('[') && value.endsWith(']')) {
      meta[key] = value.slice(1, -1).split(',').map(item => item.trim()).filter(Boolean);
      continue;
    }

    value = value.replace(/^['"]|['"]$/g, '');
    meta[key] = value;
  }

  return meta;
}

function validateCardId(id) {
  if (!id || id.trim() === '') return { valid: false, reason: 'missing id field' };
  if (!ID_FORMAT_RE.test(id.trim())) {
    return { valid: false, reason: `malformed id "${id}" — expected YYYYMMDDHHmm (12 digits)` };
  }
  return { valid: true };
}

class VaultService {
  constructor() {
    const vaultPath = process.env.VAULT_PATH;
    if (!vaultPath) throw new Error('VAULT_PATH environment variable is required');
    this.vaultPath = vaultPath;
    this._cache = null;
  }

  invalidateCache() {
    this._cache = null;
  }

  async _getStructure() {
    if (!this._cache) this._cache = await this._scanKnowledge();
    return this._cache;
  }

  async _scanKnowledge() {
    const structure = { domains: {}, totalNotes: 0, invalidNotes: [] };
    const seenIds = new Set();
    const domainEntries = await fs.readdir(this.vaultPath, { withFileTypes: true });

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

  async _scanDomain(domainPath, domainName, seenIds) {
    const domain = { sections: {}, noteCount: 0 };
    const invalidNotes = [];
    const sectionEntries = await fs.readdir(domainPath, { withFileTypes: true });

    for (const entry of sectionEntries) {
      if (!entry.isDirectory()) continue;
      const sectionName = entry.name;
      const sectionPath = path.join(domainPath, sectionName);
      const result = await this._scanSection(sectionPath, domainName, sectionName, seenIds);
      domain.sections[sectionName] = result.section;
      invalidNotes.push(...result.invalidNotes);
    }

    for (const section of Object.values(domain.sections)) {
      domain.noteCount += section.notes.length;
    }

    return { domain, invalidNotes };
  }

  async _scanSection(sectionPath, domainName, sectionName, seenIds) {
    const section = { notes: [] };
    const invalidNotes = [];
    const topicEntries = await fs.readdir(sectionPath, { withFileTypes: true });

    for (const topicEntry of topicEntries) {
      if (!topicEntry.isDirectory()) continue;
      const topicName = topicEntry.name;
      const topicPath = path.join(sectionPath, topicName);
      const noteEntries = await fs.readdir(topicPath, { withFileTypes: true });

      for (const entry of noteEntries) {
        if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
        if (entry.name === TOPIC_MAP_FILE) continue;

        const result = await this._readNote(topicPath, entry.name, domainName, sectionName, topicName, seenIds);
        if (result.note) section.notes.push(result.note);
        else if (result.invalid) invalidNotes.push(result.invalid);
      }
    }

    return { section, invalidNotes };
  }

  async _readNote(dirPath, fileName, domainName, sectionName, topicName, seenIds) {
    const filePath = path.join(dirPath, fileName);
    let content;

    try {
      content = await fs.readFile(filePath, 'utf8');
    } catch (err) {
      console.error(`[VaultService] Could not read "${filePath}": ${err.message}`);
      return {};
    }

    const meta = parseFrontmatter(content);
    const required = ['id', 'title', 'type', 'domain', 'section', 'topic', 'created', 'updated'];
    const missing = required.filter(field => !meta[field] || `${meta[field]}`.trim() === '');

    if (missing.length > 0) {
      const reason = `missing required fields: ${missing.join(', ')}`;
      console.warn(`[VaultService] Invalid card excluded — ${reason}: "${filePath}"`);
      return { invalid: { filePath, fileName, reason } };
    }

    if (!['concept', 'rule', 'reference'].includes(meta.type)) {
      const reason = `invalid type "${meta.type}"`;
      console.warn(`[VaultService] Invalid card excluded — ${reason}: "${filePath}"`);
      return { invalid: { filePath, fileName, reason } };
    }

    const idCheck = validateCardId(meta.id);
    if (!idCheck.valid) {
      const reason = idCheck.reason;
      console.warn(`[VaultService] Invalid card excluded — ${reason}: "${filePath}"`);
      return { invalid: { filePath, fileName, reason } };
    }

    const cardId = meta.id.trim();
    if (seenIds.has(cardId)) {
      const reason = `duplicate id "${cardId}"`;
      console.warn(`[VaultService] Invalid card excluded — ${reason}: "${filePath}"`);
      return { invalid: { filePath, fileName, reason } };
    }
    seenIds.add(cardId);

    if (meta.domain !== domainName || meta.section !== sectionName || meta.topic !== topicName) {
      const reason = `hierarchy mismatch (frontmatter=${meta.domain}/${meta.section}/${meta.topic}, folder=${domainName}/${sectionName}/${topicName})`;
      console.warn(`[VaultService] Invalid card excluded — ${reason}: "${filePath}"`);
      return { invalid: { filePath, fileName, reason } };
    }

    const body = content.replace(FRONTMATTER_RE, '').replace(/^\r?\n/, '');
    const links = body.match(/\[\[[^\]]+\]\]/g);

    return {
      note: {
        id: cardId,
        title: meta.title,
        type: meta.type,
        domain: meta.domain,
        section: meta.section,
        topic: meta.topic,
        source: meta.source,
        created: meta.created,
        updated: meta.updated,
        tags: Array.isArray(meta.tags) ? meta.tags : undefined,
        links: links ? links.map(link => link.slice(2, -2)) : undefined,
        content: body,
        filePath,
        fileName,
        meta,
      },
    };
  }

  async getAllDomains() {
    const { domains } = await this._getStructure();
    return Object.entries(domains).map(([name, domain]) => ({
      name,
      noteCount: domain.noteCount,
      sections: Object.keys(domain.sections),
    }));
  }

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

  async getNotesBySection(domainName, sectionName) {
    const { domains } = await this._getStructure();
    const domain = domains[domainName];
    if (!domain) throw new Error(`Domain "${domainName}" not found`);

    const section = domain.sections[sectionName];
    if (!section) throw new Error(`Section "${sectionName}" not found in domain "${domainName}"`);

    return section.notes;
  }

  async getAllNotes(limit = null, offset = 0) {
    const { domains } = await this._getStructure();
    const all = [];
    for (const domain of Object.values(domains)) {
      for (const section of Object.values(domain.sections)) all.push(...section.notes);
    }
    return limit !== null ? all.slice(offset, offset + limit) : all;
  }

  async getNoteById(id) {
    if (!id) return null;
    const all = await this.getAllNotes();
    return all.find(note => note.id === id) ?? null;
  }

  async searchVault(keyword) {
    if (!keyword?.trim()) throw new Error('Search keyword is required');
    const term = keyword.toLowerCase().trim();
    const all = await this.getAllNotes();

    return all
      .reduce((acc, note) => {
        const inTitle = note.title.toLowerCase().includes(term);
        const inContent = note.content.toLowerCase().includes(term);
        if (inTitle || inContent) acc.push({ ...note, matchType: inTitle ? 'title' : 'content', relevance: inTitle ? 2 : 1 });
        return acc;
      }, [])
      .sort((a, b) => b.relevance - a.relevance);
  }

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

  async getInvalidNotes() {
    const { invalidNotes } = await this._getStructure();
    return invalidNotes;
  }
}

module.exports = VaultService;
