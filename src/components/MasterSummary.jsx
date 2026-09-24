import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import SectionTitle from './SectionTitle';
import { useData } from '../data/DataContext';

const fmt = n => '₹' + n.toLocaleString('en-IN');

const COLORS = {
  jain: '#06b6d4',      // Cyan (Jain India)
  hdfc: '#6366f1',      // Indigo (HDFC)
  green: '#10b981',     // Emerald Green
  amber: '#f59e0b',     // Gold / Amber (USA Loan)
  purple: '#a855f7',    // Purple
  pink: '#ec4899',      // Vibrant Pink / Magenta (Staffing)
};

const TT = ({ children }) => (
  <div style={{ background: 'rgba(6,9,28,0.97)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px 14px', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', fontSize: '0.85rem' }}>
    {children}
  </div>
);

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <TT>
      <p className="font-semibold text-white mb-1">{payload[0].name}</p>
      <p style={{ color: payload[0].payload.fill || '#06b6d4' }}>{fmt(payload[0].value)}</p>
    </TT>
  );
};

const renderCustomLabel = ({ x, y, cx, cy, value }) => {
  return (
    <text
      x={x}
      y={y}
      fill="rgba(255, 255, 255, 0.85)"
      fontSize="11"
      fontWeight="600"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
    >
      {fmt(value)}
    </text>
  );
};

// Parse dates in various formats safely: "D Mon YYYY", "DD/MM/YYYY", "DD-MM-YYYY", "YYYY-MM-DD"
const MONTHS = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, september: 8, sept: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11
};

