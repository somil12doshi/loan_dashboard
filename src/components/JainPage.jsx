import { motion } from 'framer-motion';
import StatCard from './StatCard';
import SectionTitle from './SectionTitle';
import { useData } from '../data/DataContext';

const fmtInr = n => '₹' + (n || 0).toLocaleString('en-IN');
const fmtUsd = n => '$' + (n || 0).toLocaleString('en-US');
const COLORS = { jain: '#06b6d4', green: '#34d399', accent: '#f43f5e', indigo: '#6366f1', purple: '#a855f7', usa: '#fbbf24' };

export default function JainPage() {
  const { jain } = useData();
  const indiaRows = (jain.rows || []).filter(r => !r.trustName.includes('USA') && !r.trustName.includes('5000'));
  const usaRows = jain.usaRows || [];
  const usaTotals = jain.usaTotals || { amount2024: 0, amount2025: 5000, total: 5000, repaymentAmount: 0, totalRepayments: 0, remainingLiability: 5000 };

  const indiaAmount2024 = indiaRows.reduce((s, r) => s + (r.amount2024 || 0), 0);
  const indiaAmount2025 = indiaRows.reduce((s, r) => s + (r.amount2025 || 0), 0);
  const indiaTotal = indiaAmount2024 + indiaAmount2025;
  const indiaRepaymentAmount = indiaRows.reduce((s, r) => s + (r.repaymentAmount || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12"
    >
      <div>
        <SectionTitle 
          title="JAIN Trust & International Details" 
          sub="Breakdown of interest-free loans by trust source (India & USA)"
          accent={COLORS.jain}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="India Loans (INR)" value={indiaTotal} accent={COLORS.jain} icon="◆" index={0} />
        <StatCard title="USA Loans (USD)" value={fmtUsd(usaTotals.total)} accent={COLORS.usa} icon="$" index={1} />
        <StatCard title="Remaining INR Loan" value={indiaTotal - jain.totals.totalRepayments} accent={COLORS.accent} icon="◉" index={2} />
        <StatCard title="Remaining USD Loan" value={fmtUsd(usaTotals.remainingLiability)} accent={COLORS.usa} icon="◉" index={3} />
        <StatCard title="Total Repayments (INR)" value={jain.totals.totalRepayments} accent={COLORS.green} icon="✓" index={4} />
      </div>

      {/* Table 1: India Trust Disbursement Details */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white/80 flex items-center gap-2">
          <span>🇮🇳</span> India Loans — Disbursement & Repayment Schedule (₹ INR)
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
                {indiaRows.map((row, i) => (
                  <tr key={i}>
                    <td className="font-medium text-white">{row.trustName}</td>
                    <td className="text-white/45 text-xs">{row.disbursDate2024 || '—'}</td>
                    <td>{fmtInr(row.amount2024)}</td>
                    <td className="text-white/45 text-xs">{row.disbursDate2025 || '—'}</td>
                    <td>{fmtInr(row.amount2025)}</td>
                    <td className="font-semibold text-cyan-400">{fmtInr(row.total)}</td>
                    <td className="text-white/45 text-xs">{row.repaymentStart || '—'}</td>
                    <td className="font-semibold text-emerald-400">{fmtInr(row.repaymentAmount)}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td>TOTALS (INR)</td>
                  <td></td>
                  <td>{fmtInr(indiaAmount2024)}</td>
                  <td></td>
                  <td>{fmtInr(indiaAmount2025)}</td>
                  <td>{fmtInr(indiaTotal)}</td>
                  <td></td>
                  <td>{fmtInr(indiaRepaymentAmount)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Table 2: USA Loan Table */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-amber-400 flex items-center gap-2">
          <span>🇺🇸</span> USA Loans — Disbursement & Repayment Schedule ($ USD)
        </h3>
        <div className="glass-card overflow-hidden border border-amber-500/20">
          <div className="overflow-x-auto">
            <table className="loan-table">
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Trust / Lender Name</th>
                  <th style={{ width: '20%' }}>Disbursement Date</th>
                  <th style={{ width: '20%' }}>Loan Amount</th>
                  <th style={{ width: '15%' }}>Repayment Start</th>
                  <th style={{ width: '15%' }}>Repayment Amount</th>
                </tr>
              </thead>
              <tbody>
                {usaRows.map((row, i) => (
                  <tr key={i}>
                    <td className="font-medium text-white">{row.trustName}</td>
                    <td className="text-white/60 text-xs">{row.disbursDate2025 || row.disbursDate2024 || '—'}</td>
                    <td className="font-bold text-amber-400">{fmtUsd(row.total || row.amount2025 || 5000)}</td>
                    <td className="text-white/45 text-xs">{row.repaymentStart || '—'}</td>
                    <td className="font-semibold text-emerald-400">{row.repaymentAmount ? fmtUsd(row.repaymentAmount) : '—'}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td>TOTALS (USD)</td>
                  <td></td>
                  <td className="text-amber-400 font-bold">{fmtUsd(usaTotals.total)}</td>
                  <td></td>
                  <td className="text-emerald-400 font-bold">{fmtUsd(usaTotals.repaymentAmount)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Repayments Logs (India & USA) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* India Repayments Log */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
            🇮🇳 India Repayments Log (INR)
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
                      <td className="text-right font-semibold text-emerald-400">{fmtInr(row.amount)}</td>
                    </tr>
                  ))}
                  {(!jain.repayments || jain.repayments.length === 0) && (
                    <tr>
                      <td colSpan="3" className="text-center text-white/40 py-8 text-xs italic">
                        No repayments logged yet.
                      </td>
                    </tr>
                  )}
                  {jain.repayments && jain.repayments.length > 0 && (
                    <tr className="total-row">
                      <td style={{ position: 'sticky', bottom: 0, backgroundColor: '#0f1326', zIndex: 10 }}>TOTALS</td>
                      <td style={{ position: 'sticky', bottom: 0, backgroundColor: '#0f1326', zIndex: 10 }}></td>
                      <td className="text-right text-emerald-400 font-bold" style={{ position: 'sticky', bottom: 0, backgroundColor: '#0f1326', zIndex: 10 }}>{fmtInr(jain.totals.totalRepayments)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* USA Repayments Log */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-amber-400 flex items-center gap-2">
            🇺🇸 USA Repayments Log ($ USD)
          </h3>
          <div className="glass-card overflow-hidden border border-amber-500/20">
            <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: '480px' }}>
              <table className="loan-table">
                <thead>
                  <tr>
                    <th style={{ width: '40%', position: 'sticky', top: 0, backgroundColor: '#0f1326', zIndex: 10 }}>Trust / Lender</th>
                    <th style={{ width: '30%', position: 'sticky', top: 0, backgroundColor: '#0f1326', zIndex: 10 }}>Date</th>
                    <th style={{ width: '30%', textAlign: 'right', position: 'sticky', top: 0, backgroundColor: '#0f1326', zIndex: 10 }}>Payment Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(jain.usaRepayments || []).map((row, i) => (
                    <tr key={i}>
                      <td className="font-medium text-white">{row.trustName}</td>
                      <td className="text-white/60">{row.date}</td>
                      <td className="text-right font-semibold text-emerald-400">{fmtUsd(row.amount)}</td>
                    </tr>
                  ))}
                  {(!jain.usaRepayments || jain.usaRepayments.length === 0) && (
                    <tr>
                      <td colSpan="3" className="text-center text-white/40 py-8 text-xs italic">
                        No USA repayments logged yet. Go to Admin Editor to add repayments.
                      </td>
                    </tr>
                  )}
                  {jain.usaRepayments && jain.usaRepayments.length > 0 && (
                    <tr className="total-row">
                      <td style={{ position: 'sticky', bottom: 0, backgroundColor: '#0f1326', zIndex: 10 }}>TOTALS</td>
                      <td style={{ position: 'sticky', bottom: 0, backgroundColor: '#0f1326', zIndex: 10 }}></td>
                      <td className="text-right text-emerald-400 font-bold" style={{ position: 'sticky', bottom: 0, backgroundColor: '#0f1326', zIndex: 10 }}>{fmtUsd(usaTotals.totalRepayments)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}

