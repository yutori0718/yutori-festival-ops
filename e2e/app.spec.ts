import {test,expect} from '@playwright/test';
import {initializeTestEnvironment} from '@firebase/rules-unit-testing';
import {doc,setDoc} from 'firebase/firestore';
const email='ops-test@example.invalid',password='test-only-password';
test.beforeAll(async()=>{const res=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})});const data=await res.json();if(!res.ok)throw Error(JSON.stringify(data));const env=await initializeTestEnvironment({projectId:'demo-yutori-ops'});await env.withSecurityRulesDisabled(async ctx=>setDoc(doc(ctx.firestore(),'events/e2e/memberships',data.localId),{role:'admin'}));await env.cleanup();});
test('タスクを保存し再読込後も確認できる',async({page})=>{await page.goto('/yutori-festival-ops/#/admin');await page.getByRole('button',{name:'テスト用ログイン'}).click();await page.getByLabel('大会 ID').fill('e2e');await page.getByRole('button',{name:'接続'}).click();await expect(page.getByRole('heading',{name:'ダッシュボード'})).toBeVisible();await page.getByRole('link',{name:'全タスク',exact:true}).click();await page.getByLabel('タスク名').fill('テストタスク');await page.getByRole('button',{name:'保存',exact:true}).click();await expect(page.getByRole('status').filter({hasText:'保存しました'})).toBeVisible();await page.reload();await expect(page.getByRole('button',{name:/テストタスク/})).toBeVisible();await page.getByText('状態を一括更新').click();await page.getByLabel('テストタスク').check();await page.getByLabel('変更後の状態').selectOption('対応中');page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'選択した 1 件を更新'}).click();await expect(page.getByRole('button',{name:/テストタスク/})).toContainText('対応中');await page.getByRole('link',{name:'大会ステージ',exact:true}).click();await page.getByLabel('ステージ名').fill('検証ステージ');await page.getByRole('button',{name:'保存',exact:true}).click();await expect(page.getByRole('status').filter({hasText:'保存しました'})).toBeVisible();await page.reload();await expect(page.getByRole('button',{name:/検証ステージ/})).toBeVisible();await page.getByRole('link',{name:'未確定・決定事項',exact:true}).click();await page.getByLabel('タイトル').fill('検証判断');await page.getByRole('button',{name:'保存',exact:true}).click();await expect(page.getByRole('button',{name:/検証判断/})).toBeVisible();await page.getByRole('button',{name:/検証判断/}).click();await page.getByLabel('状態').selectOption('決定済み');await page.getByLabel('決定内容').fill('検証決定');await page.getByRole('button',{name:'保存',exact:true}).click();await expect(page.getByRole('button',{name:/検証判断/})).toContainText('決定済み');await page.reload();await expect(page.getByRole('button',{name:/検証判断/})).toContainText('決定済み');});


test('同時編集の競合を検出する',async({browser})=>{
 const context=await browser.newContext();const first=await context.newPage();
 await first.goto('/yutori-festival-ops/#/admin');await first.getByRole('button',{name:'テスト用ログイン'}).click();await first.getByLabel('大会 ID').fill('e2e');await first.getByRole('button',{name:'接続'}).click();await first.getByRole('link',{name:'全タスク',exact:true}).click();
 await first.getByLabel('タスク名').fill('同時編集テスト');await first.getByRole('button',{name:'保存',exact:true}).click();await expect(first.getByRole('button',{name:/同時編集テスト/})).toBeVisible();
 const second=await context.newPage();await second.goto('/yutori-festival-ops/#/admin/tasks');await expect(second.getByRole('button',{name:/同時編集テスト/})).toBeVisible();
 await first.getByRole('button',{name:/同時編集テスト/}).click();await second.getByRole('button',{name:/同時編集テスト/}).click();
 await first.getByLabel('次のアクション').fill('先の変更');await first.getByRole('button',{name:'保存',exact:true}).click();await expect(first.getByRole('button',{name:/同時編集テスト/})).toContainText('先の変更');
 await second.getByLabel('次のアクション').fill('後の変更');await second.getByRole('button',{name:'保存',exact:true}).click();await expect(second.getByRole('status')).toContainText('別の編集が先に保存されました');await context.close();
});

