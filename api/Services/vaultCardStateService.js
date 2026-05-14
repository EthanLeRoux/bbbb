'use strict';

const { getFirestore } = require('../firebase');
const VaultService = require('./vaultService');

const COLLECTION_CARD_STATES = 'card_states';

function cardMetadataFromVaultCard(card) {
  return {
    title: card.title,
    type: card.type,
    domain: card.domain,
    section: card.section,
    topic: card.topic,
    source: card.source || '',
    created: card.created || '',
    updated: card.updated || '',
    tags: Array.isArray(card.tags) ? card.tags : [],
  };
}

function defaultCardState(card) {
  const now = new Date();
  return {
    id: card.id,
    ...cardMetadataFromVaultCard(card),
    mastery: 0,
    confidence: 0,
    difficulty: 0,
    reviewCount: 0,
    lastReviewed: null,
    nextReview: now,
    history: [],
    createdAt: now,
    updatedAt: now,
  };
}

class VaultCardStateService {
  constructor() {
    this.db = getFirestore();
    this.cardStatesCollection = this.db.collection(COLLECTION_CARD_STATES);
    this.vaultService = new VaultService();
  }

  async syncVaultCards() {
    const cards = await this.vaultService.getAllNotes();
    const result = {
      scanned: cards.length,
      created: 0,
      updated: 0,
      unchanged: 0,
      errors: [],
    };

    for (const card of cards) {
      try {
        const ref = this.cardStatesCollection.doc(card.id);
        const snap = await ref.get();
        const metadata = cardMetadataFromVaultCard(card);

        if (!snap.exists) {
          await ref.set(defaultCardState(card));
          result.created += 1;
          continue;
        }

        const current = snap.data();
        const changed = Object.entries(metadata).some(([key, value]) => {
          const existing = current[key];
          return JSON.stringify(existing ?? null) !== JSON.stringify(value ?? null);
        });

        if (changed) {
          await ref.set({ id: card.id, ...metadata, updatedAt: new Date() }, { merge: true });
          result.updated += 1;
        } else {
          result.unchanged += 1;
        }
      } catch (error) {
        result.errors.push({ id: card.id, error: error.message });
      }
    }

    const invalidNotes = await this.vaultService.getInvalidNotes();
    result.invalid = invalidNotes;
    result.invalidCount = invalidNotes.length;
    return result;
  }

  async getCardState(id) {
    const snap = await this.cardStatesCollection.doc(id).get();
    return snap.exists ? { id: snap.id, ...snap.data() } : null;
  }

  async getCardWithState(id) {
    const card = await this.vaultService.getNoteById(id);
    if (!card) return null;
    const state = await this.getCardState(id);
    return { card, state };
  }
}

module.exports = VaultCardStateService;
