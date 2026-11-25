# YUTORI FESTIVAL - OPERATIONS CONTROL CENTER

大会運営のタスク、ステージ、判断事項、公開情報と週次レビューを管理するアプリです。

[運営画面](https://yutori0718.github.io/yutori-festival-ops/#/admin) ・ [参加者向け画面](https://yutori0718.github.io/yutori-festival-ops/#/participants) ・ [運用ガイド](docs/USER_GUIDE.md)

## 開発状況

- Google 認証、Firestore の大会別アクセス制御、タスクの共同編集、公開情報の承認・公開・取消を実装しています。
- ステージ管理、週次レビュー、準備項目、メンバー管理、JSON バックアップを実装しています。バックアップはタスク、ステージ、準備項目、未確定事項が対象です。決定済み事項、公開情報、メンバー、各種履歴、週次データは対象外です。
- Firestore Emulator で権限と公開制御、Playwright で保存・再読込を検証しています。本番 Firebase でも未ログインで内部情報の取得が拒否されることを確認しています。
- 大会の内部情報、初期データ、バックアップ、個人情報を公開リポジトリへコミットしないでください。

## ローカル開発

Node.js 22 以降で `npm ci` を実行します。`.env.example` を `.env.local` にコピーし、Firebase の Web アプリ設定を入力して `npm run dev` を実行します。`npm run lint`、`npm test`、`npm run build` で検証できます。

実際の大会で使用するには、Firestore のルールを検証し、本番環境へ適用したうえで、信頼できる管理経路から `events/{eventId}/memberships/{uid}` に最初の管理者を登録する必要があります。Firebase のアクセスルールが拒否設定のままではログイン後も大会データを操作できません。

GitHub Pages への配信は CI 成功と `RELEASE_READY` 変数によって制御されます。公開前に本番構成、権限、情報公開の制御、初期データの取扱いを確認してください。

[実装計画](docs/IMPLEMENTATION_PLAN.md) / [セキュリティ](docs/SECURITY.md) / [テスト結果](docs/TEST_RESULTS.md)
