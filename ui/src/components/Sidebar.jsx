import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { COLORS, FONTS, SIZE, SPACE, SIDEBAR_WIDTH, LABELS } from '../constants';

export default function Sidebar({ isCollapsed, onToggle }) {
  return (
    <div style={{
      position: 'fixed',
      left: 0,
      top: 0,
      width: isCollapsed ? 60 : SIDEBAR_WIDTH,
      height: '100vh',
      backgroundColor: COLORS.surface,
      borderRight: `1px solid ${COLORS.border}`,
      padding: isCollapsed ? SPACE.sm : SPACE.lg,
      display: 'flex',
      flexDirection: 'column',
      gap: SPACE.lg,
      transition: 'width 0.3s ease, padding 0.3s ease',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACE.md,
      }}>
        {!isCollapsed && (
          <h1 style={{
            fontFamily: FONTS.serif,
            fontSize: SIZE.lg,
            color: COLORS.text,
            margin: 0,
          }}
          >
            {LABELS.appName}
          </h1>
        )}
        <button
          onClick={onToggle}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: COLORS.text,
            cursor: 'pointer',
            padding: SPACE.xs,
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: SIZE.lg,
            transition: 'transform 0.3s ease',
            transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.bg}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          {isCollapsed ? '»' : '«'}
        </button>
      </div>
       
      <nav style={{
        display: 'flex',
        flexDirection: 'column',
        gap: SPACE.sm,
      }}
      >
        <NavLink 
          to="/" 
          style={({ isActive }) => ({
            color: isActive ? COLORS.accent : COLORS.text,
            textDecoration: 'none',
            fontSize: SIZE.sm,
            fontFamily: FONTS.mono,
            padding: `${SPACE.xs}px ${SPACE.sm}px`,
            borderRadius: 4,
            transition: 'color 0.2s',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          })}
          title={isCollapsed ? 'Dashboard' : ''}
        >
          {isCollapsed ? 'D' : LABELS.nav.dashboard}
        </NavLink>
        
        <NavLink 
          to="/vault" 
          style={({ isActive }) => ({
            color: isActive ? COLORS.accent : COLORS.text,
            textDecoration: 'none',
            fontSize: SIZE.sm,
            fontFamily: FONTS.mono,
            padding: `${SPACE.xs}px ${SPACE.sm}px`,
            borderRadius: 4,
            transition: 'color 0.2s',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          })}
          title={isCollapsed ? 'Vault' : ''}
        >
          {isCollapsed ? 'V' : LABELS.nav.vault}
        </NavLink>

        <NavLink 
          to="/cards" 
          style={({ isActive }) => ({
            color: isActive ? COLORS.accent : COLORS.text,
            textDecoration: 'none',
            fontSize: SIZE.sm,
            fontFamily: FONTS.mono,
            padding: `${SPACE.xs}px ${SPACE.sm}px`,
            borderRadius: 4,
            transition: 'color 0.2s',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          })}
          title={isCollapsed ? 'Cards' : ''}
        >
          {isCollapsed ? 'C' : 'Card Browser'}
        </NavLink>
        
        <NavLink 
          to="/review-due" 
          style={({ isActive }) => ({
            color: isActive ? COLORS.accent : COLORS.text,
            textDecoration: 'none',
            fontSize: SIZE.sm,
            fontFamily: FONTS.mono,
            padding: `${SPACE.xs}px ${SPACE.sm}px`,
            borderRadius: 4,
            transition: 'color 0.2s',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            position: 'relative',
          })}
          title={isCollapsed ? 'Review Due' : ''}
        >
          {isCollapsed ? 'R' : LABELS.nav.reviewDue}
        </NavLink>
        
        <NavLink 
          to="/generate" 
          style={({ isActive }) => ({
            color: isActive ? COLORS.accent : COLORS.text,
            textDecoration: 'none',
            fontSize: SIZE.sm,
            fontFamily: FONTS.mono,
            padding: `${SPACE.xs}px ${SPACE.sm}px`,
            borderRadius: 4,
            transition: 'color 0.2s',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          })}
          title={isCollapsed ? 'Generate' : ''}
        >
          {isCollapsed ? 'G' : LABELS.nav.generate}
        </NavLink>
        
        <NavLink 
          to="/tests" 
          style={({ isActive }) => ({
            color: isActive ? COLORS.accent : COLORS.text,
            textDecoration: 'none',
            fontSize: SIZE.sm,
            fontFamily: FONTS.mono,
            padding: `${SPACE.xs}px ${SPACE.sm}px`,
            borderRadius: 4,
            transition: 'color 0.2s',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          })}
          title={isCollapsed ? 'Tests' : ''}
        >
          {isCollapsed ? 'T' : LABELS.nav.tests}
        </NavLink>
        
        <NavLink 
          to="/attempts" 
          style={({ isActive }) => ({
            color: isActive ? COLORS.accent : COLORS.text,
            textDecoration: 'none',
            fontSize: SIZE.sm,
            fontFamily: FONTS.mono,
            padding: `${SPACE.xs}px ${SPACE.sm}px`,
            borderRadius: 4,
            transition: 'color 0.2s',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          })}
          title={isCollapsed ? 'Attempts' : ''}
        >
          {isCollapsed ? 'A' : LABELS.nav.attempts}
        </NavLink>
        
        <NavLink 
          to="/stats" 
          style={({ isActive }) => ({
            color: isActive ? COLORS.accent : COLORS.text,
            textDecoration: 'none',
            fontSize: SIZE.sm,
            fontFamily: FONTS.mono,
            padding: `${SPACE.xs}px ${SPACE.sm}px`,
            borderRadius: 4,
            transition: 'color 0.2s',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          })}
          title={isCollapsed ? 'Statistics' : ''}
        >
          {isCollapsed ? 'S' : LABELS.nav.stats}
        </NavLink>
      </nav>
    </div>
  );
}
