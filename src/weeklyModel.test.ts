import {describe,it,expect} from 'vitest';
import {compare,type Entry} from './weeklyModel';
const t=(id:string,status='未着手',progress=0):Entry=>({id,title:id,status,progress,dueDate:'',assigneeIds:[],archived:false});
describe('週次比較',()=>{it('新規、完了、進捗変更、削除を記録する',()=>{const result=compare([t('a'),t('b')],[t('a','完了',100),t('c')]);expect(result.added.map(x=>x.id)).toEqual(['c']);expect(result.completed.map(x=>x.id)).toEqual(['a']);expect(result.changed.map(x=>x.id)).toEqual(['a']);expect(result.removed.map(x=>x.id)).toEqual(['b'])})});
