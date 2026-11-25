import {readFileSync} from 'node:fs';
import {before, after, test} from 'node:test';
import {initializeTestEnvironment, assertFails, assertSucceeds} from '@firebase/rules-unit-testing';
import {doc, getDoc, setDoc, updateDoc, serverTimestamp} from 'firebase/firestore';
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

