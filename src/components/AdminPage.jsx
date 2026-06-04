import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import SectionTitle from './SectionTitle';
import { useData } from '../data/DataContext';

const MONTH_MAP = {
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

  // 1. Try parsing "D Mon YYYY" or "D Month YYYY" (e.g. "5 Aug 2025")
  const textDateRegex = /^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/;
  let match = cleaned.match(textDateRegex);
  if (match) {
    const day = parseInt(match[1], 10);
    const monthName = match[2];
    const year = parseInt(match[3], 10);
    if (MONTH_MAP[monthName] !== undefined) {
      const d = new Date(year, MONTH_MAP[monthName], day);
      if (!isNaN(d.getTime())) return d;
    }
  }

  // 2. Try parsing DD/MM/YYYY or DD-MM-YYYY
  const dmyRegex = /^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/;
  match = cleaned.match(dmyRegex);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const year = parseInt(match[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // 3. Try parsing YYYY-MM-DD
  const ymdRegex = /^(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})$/;
  match = cleaned.match(ymdRegex);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function toISODate(str) {
  if (!str) return '';
  const d = parseDate(str);
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function toDisplayDate(isoStr) {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length !== 3) return isoStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return isoStr;
  return `${day} ${MONTH_NAMES[month]} ${year}`;
}

const EditCell = ({ value, onSave, isText = false, isDate = false, isSelect = false, selectOptions = [] }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const hasSaved = useRef(false);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const handleStartEditing = () => {
    hasSaved.current = false;
    setIsEditing(true);
  };

  const handleSave = (val) => {
    if (hasSaved.current) return;
    hasSaved.current = true;
    setIsEditing(false);
    if (val !== value) {
      onSave(val);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 min-w-[150px]">
        {isSelect ? (
          <select
            autoFocus
            className="bg-[#1e293b] text-white px-2 py-1 rounded border border-white/20 w-full outline-none focus:border-cyan-500 transition-colors text-xs h-7"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSave(inputValue);
              }
              if (e.key === 'Escape') {
                setInputValue(value || '');
                setIsEditing(false);
              }
            }}
          >
            <option value="" disabled>Select Trust...</option>
            {selectOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <input
            autoFocus
            type={isDate ? "date" : "text"}
            className="bg-white/10 text-white px-2 py-1 rounded border border-white/20 w-full outline-none focus:border-cyan-500 transition-colors text-xs"
            value={isDate ? toISODate(inputValue) : inputValue}
            onChange={(e) => {
              const val = e.target.value;
              if (isDate) {
                setInputValue(toDisplayDate(val));
              } else {
                setInputValue(val);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSave(inputValue);
              }
              if (e.key === 'Escape') {
                setInputValue(value || '');
                setIsEditing(false);
              }
            }}
          />
        )}
        <button
          onClick={() => handleSave(inputValue)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1 rounded text-xs font-bold transition-colors shadow flex items-center justify-center shrink-0"
          title="Save"
        >
          ✓
        </button>
        <button
          onClick={() => {
            setInputValue(value || '');
            setIsEditing(false);
          }}
          className="bg-red-500 hover:bg-red-600 text-white px-2.5 py-1 rounded text-xs font-bold transition-colors shadow flex items-center justify-center shrink-0"
          title="Cancel"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div 
      onClick={handleStartEditing}
      className="cursor-pointer hover:bg-white/5 px-2 py-1 rounded transition-colors"
    >
      {isText ? (value || '—') : (value === null ? '—' : value.toLocaleString('en-IN'))}
    </div>
  );
};

const FormulaCell = ({ value }) => (
  <div className="px-2 py-1 text-emerald-400 font-mono text-xs opacity-80 flex items-center gap-1.5">
    <span className="text-[10px] bg-emerald-500/10 px-1 rounded">fx</span>
    {(value || 0).toLocaleString('en-IN')}
  </div>
);

export default function AdminPage() {
  const { 
    jain, hdfc, isDirty,
    isLoading, isSaving, isFirebaseConfigured,
    updateJainRow, updateJainRowText, 
    updateHdfcRow, updateHdfcRowText,
    updateHdfcRepayment, updateHdfcRepaymentText,
    addHdfcRepayment, deleteHdfcRepayment,
    updateJainRepayment, updateJainRepaymentText,
    addJainRepayment, deleteJainRepayment,
    saveToLocalStorage,
    resetAll 
  } = useData();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Invalid credentials');
    }
  };

  if (!isAuthenticated) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto mt-20 p-8 glass-card">
        <h2 className="text-2xl font-bold mb-6 text-center text-white">Admin Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-1">Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-cyan-500" 
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-cyan-500" 
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded font-bold hover:opacity-90 transition-opacity">
            Login
          </button>
        </form>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <SectionTitle 
            title="Admin Editor" 
            accent="#f43f5e"
          />
          <div>
            {isFirebaseConfigured ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ☁ Cloud Database Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/25 text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                ⚠ Running in Local Mode
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => saveToLocalStorage(jain, hdfc)}
            disabled={!isDirty || isSaving}
            className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
              isDirty && !isSaving
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 active:translate-y-0.5 cursor-pointer' 
                : 'bg-white/5 border border-white/5 text-white/30 cursor-not-allowed'
            }`}
          >
            {isSaving ? 'Saving...' : isDirty ? '● Save Changes' : 'Saved'}
          </button>
        </div>
      </div>

      {/* JAIN EDITOR */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-2">
          JAIN Trust Rows
        </h3>
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="loan-table">
              <thead>
                <tr>
                  <th>Trust Name</th>
                  <th>Disburse 2024</th>
                  <th>2024 Amt</th>
                  <th>Disburse 2025</th>
                  <th>2025 Amt</th>
                  <th style={{ color: '#34d399' }}>Total (fx)</th>
                  <th>Repay Start</th>
                  <th>Repay Amt</th>
                </tr>
              </thead>
              <tbody>
                {jain.rows.map((row, i) => (
                  <tr key={i}>
                    <td>
                      <EditCell isText value={row.trustName} onSave={v => updateJainRowText(i, 'trustName', v)} />
                    </td>
                    <td>
                      <EditCell isText isDate value={row.disbursDate2024} onSave={v => updateJainRowText(i, 'disbursDate2024', v)} />
                    </td>
                    <td>
                      <EditCell value={row.amount2024} onSave={v => updateJainRow(i, 'amount2024', v)} />
                    </td>
                    <td>
                      <EditCell isText isDate value={row.disbursDate2025} onSave={v => updateJainRowText(i, 'disbursDate2025', v)} />
                    </td>
                    <td>
                      <EditCell value={row.amount2025} onSave={v => updateJainRow(i, 'amount2025', v)} />
                    </td>
                    <td><FormulaCell value={row.total} /></td>
                    <td>
                      <EditCell isText isDate value={row.repaymentStart} onSave={v => updateJainRowText(i, 'repaymentStart', v)} />
                    </td>
                    <td>
                      <EditCell value={row.repaymentAmount} onSave={v => updateJainRow(i, 'repaymentAmount', v)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* HDFC EDITOR */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2">
          HDFC Tranche Rows
        </h3>
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="loan-table">
              <thead>
                <tr>
                  <th>Disbursement Date</th>
                  <th>Principle</th>
                  <th>Amount Now</th>
                  <th>Interest</th>
                  <th>Interest Paid</th>
                  <th>Interest Paid Till</th>
                  <th style={{ color: '#34d399' }}>Interest Left (fx)</th>
                </tr>
              </thead>
              <tbody>
                {hdfc.rows.map((row, i) => (
                  <tr key={i}>
                    <td>
                      <EditCell isText isDate value={row.paymentDate} onSave={v => updateHdfcRowText(i, 'paymentDate', v)} />
                    </td>
                    <td>
                      <EditCell value={row.principle} onSave={v => updateHdfcRow(i, 'principle', v)} />
                    </td>
                    <td>
                      <EditCell value={row.amountNow} onSave={v => updateHdfcRow(i, 'amountNow', v)} />
                    </td>
                    <td>
                      <EditCell value={row.interest} onSave={v => updateHdfcRow(i, 'interest', v)} />
                    </td>
                    <td>
                      <EditCell value={row.interestPaid} onSave={v => updateHdfcRow(i, 'interestPaid', v)} />
                    </td>
                    <td>
                      <EditCell isText isDate value={row.interestPaidTill} onSave={v => updateHdfcRowText(i, 'interestPaidTill', v)} />
                    </td>
                    <td><FormulaCell value={row.interestLeft} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* HDFC REPAYMENTS EDITOR */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2">
            HDFC Repayments
          </h3>
          <button
            onClick={() => {
              const todayStr = toDisplayDate(new Date().toISOString().split('T')[0]);
              addHdfcRepayment(todayStr, 0);
            }}
            className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-wider text-indigo-300 hover:bg-indigo-500/20 transition-all flex items-center gap-1.5"
          >
            + Add Repayment
          </button>
        </div>
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="loan-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {hdfc.repayments.map((row, i) => (
                  <tr key={i}>
                    <td>
                      <EditCell isText isDate value={row.date} onSave={v => updateHdfcRepaymentText(i, 'date', v)} />
                    </td>
                    <td>
                      <EditCell value={row.amount} onSave={v => updateHdfcRepayment(i, 'amount', v)} />
                    </td>
                    <td>
                      <div className="flex justify-center">
                        <button
                          onClick={() => deleteHdfcRepayment(i)}
                          className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                          title="Delete Repayment"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* JAIN REPAYMENTS EDITOR */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-2">
            JAIN Repayments
          </h3>
          <button
            onClick={() => {
              const firstTrust = jain.rows[0]?.trustName || 'Jain Jagruti';
              const todayStr = toDisplayDate(new Date().toISOString().split('T')[0]);
              addJainRepayment(firstTrust, todayStr, 0);
            }}
            className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-bold uppercase tracking-wider text-cyan-300 hover:bg-cyan-500/20 transition-all flex items-center gap-1.5"
          >
            + Add JAIN Repayment
          </button>
        </div>
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="loan-table">
              <thead>
                <tr>
                  <th>Trust Name</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(jain.repayments || []).map((row, i) => (
                  <tr key={i}>
                    <td>
                      <EditCell 
                        isText 
                        isSelect 
                        selectOptions={jain.rows.map(r => r.trustName)} 
                        value={row.trustName} 
                        onSave={v => updateJainRepaymentText(i, 'trustName', v)} 
                      />
                    </td>
                    <td>
                      <EditCell isText isDate value={row.date} onSave={v => updateJainRepaymentText(i, 'date', v)} />
                    </td>
                    <td>
                      <EditCell value={row.amount} onSave={v => updateJainRepayment(i, 'amount', v)} />
                    </td>
                    <td>
                      <div className="flex justify-center">
                        <button
                          onClick={() => deleteJainRepayment(i)}
                          className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                          title="Delete Repayment"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!jain.repayments || jain.repayments.length === 0) && (
                  <tr>
                    <td colSpan="4" className="text-center text-white/40 py-6 text-xs italic">
                      No JAIN repayments logged. Click "+ Add JAIN Repayment" to log one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Help note */}
      <div 
        className="rounded-xl p-5 text-sm space-y-1"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <p className="font-semibold text-white mb-2">How editing works</p>
        <p style={{ color: 'rgba(255,255,255,0.55)' }}>• Click any white value to edit it inline. Select a date using the calendar picker, and click the green check (✓) to save, or red cross (✕) to cancel.</p>
        <p style={{ color: 'rgba(255,255,255,0.55)' }}>• <span style={{ color: '#34d399' }}>Green fx cells</span> are recalculated automatically — they mirror the Excel formulas.</p>
        <p style={{ color: 'rgba(255,255,255,0.55)' }}>• Click the green **Save Changes** button at the top to save edits to browser storage (`localStorage`). To persist permanently in code, update <code style={{ color: '#06b6d4', background: 'rgba(6,182,212,0.1)', padding: '1px 4px', borderRadius: 4 }}>src/data/loanData.js</code>.</p>
      </div>
    </motion.div>
  );
}