test('承認した情報だけを公開し取り消せる',async({browser})=>{
 const context=await browser.newContext();const page=await context.newPage();await page.goto('/yutori-festival-ops/#/admin');await page.getByRole('button',{name:'テスト用ログイン'}).click();await page.getByLabel('大会 ID').fill('e2e');await page.getByRole('button',{name:'接続'}).click();await page.getByRole('link',{name:'情報公開',exact:true}).click();
 await page.getByLabel('タイトル').fill('公開検証');await page.getByLabel('内容').fill('参加者向けの検証');await page.getByLabel('確度').selectOption('確定');await page.getByLabel('公開解禁日時（日本時間）').fill('2020-01-01T00:00');await page.getByRole('button',{name:'下書き保存'}).click();await expect(page.getByRole('button',{name:'承認',exact:true})).toBeVisible();
 const publicContext=await browser.newContext();const participant=await publicContext.newPage();await participant.goto('/yutori-festival-ops/#/participants');await participant.getByLabel('大会 ID').fill('e2e');await participant.getByRole('button',{name:'表示'}).click();await expect(participant.getByText('公開情報はありません。')).toBeVisible();
 await page.getByRole('button',{name:'承認',exact:true}).click();await expect(page.getByRole('button',{name:'公開',exact:true})).toBeVisible();await page.getByRole('button',{name:'公開',exact:true}).click();await expect(participant.getByRole('heading',{name:'公開検証'})).toBeVisible();
 page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'公開取消'}).click();await expect(participant.getByRole('heading',{name:'公開検証'})).toHaveCount(0);await publicContext.close();await context.close();
});


test('バックアップを復元して再実行しても重複を作らない',async({page})=>{
 await page.goto('/yutori-festival-ops/#/admin');
 await page.getByRole('button',{name:'テスト用ログイン'}).click();
 await page.getByLabel('大会 ID').fill('e2e');
 await page.getByRole('button',{name:'接続'}).click();
 await page.getByRole('link',{name:'バックアップ',exact:true}).click();
 const record={id:'backup-stage',kind:'stages',fields:{name:'復元ステージ',date:'',confidence:'未確定',details:'',attributes:'{}',checklist:'{}'}};
 const file={name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({eventId:'e2e',version:1,exportedAt:'2026-01-01T00:00:00Z',records:[record]}))};
 await page.getByLabel('バックアップファイル').setInputFiles(file);
 await expect(page.getByText(/既存 ID 0 件/)).toBeVisible();
 page.once('dialog',dialog=>dialog.accept());
 await page.getByRole('button',{name:'確認して復元'}).click();
 await expect(page.getByRole('status')).toContainText('復元 1件');
 await expect(page.getByText('JSON 復元',{exact:true}).last()).toBeVisible();
 await page.getByLabel('バックアップファイル').setInputFiles(file);
 await expect(page.getByText(/既存 ID 1 件/)).toBeVisible();
 page.once('dialog',dialog=>dialog.accept());
 await page.getByRole('button',{name:'確認して復元'}).click();
 await expect(page.getByRole('status')).toContainText('復元 0件、既存のためスキップ 1件');
 const download=page.waitForEvent('download');
 await page.getByRole('button',{name:'JSON を出力'}).click();
 expect((await download).suggestedFilename()).toBe('operations-backup.json');
});


test('開始と終了を保存して締切・開催日と区別して表示する',async({page})=>{
 await page.goto('/yutori-festival-ops/#/admin');
 await page.getByRole('button',{name:'テスト用ログイン'}).click();
 await page.getByLabel('大会 ID').fill('e2e');
 await page.getByRole('button',{name:'接続'}).click();
 await page.getByRole('link',{name:'全タスク',exact:true}).click();
 await page.getByLabel('タスク名').fill('期間検証タスク');
 await page.getByLabel('開始予定日',{exact:true}).fill('2027-02-01');
 await page.getByLabel('終了予定日',{exact:true}).fill('2027-02-03');
 await page.getByLabel('期限',{exact:true}).fill('2027-02-05');
 await page.getByRole('button',{name:'保存',exact:true}).click();
 await expect(page.getByRole('button',{name:/期間検証タスク/})).toBeVisible();
 await page.getByRole('link',{name:'大会ステージ',exact:true}).click();
 await page.getByLabel('ステージ名').fill('準備期間検証ステージ');
 await page.getByLabel('準備開始日',{exact:true}).fill('2027-01-25');
 await page.getByLabel('準備終了予定日',{exact:true}).fill('2027-02-02');
 await page.getByLabel('開催日（未定の場合は空欄）',{exact:true}).fill('2027-02-07');
 await page.getByRole('button',{name:'保存',exact:true}).click();
 await expect(page.getByRole('button',{name:/準備期間検証ステージ/})).toBeVisible();
 await page.getByRole('link',{name:'ガントチャート',exact:true}).click();
 await page.reload();
 const task=page.locator('.timeline-row').filter({has:page.getByRole('button',{name:'期間検証タスク',exact:true})});
 const stage=page.locator('.timeline-row').filter({has:page.getByRole('button',{name:'準備期間検証ステージ',exact:true})});
 await expect(task).toContainText('開始 2027-02-01 / 終了 2027-02-03');
 await expect(task).toContainText('締切 2027-02-05');
 await expect(stage).toContainText('開始 2027-01-25 / 終了 2027-02-02');
 await expect(stage).toContainText('開催日 2027-02-07');
 await expect(task.locator('.timeline-period')).toBeVisible();
 await expect(stage.locator('.timeline-milestone')).toBeVisible();
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 await page.getByRole('button',{name:'準備期間検証ステージ',exact:true}).click();
 await expect(page.getByLabel('準備終了予定日',{exact:true})).toHaveValue('2027-02-02');
});
