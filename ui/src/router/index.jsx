import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { COLORS, SIDEBAR_WIDTH } from '../constants';
import Dashboard from '../pages/Dashboard';
import VaultExplorer from '../pages/VaultExplorer';
import GenerateTest from '../pages/GenerateTest';
import TestLibrary from '../pages/TestLibrary';
import TestDetail from '../pages/TestDetail';
import AttemptList from '../pages/AttemptList';
import AttemptDetail from '../pages/AttemptDetail';
import Statistics from '../pages/Statistics';
import VaultLearningPage from '../pages/VaultLearningPage';
import SpacedRepetitionDue from '../pages/SpacedRepetitionDue';
import CardBrowser from '../pages/CardBrowser';

function Layout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: COLORS.bg,
      color: COLORS.text,
    }}>
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={toggleSidebar} 
      />
      <main style={{
        marginLeft: isSidebarCollapsed ? 60 : SIDEBAR_WIDTH,
        flex: 1,
        padding: 24,
        transition: 'margin-left 0.3s ease',
      }}>
        <Outlet />
      </main>
    </div>
  );
}


export {
  Layout,
  Dashboard,
  VaultExplorer,
  GenerateTest,
  TestLibrary,
  TestDetail,
  AttemptList,
  AttemptDetail,
  Statistics,
  VaultLearningPage,
  SpacedRepetitionDue,
  CardBrowser,
};
