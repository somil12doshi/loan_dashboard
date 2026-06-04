import { motion } from 'framer-motion';
import StatCard from './StatCard';
import SectionTitle from './SectionTitle';
import { useData } from '../data/DataContext';

const fmt = n => '₹' + (n || 0).toLocaleString('en-IN');
const COLORS = { jain: '#06b6d4', green: '#34d399', accent: '#f43f5e', indigo: '#6366f1', purple: '#a855f7' };

export default function JainPage() {
  const { jain } = useData();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12"
    >
      <div>
        <SectionTitle 
          title="JAIN Trust Details" 
          sub="Breakdown of interest-free loans by trust source"
          accent={COLORS.jain}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total JAIN Loan" value={jain.totals.total} accent={COLORS.jain} icon="◆" index={0} />
        <StatCard title="Remaining Loan" value={jain.totals.remainingLiability} accent={COLORS.accent} icon="◉" index={1} />
        <StatCard title="Total Repayments" value={jain.totals.totalRepayments} accent={COLORS.green} icon="✓" index={2} />
        <StatCard title="2024 Disbursement" value={jain.totals.amount2024} accent={COLORS.indigo} icon="◈" index={3} />
        <StatCard title="2025 Disbursement" value={jain.totals.amount2025} accent={COLORS.purple} icon="◇" index={4} />
      </div>

      {/* Table 1: Original Trust Disbursement Details */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white/80">
          Disbursement & Repayment Schedule
        </h3>
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="loan-table">
              <thead>
                <tr>
                  {jain.headers.map((h, idx) => (
                    <th 
                      key={h} 
                      style={idx === 0 ? { width: '20%' } : idx === 6 || idx === 7 ? { width: '12%' } : {}}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jain.rows.map((row, i) => (
                  <tr key={i}>
                    <td className="font-medium text-white">{row.trustName}</td>
                    <td className="text-white/45 text-xs">{row.disbursDate2024 || '—'}</td>
                    <td>{fmt(row.amount2024)}</td>
                    <td className="text-white/45 text-xs">{row.disbursDate2025 || '—'}</td>
                    <td>{fmt(row.amount2025)}</td>
                    <td className="font-semibold text-cyan-400">{fmt(row.total)}</td>
                    <td className="text-white/45 text-xs">{row.repaymentStart || '—'}</td>
                    <td className="font-semibold text-emerald-400">{fmt(row.repaymentAmount)}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td>TOTALS</td>
                  <td></td>
                  <td>{fmt(jain.totals.amount2024)}</td>
                  <td></td>
                  <td>{fmt(jain.totals.amount2025)}</td>
                  <td>{fmt(jain.totals.total)}</td>
                  <td></td>
                  <td>{fmt(jain.totals.repaymentAmount)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Table 2: Trust Loan Summary Table */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-400">
          JAIN Trust Loan Summary
        </h3>
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="loan-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Trust Name</th>
                  <th style={{ width: '20%', textAlign: 'right' }}>Loan Amount</th>
                  <th style={{ width: '20%', textAlign: 'right' }}>Total Repayment Amount</th>
                  <th style={{ width: '20%', textAlign: 'right' }}>Remaining Loan</th>
                </tr>
              </thead>
              <tbody>
                {jain.rows.map((row, i) => {
                  const totalRepayments = (jain.repayments || [])
                    .filter(r => r.trustName === row.trustName)
                    .reduce((sum, r) => sum + (r.amount || 0), 0);
                  const remainingLoan = (row.total || 0) - totalRepayments;
                  return (
                    <tr key={i}>
                      <td className="font-medium text-white">{row.trustName}</td>
                      <td className="text-right text-white/80">{fmt(row.total)}</td>
                      <td className="text-right text-emerald-400">{fmt(totalRepayments)}</td>
                      <td className="text-right font-semibold text-cyan-400">{fmt(remainingLoan)}</td>
                    </tr>
                  );
                })}
                <tr className="total-row">
                  <td>TOTALS</td>
                  <td className="text-right text-white font-bold">{fmt(jain.totals.total)}</td>
                  <td className="text-right text-emerald-400 font-bold">{fmt(jain.totals.totalRepayments)}</td>
                  <td className="text-right text-cyan-400 font-bold">{fmt(jain.totals.remainingLiability)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Table 3: Repayment Log Table */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
          JAIN Repayments Log
        </h3>
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: '480px' }}>
            <table className="loan-table">
              <thead>
                <tr>
                  <th style={{ width: '40%', position: 'sticky', top: 0, backgroundColor: '#0f1326', zIndex: 10 }}>Trust Name</th>
                  <th style={{ width: '30%', position: 'sticky', top: 0, backgroundColor: '#0f1326', zIndex: 10 }}>Date</th>
                  <th style={{ width: '30%', textAlign: 'right', position: 'sticky', top: 0, backgroundColor: '#0f1326', zIndex: 10 }}>Payment Amount</th>
                </tr>
              </thead>
              <tbody>
                {(jain.repayments || []).map((row, i) => (
                  <tr key={i}>
                    <td className="font-medium text-white">{row.trustName}</td>
                    <td className="text-white/60">{row.date}</td>
                    <td className="text-right font-semibold text-emerald-400">{fmt(row.amount)}</td>
                  </tr>
                ))}
                {(!jain.repayments || jain.repayments.length === 0) && (
                  <tr>
                    <td colSpan="3" className="text-center text-white/40 py-8 text-xs italic">
                      No repayments logged yet. Go to Admin Editor to add repayments.
                    </td>
                  </tr>
                )}
                {jain.repayments && jain.repayments.length > 0 && (
                  <tr className="total-row">
                    <td style={{ position: 'sticky', bottom: 0, backgroundColor: '#0f1326', zIndex: 10 }}>TOTALS</td>
                    <td style={{ position: 'sticky', bottom: 0, backgroundColor: '#0f1326', zIndex: 10 }}></td>
                    <td className="text-right text-emerald-400 font-bold" style={{ position: 'sticky', bottom: 0, backgroundColor: '#0f1326', zIndex: 10 }}>{fmt(jain.totals.totalRepayments)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
