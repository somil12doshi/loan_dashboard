import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Background from './components/Background';
import MasterSummary from './components/MasterSummary';
import JainPage from './components/JainPage';
import HdfcPage from './components/HdfcPage';
import AdminPage from './components/AdminPage';
import { DataProvider, useData } from './data/DataContext';
import './index.css';

const pages = {
  summary: MasterSummary,
  jain: JainPage,
  hdfc: HdfcPage,
  admin: AdminPage,
};

function MainContent() {
  const [activeTab, setActiveTab] = useState('summary');
  const { isLoading } = useData();
  const Page = pages[activeTab];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white">
        <div className="text-center space-y-4 z-10 glass-card p-10 max-w-sm mx-auto flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-2" />
          <h2 className="text-xl font-bold tracking-wider text-cyan-400">Loading Dashboard</h2>
          <p className="text-xs text-white/50">Fetching database records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ zIndex: 1, minHeight: '100vh' }}>
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <Page />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <Background />
      <MainContent />
    </DataProvider>
  );
}