function parseDate(str) {
  if (!str) return null;
  const cleaned = str.trim().toLowerCase();

  // 1. Try parsing "D Mon YYYY" or "D Month YYYY" (e.g. "5 Aug 2025", "29 Jul 2024", "05 August 2025")
  const textDateRegex = /^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/;
  let match = cleaned.match(textDateRegex);
  if (match) {
    const day = parseInt(match[1], 10);
    const monthName = match[2];
    const year = parseInt(match[3], 10);
    if (MONTHS[monthName] !== undefined) {
      const d = new Date(year, MONTHS[monthName], day);
      if (!isNaN(d.getTime())) return d;
    }
  }

  // 2. Try parsing DD/MM/YYYY or DD-MM-YYYY (e.g. 5/8/2026, 05-08-2026)
  const dmyRegex = /^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/;
  match = cleaned.match(dmyRegex);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // 0-indexed month
    const year = parseInt(match[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // 3. Try parsing YYYY-MM-DD (e.g. 2026-08-05)
  const ymdRegex = /^(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})$/;
  match = cleaned.match(ymdRegex);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // 4. Fallback to standard browser parsing
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function NextInstallments({ jain, hdfc }) {
  // Use current live system date, set to midnight for robust calculations
  const today = new Date(); 
  today.setHours(0, 0, 0, 0);

  const upcoming = [];

  const allJainRows = [
    ...(jain.rows || []).map(r => ({ ...r, isUsd: false })),
    ...(jain.usaRows || []).map(r => ({ ...r, isUsd: true }))
  ];

  // JAIN rows with repayment start date specified
  allJainRows.forEach(r => {
    if (!r.repaymentAmount) return;
    if (!r.repaymentStart) return; // Skip if no repayment start date is specified

    // Calculate total loan and total repayments for this specific trust row
    const totalLoan = r.total || ((r.amount2024 || 0) + (r.amount2025 || 0));
    const trustRepayments = r.isUsd
      ? (jain.usaRepayments || []).filter(rep => rep.trustName === r.trustName).reduce((s, rep) => s + (rep.amount || 0), 0)
      : (jain.repayments || []).filter(rep => rep.trustName === r.trustName).reduce((s, rep) => s + (rep.amount || 0), 0);

    const trustRemaining = totalLoan - trustRepayments;

    // Skip if remaining amount in this Trust is 0 or less
    if (trustRemaining <= 0) return;

    const startDate = parseDate(r.repaymentStart);
    if (!startDate) return; // Skip invalid dates

    let nextPaymentDate = new Date(startDate);
    const paymentDay = startDate.getDate();

    // Advance month-by-month as long as current due is over (nextPaymentDate < today)
    while (nextPaymentDate < today) {
      const curYear = nextPaymentDate.getFullYear();
      const curMonth = nextPaymentDate.getMonth();
      let nextMonth = curMonth + 1;
      let nextYear = curYear;
      if (nextMonth > 11) {
        nextMonth = 0;
        nextYear++;
      }
      const daysInTargetMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
      const targetDay = Math.min(paymentDay, daysInTargetMonth);
      nextPaymentDate = new Date(nextYear, nextMonth, targetDay);
    }

    const daysLeft = Math.ceil((nextPaymentDate - today) / 86400000);
    let status = 'active';

    if (daysLeft <= 7) status = 'urgent';
    else if (daysLeft <= 30) status = 'soon';
    else status = 'upcoming';

    const installmentAmount = Math.min(r.repaymentAmount, trustRemaining);

    upcoming.push({
      name: r.trustName,
      amount: installmentAmount,
      date: nextPaymentDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      type: r.isUsd ? 'USA LOAN' : 'JAIN INDIA',
      color: r.isUsd ? COLORS.amber : COLORS.jain,
      isUsd: r.isUsd,
      status,
      daysLeft,
    });
  });

  // Sort by days left ascending
  upcoming.sort((a, b) => a.daysLeft - b.daysLeft);

  const badgeStyle = (status) => {
    if (status === 'urgent') return { bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.4)', color: '#f87171', label: 'Due Urgent' };
    if (status === 'soon') return { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.35)', color: '#fbbf24', label: 'Due Soon' };
    return { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.35)', color: '#818cf8', label: 'Upcoming' };
  };

  if (!upcoming.length) return null;

  return (
    <section>
      <SectionTitle
        title="Next Installments Due"
        sub={`Based on today — ${today.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`}
        accent={COLORS.amber}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {upcoming.map((item, i) => {
          const badge = badgeStyle(item.status);
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="glass-card p-5 relative overflow-hidden"
            >
              {/* Side accent */}
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: item.color }} />

              <div className="pl-3">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: item.color }}>
                      {item.type}
                    </p>
                    <p className="text-sm font-medium text-white leading-snug">{item.name}</p>
                  </div>
                  <span
                    className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color }}
                  >
                    {badge.label}
                  </span>
                </div>

                <p className="text-xl font-bold text-white mb-2">
                  {item.isUsd ? '$' + (item.amount || 0).toLocaleString('en-US') : fmt(item.amount)}
                </p>

                <div className="flex items-center justify-between text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  <span>📅 {item.date}</span>
                  <span style={{ color: item.daysLeft <= 7 ? '#f87171' : item.daysLeft <= 30 ? '#fbbf24' : 'rgba(255,255,255,0.35)' }}>
                    {item.daysLeft <= 0 ? 'Overdue' : `${item.daysLeft}d left`}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function OverviewCard({ title, combinedValue, jainValue, hdfcValue, items, icon, colors, index, customValue, hideProgressBar, subtitle }) {
  const total = items ? items.reduce((s, item) => s + (item.value || 0), 0) : (jainValue || 0) + (hdfcValue || 0);
  const jainPct = !items && total > 0 ? (jainValue / total) * 100 : 0;
  const hdfcPct = !items && total > 0 ? (hdfcValue / total) * 100 : 0;

  const isCompact = customValue || hideProgressBar;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`glass-card p-5 flex flex-col justify-between relative overflow-hidden h-full ${isCompact ? 'min-h-[125px]' : 'min-h-[175px]'}`}
    >
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">{title}</span>
          <span className="text-xl shrink-0 ml-2" style={{ color: colors.accent }}>{icon}</span>
        </div>

        {/* Combined Total Value */}
        <div className={isCompact ? "mb-0" : "mb-4"}>
          <p className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            {customValue ? customValue : fmt(combinedValue)}
          </p>
          <span className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">
            {subtitle ? subtitle : customValue ? 'International Liability' : 'Combined Balance'}
          </span>
        </div>
      </div>

      {/* Progress Split Bar & Detail */}
      {!hideProgressBar && total > 0 ? (
        items ? (
          <div className="space-y-3">
            {/* Multi-item Progress bar */}
            <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden flex">
              {items.map((item, idx) => {
                if (!item.value || item.value <= 0) return null;
                const pct = (item.value / total) * 100;
                return (
                  <div
                    key={idx}
                    style={{ width: `${pct}%`, backgroundColor: item.color }}
                    className="h-full transition-all duration-500"
                  />
                );
              })}
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs pt-1">
              {items.map((item, idx) => {
                if (!item.value || item.value <= 0) return null;
                const pct = (item.value / total) * 100;
                return (
                  <div key={idx} className="flex flex-col">
                    <span className="text-[10px] uppercase text-white/40 mb-0.5 flex items-center gap-1 font-medium truncate">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </span>
                    <span className="text-xs font-semibold text-white flex items-center gap-1 flex-wrap">
                      <span style={{ color: item.color }}>{fmt(item.value)}</span>
                      <span className="text-[10px] text-white/45 font-normal">({pct.toFixed(0)}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Progress bar */}
            <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden flex">
              {jainValue > 0 && (
                <div 
                  style={{ width: `${jainPct}%`, backgroundColor: colors.jain }} 
                  className="h-full transition-all duration-500" 
                />
              )}
              {hdfcValue > 0 && (
                <div 
                  style={{ width: `${hdfcPct}%`, backgroundColor: colors.hdfc }} 
                  className="h-full transition-all duration-500"
                />
              )}
            </div>

            {/* Details */}
            <div className="flex items-center justify-between text-xs pt-1 gap-2">
              {jainValue > 0 && (
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-white/40 mb-0.5 flex items-center gap-1.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.jain }} />
                    JAIN Trust
                  </span>
                  <span className="text-sm font-semibold" style={{ color: colors.jain }}>
                    {fmt(jainValue)}
                    {hdfcValue > 0 && (
                      <span className="text-[10px] text-white/45 ml-1 font-normal">({jainPct.toFixed(0)}%)</span>
                    )}
                  </span>
                </div>
              )}

              {hdfcValue > 0 && (
                <div className={`flex flex-col ${jainValue > 0 ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] uppercase text-white/40 mb-0.5 flex items-center gap-1.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.hdfc }} />
                    HDFC
                  </span>
                  <span className="text-sm font-semibold" style={{ color: colors.hdfc }}>
                    {fmt(hdfcValue)}
                    {jainValue > 0 && (
                      <span className="text-[10px] text-white/45 ml-1 font-normal">({hdfcPct.toFixed(0)}%)</span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        )
      ) : customValue ? null : null}
    </motion.div>
  );
}

export default function MasterSummary() {
  const { summaryData, jain, hdfc, staffing } = useData();
  const usaLiabilityUSD = jain.usaTotals?.remainingLiability || 5000;
  const staffingLiabilityUSD = staffing?.totals?.remainingLiability || 7860;
  const usaLiabilityINR = usaLiabilityUSD * 95;
  const staffingLiabilityINR = staffingLiabilityUSD * 95;

  // 4 distinct colors for all 4 loans:
  // 1. Jain Trust (India): Cyan (#06b6d4)
  // 2. HDFC: Indigo (#6366f1)
  // 3. USA Loan ($5000): Amber / Gold (#f59e0b)
  // 4. Staffing: Vibrant Pink / Magenta (#ec4899)
  const currentOutstandingItems = [
    { name: 'JAIN TRUST', value: summaryData.jainRemainingLiability, color: COLORS.jain },
    { name: 'HDFC', value: summaryData.hdfcAmountNow, color: COLORS.hdfc },
    { name: 'USA LOAN', value: usaLiabilityINR, color: COLORS.amber },
    { name: 'STAFFING', value: staffingLiabilityINR, color: COLORS.pink },
  ];

  const loanDistribution = [
    { name: 'JAIN India', value: summaryData.jainTotal, fill: COLORS.jain },
    { name: 'HDFC', value: summaryData.hdfcTotal, fill: COLORS.hdfc },
  ];

  const remainingBreakdown = [
    { name: 'JAIN India', value: summaryData.jainRemainingLiability, fill: COLORS.jain },
    { name: 'HDFC Amount Now', value: summaryData.hdfcAmountNow, fill: COLORS.hdfc },
    { name: 'USA Loan (INR)', value: usaLiabilityINR, fill: COLORS.amber },
    { name: 'Staffing (INR)', value: staffingLiabilityINR, fill: COLORS.pink },
  ].filter(item => item.value > 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-10"
    >
      {/* Master Overview */}
      <section className="space-y-4">
        <SectionTitle title="Master Overview" sub="Combined financial position across all loan sources" />
        
        {/* Line 1: Main Overview Cards (2 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <OverviewCard
            title="Total Principal (INR)"
            combinedValue={summaryData.totalCombinedLoan}
            jainValue={summaryData.jainTotal}
            hdfcValue={summaryData.hdfcTotal}
            icon="◈"
            colors={{ jain: COLORS.jain, hdfc: COLORS.hdfc, accent: COLORS.jain }}
            index={0}
          />
          <OverviewCard
            title="Current Outstanding (INR)"
            combinedValue={summaryData.totalRemainingLiability}
            items={currentOutstandingItems}
            icon="◉"
            colors={{ jain: COLORS.jain, hdfc: COLORS.hdfc, accent: COLORS.hdfc }}
            index={1}
          />
        </div>

        {/* Line 2: Interest Remaining & International Liabilities (3 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          <OverviewCard
            title="Interest Remaining (INR)"
            combinedValue={summaryData.hdfcInterestLeft}
            hideProgressBar={true}
            icon="%"
            subtitle="HDFC Interest Left"
            colors={{ jain: COLORS.green, hdfc: COLORS.green, accent: COLORS.green }}
            index={2}
          />
          <OverviewCard
            title="USA Loan Remaining ($ USD)"
            combinedValue={0}
            jainValue={0}
            hdfcValue={0}
            customValue={'$' + usaLiabilityUSD.toLocaleString('en-US')}
            icon="$"
            colors={{ jain: COLORS.amber, hdfc: COLORS.amber, accent: COLORS.amber }}
            index={3}
          />
          <OverviewCard
            title="Staffing Remaining ($ USD)"
            combinedValue={0}
            jainValue={0}
            hdfcValue={0}
            customValue={'$' + staffingLiabilityUSD.toLocaleString('en-US')}
            icon="💼"
            colors={{ jain: COLORS.pink, hdfc: COLORS.pink, accent: COLORS.pink }}
            index={4}
          />
        </div>
      </section>

      {/* Next Installments */}
      <NextInstallments jain={jain} hdfc={hdfc} />

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
          <h3 className="text-sm font-semibold text-white mb-1">Loan Source Distribution</h3>
          <p className="text-xs mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>By original principal amount</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={loanDistribution}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                label={renderCustomLabel}
                labelLine={{ stroke: 'rgba(255, 255, 255, 0.35)', strokeWidth: 1 }}
              >
                {loanDistribution.map((e, i) => <Cell key={i} fill={e.fill} stroke="transparent" />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={v => <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
          <h3 className="text-sm font-semibold text-white mb-1">Remaining Liability Breakdown</h3>
          <p className="text-xs mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>Current outstanding amounts</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={remainingBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                label={renderCustomLabel}
                labelLine={{ stroke: 'rgba(255, 255, 255, 0.35)', strokeWidth: 1 }}
              >
                {remainingBreakdown.map((e, i) => <Cell key={i} fill={e.fill} stroke="transparent" />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={v => <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </section>


    </motion.div>
  );
}
