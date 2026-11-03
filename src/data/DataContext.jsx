import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import { jainData as initialJain, hdfcData as initialHdfc, staffingData as initialStaffing } from './loanData';

// Deep clone initial data
const cloneJain = () => {
  const filteredRows = initialJain.rows.filter(r => !r.trustName.includes('USA') && !r.trustName.includes('5000'));
  const cloned = {
    ...initialJain,
    rows: filteredRows.map(r => ({ ...r })),
    usaRows: (initialJain.usaRows || []).map(r => ({ ...r })),
    repayments: (initialJain.repayments || []).map(r => ({ ...r })),
    usaRepayments: (initialJain.usaRepayments || []).map(r => ({ ...r })),
    totals: { ...initialJain.totals },
    usaTotals: { ...(initialJain.usaTotals || {}) },
  };
  cloned.totals = recalcJain(cloned.rows, cloned.repayments);
  cloned.usaTotals = recalcUsa(cloned.usaRows, cloned.usaRepayments);
  return cloned;
};

const cloneHdfc = () => {
  const tableTotals = recalcHdfcTable(initialHdfc.rows);
  const outstandingAmount = initialHdfc.outstandingAmount ?? (initialHdfc.totals?.amountNow ?? 1122092);
  return {
    ...initialHdfc,
    rows: initialHdfc.rows.map(r => ({ ...r })),
    repayments: initialHdfc.repayments.map(r => ({ ...r })),
    outstandingAmount,
    tableTotals,
    totals: { 
      ...initialHdfc.totals, 
      amountNow: outstandingAmount 
    },
    summary: { 
      ...initialHdfc.summary,
      repayment: initialHdfc.summary?.repayment || 1250000,
    },
  };
};

const cloneStaffing = () => {
  const cloned = {
    ...initialStaffing,
    rows: initialStaffing.rows.map(r => ({ ...r })),
    repayments: (initialStaffing.repayments || []).map(r => ({ ...r })),
    totals: { ...initialStaffing.totals },
  };
  cloned.totals = recalcStaffing(cloned.rows, cloned.repayments);
  return cloned;
};

// Signatures of static initial data in loanData.js to clear stale local storage cache if source code changes
const JAIN_SIGNATURE = "v7_purge_usa_permanently_" + JSON.stringify({
  rows: initialJain.rows.filter(r => !r.trustName.includes('USA') && !r.trustName.includes('5000')).map(r => ({ 
    trustName: r.trustName, 
    repaymentStart: r.repaymentStart,
    repaymentAmount: r.repaymentAmount,
    amount2024: r.amount2024,
    amount2025: r.amount2025
  })),
  usaRows: (initialJain.usaRows || []).map(r => ({
    trustName: r.trustName,
    amount2024: r.amount2024,
    amount2025: r.amount2025
  })),
  repayments: (initialJain.repayments || []).map(r => ({
    trustName: r.trustName,
    date: r.date,
    amount: r.amount
  }))
});

const HDFC_SIGNATURE = JSON.stringify({
  rows: initialHdfc.rows.map(r => ({
    paymentDate: r.paymentDate,
    principle: r.principle,
    amountNow: r.amountNow
  })),
  repayments: initialHdfc.repayments.map(r => ({
    date: r.date,
    amount: r.amount
  }))
});

const STAFFING_SIGNATURE = "v2_staffing_repaid_1500_" + JSON.stringify({
  rows: initialStaffing.rows,
  repayments: initialStaffing.repayments
});


const loadJain = () => {
  try {
    const savedSignature = localStorage.getItem('loanData_jain_signature');
    if (savedSignature !== JAIN_SIGNATURE) {
      localStorage.removeItem('loanData_jain');
      localStorage.setItem('loanData_jain_signature', JAIN_SIGNATURE);
      return cloneJain();
    }
    const saved = localStorage.getItem('loanData_jain');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.headers) {
        data.headers = data.headers.map(h => h.replace(/\s*\(₹\)/g, ''));
      }
      if (!data.repayments) {
        data.repayments = [];
      }
      if (!data.usaRepayments) {
        data.usaRepayments = [];
      }
      // Ensure SMJV USA is not present in India rows
      data.rows = (data.rows || []).filter(r => !r.trustName.includes('USA') && !r.trustName.includes('5000'));
      if (!data.usaRows) {
        data.usaRows = (initialJain.usaRows || []).map(r => ({ ...r }));
      }
      // Keep totals in sync with actual rows and repayments array
      data.totals = recalcJain(data.rows, data.repayments);
      data.usaTotals = recalcUsa(data.usaRows, data.usaRepayments);
      return data;
    }
  } catch (e) {}
  try {
    localStorage.setItem('loanData_jain_signature', JAIN_SIGNATURE);
  } catch (e) {}
  return cloneJain();
};

