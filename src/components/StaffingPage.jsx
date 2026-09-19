import { motion } from 'framer-motion';
import StatCard from './StatCard';
import SectionTitle from './SectionTitle';
import { useData } from '../data/DataContext';

const fmtUSD = n => '$' + (n || 0).toLocaleString('en-US');
const COLORS = { purple: '#a855f7', amber: '#fbbf24', green: '#34d399', pink: '#f43f5e' };

export default function StaffingPage() {
  const { staffing } = useData();

  const totalAmount = staffing?.totals?.total || 9360;
  const totalRepaid = staffing?.totals?.totalRepayments || 0;
  const remainingLiability = staffing?.totals?.remainingLiability || totalAmount;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <SectionTitle 
        title="Staffing Loan Details" 
        sub="Total Amount Payable (12%): $9,360 USD"
        accent={COLORS.purple}
      />

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Amount Payable (12%)" value={fmtUSD(totalAmount)} accent={COLORS.purple} icon="💼" index={0} />
        <StatCard title="Total Paid ($ USD)" value={fmtUSD(totalRepaid)} accent={COLORS.green} icon="✓" index={1} />
        <StatCard title="Remaining Liability ($ USD)" value={fmtUSD(remainingLiability)} accent={COLORS.amber} icon="◉" index={2} />
        <StatCard title="Total Installments" value={`${(staffing?.rows || []).length} Payments`} accent={COLORS.pink} icon="📅" index={3} />
      </div>

      {/* Payment Schedule Table matching User's Image */}
      <section className="space-y-3 max-w-2xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>Total Amount Payable (12%):</span>
            <span className="text-purple-400 font-extrabold">$9,360</span>
          </h3>
          <span className="text-xs text-white/50 bg-white/5 border border-white/10 px-3 py-1 rounded-full w-fit">
            4 Installments Breakdown
          </span>
        </div>

        <div className="glass-card overflow-hidden border border-purple-500/20 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="loan-table w-full">
              <thead>
                <tr>
                  <th style={{ width: '60%' }}>Payment</th>
                  <th style={{ width: '40%', textAlign: 'right', paddingRight: '2rem' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(staffing?.rows || []).map((row, i) => {
                  const repayment = (staffing?.repayments || []).find(r => r.payment === row.payment);
                  const isPaid = !!repayment || row.status === 'Paid';
                  return (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="font-medium text-white flex items-center justify-between gap-2 pr-4">
                        <span>{row.payment}</span>
                        {isPaid && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                            ✓ Paid {repayment?.date ? `(${repayment.date})` : ''}
                          </span>
                        )}
                      </td>
                      <td className="font-bold text-purple-300 text-right pr-8" style={{ fontSize: '0.95rem' }}>
                        {fmtUSD(row.amount)}
                      </td>
                    </tr>
                  );
                })}
                <tr className="total-row border-t-2 border-purple-500/30">
                  <td className="font-extrabold text-white text-base">Total</td>
                  <td className="font-extrabold text-purple-400 text-base text-right pr-8">
                    {fmtUSD(totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Staffing Repayment History */}
      <section className="space-y-4">
        <SectionTitle title="Repayment Log ($ USD)" sub="Past installments paid towards Staffing" accent={COLORS.green} />
        <div className="glass-card p-6 border border-white/10">
          {staffing?.repayments && staffing.repayments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {staffing.repayments.map((r, i) => (
                <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400">{r.payment || 'Installment'}</p>
                  <p className="text-xs text-white/50">{r.date || '—'}</p>
                  <p className="text-lg font-extrabold text-emerald-400">{fmtUSD(r.amount)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-white/40 text-sm italic">
              No Staffing repayments logged yet. Add repayments in the Admin Editor tab.
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
}
