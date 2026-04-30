import { HomePriorityType, HomeTargetKind } from '../enums';
import type { DashboardHomeSummary, HomePriority } from '../models/dashboard-home';
import type { NoteSummary } from '../models/note';
import type { Project } from '../models/project';
import type { Reminder } from '../models/reminder';
import type { Review } from '../models/review';

const HOME_WINDOW_DAYS = 7;
const OPEN_STATUSES = new Set(['open', 'active', 'pending', 'todo']);
const INTERESTING_TYPES = ['incident', 'decision', 'followup', 'reminder', 'event'];

function parseTimestamp(value: string) {
  const timestamp = Date.parse(String(value || '').trim());
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function localDateKey(value: string) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  const year = String(parsed.getFullYear());
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDayLabel(key: string) {
  const [, month, day] = key.match(/\d{4}-(\d{2})-(\d{2})/) || [];
  return month && day ? `${month}/${day}` : key;
}

function shiftDateKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day + days);
  const outYear = String(date.getFullYear());
  const outMonth = String(date.getMonth() + 1).padStart(2, '0');
  const outDay = String(date.getDate()).padStart(2, '0');
  return `${outYear}-${outMonth}-${outDay}`;
}

function projectLabel(projects: Project[], slug: string) {
  return projects.find((project) => project.projectSlug === slug)?.displayName || slug || 'Sem projeto';
}

function isOpen(status: string) {
  return OPEN_STATUSES.has(String(status || '').toLowerCase());
}

function isHigh(severity: string) {
  return ['high', 'critical'].includes(String(severity || '').toLowerCase());
}

function noteTarget(note: NoteSummary) {
  return { kind: HomeTargetKind.Note, id: note.id, path: note.path } as const;
}

function findNoteByPath(notes: NoteSummary[], path: string) {
  if (!path) return undefined;
  return notes.find((note) => note.path === path || note.path.endsWith(path));
}

function sortPriorities(left: HomePriority & { rank?: number; timestamp?: number }, right: HomePriority & { rank?: number; timestamp?: number }) {
  return (left.rank || 0) - (right.rank || 0) || (left.timestamp || 0) - (right.timestamp || 0) || left.title.localeCompare(right.title);
}