const loadHdfc = () => {
  try {
    const savedSignature = localStorage.getItem('loanData_hdfc_signature');
    if (savedSignature !== HDFC_SIGNATURE) {
      localStorage.removeItem('loanData_hdfc');
      localStorage.setItem('loanData_hdfc_signature', HDFC_SIGNATURE);
      return cloneHdfc();
    }
    const saved = localStorage.getItem('loanData_hdfc');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.headers) {
        data.headers = data.headers.map(h => {
          const cleaned = h.replace(/\s*\(₹\)/g, '');
          if (cleaned === 'Interest Paid') return 'Autopay';
          if (cleaned === 'Payment Date') return 'Disbursement Date';
          return cleaned;
        });
      }
      const outstandingAmount = data.outstandingAmount !== undefined 
        ? data.outstandingAmount 
        : (data.totals?.amountNow ?? 1122092);
      data.outstandingAmount = outstandingAmount;
      if (!data.totals) data.totals = {};
      data.totals.amountNow = outstandingAmount;
      data.tableTotals = recalcHdfcTable(data.rows || []);
      return data;
    }
  } catch (e) {}
  try {
    localStorage.setItem('loanData_hdfc_signature', HDFC_SIGNATURE);
  } catch (e) {}
  return cloneHdfc();
};

// Recalculate Staffing totals
function recalcStaffing(rows = [], repayments = []) {
  const total = rows.reduce((s, r) => s + (r.amount || 0), 0);
  const totalRepayments = repayments.reduce((s, r) => s + (r.amount || 0), 0);
  const remainingLiability = total - totalRepayments;

  return {
    total,
    totalRepayments,
    remainingLiability,
  };
}

const loadStaffing = () => {
  try {
    const savedSignature = localStorage.getItem('loanData_staffing_signature');
    if (savedSignature !== STAFFING_SIGNATURE) {
      localStorage.removeItem('loanData_staffing');
      localStorage.setItem('loanData_staffing_signature', STAFFING_SIGNATURE);
      return cloneStaffing();
    }
    const saved = localStorage.getItem('loanData_staffing');
    if (saved) {
      const data = JSON.parse(saved);
      if (!data.repayments) data.repayments = [];
      if (!data.rows) data.rows = (initialStaffing.rows || []).map(r => ({ ...r }));
      data.totals = recalcStaffing(data.rows, data.repayments);
      return data;
    }
  } catch (e) {}
  try {
    localStorage.setItem('loanData_staffing_signature', STAFFING_SIGNATURE);
  } catch (e) {}
  return cloneStaffing();
};

// Recalculate Jain totals from rows (mirrors Excel formulas)
function recalcJain(rows, repayments = []) {
  const amount2024 = rows.reduce((s, r) => s + (r.amount2024 || 0), 0);
  const amount2025 = rows.reduce((s, r) => s + (r.amount2025 || 0), 0);
  const repaymentAmount = rows.reduce((s, r) => s + (r.repaymentAmount || 0), 0);
  const total = amount2024 + amount2025;
  const totalRepayments = repayments.reduce((s, r) => s + (r.amount || 0), 0);
  const remainingLiability = total - totalRepayments;

  return {
    amount2024,
    amount2025,
    total,
    repaymentAmount,
    totalRepayments,
    remainingLiability,
  };
}

// Recalculate USA totals
function recalcUsa(usaRows = [], usaRepayments = []) {
  const amount2024 = usaRows.reduce((s, r) => s + (r.amount2024 || 0), 0);
  const amount2025 = usaRows.reduce((s, r) => s + (r.amount2025 || 0), 0);
  const repaymentAmount = usaRows.reduce((s, r) => s + (r.repaymentAmount || 0), 0);
  const total = amount2024 + amount2025;
  const totalRepayments = usaRepayments.reduce((s, r) => s + (r.amount || 0), 0);
  const remainingLiability = total - totalRepayments;

  return {
    amount2024,
    amount2025,
    total,
    repaymentAmount,
    totalRepayments,
    remainingLiability,
  };
}

