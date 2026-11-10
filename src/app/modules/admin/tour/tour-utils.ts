/**
 * Small, dependency-free helpers shared by the whole tour module
 * (tours list, tour detail, tour dashboard and the add-tour dialogs).
 */

export type TourStatus = 'upcoming' | 'ongoing' | 'completed';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Parses a "date only" value coming from Hasura ("2026-11-09") or a Date into a
 * local-midnight Date. Parsing the string by hand avoids the classic off-by-one-day
 * bug of `new Date('2026-11-09')` (which is UTC midnight) in timezones behind UTC.
 */
export function parseDateOnly(value: any): Date | null {
    if (!value) {
        return null;
    }
    if (value instanceof Date) {
        return isNaN(value.getTime())
            ? null
            : new Date(value.getFullYear(), value.getMonth(), value.getDate());
    }
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
    if (match) {
        return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }
    const parsed = new Date(value);
    return isNaN(parsed.getTime())
        ? null
        : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

/**
 * Serialises a Date picked from a datepicker into "yyyy-MM-dd" using the *local*
 * calendar day, so that the Hasura `date` column stores exactly what the user picked.
 */
export function toDateOnlyString(value: any): string | null {
    const date = parseDateOnly(value);
    if (!date) {
        return null;
    }
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export function today(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function addDays(date: Date, days: number): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Whole days between two local-midnight dates (b - a). */
export function diffInDays(a: Date, b: Date): number {
    return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}

export function getStatus(start: any, end: any): TourStatus {
    const s = parseDateOnly(start);
    const e = parseDateOnly(end) ?? s;
    const now = today();
    if (s && now < s) {
        return 'upcoming';
    }
    if (e && now > e) {
        return 'completed';
    }
    return 'ongoing';
}

export const STATUS_LABELS: Record<TourStatus, string> = {
    upcoming: 'Upcoming',
    ongoing: 'Ongoing',
    completed: 'Completed',
};

/** Tailwind classes for the status pill (works in light and dark mode). */
export const STATUS_CLASSES: Record<TourStatus, string> = {
    upcoming:
        'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-400/30',
    ongoing:
        'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/30',
    completed:
        'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-400/30',
};

/** Percentage (0-100) of the tour timeline that has elapsed. */
export function getProgress(start: any, end: any): number {
    const s = parseDateOnly(start);
    const e = parseDateOnly(end);
    if (!s || !e) {
        return 0;
    }
    const now = today();
    if (now <= s) {
        return 0;
    }
    if (now >= e) {
        return 100;
    }
    const total = e.getTime() - s.getTime();
    return total <= 0 ? 100 : Math.round(((now.getTime() - s.getTime()) / total) * 100);
}

/** Human readable timing hint, e.g. "Starts in 3 days", "Day 2 of 10", "Ended 5 days ago". */
export function getTimingLabel(start: any, end: any): string {
    const s = parseDateOnly(start);
    const e = parseDateOnly(end) ?? s;
    if (!s || !e) {
        return '';
    }
    const now = today();
    const status = getStatus(start, end);
    if (status === 'upcoming') {
        const n = diffInDays(now, s);
        return n === 1 ? 'Starts tomorrow' : `Starts in ${n} days`;
    }
    if (status === 'completed') {
        const n = diffInDays(e, now);
        return n === 1 ? 'Ended yesterday' : `Ended ${n} days ago`;
    }
    const totalDays = diffInDays(s, e) + 1;
    const currentDay = diffInDays(s, now) + 1;
    return `Day ${currentDay} of ${totalDays}`;
}

export function getDurationDays(start: any, end: any): number {
    const s = parseDateOnly(start);
    const e = parseDateOnly(end);
    if (!s || !e) {
        return 0;
    }
    return Math.max(diffInDays(s, e) + 1, 1);
}

export function getInitials(name: string): string {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) {
        return '?';
    }
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

/** Strips tags from a Quill HTML string for short previews. */
export function stripHtml(html: string): string {
    if (!html) {
        return '';
    }
    return html
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim();
}

/** Maps the add-tour dialog result to the `tour` row that is inserted in Hasura. */
export function buildTourPayload(result: { title: string; startDate: any; endDate: any }, adminId: string, id: string) {
    return {
        id,
        adminId,
        name: (result.title || '').trim(),
        logo: null as string | null,
        dateCreated: new Date().toISOString(),
        startDate: toDateOnlyString(result.startDate),
        endDate: toDateOnlyString(result.endDate),
    };
}
