// Formats an ISO date string to 12-hour time of day in Indian Standard Time (IST), e.g. "9:18 PM"
export function formatTimeOfDay(isoStr) {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
  } catch (_) {
    return '';
  }
}

// Formats an ISO date string to Indian date display, e.g. "04 Nov"
export function formatIndianDate(isoStr) {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      timeZone: 'Asia/Kolkata',
    });
  } catch (_) {
    return '';
  }
}

// Returns today's date in YYYY-MM-DD format in Indian Standard Time (IST)
export function getIndianTodayIsoDate() {
  try {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  } catch (_) {
    return new Date().toISOString().split('T')[0];
  }
}

// Formats duration in minutes, e.g. "45m" or "1h 15m"
export function formatDuration(minutes) {
  const m = Number(minutes);
  if (!m || isNaN(m) || m <= 0) return '0m';
  if (m < 60) return `${m}m`;
  const hrs = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

// Formats seconds into stopwatch string "MM:SS" or "HH:MM:SS"
export function formatStopwatch(totalSeconds) {
  const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');

  if (hrs > 0) {
    const hh = String(hrs).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