// Calculate table-only totals from rows
function recalcHdfcTable(rows = []) {
  const principle = rows.reduce((s, r) => s + (r.principle || 0), 0);
  const amountNow = rows.reduce((s, r) => s + (r.amountNow || 0), 0);
  const interest = rows.reduce((s, r) => s + (r.interest || 0), 0);
  const interestPaid = rows.reduce((s, r) => s + (r.interestPaid || 0), 0);
  const interestLeft = rows.reduce((s, r) => s + (r.interestLeft || 0), 0); // G = D - E per row
  return { principle, amountNow, interest, interestPaid, interestLeft };
}

// Recalculate HDFC totals + summary. The main amountNow is decoupled from table rows!
function recalcHdfc(rows, repayments, customOutstandingAmount) {
  const table = recalcHdfcTable(rows);
  const repayment = repayments.reduce((s, r) => s + r.amount, 0);
  const totalPrincipal = 2150000; // Fixed as per Excel summary logic
  const totalInterest = rows.reduce((s, r) => s + (r.interest || 0), 0);

  // The main outstanding amount is decoupled from table rows
  const amountNow = customOutstandingAmount !== undefined ? customOutstandingAmount : 1122092;

  return {
    tableTotals: table,
    totals: { 
      principle: table.principle, 
      amountNow, 
      interest: table.interest, 
      interestPaid: table.interestPaid, 
      interestLeft: table.interestLeft 
    },
    summary: {
      principleAndInterestLeft: table.principle + table.interestLeft,
      repayment: repayment || 1250000,
      totalPrincipal,
      totalAmount: amountNow + (repayment || 1250000),
      totalInterest,
    },
  };
}

function recalcJainRows(rows) {
  return rows.map(r => ({
    ...r,
    total: (r.amount2024 || 0) + (r.amount2025 || 0), // F = C + E per row
  }));
}

