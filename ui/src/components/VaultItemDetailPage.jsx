import { useState } from 'react';
import { Link } from 'react-router-dom';
import VaultItemStats from './VaultItemStats';
import VaultTestComponent from './VaultTestComponent';
import TestResubmissionDashboard from './TestResubmissionDashboard';
import ResubmitButton from './ResubmitButton';
import NoteStatsPanel from './NoteStatsPanel';
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
  tabs: {
    display: 'flex',
    gap: SPACE.sm,
    marginBottom: SPACE.xl,
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
  sectionTitle: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.lg,
    fontWeight: 500,
    color: COLORS.text,
    marginBottom: SPACE.md,
  },
  reviewLinkCard: {
    display: 'block',
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    padding: SPACE.lg,
    color: COLORS.text,
    textDecoration: 'none',
  },
  reviewLinkTitle: {
    fontFamily: FONTS.serif,
    fontSize: SIZE.lg,
    marginBottom: SPACE.xs,
  },
  reviewLinkText: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.muted,
  },
};

export default function VaultItemDetailPage({ vaultId, vaultTitle, vaultDomain, vaultSection, vaultPath }) {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'stats', label: 'Statistics' },
    { id: 'test', label: 'Take Test' },
    { id: 'resubmit', label: 'Resubmit Tests' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div style={styles.tabContent}>
            <div style={styles.section}>
              <Link to="/review-due" style={styles.reviewLinkCard}>
                <div style={styles.reviewLinkTitle}>Review Calendar</div>
                <div style={styles.reviewLinkText}>
                  Reviews for this item now live in the central Review Calendar dashboard.
                </div>
              </Link>
            </div>
          </div>
        );
      
      case 'stats':
        return (
          <div style={styles.tabContent}>
            <div style={styles.section}>
              {/* Note-level SR stats panel — shown when vaultId is a note slug */}
              <NoteStatsPanel noteId={vaultId} noteTitle={vaultTitle} />
              <VaultItemStats vaultId={vaultId} />
            </div>
          </div>
        );
      
      case 'test':
        return (
          <div style={styles.tabContent}>
            <div style={styles.section}>
              <VaultTestComponent vaultId={vaultId} vaultTitle={vaultTitle} vaultDomain={vaultDomain} vaultSection={vaultSection} />
            </div>
          </div>
        );
      
      case 'resubmit':
        return (
          <div style={styles.tabContent}>
            <div style={styles.section}>
              <TestResubmissionDashboard vaultId={vaultId} vaultTitle={vaultTitle} vaultDomain={vaultDomain} vaultSection={vaultSection} />
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
        <h1 style={styles.title}>{vaultTitle}</h1>
        <p style={styles.subtitle}>Vault Item: {vaultId}</p>
        {(vaultDomain || vaultSection || vaultPath) && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            {vaultDomain && (
              <span style={{
                fontFamily: 'monospace',
                fontSize: 11,
                color: '#6366f1',
                backgroundColor: 'rgba(99,102,241,0.1)',
                padding: '2px 8px',
                borderRadius: 4,
                border: '1px solid rgba(99,102,241,0.3)',
              }}>
                {vaultDomain}
              </span>
            )}
            {vaultSection && (
              <span style={{
                fontFamily: 'monospace',
                fontSize: 11,
                color: '#94a3b8',
                backgroundColor: 'rgba(148,163,184,0.1)',
                padding: '2px 8px',
                borderRadius: 4,
                border: '1px solid rgba(148,163,184,0.3)',
              }}>
                {vaultSection}
              </span>
            )}
            {vaultPath && (
              <span style={{
                fontFamily: 'monospace',
                fontSize: 11,
                color: '#94a3b8',
              }}>
                {vaultPath}
              </span>
            )}
          </div>
        )}
      </div>

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

      {renderTabContent()}
    </div>
  );
}
