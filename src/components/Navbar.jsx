import { motion } from 'framer-motion';

export default function Navbar({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'summary', label: 'Master Summary' },
    { id: 'jain', label: 'JAIN Trust' },
    { id: 'hdfc', label: 'HDFC' },
    { id: 'staffing', label: 'Staffing' },
    { id: 'admin', label: 'Admin' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-navbar px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            L
          </div>
          <h1 className="text-lg font-bold text-white hidden sm:block tracking-tight">Loan Tracker</h1>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 p-1 bg-white/5 rounded-full border border-white/5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative px-3 sm:px-5 py-1.5 text-xs sm:text-sm font-semibold transition-all duration-300 rounded-full
                ${activeTab === tab.id ? 'text-white' : 'text-white/50 hover:text-white/80'}
              `}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white/10 border border-white/10 rounded-full"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Status */}
        <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>
    </nav>
  );
}
