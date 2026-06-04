import { motion } from 'framer-motion';
import StatCard from './StatCard';
import SectionTitle from './SectionTitle';
import { useData } from '../data/DataContext';

const fmt = n => '₹' + (n || 0).toLocaleString('en-IN');
const COLORS = { hdfc: '#6366f1', amber: '#fbbf24', green: '#34d399' };

export default function HdfcPage() {
  const { hdfc } = useData();

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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Principal" value={hdfc.summary.totalPrincipal} accent={COLORS.hdfc} icon="◇" index={0} />
        <StatCard title="Amount Outstanding" value={hdfc.totals.amountNow} accent={COLORS.amber} icon="◉" index={1} />
        <StatCard title="Interest Remaining" value={hdfc.totals.interestLeft} accent={COLORS.amber} icon="%" index={2} />
        <StatCard title="Already Repaid" value={hdfc.summary.repayment} accent={COLORS.green} icon="✓" index={3} />
      </div>

      <div className="glass-card overflow-hidden">
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
                <td>{fmt(hdfc.totals.principle)}</td>
                <td>{fmt(hdfc.totals.amountNow)}</td>
                <td>{fmt(hdfc.totals.interest)}</td>
                <td>{fmt(hdfc.totals.interestPaid)}</td>
                <td></td>
                <td>{fmt(hdfc.totals.interestLeft)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <SectionTitle title="Repayment History" sub="Past principal repayments tracked in Excel" accent={COLORS.green} />
      <div className="glass-card p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {hdfc.repayments.map((r, i) => (
            <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5">
              <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">{r.date}</p>
              <p className="text-sm font-bold text-emerald-400">{fmt(r.amount)}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