export function buildDashboardHome(projects: Project[], notes: NoteSummary[], reviews: Review[], reminders: Reminder[], now = new Date()): DashboardHomeSummary {
  const todayDate = localDateKey(now.toISOString());
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const end = todayDate;
  const start = shiftDateKey(end, -(HOME_WINDOW_DAYS - 1));
  const recentNotes = notes.filter((note) => {
    const key = localDateKey(note.date);
    return Boolean(key && key >= start && key <= end);
  });
  const openReminders = reminders.filter((reminder) => isOpen(reminder.status));
  const overdueReminders = openReminders.filter((reminder) => {
    if (reminder.reminderAt) {
      const timestamp = parseTimestamp(reminder.reminderAt);
      return Boolean(timestamp && timestamp < now.getTime());
    }
    if (reminder.reminderDate < todayDate) return true;
    return reminder.reminderDate === todayDate && Boolean(reminder.reminderTime && reminder.reminderTime < currentTime);
  });
  const openHighFindings = reviews.flatMap((review) => review.findings.filter((finding) => isOpen(finding.status) && isHigh(finding.severity)).map((finding) => ({ review, finding })));
  const reviewsWithOpenFindings = reviews.filter((review) => review.findings.some((finding) => isOpen(finding.status)));
  const recentIncidentsAndFollowups = recentNotes.filter((note) => ['incident', 'followup'].includes(note.type) && isOpen(note.status));

  const dayKeys = Array.from({ length: HOME_WINDOW_DAYS }, (_, index) => shiftDateKey(start, index));
  const countByDay = new Map(dayKeys.map((key) => [key, 0]));
  for (const note of recentNotes) {
    const key = localDateKey(note.date);
    if (countByDay.has(key)) countByDay.set(key, (countByDay.get(key) || 0) + 1);
  }

  const countByProject = new Map<string, number>();
  for (const note of recentNotes) {
    countByProject.set(note.project, (countByProject.get(note.project) || 0) + 1);
  }

  const priorityCandidates: Array<HomePriority & { rank: number; timestamp: number }> = [
    ...openReminders.map((reminder) => {
      const timestamp = parseTimestamp(reminder.reminderAt);
      const relatedNote = findNoteByPath(notes, reminder.sourceNotePath) || findNoteByPath(notes, reminder.relativePath);
      const overdue = reminder.reminderAt
        ? Boolean(timestamp && timestamp < now.getTime())
        : reminder.reminderDate < todayDate || (reminder.reminderDate === todayDate && Boolean(reminder.reminderTime && reminder.reminderTime < currentTime));
      return {
        id: `reminder:${reminder.id}`,
        type: HomePriorityType.Reminder,
        title: reminder.title,
        project: reminder.project,
        date: reminder.reminderAt || reminder.reminderDate,
        description: overdue ? 'Lembrete vencido' : 'Lembrete aberto',
        status: reminder.status,
        target: relatedNote ? noteTarget(relatedNote) : { kind: HomeTargetKind.Note, path: reminder.sourceNotePath || reminder.relativePath },
        rank: overdue ? 0 : 1,
        timestamp: timestamp || Number.MAX_SAFE_INTEGER,
      };
    }),
    ...openHighFindings.map(({ review, finding }, index) => ({
      id: `finding:${review.id}:${index}`,
      type: HomePriorityType.Finding,
      title: review.title,
      project: review.project,
      date: review.date,
      description: finding.file ? `${finding.summary} (${finding.file})` : finding.summary,
      severity: finding.severity,
      status: finding.status,
      target: { kind: HomeTargetKind.Review, id: review.id, path: review.generatedNotePath },
      rank: 2,
      timestamp: parseTimestamp(review.date) || Number.MAX_SAFE_INTEGER,
    })),
    ...recentIncidentsAndFollowups.map((note) => ({
      id: `note:${note.id}`,
      type: note.type === 'incident' ? HomePriorityType.Incident : HomePriorityType.Followup,
      title: note.title,
      project: note.project,
      date: note.date,
      description: note.summary,
      status: note.status,
      target: noteTarget(note),
      rank: note.type === 'incident' ? 3 : 4,
      timestamp: parseTimestamp(note.date) || Number.MAX_SAFE_INTEGER,
    })),
  ];

  const recentInterestingEvents = recentNotes
    .filter((note) => INTERESTING_TYPES.includes(note.type) && isOpen(note.status))
    .sort((left, right) => {
      const typePriority = INTERESTING_TYPES.indexOf(left.type) - INTERESTING_TYPES.indexOf(right.type);
      return typePriority || (parseTimestamp(right.date) || 0) - (parseTimestamp(left.date) || 0) || left.title.localeCompare(right.title);
    })
    .slice(0, 5)
    .map((note) => ({
      id: note.id,
      type: note.type,
      title: note.title,
      project: note.project,
      date: note.date,
      summary: note.summary,
      status: note.status,
      target: noteTarget(note),
    }));

  return {
    windowDays: HOME_WINDOW_DAYS,
    metrics: [
      { id: 'recent-notes', label: 'Mudancas recentes', value: recentNotes.length, meta: `notas em ${HOME_WINDOW_DAYS} dias`, tone: 'active' },
      { id: 'active-projects', label: 'Projetos ativos', value: countByProject.size, meta: 'com movimento recente', tone: 'active' },
      { id: 'open-reminders', label: 'Lembretes abertos', value: openReminders.length, meta: `${overdueReminders.length} vencidos`, tone: overdueReminders.length ? 'high' : 'active' },
      { id: 'open-findings', label: 'Findings abertos', value: openHighFindings.length, meta: `${reviewsWithOpenFindings.length} reviews com pendencias`, tone: openHighFindings.length ? 'high' : 'active' },
    ],
    activityByDay: dayKeys.map((key) => ({ date: key, label: formatDayLabel(key), count: countByDay.get(key) || 0 })),
    activityByProject: Array.from(countByProject.entries()).map(([project, count]) => ({ project, label: projectLabel(projects, project), count }))
      .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
      .slice(0, 5),
    priorities: priorityCandidates.sort(sortPriorities).slice(0, 5).map(({ rank: _rank, timestamp: _timestamp, ...priority }) => priority),
    recentInterestingEvents,
  };
}
