import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, query } from 'firebase/firestore';
import { db } from './firebase';
import { isOverdue, type Task } from './model';

type Stage = { id: string; name: string; date: string; confidence: string };
type Groups = Map<string, Task[]>;

function groupTasks(tasks: Task[], by: (task: Task) => string[]) {
  const groups: Groups = new Map();
  for (const task of tasks) {
    for (const key of new Set(by(task))) {
      const group = groups.get(key) ?? [];
      group.push(task);
      groups.set(key, group);
    }
  }
  return groups;
}

function GroupProgress({ heading, groups }: { heading: string; groups: Groups }) {
  return <section className="panel">
    <h2>{heading}</h2>
    {groups.size ? Array.from(groups, ([name, tasks]) => <div className="row" key={name}>
      <strong>{name}</strong>
      <span>{tasks.filter((task) => task.status === '完了').length} / {tasks.length} 件完了</span>
      <span>{Math.round(tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length)}%</span>
    </div>) : <p className="muted">対象のタスクはありません。</p>}
  </section>;
}

function taskGroupDetails(task: Task): { category?: string; stageIds?: string } {
  try {
    const value = JSON.parse(task.metadata || '{}');
    return value && typeof value === 'object' ? value : {};
  } catch {
    return {};
  }
}

export default function DashboardDetails({ eventId, tasks, today }: { eventId: string; tasks: Task[]; today: string }) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loadError, setLoadError] = useState(false);
  useEffect(() => onSnapshot(
    query(collection(db, 'events', eventId, 'stages'), limit(100)),
    (result) => {
      setStages(result.docs.map((item) => ({ id: item.id, ...item.data() } as Stage)));
      setLoadError(false);
    },
    () => setLoadError(true),
  ), [eventId]);

  const upcoming = stages.filter((stage) => stage.date && stage.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const next = upcoming[0];
  const remaining = next ? Math.round((Date.parse(next.date) - Date.parse(today)) / 86400000) : null;
  const todayTasks = tasks.filter((task) => task.dueDate === today && task.status !== '完了');
  const overdue = tasks.filter((task) => isOverdue(task, today)).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const recent = tasks.filter((task) => task.updatedAt).sort((a, b) => (b.updatedAt?.seconds ?? 0) - (a.updatedAt?.seconds ?? 0)).slice(0, 8);
  const byCategory = groupTasks(tasks, (task) => [taskGroupDetails(task).category || '未分類']);
  const byStage = groupTasks(tasks, (task) => {
    const value = taskGroupDetails(task).stageIds;
    return typeof value === 'string'
      ? value.split(',').map((id) => id.trim()).filter(Boolean).map((id) => stages.find((stage) => stage.id === id)?.name || id)
      : [];
  });
  const byAssignee = groupTasks(tasks, (task) => task.assigneeIds.length ? task.assigneeIds : ['未割当']);

  return <>
    <section className="panel">
      <h2>大会までのロードマップ</h2>
      {next && remaining !== null && <p><strong>{next.name}</strong>まで{remaining === 0 ? '本日' : `あと ${remaining} 日`}</p>}
      {loadError && <p role="status">ステージを読み込めませんでした。</p>}
      {[...upcoming, ...stages.filter((stage) => !stage.date)].map((stage) =>
        <div className="row" key={stage.id}><strong>{stage.name}</strong><span>{stage.date || '開催日未定'}</span><span>{stage.confidence}</span></div>,
      )}
      {!stages.length && !loadError && <p className="muted">開催ステージは登録されていません。</p>}
    </section>
    <div className="grid">
      {[['本日の対応事項', todayTasks], ['期限超過', overdue], ['最近更新されたタスク', recent]].map(([title, value]) => {
        const items = value as Task[];
        return <section className="panel" key={String(title)}>
          <h2>{String(title)}</h2>
          {items.length ? items.map((task) => <div className="row" key={task.id}>
            <strong>{task.title}</strong><span>{task.dueDate || '期限未定'}</span><span>{task.status}</span>
          </div>) : <p className="muted">該当するタスクはありません。</p>}
        </section>;
      })}
    </div>
    <div className="grid">
      <GroupProgress heading="カテゴリ別進捗" groups={byCategory} />
      <GroupProgress heading="ステージ別進捗" groups={byStage} />
      <GroupProgress heading="担当者別進捗" groups={byAssignee} />
    </div>
  </>;
}
