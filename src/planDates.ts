const dayMs = 86_400_000;

export type PlanDates = { start: string; end: string; milestone?: string };

export function dayNumber(date: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const time = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== date) return null;
  return Math.floor(time / dayMs);
}

export function invalidPeriod(start: string, end: string): boolean {
  const from = dayNumber(start), to = dayNumber(end);
  return (!!start && from === null) || (!!end && to === null) || (from !== null && to !== null && to < from);
}

export function dateFromDay(number: number): string {
  return new Date(number * dayMs).toISOString().slice(0, 10);
}

export function readTaskDates(metadata: string | undefined, dueDate: string): PlanDates {
  try {
    const data = JSON.parse(metadata || '{}');
    return {
      start: typeof data?.startDate === 'string' ? data.startDate : '',
      end: typeof data?.endDate === 'string' ? data.endDate : '',
      milestone: dueDate,
    };
  } catch {
    return { start: '', end: '', milestone: dueDate };
  }
}


export const stageStartKey = '準備開始日';
export const stageEndKey = '準備終了予定日';

export function readStageDates(attributes: string | undefined, date: string): PlanDates {
  try {
    const data = JSON.parse(attributes || '{}');
    const start = data?.[stageStartKey]?.value;
    const end = data?.[stageEndKey]?.value;
    return { start: typeof start === 'string' ? start : '', end: typeof end === 'string' ? end : '', milestone: date };
  } catch {
    return { start: '', end: '', milestone: date };
  }
}
