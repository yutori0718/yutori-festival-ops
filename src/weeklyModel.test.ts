import {describe,it,expect} from 'vitest';
import {compare,type Entry} from './weeklyModel';
const t=(id:string,status='������',progress=0):Entry=>({id,title:id,status,progress,dueDate:'',assigneeIds:[],archived:false});
describe('�T����r',()=>{it('�V�K�A�����A�i���ύX�A�폜���L�^����',()=>{const result=compare([t('a'),t('b')],[t('a','����',100),t('c')]);expect(result.added.map(x=>x.id)).toEqual(['c']);expect(result.completed.map(x=>x.id)).toEqual(['a']);expect(result.changed.map(x=>x.id)).toEqual(['a']);expect(result.removed.map(x=>x.id)).toEqual(['b'])})});