function recalcHdfcRows(rows) {
  return rows.map(r => ({
    ...r,
    interestLeft: (r.interest || 0) - (r.interestPaid || 0), // G = D - E
  }));
}

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [jain, setJain] = useState(loadJain);
  const [hdfc, setHdfc] = useState(loadHdfc);
  const [staffing, setStaffing] = useState(loadStaffing);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch initial data from Firestore if configured
  useEffect(() => {
    async function initData() {
      if (!isFirebaseConfigured || !db) {
        setIsLoading(false);
        return;
      }
      try {
        const jainRef = doc(db, 'loans', 'jain');
        const hdfcRef = doc(db, 'loans', 'hdfc');
        const staffingRef = doc(db, 'loans', 'staffing');

        const [jainSnap, hdfcSnap, staffingSnap] = await Promise.all([
          getDoc(jainRef),
          getDoc(hdfcRef),
          getDoc(staffingRef),
        ]);

        let loadedJain = null;
        let loadedHdfc = null;
        let loadedStaffing = null;

        if (jainSnap.exists()) {
          loadedJain = jainSnap.data();
          const hadUsa = (loadedJain.rows || []).some(r => r.trustName.includes('USA') || r.trustName.includes('5000'));
          // Filter out any USA rows from India rows array
          if (loadedJain.rows) {
            loadedJain.rows = loadedJain.rows.filter(r => !r.trustName.includes('USA') && !r.trustName.includes('5000'));
          }
          // Ensure structure and recalculate
          if (!loadedJain.repayments) loadedJain.repayments = [];
          if (!loadedJain.usaRepayments) loadedJain.usaRepayments = [];
          if (!loadedJain.usaRows) loadedJain.usaRows = (initialJain.usaRows || []).map(r => ({ ...r }));
          loadedJain.totals = recalcJain(loadedJain.rows, loadedJain.repayments);
          loadedJain.usaTotals = recalcUsa(loadedJain.usaRows, loadedJain.usaRepayments);
          if (hadUsa) {
            await setDoc(jainRef, loadedJain);
          }
          setJain(loadedJain);
        } else {
          // Initialize in database on first run
          await setDoc(jainRef, jain);
        }

        if (hdfcSnap.exists()) {
          loadedHdfc = hdfcSnap.data();
          if (!loadedHdfc.repayments) loadedHdfc.repayments = [];
          const currentOutstanding = loadedHdfc.outstandingAmount !== undefined 
            ? loadedHdfc.outstandingAmount 
            : (loadedHdfc.totals?.amountNow ?? 1122092);
          loadedHdfc.outstandingAmount = currentOutstanding;

          const { totals, summary, tableTotals } = recalcHdfc(loadedHdfc.rows, loadedHdfc.repayments, currentOutstanding);
          loadedHdfc.tableTotals = tableTotals;
          loadedHdfc.totals = totals;
          loadedHdfc.summary = summary;
          setHdfc(loadedHdfc);
        } else {
          // Initialize in database on first run
          await setDoc(hdfcRef, hdfc);
        }

        if (staffingSnap.exists()) {
          loadedStaffing = staffingSnap.data();
          if (!loadedStaffing.repayments || loadedStaffing.repayments.length === 0) {
            loadedStaffing.repayments = (initialStaffing.repayments || []).map(r => ({ ...r }));
            await setDoc(staffingRef, loadedStaffing);
          }
          if (!loadedStaffing.rows) loadedStaffing.rows = (initialStaffing.rows || []).map(r => ({ ...r }));
          loadedStaffing.totals = recalcStaffing(loadedStaffing.rows, loadedStaffing.repayments);
          setStaffing(loadedStaffing);
        } else {
          await setDoc(staffingRef, staffing);
        }
      } catch (err) {
        console.error('Error connecting to Firebase Firestore, falling back to local cache:', err);
      } finally {
        setIsLoading(false);
      }
    }
    initData();
  }, []);

  const saveToLocalStorage = useCallback(async (currentJain, currentHdfc, currentStaffing) => {
    setIsSaving(true);
    try {
      const sanitizedJain = {
        ...currentJain,
        rows: (currentJain.rows || []).filter(r => !r.trustName.includes('USA') && !r.trustName.includes('5000'))
      };
      const activeHdfc = currentHdfc || hdfc;
      const activeStaffing = currentStaffing || staffing;
      if (isFirebaseConfigured && db) {
        const jainRef = doc(db, 'loans', 'jain');
        const hdfcRef = doc(db, 'loans', 'hdfc');
        const staffingRef = doc(db, 'loans', 'staffing');
        await Promise.all([
          setDoc(jainRef, sanitizedJain),
          setDoc(hdfcRef, activeHdfc),
          setDoc(staffingRef, activeStaffing)
        ]);
      }
      // Always save to localStorage as a fast local cache & backup
      localStorage.setItem('loanData_jain', JSON.stringify(sanitizedJain));
      localStorage.setItem('loanData_hdfc', JSON.stringify(activeHdfc));
      localStorage.setItem('loanData_staffing', JSON.stringify(activeStaffing));
      setJain(sanitizedJain);
      setHdfc(activeHdfc);
      setStaffing(activeStaffing);
      setIsDirty(false);
    } catch (err) {
      console.error('Error saving data:', err);
      alert('Failed to save to cloud database. Please verify your connection/rules.');
    } finally {
      setIsSaving(false);
    }
  }, [staffing]);

  const updateJainRow = useCallback((rowIndex, field, rawValue) => {
    const value = rawValue === '' || rawValue == null ? null : Number(rawValue);
    setJain(prev => {
      const rows = prev.rows.map((r, i) => i === rowIndex ? { ...r, [field]: value } : r);
      const recalculated = recalcJainRows(rows);
      return { ...prev, rows: recalculated, totals: recalcJain(recalculated, prev.repayments) };
    });
    setIsDirty(true);
  }, []);

  const updateJainRowText = useCallback((rowIndex, field, value) => {
    setJain(prev => {
      const rows = prev.rows.map((r, i) => i === rowIndex ? { ...r, [field]: value } : r);
      return { ...prev, rows };
    });
    setIsDirty(true);
  }, []);

  const updateUsaRow = useCallback((rowIndex, field, rawValue) => {
    const value = rawValue === '' || rawValue == null ? null : Number(rawValue);
    setJain(prev => {
      const usaRows = (prev.usaRows || []).map((r, i) => i === rowIndex ? { ...r, [field]: value } : r);
      const recalculated = recalcJainRows(usaRows);
      return { ...prev, usaRows: recalculated, usaTotals: recalcUsa(recalculated, prev.usaRepayments || []) };
    });
    setIsDirty(true);
  }, []);

  const updateUsaRowText = useCallback((rowIndex, field, value) => {
    setJain(prev => {
      const usaRows = (prev.usaRows || []).map((r, i) => i === rowIndex ? { ...r, [field]: value } : r);
      return { ...prev, usaRows };
    });
    setIsDirty(true);
  }, []);

  const updateJainRepayment = useCallback((rowIndex, field, rawValue) => {
    const value = rawValue === '' || rawValue == null ? 0 : Number(rawValue);
    setJain(prev => {
      const repayments = prev.repayments.map((r, i) => i === rowIndex ? { ...r, [field]: value } : r);
      return { ...prev, repayments, totals: recalcJain(prev.rows, repayments) };
    });
    setIsDirty(true);
  }, []);

  const updateJainRepaymentText = useCallback((rowIndex, field, value) => {
    setJain(prev => {
      const repayments = prev.repayments.map((r, i) => i === rowIndex ? { ...r, [field]: value } : r);
      return { ...prev, repayments };
    });
    setIsDirty(true);
  }, []);

  const addJainRepayment = useCallback((trustName, date, amount) => {
    setJain(prev => {
      const repayments = [...prev.repayments, { trustName, date, amount: Number(amount) || 0 }];
      return { ...prev, repayments, totals: recalcJain(prev.rows, repayments) };
    });
    setIsDirty(true);
  }, []);

  const deleteJainRepayment = useCallback((rowIndex) => {
    setJain(prev => {
      const repayments = prev.repayments.filter((_, i) => i !== rowIndex);
      return { ...prev, repayments, totals: recalcJain(prev.rows, repayments) };
    });
    setIsDirty(true);
  }, []);

  const updateUsaRepayment = useCallback((rowIndex, field, rawValue) => {
    const value = rawValue === '' || rawValue == null ? 0 : Number(rawValue);
    setJain(prev => {
      const usaRepayments = (prev.usaRepayments || []).map((r, i) => i === rowIndex ? { ...r, [field]: value } : r);
      return { ...prev, usaRepayments, usaTotals: recalcUsa(prev.usaRows, usaRepayments) };
    });
    setIsDirty(true);
  }, []);

  const updateUsaRepaymentText = useCallback((rowIndex, field, value) => {
    setJain(prev => {
      const usaRepayments = (prev.usaRepayments || []).map((r, i) => i === rowIndex ? { ...r, [field]: value } : r);
      return { ...prev, usaRepayments };
    });
    setIsDirty(true);
  }, []);

  const addUsaRepayment = useCallback((trustName, date, amount) => {
    setJain(prev => {
      const usaRepayments = [...(prev.usaRepayments || []), { trustName, date, amount: Number(amount) || 0 }];
      return { ...prev, usaRepayments, usaTotals: recalcUsa(prev.usaRows, usaRepayments) };
    });
    setIsDirty(true);
  }, []);

  const deleteUsaRepayment = useCallback((rowIndex) => {
    setJain(prev => {
      const usaRepayments = (prev.usaRepayments || []).filter((_, i) => i !== rowIndex);
      return { ...prev, usaRepayments, usaTotals: recalcUsa(prev.usaRows, usaRepayments) };
    });
    setIsDirty(true);
  }, []);

  const updateHdfcRow = useCallback((rowIndex, field, rawValue) => {
    const value = rawValue === '' || rawValue == null ? 0 : Number(rawValue);
    setHdfc(prev => {
      const rows = prev.rows.map((r, i) => i === rowIndex ? { ...r, [field]: value } : r);
      const recalculated = recalcHdfcRows(rows);
      const currentOutstanding = prev.outstandingAmount !== undefined ? prev.outstandingAmount : (prev.totals?.amountNow ?? 1122092);
      const { totals, summary, tableTotals } = recalcHdfc(recalculated, prev.repayments, currentOutstanding);
      return { ...prev, rows: recalculated, tableTotals, totals, summary, outstandingAmount: currentOutstanding };
    });
    setIsDirty(true);
  }, []);

  const updateHdfcRowText = useCallback((rowIndex, field, value) => {
    setHdfc(prev => {
      const rows = prev.rows.map((r, i) => i === rowIndex ? { ...r, [field]: value } : r);
      return { ...prev, rows };
    });
    setIsDirty(true);
  }, []);

  const updateHdfcRepayment = useCallback((rowIndex, field, rawValue) => {
    const value = rawValue === '' || rawValue == null ? 0 : Number(rawValue);
    setHdfc(prev => {
      const oldAmount = prev.repayments[rowIndex]?.amount || 0;
      const repayments = prev.repayments.map((r, i) => i === rowIndex ? { ...r, [field]: value } : r);
      let currentOutstanding = prev.outstandingAmount !== undefined ? prev.outstandingAmount : (prev.totals?.amountNow ?? 1122092);
      
      // Auto-adjust outstanding when repayment amount is edited
      if (field === 'amount') {
        const delta = value - oldAmount;
        currentOutstanding = Math.max(0, currentOutstanding - delta);
      }

      const { totals, summary, tableTotals } = recalcHdfc(prev.rows, repayments, currentOutstanding);
      return { ...prev, repayments, tableTotals, totals, summary, outstandingAmount: currentOutstanding };
    });
    setIsDirty(true);
  }, []);

  const updateHdfcRepaymentText = useCallback((rowIndex, field, value) => {
    setHdfc(prev => {
      const repayments = prev.repayments.map((r, i) => i === rowIndex ? { ...r, [field]: value } : r);
      return { ...prev, repayments };
    });
    setIsDirty(true);
  }, []);

  const addHdfcRepayment = useCallback((date, amount) => {
    const paymentAmount = Number(amount) || 0;
    setHdfc(prev => {
      const repayments = [...prev.repayments, { date, amount: paymentAmount }];
      const currentOutstanding = prev.outstandingAmount !== undefined ? prev.outstandingAmount : (prev.totals?.amountNow ?? 1122092);
      // Auto-decrease outstanding by the payment amount
      const nextOutstanding = Math.max(0, currentOutstanding - paymentAmount);
      const { totals, summary, tableTotals } = recalcHdfc(prev.rows, repayments, nextOutstanding);
      return { ...prev, repayments, tableTotals, totals, summary, outstandingAmount: nextOutstanding };
    });
    setIsDirty(true);
  }, []);

  const deleteHdfcRepayment = useCallback((rowIndex) => {
    setHdfc(prev => {
      const deletedAmount = prev.repayments[rowIndex]?.amount || 0;
      const repayments = prev.repayments.filter((_, i) => i !== rowIndex);
      const currentOutstanding = prev.outstandingAmount !== undefined ? prev.outstandingAmount : (prev.totals?.amountNow ?? 1122092);
      // Restore outstanding when a repayment is deleted
      const nextOutstanding = currentOutstanding + deletedAmount;
      const { totals, summary, tableTotals } = recalcHdfc(prev.rows, repayments, nextOutstanding);
      return { ...prev, repayments, tableTotals, totals, summary, outstandingAmount: nextOutstanding };
    });
    setIsDirty(true);
  }, []);

  const recordHdfcPayment = useCallback(async (date, amount) => {
    const paymentAmount = Number(amount) || 0;
    let nextHdfc = null;
    setHdfc(prev => {
      const repayments = [...prev.repayments, { date, amount: paymentAmount }];
      const currentOutstanding = prev.outstandingAmount !== undefined ? prev.outstandingAmount : (prev.totals?.amountNow ?? 1122092);
      const nextOutstanding = Math.max(0, currentOutstanding - paymentAmount);
      const { totals, summary, tableTotals } = recalcHdfc(prev.rows, repayments, nextOutstanding);
      nextHdfc = { ...prev, repayments, tableTotals, totals, summary, outstandingAmount: nextOutstanding };
      return nextHdfc;
    });

    if (nextHdfc) {
      try {
        localStorage.setItem('loanData_hdfc', JSON.stringify(nextHdfc));
        if (isFirebaseConfigured && db) {
          const hdfcRef = doc(db, 'loans', 'hdfc');
          await setDoc(hdfcRef, nextHdfc);
        }
        setIsDirty(false);
      } catch (err) {
        console.error('Error saving HDFC payment:', err);
      }
    }
  }, []);

  const deleteHdfcRepaymentDirectly = useCallback(async (rowIndex) => {
    let nextHdfc = null;
    setHdfc(prev => {
      const deletedAmount = prev.repayments[rowIndex]?.amount || 0;
      const repayments = prev.repayments.filter((_, i) => i !== rowIndex);
      const currentOutstanding = prev.outstandingAmount !== undefined ? prev.outstandingAmount : (prev.totals?.amountNow ?? 1122092);
      const nextOutstanding = currentOutstanding + deletedAmount;
      const { totals, summary, tableTotals } = recalcHdfc(prev.rows, repayments, nextOutstanding);
      nextHdfc = { ...prev, repayments, tableTotals, totals, summary, outstandingAmount: nextOutstanding };
      return nextHdfc;
    });

    if (nextHdfc) {
      try {
        localStorage.setItem('loanData_hdfc', JSON.stringify(nextHdfc));
        if (isFirebaseConfigured && db) {
          const hdfcRef = doc(db, 'loans', 'hdfc');
          await setDoc(hdfcRef, nextHdfc);
        }
        setIsDirty(false);
      } catch (err) {
        console.error('Error deleting HDFC payment:', err);
      }
    }
  }, []);

  const updateHdfcOutstandingAmount = useCallback((rawValue) => {
    const val = rawValue === '' || rawValue == null ? 0 : Number(rawValue);
    setHdfc(prev => {
      const updatedTotals = { ...prev.totals, amountNow: val };
      const updatedSummary = {
        ...prev.summary,
        totalAmount: val + (prev.summary?.repayment || 0),
      };
      return {
        ...prev,
        outstandingAmount: val,
        totals: updatedTotals,
        summary: updatedSummary,
      };
    });
    setIsDirty(true);
  }, []);

  const saveHdfcOutstandingAmount = useCallback(async (rawValue) => {
    const val = rawValue === '' || rawValue == null ? 0 : Number(rawValue);
    let nextHdfc = null;
    setHdfc(prev => {
      const updatedTotals = { ...prev.totals, amountNow: val };
      const updatedSummary = {
        ...prev.summary,
        totalAmount: val + (prev.summary?.repayment || 0),
      };
      nextHdfc = {
        ...prev,
        outstandingAmount: val,
        totals: updatedTotals,
        summary: updatedSummary,
      };
      return nextHdfc;
    });

    if (nextHdfc) {
      try {
        localStorage.setItem('loanData_hdfc', JSON.stringify(nextHdfc));
        if (isFirebaseConfigured && db) {
          const hdfcRef = doc(db, 'loans', 'hdfc');
          await setDoc(hdfcRef, nextHdfc);
        }
        setIsDirty(false);
      } catch (err) {
        console.error('Error saving HDFC outstanding amount:', err);
      }
    }
  }, []);

  const updateStaffingRow = useCallback((rowIndex, field, rawValue) => {
    const value = rawValue === '' || rawValue == null ? 0 : Number(rawValue);
    setStaffing(prev => {
      const rows = prev.rows.map((r, i) => i === rowIndex ? { ...r, [field]: value } : r);
      return { ...prev, rows, totals: recalcStaffing(rows, prev.repayments) };
    });
    setIsDirty(true);
  }, []);

  const updateStaffingRowText = useCallback((rowIndex, field, value) => {
    setStaffing(prev => {
      const rows = prev.rows.map((r, i) => i === rowIndex ? { ...r, [field]: value } : r);
      return { ...prev, rows };
    });
    setIsDirty(true);
  }, []);

  const updateStaffingRepayment = useCallback((rowIndex, field, rawValue) => {
    const value = rawValue === '' || rawValue == null ? 0 : Number(rawValue);
    setStaffing(prev => {
      const repayments = (prev.repayments || []).map((r, i) => i === rowIndex ? { ...r, [field]: value } : r);
      return { ...prev, repayments, totals: recalcStaffing(prev.rows, repayments) };
    });
    setIsDirty(true);
  }, []);

  const updateStaffingRepaymentText = useCallback((rowIndex, field, value) => {
    setStaffing(prev => {
      const repayments = (prev.repayments || []).map((r, i) => i === rowIndex ? { ...r, [field]: value } : r);
      return { ...prev, repayments };
    });
    setIsDirty(true);
  }, []);

  const addStaffingRepayment = useCallback((payment, date, amount) => {
    setStaffing(prev => {
      const repayments = [...(prev.repayments || []), { payment, date, amount: Number(amount) || 0 }];
      return { ...prev, repayments, totals: recalcStaffing(prev.rows, repayments) };
    });
    setIsDirty(true);
  }, []);

  const deleteStaffingRepayment = useCallback((rowIndex) => {
    setStaffing(prev => {
      const repayments = (prev.repayments || []).filter((_, i) => i !== rowIndex);
      return { ...prev, repayments, totals: recalcStaffing(prev.rows, repayments) };
    });
    setIsDirty(true);
  }, []);

  const resetAll = useCallback(async () => {
    if (!window.confirm("Are you sure you want to reset all data back to the initial Excel data? This will overwrite the cloud database and your local cache.")) {
      return;
    }
    setIsSaving(true);
    try {
      const initialJ = cloneJain();
      const initialH = cloneHdfc();
      const initialS = cloneStaffing();
      setJain(initialJ);
      setHdfc(initialH);
      setStaffing(initialS);

      if (isFirebaseConfigured && db) {
        const jainRef = doc(db, 'loans', 'jain');
        const hdfcRef = doc(db, 'loans', 'hdfc');
        const staffingRef = doc(db, 'loans', 'staffing');
        await Promise.all([
          setDoc(jainRef, initialJ),
          setDoc(hdfcRef, initialH),
          setDoc(staffingRef, initialS)
        ]);
      }
      localStorage.removeItem('loanData_jain');
      localStorage.removeItem('loanData_hdfc');
      localStorage.removeItem('loanData_staffing');
      setIsDirty(false);
    } catch (err) {
      console.error('Error resetting data:', err);
      alert('Failed to reset cloud database. Please verify your connection.');
    } finally {
      setIsSaving(false);
    }
  }, []);

  const usaLiabilityUSD = jain.usaTotals?.remainingLiability || 0;
  const staffingLiabilityUSD = staffing.totals?.remainingLiability || 0;
  const usaLiabilityINR = usaLiabilityUSD * 95;
  const staffingLiabilityINR = staffingLiabilityUSD * 95;

  const usaTotalUSD = jain.usaTotals?.total || 5000;
  const staffingTotalUSD = staffing.totals?.total || 9360;
  const usaTotalINR = usaTotalUSD * 95;
  const staffingTotalINR = staffingTotalUSD * 95;
  const hdfcOutstanding = hdfc.outstandingAmount !== undefined ? hdfc.outstandingAmount : (hdfc.totals?.amountNow ?? 1122092);
  const indiaPrincipalTotal = jain.totals.total + hdfc.summary.totalPrincipal;
  const grandTotalLoan = indiaPrincipalTotal + usaTotalINR + staffingTotalINR;

  const totalOutstandingINR = jain.totals.remainingLiability + hdfcOutstanding + usaLiabilityINR + staffingLiabilityINR;
  const totalRepaidINR = Math.max(0, grandTotalLoan - totalOutstandingINR);
  const repaidPercentage = grandTotalLoan > 0 ? (totalRepaidINR / grandTotalLoan) * 100 : 0;
  const remainingPercentage = grandTotalLoan > 0 ? (totalOutstandingINR / grandTotalLoan) * 100 : 0;

  const summaryData = {
    // Total original loans
    totalCombinedLoan: indiaPrincipalTotal, // ₹47,00,000 (India loans)
    indiaPrincipalTotal,
    grandTotalLoan, // ₹60,64,200 (Total Principal + Staffing @ 95 + USA Loan @ 95)
    usaTotal: usaTotalUSD,
    usaTotalUSD,
    usaTotalINR,
    staffingTotal: staffingTotalUSD,
    staffingTotalUSD,
    staffingTotalINR,
    jainTotal: jain.totals.total,
    hdfcTotal: hdfc.summary.totalPrincipal,

    // Outstanding / Remaining
    totalRemainingLiability: totalOutstandingINR, // Total loan left
    totalLoanLeft: totalOutstandingINR,
    jainRemainingLiability: jain.totals.remainingLiability,
    usaRemainingLiability: usaLiabilityUSD,
    usaRemainingLiabilityINR: usaLiabilityINR,
    hdfcTotalPrincipal: hdfc.summary.totalPrincipal,
    hdfcInterestLeft: hdfc.totals.interestLeft,
    hdfcAmountNow: hdfcOutstanding,
    staffingRemainingLiability: staffingLiabilityUSD,
    staffingRemainingLiabilityINR: staffingLiabilityINR,

    // Repaid & Progress
    totalRepaidINR,
    repaidPercentage,
    remainingPercentage,
    staffingRepayments: staffing.totals?.totalRepayments || 0,
    staffingRepaymentsINR: (staffing.totals?.totalRepayments || 0) * 95,
    hdfcRepayments: hdfc.summary.repayment || 1250000,
    jainRepayments: jain.totals.totalRepayments || 0,
    usaRepayments: (jain.usaTotals?.totalRepayments || 0) * 95,

    // Loan counts
    jainActiveLoans: jain.rows.length,
    usaActiveLoans: (jain.usaRows || []).length,
    hdfcActiveLoans: hdfc.rows.filter(r => r.amountNow > 0).length,
    staffingActiveLoans: (staffing.rows || []).length,
  };

  return (
    <DataContext.Provider value={{ 
      jain, hdfc, staffing, summaryData, isDirty,
      isLoading, isSaving, isFirebaseConfigured,
      updateJainRow, updateJainRowText,
      updateUsaRow, updateUsaRowText,
      updateHdfcRow, updateHdfcRowText,
      updateHdfcOutstandingAmount, saveHdfcOutstandingAmount,
      updateHdfcRepayment, updateHdfcRepaymentText,
      addHdfcRepayment, deleteHdfcRepayment,
      recordHdfcPayment, deleteHdfcRepaymentDirectly,
      updateJainRepayment, updateJainRepaymentText,
      addJainRepayment, deleteJainRepayment,
      updateUsaRepayment, updateUsaRepaymentText,
      addUsaRepayment, deleteUsaRepayment,
      updateStaffingRow, updateStaffingRowText,
      updateStaffingRepayment, updateStaffingRepaymentText,
      addStaffingRepayment, deleteStaffingRepayment,
      saveToLocalStorage,
      resetAll 
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);

