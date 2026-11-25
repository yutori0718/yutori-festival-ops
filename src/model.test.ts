import {describe,it,expect} from 'vitest';
import {validProgress,isOverdue,type Task} from './model';
describe('タスクの状態',()=>{it('完了と進捗の矛盾を拒否する',()=>{expect(validProgress('完了',100)).toBe(true);expect(validProgress('完了',99)).toBe(false);expect(validProgress('対応中',100)).toBe(false)});it('未完了の過去期限のみ超過とする',()=>{const t={dueDate:'2026-01-01',status:'対応中',archived:false} as Task;expect(isOverdue(t,'2026-01-02')).toBe(true);expect(isOverdue({...t,status:'完了'},'2026-01-02')).toBe(false)})});
