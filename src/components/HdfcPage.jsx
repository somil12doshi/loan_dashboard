import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StatCard from './StatCard';
import SectionTitle from './SectionTitle';
import { useData } from '../data/DataContext';
import { sortRepaymentsLatestFirst } from '../utils/dateUtils';

const fmt = n => '₹' + (n || 0).toLocaleString('en-IN');
const COLORS = { hdfc: '#6366f1', amber: '#fbbf24', green: '#34d399' };

export default function HdfcPage() {
  const { hdfc } = useData();
  // By default, table is in hide mode
  const [showTable, setShowTable] = useState(false);

  const hdfcOutstanding = hdfc.outstandingAmount !== undefined 
    ? hdfc.outstandingAmount 
    : (hdfc.totals?.amountNow ?? 1122092);

  // Sort repayments so latest payment is in front (not at last)
  const sortedRepayments = useMemo(() => sortRepaymentsLatestFirst(hdfc.repayments), [hdfc.repayments]);

  // Table totals calculated from rows only (for table display, unlinked from main data)
  const tableTotals = {
    principle: hdfc.rows.reduce((s, r) => s + (r.principle || 0), 0),
    amountNow: hdfc.rows.reduce((s, r) => s + (r.amountNow || 0), 0),
    interest: hdfc.rows.reduce((s, r) => s + (r.interest || 0), 0),
    interestPaid: hdfc.rows.reduce((s, r) => s + (r.interestPaid || 0), 0),
    interestLeft: hdfc.rows.reduce((s, r) => s + (r.interestLeft || 0), 0),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <SectionTitle 
        title="HDFC Loan Details" 
        sub="Interest-bearing tranches and current outstanding"
        accent={COLORS.hdfc}
      />

      {/* 3 Summary Cards (Interest Remaining card removed, view-only — edits in Admin) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="Total Principal" 
          value={hdfc.summary?.totalPrincipal || 2150000} 
          accent={COLORS.hdfc} 
          icon="◇" 
          index={0} 
        />
        <StatCard 
          title="Amount Outstanding" 
          value={hdfcOutstanding} 
          accent={COLORS.amber} 
          icon="◉" 
          index={1} 
        />
        <StatCard 
          title="Already Repaid" 
          value={hdfc.summary?.repayment || 1250000} 
          accent={COLORS.green} 
          icon="✓" 
          index={2} 
        />
      </div>

      {/* Repayment History Section */}
      <div className="space-y-4">
        <SectionTitle 
          title="Repayment History" 
          sub="Past principal repayments tracked in Excel" 
          accent={COLORS.green} 
        />

        <div className="glass-card p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {sortedRepayments.map((r, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5">
                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">{r.date}</p>
                <p className="text-sm font-bold text-emerald-400">{fmt(r.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tranche Breakdown Table (Shifted to bottom, hidden by default) */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-4 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white/90">
                Tranche Breakdown Table
              </h3>
              <p className="text-[11px] text-white/40">
                Disbursement records (reference only • unlinked from main total)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowTable(prev => !prev)}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 ${
              showTable 
                ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80 hover:text-white' 
                : 'bg-indigo-500/20 hover:bg-indigo-500/30 border-indigo-500/40 text-indigo-300 shadow-indigo-500/10'
            }`}
          >
            {showTable ? (
              <>
                <svg className="w-3.5 h-3.5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
                <span>Hide Table</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>Show Table</span>
              </>
            )}
          </button>
        </div>

        {/* Collapsible Tranche Table */}
        <AnimatePresence initial={false}>
          {showTable ? (
            <motion.div
              key="table"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="glass-card overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="loan-table">
                  <thead>
                    <tr>
                      {hdfc.headers.map(h => <th key={h}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {hdfc.rows.map((row, i) => (
                      <tr key={i}>
                        <td style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem' }}>{row.paymentDate}</td>
                        <td>{fmt(row.principle)}</td>
                        <td className="font-semibold" style={{ color: COLORS.amber }}>{fmt(row.amountNow)}</td>
                        <td>{fmt(row.interest)}</td>
                        <td>{fmt(row.interestPaid)}</td>
                        <td style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem' }}>{row.interestPaidTill}</td>
                        <td className="font-semibold" style={{ color: COLORS.green }}>{fmt(row.interestLeft)}</td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td>TOTALS</td>
                      <td>{fmt(tableTotals.principle)}</td>
                      <td>{fmt(tableTotals.amountNow)}</td>
                      <td>{fmt(tableTotals.interest)}</td>
                      <td>{fmt(tableTotals.interestPaid)}</td>
                      <td></td>
                      <td>{fmt(tableTotals.interestLeft)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="hidden-hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTable(true)}
              className="glass-card p-5 text-center text-xs text-white/40 border border-dashed border-white/10 rounded-2xl hover:border-indigo-500/30 hover:text-white/70 transition-all cursor-pointer select-none"
            >
              <p className="font-medium text-white/60">Tranche table is currently hidden (default).</p>
              <p className="text-[11px] text-white/35 mt-0.5">Click here or "Show Table" above to view individual disbursement tranches.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
