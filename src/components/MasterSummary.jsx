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

function TotalLoanLeftCard({ summaryData, usaLiabilityUSD, staffingLiabilityUSD }) {
  const usaTotalINR = (summaryData.usaTotal || 5000) * 95;
  const staffingTotalINR = (summaryData.staffingTotal || 9360) * 95;
  const grandTotal = summaryData.grandTotalLoan || (summaryData.jainTotal + summaryData.hdfcTotal + usaTotalINR + staffingTotalINR);
  const totalLeft = summaryData.totalRemainingLiability;
  const totalRepaid = Math.max(0, grandTotal - totalLeft);
  const pctLeft = grandTotal > 0 ? (totalLeft / grandTotal) * 100 : 0;
  const pctRepaid = grandTotal > 0 ? (totalRepaid / grandTotal) * 100 : 0;

  // Breakdown for the 4 sources
  const jainLeft = summaryData.jainRemainingLiability || 0;
  const jainTotal = summaryData.jainTotal || 0;
  const jainRepaid = Math.max(0, jainTotal - jainLeft);
  const jainPctPaid = jainTotal > 0 ? (jainRepaid / jainTotal) * 100 : 0;

  const hdfcLeft = summaryData.hdfcAmountNow || 0;
  const hdfcTotal = summaryData.hdfcTotal || 0;
  const hdfcRepaid = Math.max(0, hdfcTotal - hdfcLeft);
  const hdfcPctPaid = hdfcTotal > 0 ? (hdfcRepaid / hdfcTotal) * 100 : 0;

  const usaLeft = (summaryData.usaRemainingLiability || usaLiabilityUSD) * 95;
  const usaRepaid = Math.max(0, usaTotalINR - usaLeft);
  const usaPctPaid = usaTotalINR > 0 ? (usaRepaid / usaTotalINR) * 100 : 0;

  const staffingLeft = (summaryData.staffingRemainingLiability || staffingLiabilityUSD) * 95;
  const staffingRepaid = Math.max(0, staffingTotalINR - staffingLeft);
  const staffingPctPaid = staffingTotalINR > 0 ? (staffingRepaid / staffingTotalINR) * 100 : 0;

  const chartData = [
    { name: 'Total Loan Left', value: totalLeft, fill: '#6366f1' },
    { name: 'Total Repaid', value: totalRepaid, fill: '#10b981' },
  ];

  const sourceItems = [
    {
      name: 'JAIN TRUST (INDIA)',
      sub: '₹25,50,000 Sanctioned',
      left: jainLeft,
      total: jainTotal,
      repaid: jainRepaid,
      pctPaid: jainPctPaid,
      color: COLORS.jain,
      icon: '🏛️',
    },
    {
      name: 'HDFC BANK',
      sub: '₹21,50,000 Sanctioned',
      left: hdfcLeft,
      total: hdfcTotal,
      repaid: hdfcRepaid,
      pctPaid: hdfcPctPaid,
      color: COLORS.hdfc,
      icon: '🏦',
    },
    {
      name: 'USA LOAN ($5,000)',
      sub: '$5,000 USD',
      left: usaLeft,
      total: usaTotalINR,
      repaid: usaRepaid,
      pctPaid: usaPctPaid,
      color: COLORS.amber,
      icon: '🇺🇸',
    },
    {
      name: 'STAFFING ($9,360)',
      sub: '$9,360 USD',
      left: staffingLeft,
      total: staffingTotalINR,
      repaid: staffingRepaid,
      pctPaid: staffingPctPaid,
      color: COLORS.pink,
      icon: '💼',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card p-6 lg:p-7 relative overflow-hidden space-y-6"
      style={{
        background: 'radial-gradient(ellipse at top right, rgba(99, 102, 241, 0.12), rgba(6, 9, 28, 0.85) 70%)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
      }}
    >
      {/* Main Chart + Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Donut Chart Indicator */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative min-h-[220px]">
          <div className="w-full h-[220px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  startAngle={90}
                  endAngle={-270}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((e, i) => (
                    <Cell key={i} fill={e.fill} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Inner Center Readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
              <span className="text-[10px] uppercase tracking-widest font-bold text-white/50">
                Total Loan Left
              </span>
              <span className="text-xl font-extrabold text-white tracking-tight mt-0.5">
                {fmt(totalLeft)}
              </span>
              <span className="text-xs font-semibold text-indigo-400">
                {pctLeft.toFixed(1)}% Remaining
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6 mt-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span className="text-white/70">Loan Left: <strong className="text-white">{pctLeft.toFixed(1)}%</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-white/70">Repaid: <strong className="text-emerald-400">{pctRepaid.toFixed(1)}%</strong></span>
            </div>
          </div>
        </div>

        {/* Right: Summary Metrics & Big Progress Bar */}
        <div className="lg:col-span-7 space-y-4">
          {/* Big Summary Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider block mb-1">
                Total Sanctioned Loan
              </span>
              <p className="text-lg font-bold text-white tracking-tight">
                {fmt(grandTotal)}
              </p>
              <span className="text-[10px] text-white/40">100% Initial</span>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <span className="text-[10px] font-semibold text-indigo-300 uppercase tracking-wider block mb-1">
                Total Loan Left
              </span>
              <p className="text-lg font-bold text-indigo-300 tracking-tight">
                {fmt(totalLeft)}
              </p>
              <span className="text-[10px] text-indigo-400/80 font-medium">{pctLeft.toFixed(1)}% to clear</span>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wider block mb-1">
                Total Paid Off
              </span>
              <p className="text-lg font-bold text-emerald-300 tracking-tight">
                {fmt(totalRepaid)}
              </p>
              <span className="text-[10px] text-emerald-400/80 font-medium">{pctRepaid.toFixed(1)}% cleared</span>
            </div>
          </div>

          {/* Master Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs font-semibold text-white/60">
              <span>Overall Payoff Progress</span>
              <span className="text-emerald-400">{pctRepaid.toFixed(1)}% Repaid ({fmt(totalRepaid)} of {fmt(grandTotal)})</span>
            </div>
            <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden flex p-0.5 border border-white/10">
              <div
                style={{ width: `${pctRepaid}%` }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: 4-Source Mini Progress Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
        {sourceItems.map((item, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 relative overflow-hidden hover:border-white/20 transition-all"
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[11px] font-bold text-white/80 flex items-center gap-1 truncate">
                <span>{item.icon}</span>
                {item.name}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded" style={{ color: item.color, backgroundColor: `${item.color}15` }}>
                {item.pctPaid.toFixed(0)}% Paid
              </span>
            </div>

            <div className="flex items-baseline justify-between mb-2">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-white/40 block">Loan Left</span>
                <span className="text-sm font-bold text-white">{fmt(item.left)}</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] uppercase tracking-wider text-white/40 block">Sanctioned</span>
                <span className="text-xs font-semibold text-white/60">{fmt(item.total)}</span>
              </div>
            </div>

            {/* Micro Progress Bar */}
            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                style={{ width: `${Math.max(item.pctPaid, item.left > 0 ? 0 : 100)}%`, backgroundColor: item.color }}
                className="h-full rounded-full transition-all duration-500"
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function MasterSummary() {
  const { summaryData, jain, hdfc, staffing } = useData();
  const usaLiabilityUSD = jain.usaTotals?.remainingLiability || 5000;
  const staffingLiabilityUSD = staffing?.totals?.remainingLiability || 7860;
  const usaTotalUSD = jain.usaTotals?.total || 5000;
  const staffingTotalUSD = staffing?.totals?.total || 9360;

  const usaLiabilityINR = usaLiabilityUSD * 95;
  const staffingLiabilityINR = staffingLiabilityUSD * 95;
  const usaTotalINR = usaTotalUSD * 95;
  const staffingTotalINR = staffingTotalUSD * 95;

  const grandTotalPrincipalINR = summaryData.grandTotalLoan || (summaryData.jainTotal + summaryData.hdfcTotal + usaTotalINR + staffingTotalINR);

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

  const totalPrincipalItems = [
    { name: 'JAIN TRUST', value: summaryData.jainTotal, color: COLORS.jain },
    { name: 'HDFC', value: summaryData.hdfcTotal, color: COLORS.hdfc },
    { name: 'USA LOAN', value: usaTotalINR, color: COLORS.amber },
    { name: 'STAFFING', value: staffingTotalINR, color: COLORS.pink },
  ];

  // All 4 sources included in Loan Source Distribution
  const loanDistribution = [
    { name: 'JAIN India', value: summaryData.jainTotal, fill: COLORS.jain },
    { name: 'HDFC', value: summaryData.hdfcTotal, fill: COLORS.hdfc },
    { name: 'USA Loan', value: usaTotalINR, fill: COLORS.amber },
    { name: 'Staffing', value: staffingTotalINR, fill: COLORS.pink },
  ].filter(item => item.value > 0);

  const remainingBreakdown = [
    { name: 'JAIN India', value: summaryData.jainRemainingLiability, fill: COLORS.jain },
    { name: 'HDFC Amount Now', value: summaryData.hdfcAmountNow, fill: COLORS.hdfc },
    { name: 'USA Loan', value: usaLiabilityINR, fill: COLORS.amber },
    { name: 'Staffing', value: staffingLiabilityINR, fill: COLORS.pink },
  ].filter(item => item.value > 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-10"
    >
      {/* Master Overview */}
      <section className="space-y-5">
        <SectionTitle title="Master Overview" sub="Combined financial position across all loan sources" />
        
        {/* Total Loan Left Payoff Card */}
        <TotalLoanLeftCard
          summaryData={summaryData}
          usaLiabilityUSD={usaLiabilityUSD}
          staffingLiabilityUSD={staffingLiabilityUSD}
        />
        
        {/* Line 1: Main Overview Cards (2 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <OverviewCard
            title="Total Principal & Loans (INR)"
            combinedValue={grandTotalPrincipalINR}
            items={totalPrincipalItems}
            icon="◈"
            subtitle="Combined Loan Balance"
            colors={{ jain: COLORS.jain, hdfc: COLORS.hdfc, accent: COLORS.jain }}
            index={0}
          />
          <OverviewCard
            title="Current Outstanding (INR)"
            combinedValue={summaryData.totalRemainingLiability}
            items={currentOutstandingItems}
            icon="◉"
            subtitle="Total Loan Left"
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
            subtitle={`₹${(usaLiabilityUSD * 95).toLocaleString('en-IN')} INR`}
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
            subtitle={`₹${(staffingLiabilityUSD * 95).toLocaleString('en-IN')} INR`}
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
          <p className="text-xs mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>By original total amount across all 4 sources</p>
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
          <p className="text-xs mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>Current outstanding amounts across all sources</p>
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
