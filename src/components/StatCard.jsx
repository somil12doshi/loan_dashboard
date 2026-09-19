import { motion } from 'framer-motion';

export default function StatCard({ title, value, accent, icon, index }) {
  const fmt = n => '₹' + (n || 0).toLocaleString('en-IN');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      style={{
        background: `radial-gradient(circle at top left, ${accent}0d, transparent 70%), rgba(255, 255, 255, 0.03)`,
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
      }}
      className="p-5 rounded-2xl group hover:border-white/20 transition-all duration-300 relative overflow-hidden"
    >
      {/* Background glow on hover */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 10% 10%, ${accent}15, transparent 50%)`,
        }}
      />

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-transform duration-300 group-hover:scale-110" 
          style={{ background: accent + '1a', color: accent, border: `1px solid ${accent}30` }}
        >
          {icon}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-white/5 text-white/50 border border-white/5">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accent }} />
          Live
        </div>
      </div>
      
      <p className="text-[10px] font-bold uppercase tracking-wider mb-1 relative z-10 text-white/40">
        {title}
      </p>
      
      <p className="text-2xl font-extrabold text-white tracking-tight relative z-10 transition-colors duration-300 group-hover:text-white">
        {typeof value === 'string' ? value : fmt(value)}
      </p>
    </motion.div>
  );
}
