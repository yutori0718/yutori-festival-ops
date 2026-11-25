# デプロイ手順

- GitHub Pages の Source は GitHub Actions を選択します。VS Code 等で作業する場合も、公開リポジトリには運営データを保存しません。
- GitHub Actions のリポジトリ変数に、Firebase Web アプリの `VITE_FIREBASE_API_KEY`、`VITE_FIREBASE_AUTH_DOMAIN`、`VITE_FIREBASE_PROJECT_ID`、`VITE_FIREBASE_APP_ID` を登録します。Firebase Authentication の承認済みドメインに Pages のドメインを登録します。
- Firestore Rules の変更は Emulator でテストし、`firebase deploy --only firestore:rules --project <対象プロジェクトID>` で適用します。対象プロジェクトと適用するコミットを確認します。
- 運営管理者は Google ログインを一度実施します。Firebase Console の Authentication で対象者の UID を確認し、Firestore Console から `events/{eventId}/memberships/{uid}` を作成して `role` を文字列 `admin` に設定します。既に認可されている管理者がいる場合、メンバー登録には運営画面を使用します。
- 初期データやバックアップは運営の非公開保管先に保存し、管理者が対象大会のバックアップ画面から投入します。
- `RELEASE_READY` が `true` のとき、main の CI が成功したコミットを Pages に自動デプロイします。Actions で CI と Deploy to GitHub Pages の両方を確認してください。
- 初回公開後は運営 URL で Google ログインと大会データ、参加者向け URL で公開情報の表示を確認します。
