import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, query } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Timeline, { taskTimelineItem, type TimelineItem } from './Timeline';
import { db } from './firebase';
import { readStageDates } from './planDates';
import type { Task } from './model';

type Stage = { id: string; name: string; date: string; attributes?: string };

export default function TimelinePage({ eventId, tasks, openTask }: {
  eventId: string;
  tasks: Task[];
  openTask: (task: Task) => void;
}) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState('すべて');
  const navigate = useNavigate();

  useEffect(() => onSnapshot(
    query(collection(db, 'events', eventId, 'stages'), limit(100)),
    snapshot => { setStages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Stage))); setError(false); },
    () => setError(true),
  ), [eventId]);

  const items: TimelineItem[] = [
    ...tasks.map(task => taskTimelineItem(task, () => { openTask(task); navigate('/admin/tasks'); })),
    ...stages.map(stage => ({
      id: stage.id,
      name: stage.name,
      kind: 'ステージ' as const,
      ...readStageDates(stage.attributes, stage.date),
      milestoneLabel: '開催日' as const,
      open: () => navigate(`/admin/stages?stage=${encodeURIComponent(stage.id)}`),
    })),
  ];

  return <>
    <div className="heading"><h2>ガントチャート</h2></div>
    <section className="panel">
      <label>表示対象 <select value={filter} onChange={e => setFilter(e.target.value)}>
        <option>すべて</option><option>タスク</option><option>ステージ</option>
      </select></label>
      {error && <p role="status">ステージを読み込めませんでした。</p>}
      <Timeline items={items.filter(item => filter === 'すべて' || item.kind === filter)} />
    </section>
  </>;
}
