import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/layout/Header';
import { DiscoverPage } from '@/pages/DiscoverPage';
import { CreateMatchPage } from '@/pages/CreateMatchPage';
import { MatchDetailPage } from '@/pages/MatchDetailPage';
import { ScorecardPage } from '@/pages/ScorecardPage';
import { ResultsPage } from '@/pages/ResultsPage';
import { WalletPage } from '@/pages/WalletPage';
import { MatchHistoryPage } from '@/pages/MatchHistoryPage';
import { StatisticsPage } from '@/pages/StatisticsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AdminPage } from '@/pages/AdminPage';

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="golf-match-theme">
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<DiscoverPage />} />
              <Route path="/create" element={<CreateMatchPage />} />
              <Route path="/match/:id" element={<MatchDetailPage />} />
              <Route path="/score/:id" element={<ScorecardPage />} />
              <Route path="/results/:id" element={<ResultsPage />} />
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/history" element={<MatchHistoryPage />} />
              <Route path="/statistics" element={<StatisticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/profile" element={<SettingsPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </main>
          <Toaster />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;