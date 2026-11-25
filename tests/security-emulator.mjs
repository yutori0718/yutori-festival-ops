import {readFileSync} from 'node:fs';
import {before, after, test} from 'node:test';
import {initializeTestEnvironment, assertFails, assertSucceeds} from '@firebase/rules-unit-testing';
import {doc, getDoc, setDoc, updateDoc, writeBatch, serverTimestamp} from 'firebase/firestore';
let env;
const event='event-one';
const task=(who='admin')=>({title:'Task',status:'未着手',progress:0,dueDate:'',priority:'中',nextAction:'',assigneeIds:['member'],archived:false,revision:1,eventId:event,createdBy:who,createdAt:serverTimestamp(),updatedBy:who,updatedAt:serverTimestamp()});
const ref=(db,path)=>doc(db,path);
before(async()=>{
 env=await initializeTestEnvironment({projectId:'demo-yutori-ops',firestore:{rules:readFileSync('firestore.rules','utf8')}});
 await env.clearFirestore();
 await env.withSecurityRulesDisabled(async ctx=>{const db=ctx.firestore();for(const [uid,role] of [['admin','admin'],['member','member'],['viewer','viewer']])await setDoc(ref(db,`events/${event}/memberships/${uid}`),{role});await setDoc(ref(db,`events/${event}/tasks/existing`),task());});
});
after(async()=>{await env?.cleanup()});
test('未認証と他大会のユーザーは内部データを読めない',async()=>{await assertFails(getDoc(ref(env.unauthenticatedContext().firestore(),`events/${event}/tasks/existing`)));await assertFails(getDoc(ref(env.authenticatedContext('outsider').firestore(),`events/${event}/tasks/existing`)));});
test('閲覧専用は読めるが更新できない',async()=>{const db=env.authenticatedContext('viewer').firestore();await assertSucceeds(getDoc(ref(db,`events/${event}/tasks/existing`)));await assertFails(updateDoc(ref(db,`events/${event}/tasks/existing`),{status:'対応中',revision:2,updatedBy:'viewer',updatedAt:serverTimestamp()}));});
test('管理者はタスクを追加でき、進捗の矛盾は拒否',async()=>{const db=env.authenticatedContext('admin').firestore();await assertSucceeds(setDoc(ref(db,`events/${event}/tasks/new`),{...task(),assigneeIds:[]}));await assertFails(setDoc(ref(db,`events/${event}/tasks/invalid`),{...task(),status:'完了',progress:50}));});
test('担当者は担当タスクの進捗のみ更新できる',async()=>{const db=env.authenticatedContext('member').firestore();await assertSucceeds(updateDoc(ref(db,`events/${event}/tasks/existing`),{status:'対応中',progress:20,revision:2,updatedBy:'member',updatedAt:serverTimestamp()}));await assertFails(updateDoc(ref(db,`events/${event}/tasks/existing`),{title:'changed',revision:3,updatedBy:'member',updatedAt:serverTimestamp()}));await assertFails(updateDoc(ref(db,`events/${event}/tasks/new`),{status:'対応中',revision:2,updatedBy:'member',updatedAt:serverTimestamp()}));});
test('権限の自己変更と公開データへの直接アクセスは拒否',async()=>{const db=env.authenticatedContext('member').firestore();await assertFails(updateDoc(ref(db,`events/${event}/memberships/member`),{role:'admin'}));await assertFails(setDoc(ref(db,'publicEvents/test'),{title:'x'}));await assertFails(getDoc(ref(env.unauthenticatedContext().firestore(),'publicEvents/test')));});
test('異なる大会のメンバー権限ではアクセスできない',async()=>{const db=env.authenticatedContext('admin').firestore();await assertFails(getDoc(ref(db,'events/another/tasks/existing')));});


test('ステージは大会メンバーのみ閲覧でき、管理者以外の書込みを拒否する',async()=>{
 const stage={name:'Stage',date:'',confidence:'未確定',details:'',revision:1,eventId:event,createdBy:'admin',createdAt:serverTimestamp(),updatedBy:'admin',updatedAt:serverTimestamp()};
 const admin=env.authenticatedContext('admin').firestore(); const member=env.authenticatedContext('member').firestore();
 await assertSucceeds(setDoc(ref(admin,`events/${event}/stages/stage-one`),stage));
 await assertSucceeds(getDoc(ref(member,`events/${event}/stages/stage-one`)));
 await assertFails(updateDoc(ref(member,`events/${event}/stages/stage-one`),{name:'modified',revision:2,updatedBy:'member',updatedAt:serverTimestamp()}));
 await assertFails(getDoc(ref(env.unauthenticatedContext().firestore(),`events/${event}/stages/stage-one`)));
 await assertFails(updateDoc(ref(admin,`events/${event}/stages/stage-one`),{name:'modified',revision:3,updatedBy:'admin',updatedAt:serverTimestamp()}));
 await assertSucceeds(updateDoc(ref(admin,`events/${event}/stages/stage-one`),{date:'2027-01-01',revision:2,updatedBy:'admin',updatedAt:serverTimestamp()}));
});

test('週次スナップショットは管理者のみ作成でき、保存後は変更できない',async()=>{
 const admin=env.authenticatedContext('admin').firestore(), member=env.authenticatedContext('member').firestore();
 const record={eventId:event,label:'week',data:'[]',comment:'',createdBy:'admin',createdAt:serverTimestamp()};
 await assertSucceeds(setDoc(ref(admin,`events/${event}/weeklySnapshots/w1`),record));
 await assertSucceeds(getDoc(ref(member,`events/${event}/weeklySnapshots/w1`)));
 await assertFails(setDoc(ref(member,`events/${event}/weeklySnapshots/w2`),{...record,createdBy:'member'}));
 await assertFails(updateDoc(ref(admin,`events/${event}/weeklySnapshots/w1`),{comment:'changed'}));
});


test('決定には同時に変更不可能な決定ログが必要',async()=>{
 const admin=env.authenticatedContext('admin').firestore(), member=env.authenticatedContext('member').firestore();
 const decision=ref(admin,`events/${event}/decisions/d1`), log=ref(admin,`events/${event}/decisionLogs/l1`);
 await assertSucceeds(setDoc(decision,{eventId:event,title:'Question',details:'',status:'未確定',resolution:'',logId:'',revision:1,createdBy:'admin',createdAt:serverTimestamp(),updatedBy:'admin',updatedAt:serverTimestamp()}));
 await assertFails(updateDoc(decision,{status:'決定済み',resolution:'answer',logId:'missing',revision:2,updatedBy:'admin',updatedAt:serverTimestamp()}));
 await assertFails(updateDoc(ref(member,`events/${event}/decisions/d1`),{title:'bad',revision:2,updatedBy:'member',updatedAt:serverTimestamp()}));
 const batch=writeBatch(admin);batch.update(decision,{status:'決定済み',resolution:'answer',logId:'l1',revision:2,updatedBy:'admin',updatedAt:serverTimestamp()});batch.set(log,{eventId:event,decisionId:'d1',title:'Question',resolution:'answer',decidedBy:'admin',decidedAt:serverTimestamp()});await assertSucceeds(batch.commit());
 await assertFails(updateDoc(log,{resolution:'altered'}));
 await assertFails(updateDoc(decision,{resolution:'altered',revision:3,updatedBy:'admin',updatedAt:serverTimestamp()}));
});
