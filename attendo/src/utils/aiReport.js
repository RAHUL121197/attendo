// Client-side helpers for the AI Report feature.
// The AI request goes to our own backend endpoint (/api/ai/ask), which holds
// the AgentRouter API key server-side. This module never sees the key.

const SECTION_KEYS = [
  { key: 'performance summary', title: 'Performance Summary' },
  { key: 'strengths', title: 'Strengths' },
  { key: 'weaknesses', title: 'Weaknesses' },
  { key: 'improvement suggestions', title: 'Improvement Suggestions' },
  { key: 'overall performance rating', title: 'Overall Performance Rating' },
];

export function buildEmployeeReportContext({ employee, stats, settings, range }) {
  return {
    name: employee.name,
    id: employee.id,
    department: employee.department,
    designation: employee.designation,
    shift: employee.shift,
    joiningDate: employee.joiningDate,
    status: employee.status,
    period: {
      from: range.from,
      to: range.to,
    },
    metrics: {
      presentDays: stats.present,
      lateDays: stats.late,
      absentDays: stats.absent,
      paidTimeOffDays: stats.timeOff,
      totalWorkingHours: stats.totalHours,
      attendanceRate: stats.attendancePct,
    },
    companySettings: {
      applicationName: settings?.applicationName || 'Attendo',
      expectedWorkingHours: settings?.workingHours ?? 8,
    },
  };
}

export function buildReportPrompt(ctx) {
  return [
    'You are an HR performance analyst for the company "' + ctx.companySettings.applicationName + '".',
    'Write a concise employee performance report based ONLY on the data below. Be objective and specific.',
    '',
    'Employee: ' + ctx.name + ' (ID ' + ctx.id + ')',
    'Role: ' + ctx.designation + ' - ' + ctx.department,
    'Shift: ' + ctx.shift + ', Joined: ' + ctx.joiningDate + ', Status: ' + ctx.status,
    'Expected working hours per day: ' + ctx.companySettings.expectedWorkingHours,
    '',
    'Attendance period: ' + ctx.period.from + ' to ' + ctx.period.to,
    'Attendance metrics: ' + JSON.stringify(ctx.metrics),
    '',
    'Respond with EXACTLY these five numbered sections, nothing else:',
    '1. Performance Summary (2-3 sentences)',
    '2. Strengths (bulleted list)',
    '3. Weaknesses (bulleted list)',
    '4. Improvement Suggestions (bulleted list)',
    '5. Overall Performance Rating: X/10 (one line, X between 0 and 10)',
  ].join('\n');
}

export async function requestAIReport(prompt, { signal } = {}) {
  const response = await fetch('/api/ai/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
    signal,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    // leave data null, handled below
  }

  if (!response.ok) {
    const message = data?.error ? data.error : `Request failed (${response.status})`;
    throw new Error(message);
  }
  if (!data?.ok) {
    throw new Error(data?.error || 'Unexpected response from AI service.');
  }
  return data.content;
}

export function parseAISections(content) {
  const sections = [];
  let current = null;

  const flush = () => {
    if (current && current.text.trim()) {
      current.lines = current.text
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      sections.push(current);
    }
    current = null;
  };

  String(content || '')
    .split(/\r?\n/)
    .forEach((raw) => {
      const line = raw.trim();
      if (!line) return;
      const title = matchSectionTitle(line);
      if (title) {
        flush();
        const stripped = line.replace(/^(?:\d+\s*[.)]+:?\s*)+/, '');
        const colonIdx = stripped.indexOf(':');
        const afterTitle = colonIdx >= 0 ? stripped.slice(colonIdx + 1).trim() : '';
        current = { title, text: afterTitle || '' };
      } else if (current) {
        current.text += (current.text ? '\n' : '') + line;
      } else {
        current = { title: 'Report', text: line };
      }
    });
  flush();

  return sections;
}

export function extractRating(content) {
  const m = String(content || '').match(/(\d+(?:\.\d+)?)\s*\/\s*10/);
  return m ? Number(m[1]) : null;
}

function matchSectionTitle(line) {
  const stripped = line
    .replace(/^(?:\d+\s*[.)]+:?\s*)+/, '')
    .replace(/^[#*-]+\s*/, '')
    .replace(/[#*_]+/g, '')
    .trim();
  const lower = stripped.toLowerCase().replace(/:.*$/, '').trim();
  for (const s of SECTION_KEYS) {
    if (lower.startsWith(s.key)) return s.title;
  }
  return null;
}