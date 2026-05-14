'use strict';

const express = require('express');
const router = express.Router();
const VaultService = require('../Services/vaultService');
const VaultCardStateService = require('../Services/vaultCardStateService');

// ─── Service initialisation ───────────────────────────────────────────────────

let vaultService;
let vaultCardStateService;
try {
  vaultService = new VaultService();
  vaultCardStateService = new VaultCardStateService();
} catch (error) {
  console.error('[VaultRouter] Failed to initialise VaultService:', error.message);
}

// ─── Middleware ───────────────────────────────────────────────────────────────

const checkVaultService = (req, res, next) => {
  if (!vaultService) {
    return res.status(503).json({
      success: false,
      error: 'Vault service unavailable. Check VAULT_SOURCE and vault source environment variables.',
    });
  }
  next();
};

const checkVaultCardStateService = (req, res, next) => {
  if (!vaultCardStateService) {
    return res.status(503).json({
      success: false,
      error: 'Vault card state service unavailable. Check VAULT_SOURCE, vault source environment variables, and Firebase configuration.',
    });
  }
  next();
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Wrap an async route handler so unhandled rejections become 500 responses.
 * @param {Function} fn
 */
const asyncHandler = fn => (req, res, next) => fn(req, res, next).catch(next);

/**
 * Send a 404 when a service error message contains "not found".
 * @param {Error} error
 * @param {import('express').Response} res
 */
const handleServiceError = (error, res) => {
  if (error.message.toLowerCase().includes('not found')) {
    return res.status(404).json({ success: false, error: error.message });
  }
  return res.status(500).json({ success: false, error: error.message });
};

// ─── Static routes  (must come before param routes) ──────────────────────────

// GET /api/vault/domains
router.get('/domains', checkVaultService, asyncHandler(async (req, res) => {
  const domains = await vaultService.getAllDomains();
  res.json({ success: true, data: domains, count: domains.length });
}));

// GET /api/vault/notes?limit=&offset=
router.get('/notes', checkVaultService, asyncHandler(async (req, res) => {
  const limit  = req.query.limit  ? parseInt(req.query.limit,  10) : null;
  const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0;

  if (limit !== null && (isNaN(limit) || limit < 1)) {
    return res.status(400).json({ success: false, error: '"limit" must be a positive integer' });
  }
  if (isNaN(offset) || offset < 0) {
    return res.status(400).json({ success: false, error: '"offset" must be a non-negative integer' });
  }

  const notes = await vaultService.getAllNotes(limit, offset);
  res.json({ success: true, data: notes, count: notes.length, limit, offset });
}));

// GET /api/vault/search?q=
router.get('/search', checkVaultService, asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q?.trim()) {
    return res.status(400).json({ success: false, error: 'Query param "q" is required' });
  }

  const results = await vaultService.searchVault(q);
  res.json({ success: true, data: results, query: q, count: results.length });
}));

// GET /api/vault/stats
router.get('/stats', checkVaultService, asyncHandler(async (req, res) => {
  const stats = await vaultService.getVaultStats();
  res.json({ success: true, data: stats });
}));

// POST /api/vault/sync
router.post('/sync', checkVaultCardStateService, asyncHandler(async (req, res) => {
  const result = await vaultCardStateService.syncVaultCards();
  res.json({
    success: true,
    data: result,
    message: 'Vault cards synced to Firebase state layer without storing markdown content',
  });
}));

// GET /api/vault/cards/:id
router.get('/cards/:id', checkVaultCardStateService, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await vaultCardStateService.getCardWithState(id);
  if (!result) return res.status(404).json({ success: false, error: `Card "${id}" not found in vault` });
  res.json({ success: true, data: result });
}));

// GET /api/vault/invalid
router.get('/invalid', checkVaultService, asyncHandler(async (req, res) => {
  const invalid = await vaultService.getInvalidNotes();
  res.json({ success: true, data: invalid, count: invalid.length });
}));

// ─── Param routes  (dynamic segments — must come last) ───────────────────────

// GET /api/vault/:domain
router.get('/:domain', checkVaultService, asyncHandler(async (req, res) => {
  const { domain } = req.params;
  try {
    const sections = await vaultService.getSectionsByDomain(domain);
    res.json({ success: true, data: sections, domain, count: sections.length });
  } catch (error) {
    handleServiceError(error, res);
  }
}));

// GET /api/vault/:domain/:section/topics
router.get('/:domain/:section/topics', checkVaultService, asyncHandler(async (req, res) => {
  const { domain, section } = req.params;
  try {
    const topics = await vaultService.getTopicsBySection(domain, section);
    res.json({ success: true, data: topics, domain, section, count: topics.length });
  } catch (error) {
    handleServiceError(error, res);
  }
}));

// GET /api/vault/:domain/:section/topics/:topic
router.get('/:domain/:section/topics/:topic', checkVaultService, asyncHandler(async (req, res) => {
  const { domain, section, topic } = req.params;
  try {
    const notes = await vaultService.getNotesByTopic(domain, section, topic);
    res.json({ success: true, data: notes, domain, section, topic, count: notes.length });
  } catch (error) {
    handleServiceError(error, res);
  }
}));

// GET /api/vault/:domain/:section
router.get('/:domain/:section', checkVaultService, asyncHandler(async (req, res) => {
  const { domain, section } = req.params;
  try {
    const notes = await vaultService.getNotesBySection(domain, section);
    res.json({ success: true, data: notes, domain, section, count: notes.length });
  } catch (error) {
    handleServiceError(error, res);
  }
}));

// ─── Error handler (catches asyncHandler rejections) ─────────────────────────

// eslint-disable-next-line no-unused-vars
router.use((err, req, res, _next) => {
  console.error('[VaultRouter]', err);
  res.status(500).json({ success: false, error: err.message });
});

module.exports = router;
