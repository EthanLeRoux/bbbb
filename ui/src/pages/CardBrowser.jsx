import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllNotes } from '../api/vault';
import NoteStatsPanel from '../components/NoteStatsPanel';
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
    boxSizing: 'border-box',
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

export default function CardBrowser() {
  const [selectedVaultId, setSelectedVaultId] = useState(null);
  const [search, setSearch] = useState('');

  const { data: allNotes = [], isLoading: notesLoading, error: notesError } = useQuery({
    queryKey: ['vault', 'all-notes-for-card-browser'],
    queryFn: async () => {
      const notes = await getAllNotes(100);
      return notes.map(note => ({
        ...note,
        vaultId: note.id,
        title: note.title || note.id,
      }));
    },
    retry: 1,
  });

  useEffect(() => {
    if (allNotes.length > 0 && !selectedVaultId) {
      setSelectedVaultId(allNotes[0].vaultId);
    }
  }, [allNotes, selectedVaultId]);

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

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Card Browser</h1>
        <p style={styles.subtitle}>Browse, search, and inspect source cards used for assessments</p>
      </div>

      {notesError && (
        <div style={styles.errorState}>
          Failed to load vault cards: {notesError.message}
        </div>
      )}

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
            </div>
          ) : (
            <div style={styles.loadingState}>
              {notesLoading ? 'Loading vault cards...' : 'Select a card to inspect it.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
