import { dateFromDay, dayNumber, readTaskDates, type PlanDates } from './planDates';
import { todayTokyo, type Task } from './model';

export type TimelineItem = PlanDates & {
  id: string;
  name: string;
  kind: 'タスク' | 'ステージ';
  milestoneLabel: '締切' | '開催日';
  open?: () => void;
};

export function taskTimelineItem(task: Task, open?: () => void): TimelineItem {
  return {
    id: task.id,
    name: task.title,
    kind: 'タスク',
    milestoneLabel: '締切',
    ...readTaskDates(task.metadata, task.dueDate),
    open,
  };
}

export default function Timeline({ items }: { items: TimelineItem[] }) {
  const raw = items.map(item => ({
    item, start: dayNumber(item.start), end: dayNumber(item.end), milestone: dayNumber(item.milestone ?? ''),
  }));
  const dated = raw.filter(row => row.start !== null || row.end !== null || row.milestone !== null);
  dated.sort((a, b) =>
    (a.start ?? a.end ?? a.milestone ?? 0) - (b.start ?? b.end ?? b.milestone ?? 0) || a.item.name.localeCompare(b.item.name, 'ja'),
  );
  const undated = raw.filter(row => row.start === null && row.end === null && row.milestone === null);
  if (!dated.length && !undated.length) return <p className="muted">表示できる予定はありません。</p>;
  const days = dated.flatMap(row => [row.start, row.end, row.milestone]).filter((day): day is number => day !== null);
  const origin = days.length ? days.reduce((min, day) => Math.min(min, day)) : 0;
  const last = days.length ? days.reduce((max, day) => Math.max(max, day)) : origin;
  const span = Math.max(1, last - origin + 1);
  const step = span <= 8 ? 1 : span <= 84 ? 7 : Math.ceil(span / 10 / 7) * 7;
  const ticks = Array.from({ length: Math.ceil(span / step) }, (_, index) => origin + index * step);
  const percent = (day: number) => (day - origin) * 100 / span;
  const today = dayNumber(todayTokyo());
  const todayVisible = today !== null && today >= origin && today <= last;

  return <>
    <ul className="timeline-legend" aria-label="凡例">
      <li><i className="timeline-key planned" />予定期間</li>
      <li><i className="timeline-key single" />開始・終了の片方のみ</li>
      <li><i className="timeline-key milestone" />締切・開催日</li>
      {todayVisible && <li><i className="timeline-key today" />今日</li>}
    </ul>
    {dated.length > 0 && <>
      <p className="muted">表示範囲 {dateFromDay(origin)} ～ {dateFromDay(last)}</p>
      <div className="timeline-scroll" role="region" aria-label="予定表。横にスクロールできます" tabIndex={0}>
        <div className="timeline-inner">
          <div className="timeline-row timeline-header"><b>項目と日付</b><div className="timeline-track">
            {ticks.map(day => <span className="timeline-tick" style={{ left: `${percent(day)}%` }} key={day}>
              {dateFromDay(day).slice(5).replace('-', '/')}
            </span>)}
          </div></div>
          {dated.map(({ item, start, end, milestone }) => {
            const range = start !== null && end !== null && start <= end;
            return <div className="timeline-row" key={item.kind + item.id}>
              <div className="timeline-name">
                <small>{item.kind}</small>
                {item.open ? <button type="button" className="timeline-link" onClick={item.open}>{item.name}</button> : <strong>{item.name}</strong>}
                <small>開始 {item.start || '未定'} / 終了 {item.end || '未定'}</small>
                {milestone !== null && <small>{item.milestoneLabel} {item.milestone}</small>}
                {start !== null && end !== null && !range && <small>開始日と終了日の順序を確認してください</small>}
              </div>
              <div className="timeline-track" aria-hidden="true">
                {ticks.map(day => <i className="timeline-gridline" style={{ left: `${percent(day)}%` }} key={day} />)}
                {todayVisible && <i className="timeline-today" style={{ left: `${percent(today) + 50 / span}%` }} />}
                {range ? <i className="timeline-period" style={{ left: `${percent(start)}%`, width: `${(end - start + 1) * 100 / span}%` }} /> :
                  [start, end].map((day, index) => day !== null && <i className="timeline-single" style={{ left: `${percent(day) + 50 / span}%` }} key={index} />)}
                {milestone !== null && <i className="timeline-milestone" style={{ left: `${percent(milestone) + 50 / span}%` }} />}
              </div>
            </div>;
          })}
        </div>
      </div>
    </>}
    {undated.length > 0 && <details className="timeline-undated">
      <summary>日付が未入力の項目（{undated.length} 件）</summary>
      <ul>{undated.map(({ item }) => <li key={item.kind + item.id}>
        {item.kind}：{item.open ? <button type="button" className="timeline-link" onClick={item.open}>{item.name}</button> : item.name}
      </li>)}</ul>
    </details>}
  </>;
}
