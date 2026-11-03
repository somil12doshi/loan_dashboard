export const MONTH_MAP = {
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

export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function parseDate(str) {
  if (!str) return null;
  const cleaned = str.trim().toLowerCase();

  // 1. Try parsing "D Mon YYYY" or "D Month YYYY" (e.g. "27 Oct 2026")
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

export function sortRepaymentsLatestFirst(repayments = []) {
  return [...repayments]
    .map((r, originalIndex) => ({ ...r, originalIndex }))
    .sort((a, b) => {
      const timeA = parseDate(a.date)?.getTime() || 0;
      const timeB = parseDate(b.date)?.getTime() || 0;
      if (timeB !== timeA) return timeB - timeA;
      return b.originalIndex - a.originalIndex;
    });
}

