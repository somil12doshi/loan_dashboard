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

const cloneHdfc = () => ({
  ...initialHdfc,
  rows: initialHdfc.rows.map(r => ({ ...r })),
  repayments: initialHdfc.repayments.map(r => ({ ...r })),
  totals: { ...initialHdfc.totals },
  summary: { ...initialHdfc.summary },
});

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

// Recalculate HDFC totals + summary from rows (mirrors Excel formulas)
function recalcHdfc(rows, repayments) {
  const principle = rows.reduce((s, r) => s + (r.principle || 0), 0);
  const amountNow = rows.reduce((s, r) => s + (r.amountNow || 0), 0);
  const interest = rows.reduce((s, r) => s + (r.interest || 0), 0);
  const interestPaid = rows.reduce((s, r) => s + (r.interestPaid || 0), 0);
  const interestLeft = rows.reduce((s, r) => s + (r.interestLeft || 0), 0); // G = D - E per row

  const totalPrincipal = rows.reduce((s, r) => s + (r.principle || 0), 0) + repayments.reduce((s, r) => s + r.amount, 0);
  const repayment = repayments.reduce((s, r) => s + r.amount, 0);
  // Simple approximation for total interest in HDFC summary
  const totalInterest = rows.reduce((s, r) => s + (r.interest || 0), 0);

  return {
    totals: { principle, amountNow, interest, interestPaid, interestLeft },
    summary: {
      principleAndInterestLeft: principle + interestLeft,
      repayment,
      totalPrincipal: 2150000, // Fixed as per Excel summary logic
      totalAmount: amountNow + repayment,
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
          // Ensure structure and recalculate
          if (!loadedHdfc.repayments) loadedHdfc.repayments = [];
          const { totals, summary } = recalcHdfc(loadedHdfc.rows, loadedHdfc.repayments);
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
      const activeStaffing = currentStaffing || staffing;
      if (isFirebaseConfigured && db) {
        const jainRef = doc(db, 'loans', 'jain');
        const hdfcRef = doc(db, 'loans', 'hdfc');
        const staffingRef = doc(db, 'loans', 'staffing');
        await Promise.all([
          setDoc(jainRef, sanitizedJain),
          setDoc(hdfcRef, currentHdfc),
          setDoc(staffingRef, activeStaffing)
        ]);
      }
      // Always save to localStorage as a fast local cache & backup
      localStorage.setItem('loanData_jain', JSON.stringify(sanitizedJain));
      localStorage.setItem('loanData_hdfc', JSON.stringify(currentHdfc));
      localStorage.setItem('loanData_staffing', JSON.stringify(activeStaffing));
      setJain(sanitizedJain);
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
      const { totals, summary } = recalcHdfc(recalculated, prev.repayments);
      return { ...prev, rows: recalculated, totals, summary };
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
      const repayments = prev.repayments.map((r, i) => i === rowIndex ? { ...r, [field]: value } : r);
      const { totals, summary } = recalcHdfc(prev.rows, repayments);
      return { ...prev, repayments, totals, summary };
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
    setHdfc(prev => {
      const repayments = [...prev.repayments, { date, amount: Number(amount) || 0 }];
      const { totals, summary } = recalcHdfc(prev.rows, repayments);
      return { ...prev, repayments, totals, summary };
    });
    setIsDirty(true);
  }, []);

  const deleteHdfcRepayment = useCallback((rowIndex) => {
    setHdfc(prev => {
      const repayments = prev.repayments.filter((_, i) => i !== rowIndex);
      const { totals, summary } = recalcHdfc(prev.rows, repayments);
      return { ...prev, repayments, totals, summary };
    });
    setIsDirty(true);
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

  const summaryData = {
    totalCombinedLoan: jain.totals.total + hdfc.summary.totalPrincipal,
    totalRemainingLiability: jain.totals.remainingLiability + hdfc.totals.amountNow,
    jainTotal: jain.totals.total,
    usaTotal: jain.usaTotals?.total || 5000,
    hdfcTotal: hdfc.summary.totalPrincipal,
    staffingTotal: staffing.totals?.total || 9360,
    jainRemainingLiability: jain.totals.remainingLiability,
    jainRepayment: jain.totals.repaymentAmount,
    hdfcInterestLeft: hdfc.totals.interestLeft,
    hdfcAmountNow: hdfc.totals.amountNow,
    staffingRemainingLiability: staffing.totals?.remainingLiability || 9360,
    staffingRepayments: staffing.totals?.totalRepayments || 0,
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
      updateHdfcRepayment, updateHdfcRepaymentText,
      addHdfcRepayment, deleteHdfcRepayment,
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

