import {describe,it,expect} from 'vitest';
import {valid} from './backupModel';
describe('バックアップの検証',()=>{
 it('各対象の妥当な形式を受け付け、不正なデータを拒否する',()=>{
  const task={id:'t1',kind:'tasks' as const,fields:{title:'Task',status:'未着手',progress:0,dueDate:'',priority:'高',nextAction:'',assigneeIds:[],archived:false,metadata:'{}'}};
  const stage={id:'s1',kind:'stages' as const,fields:{name:'Stage',date:'',confidence:'未確定',details:'',attributes:'{}',checklist:'{}'}};
  const rec={id:'r1',kind:'operationalRecords' as const,fields:{category:'recruitment',title:'Plan',status:'未着手',certainty:'未確定',date:'',details:'',url:'',archived:false}};
  const decision={id:'d1',kind:'decisions' as const,fields:{title:'判断',details:'',status:'未確定',resolution:'案',logId:''}};
  expect(valid(decision)).toBe(true);expect(valid({...decision,fields:{...decision.fields,status:'決定済み'}})).toBe(false);
  expect(valid(task)).toBe(true);expect(valid(stage)).toBe(true);expect(valid(rec)).toBe(true);expect(valid({...task,fields:{...task.fields,progress:100}})).toBe(false);expect(valid({...rec,id:'invalid/path'})).toBe(false);expect(valid({...rec,fields:{...rec.fields,unknown:'secret'}})).toBe(false);
 });
});
