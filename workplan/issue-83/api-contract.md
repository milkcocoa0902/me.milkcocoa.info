# お問い合わせ API 契約

2026-10-22 改訂。原本は D1、Lambda は通知のみ。

## 公開 API

`POST https://me.milkcocoa.info/api/contact`。同一 Origin、JSON UTF-8、32 KiB以内。GET/HEAD/OPTIONS・prefetch・描画からDB保存/通知は行わない。

```json
{"requestId":"d66fc392-4c37-40e9-b435-22b7058f643f","name":"相談者","email":"user@example.net","message":"相談内容","turnstileToken":"token"}
```

5項目だけ受け付ける。requestIdはUUID v4。nameは200 Unicodeコードポイント、emailは254文字以内の単一アドレス、messageは8000コードポイント、tokenは2048 UTF-16コード単位以内。前後空白を除去、改行をLFに統一する。ヘッダーへの制御文字混入、未知フィールド、添付、利用者指定宛先は拒否する。共通定義は `src/lib/contact/contract.ts`。

処理順は Host/path/Origin・サイズ・入力 → Cloudflare の接続 IP → Siteverify（success/hostname/action=business_contact）→ D1保存 → 通知。毎回新しい token を検証し、token を保存しない。

## 保存と通知

D1 の contacts に requestId・氏名・暗号化メールアドレス・本文・IP・受付日時・メール状態/MessageIdを保存する。暗号鍵はWorker Secret `CONTACT_EMAIL_ENCRYPTION_KEY`（32ランダムバイトのbase64）。AES-256-GCM、ランダム96bit IV、受付IDをAADとして改ざん/行差替えを検出する。本文等へ利用者が書いたメールアドレスの自動抽出や置換はしない。

原本保存成功を `200 {"status":"accepted","requestId":"..."}` とする。メール失敗でも保存済みなら成功。`mail_status` は pending/sent/failed/unknown。通知失敗時も原本とIPを保持する。ログには原本・メール・IP・token・秘密値を出さない。

同じID/同じ内容は再通知せず成功を返す。別内容なら409。保存済み内容との照合時にメールを復号する。自動削除/24時間TTLは設けず、保持期間は公開前に運用方針を確定する。メール再通知は手動照合後の運用で扱い、ブラウザー再試行を再送ボタンにしない。

上限は日50件/月500件（UTC）、同じIPは直近10分に3件。独立したカウンターは作らず、同じテーブルのindex付き件数を1つの条件付きINSERTで確認する。通知失敗でも枠を消費する。全体枠は金額ハードキャップではない。

## 応答

| HTTP | code | 意味 |
|---|---|---|
| 200 | accepted | 原本をD1に保存済み |
| 400 | invalid_input / invalid_token | 入力・token不正 |
| 403 | forbidden | Host/Origin/検証hostname/action不一致 |
| 409 | conflict | 同じIDで保存済みの内容と不一致 |
| 413 | too_large | サイズ超過 |
| 415 | unsupported_type | JSON以外等 |
| 429 | rate_limited | 受付上限 |
| 503 | unavailable | D1保存未確認・鍵/外部依存の設定不足等 |
| 503 | unknown | 通信等で受付結果を確認できない |

エラーは `{status:"error",code}`、入力時は任意のfields。Cache-Control:no-store。通信断では同じIDを維持して手動再試行すれば保存済み原本を再利用できる。

## Lambda 内部イベント

`{requestId,name,email,message}` の4項目だけ。Workerで保存できた新規原本だけを通知する。token/IP/verified/暗号鍵は渡さない。From/To/件名はサーバー固定、emailは検証済みReply-To。応答は `{status:"sent",messageId}` または `{status:"failed"|"unknown"|"invalid_input"}`。Lambdaの応答を公開APIの受付成功判定には使わない。

SDK/Siteverify/Invoke/SESは試行1回・有限timeout。unknown/pendingはメール箱と受付IDで照合し、勝手に再送しない。詳細は [運用手順](../../infra/contact/README.md)。
