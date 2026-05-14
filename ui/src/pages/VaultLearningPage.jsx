import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import VaultReviewDashboard from '../components/VaultReviewDashboard';
import VaultTestComponent from '../components/VaultTestComponent';
import TestResubmissionDashboard from '../components/TestResubmissionDashboard';
import VaultItemStats from '../components/VaultItemStats';
import NoteStatsPanel from '../components/NoteStatsPanel';
import { getAllNotes } from '../api/vault';
import { COLORS, FONTS, SIZE, SPACE } from '../constants';

const styles = {
  container: {
    padding: SPACE.lg,
    backgroundColor: COLORS.bg,
    minHeight: '100vh',
  },
  header: {
    marginBottom: SPACE.xl,
    paddingBottom: SPACE.lg,
    borderBottom: `1px solid ${COLORS.border}`,
  },
  title: {
    fontFamily: FONTS.serif,
    fontSize: SIZE.xl,
    color: COLORS.text,
    marginBottom: SPACE.sm,
  },
  subtitle: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.muted,
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACE.xl,
    flexWrap: 'wrap',
    gap: SPACE.md,
  },
  browserLayout: {
    display: 'grid',
    gridTemplateColumns: 'minmax(260px, 360px) 1fr',
    gap: SPACE.lg,
    alignItems: 'start',
  },
  searchInput: {
    width: '100%',
    padding: `${SPACE.sm}px ${SPACE.md}px`,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    outline: 'none',
    marginBottom: SPACE.md,
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACE.xs,
    maxHeight: '70vh',
    overflowY: 'auto',
  },
  cardRow: {
    width: '100%',
    textAlign: 'left',
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    padding: SPACE.sm,
    color: COLORS.text,
    cursor: 'pointer',
  },
  cardRowActive: {
    borderColor: COLORS.accent,
    backgroundColor: `${COLORS.accent}12`,
  },
  cardTitle: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    fontWeight: 600,
    marginBottom: SPACE.xs,
  },
  cardMeta: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
  },
  detailPanel: {
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    padding: SPACE.lg,
  },
  detailTitle: {
    fontFamily: FONTS.serif,
    fontSize: SIZE.xl,
    color: COLORS.text,
    margin: 0,
    marginBottom: SPACE.sm,
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: SPACE.sm,
    marginTop: SPACE.md,
    marginBottom: SPACE.lg,
  },
  infoItem: {
    backgroundColor: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    padding: SPACE.sm,
  },
  infoLabel: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
    marginBottom: 2,
  },
  infoValue: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.text,
    overflowWrap: 'anywhere',
  },
  contentBox: {
    backgroundColor: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    padding: SPACE.md,
    whiteSpace: 'pre-wrap',
    lineHeight: 1.6,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.text,
    maxHeight: 420,
    overflowY: 'auto',
  },
  vaultSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  select: {
    padding: `${SPACE.xs}px ${SPACE.sm}px`,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 4,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    minWidth: '250px',
  },
  vaultInfo: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
  },
  tabs: {
    display: 'flex',
    gap: SPACE.sm,
    borderBottom: `1px solid ${COLORS.border}`,
  },
  tabButton: {
    padding: `${SPACE.sm}px ${SPACE.lg}px`,
    border: 'none',
    backgroundColor: 'transparent',
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.muted,
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    transition: 'all 0.2s',
  },
  tabButtonActive: {
    color: COLORS.accent,
    borderBottomColor: COLORS.accent,
  },
  tabContent: {
    marginBottom: SPACE.xl,
  },
  section: {
    marginBottom: SPACE.xl,
  },
  loadingState: {
    textAlign: 'center',
    color: COLORS.muted,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    padding: SPACE.xl,
  },
  errorState: {
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.error}`,
    borderRadius: 8,
    padding: SPACE.md,
    color: COLORS.error,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    marginBottom: SPACE.lg,
  },
};

export default function VaultLearningPage() {
  const [activeTab, setActiveTab] = useState('card');
  const [selectedVaultId, setSelectedVaultId] = useState(null);
  const [search, setSearch] = useState('');

  // Fetch all vault notes once
  const { data: allNotes = [], isLoading: notesLoading, error: notesError } = useQuery({
    queryKey: ['vault', 'all-notes-for-learning'],
    queryFn: async () => {
      try {
        const notes = await getAllNotes(100);
        return notes.map(note => ({
          ...note,
          vaultId: note.id,
          title: note.title || note.id,
        }));
      } catch (err) {
        console.error('[VaultLearning] Error fetching vault notes:', err);
        return [];
      }
    },
    retry: 1,
  });

  // Auto-select first vault on load
  useEffect(() => {
    if (allNotes.length > 0 && !selectedVaultId) {
      setSelectedVaultId(allNotes[0].vaultId);
    }
  }, [allNotes, selectedVaultId]);

  const handleVaultChange = (e) => {
    setSelectedVaultId(e.target.value);
  };

  const selectedVault = allNotes.find(n => n.vaultId === selectedVaultId);
  const filteredNotes = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return allNotes;
    return allNotes.filter(note => [
      note.title,
      note.id,
      note.domain,
      note.section,
      note.topic,
      ...(Array.isArray(note.tags) ? note.tags : []),
    ].filter(Boolean).join(' ').toLowerCase().includes(term));
  }, [allNotes, search]);

  const tabs = [
    { id: 'dashboard', label: 'Review Calendar' },
    { id: 'card', label: 'Card Browser' },
    { id: 'test', label: 'Take Test' },
    { id: 'resubmit', label: 'Resubmit Tests' },
    { id: 'stats', label: 'Statistics' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'card':
        return (
          <div style={styles.browserLayout}>
            <div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search cards, topics, tags..."
                style={styles.searchInput}
              />
              <div style={styles.cardList}>
                {filteredNotes.map(note => (
                  <button
                    key={note.vaultId}
                    type="button"
                    style={{
                      ...styles.cardRow,
                      ...(selectedVaultId === note.vaultId ? styles.cardRowActive : {}),
                    }}
                    onClick={() => setSelectedVaultId(note.vaultId)}
                  >
                    <div style={styles.cardTitle}>{note.title}</div>
                    <div style={styles.cardMeta}>
                      {[note.domain, note.section, note.topic].filter(Boolean).join(' / ')}
                    </div>
                  </button>
                ))}
                {!notesLoading && filteredNotes.length === 0 && (
                  <div style={styles.loadingState}>No cards match that search.</div>
                )}
              </div>
            </div>

            <div>
              {selectedVault ? (
                <div>
                  <div style={styles.detailPanel}>
                    <h2 style={styles.detailTitle}>{selectedVault.title}</h2>
                    <div style={styles.cardMeta}>{selectedVault.id}</div>

                    <div style={styles.infoGrid}>
                      {[
                        ['Domain', selectedVault.domain],
                        ['Section', selectedVault.section],
                        ['Topic', selectedVault.topic],
                        ['Type', selectedVault.type],
                        ['Source', selectedVault.source],
                        ['Created', selectedVault.created],
                        ['Updated', selectedVault.updated],
                        ['File', selectedVault.fileName],
                        ['Path', selectedVault.filePath],
                        ['Tags', Array.isArray(selectedVault.tags) ? selectedVault.tags.join(', ') : selectedVault.tags],
                      ].filter(([, value]) => value).map(([label, value]) => (
                        <div key={label} style={styles.infoItem}>
                          <div style={styles.infoLabel}>{label}</div>
                          <div style={styles.infoValue}>{value}</div>
                        </div>
                      ))}
                    </div>

                    <div style={styles.contentBox}>
                      {selectedVault.content || 'No note content available.'}
                    </div>
                  </div>

                  <NoteStatsPanel noteId={selectedVault.vaultId} noteTitle={selectedVault.title} />
                  <VaultItemStats vaultId={selectedVault.vaultId} />
                </div>
              ) : (
                <div style={styles.loadingState}>
                  {notesLoading ? 'Loading vault cards...' : 'Select a card to inspect it.'}
                </div>
              )}
            </div>
          </div>
        );

      case 'dashboard':
        return (
          <div style={styles.tabContent}>
            <div style={styles.section}>
              <VaultReviewDashboard />
            </div>
          </div>
        );
      
      case 'test':
        if (!selectedVaultId) {
          return (
            <div style={styles.section}>
              <div style={styles.loadingState}>
                {notesLoading ? 'Loading vault items...' : 'No vault items available.'}
              </div>
            </div>
          );
        }
        return (
          <div style={styles.tabContent}>
            <div style={styles.section}>
              <VaultTestComponent vaultId={selectedVaultId} vaultTitle={selectedVault?.title || 'Vault Item'} />
            </div>
          </div>
        );
      
      case 'resubmit':
        // Always show all attempts across all vaults — no selector needed
        return (
          <div style={styles.tabContent}>
            <div style={styles.section}>
              <TestResubmissionDashboard showAllAttempts={true} />
            </div>
          </div>
        );
      
      case 'stats':
        if (!selectedVaultId) {
          return (
            <div style={styles.section}>
              <div style={styles.loadingState}>
                {notesLoading ? 'Loading vault items...' : 'No vault items available.'}
              </div>
            </div>
          );
        }
        return (
          <div style={styles.tabContent}>
            <div style={styles.section}>
              <VaultItemStats vaultId={selectedVaultId} />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Vault Learning</h1>
        <p style={styles.subtitle}>Review calendar, card browser, practice, and stats</p>
      </div>

      {/* Controls: vault selector for tabs that need it */}
      <div style={styles.controls}>
        <div style={styles.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              style={{
                ...styles.tabButton,
                ...(activeTab === tab.id ? styles.tabButtonActive : {}),
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Vault selector — only relevant for Take Test & Statistics tabs */}
        {(activeTab === 'test' || activeTab === 'stats') && (
          <div style={styles.vaultSelector}>
            <label style={{ fontFamily: FONTS.mono, fontSize: SIZE.sm, color: COLORS.text }}>
              Vault Item:
            </label>
            <select 
              style={styles.select} 
              value={selectedVaultId || ''} 
              onChange={handleVaultChange}
              disabled={notesLoading || allNotes.length === 0}
            >
              {allNotes.map(note => (
                <option key={note.vaultId} value={note.vaultId}>
                  {note.title}
                </option>
              ))}
            </select>
            {selectedVault && (
              <span style={styles.vaultInfo}>
                {[selectedVault.domain, selectedVault.section, selectedVault.topic].filter(Boolean).join(' / ')}
              </span>
            )}
          </div>
        )}
      </div>

      {notesError && (
        <div style={styles.errorState}>
          Failed to load vault items: {notesError.message}
        </div>
      )}

      {renderTabContent()}
    </div>
  );
}
