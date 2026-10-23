# contact-api

Node.js 24 の独立した Lambda パッケージ。通知イベントの入力を再検証し、固定宛先にSESメールを1回送る。DB・受付制限・原本保存・冪等性はWorker/D1の担当。LambdaにD1権限・暗号鍵は不要。

```sh
npm ci
npm test
npm run typecheck
npm run build
```

From/Toは環境変数 `CONTACT_FROM` / `CONTACT_TO`。AWS認証はLambda実行ロール。token/IPを含まない4項目のイベントと、設定/手動deploy/運用は [infra/contact](../../infra/contact/README.md) を参照。単体テストは実AWS・SESを呼ばない。
