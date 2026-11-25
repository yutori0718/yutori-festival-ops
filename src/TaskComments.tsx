import { useEffect, useState, type FormEvent } from 'react';
import { addDoc, collection, limit, onSnapshot, orderBy, query, serverTimestamp, type Timestamp } from 'firebase/firestore';
import { db } from './firebase';

type Entry = { id: string; text: string; kind: string; actor: string; at: Timestamp | null };

export default function TaskComments({ eventId, taskId, uid, role }: {
  eventId: string; taskId: string; uid: string; role: string;
}) {
  const [items, setItems] = useState<Entry[]>([]);
  const [kind, setKind] = useState('コメント');
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => onSnapshot(
    query(collection(db, 'events', eventId, 'tasks', taskId, 'comments'), orderBy('at', 'desc'), limit(50)),
    (snap) => setItems(snap.docs.map((item) => ({ id: item.id, ...item.data() } as Entry))),
    () => setStatus('コメントを読み込めませんでした。'),
  ), [eventId, taskId]);

  async function post(event: FormEvent) {
    event.preventDefault();
    if (!text.trim() || saving) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'events', eventId, 'tasks', taskId, 'comments'), {
        text: text.trim(), kind, actor: uid, at: serverTimestamp(),
      });
      setText('');
      setStatus('投稿しました。');
    } catch {
      setStatus('投稿できませんでした。権限と接続状態を確認してください。');
    } finally {
      setSaving(false);
    }
  }

  return <section className="panel">
    <h3>コメント・確認事項</h3>
    {items.length ? items.map((item) => <article className="row" key={item.id}>
      <div><strong>{item.kind}</strong><p style={{ whiteSpace: 'pre-wrap' }}>{item.text}</p></div>
      <small>{item.actor === uid ? '自分' : item.actor}</small>
      <time>{item.at?.toDate().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) || '保存中'}</time>
    </article>) : <p className="muted">コメントはありません。</p>}
    {role !== 'viewer' && <form className="form" onSubmit={post}>
      <label>種類<select value={kind} onChange={(event) => setKind(event.target.value)}>
        <option>コメント</option><option>確認事項</option><option>公開承認申請</option>
      </select></label>
      <label>内容<textarea required maxLength={2000} value={text} onChange={(event) => setText(event.target.value)} /></label>
      <button disabled={saving || !text.trim()}>投稿</button>
    </form>}
    {status && <p role="status">{status}</p>}
  </section>;
}
