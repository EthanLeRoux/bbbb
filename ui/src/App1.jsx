import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { COLORS, FONTS } from './constants';
import { Layout, Dashboard, VaultExplorer, GenerateTest, TestLibrary, TestDetail, AttemptList, AttemptDetail, Statistics } from './router';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div style={{
          backgroundColor: COLORS.bg,
          color: COLORS.text,
          fontFamily: FONTS.mono,
          minHeight: '100vh',
          margin: 0,
          padding: 0,
        }}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="vault" element={<VaultExplorer />} />
              <Route path="generate" element={<GenerateTest />} />
              <Route path="tests" element={<TestLibrary />} />
              <Route path="tests/:id" element={<TestDetail />} />
              <Route path="attempts" element={<AttemptList />} />
              <Route path="attempts/:id" element={<AttemptDetail />} />
              <Route path="stats" element={<Statistics />} />
            </Route>
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
