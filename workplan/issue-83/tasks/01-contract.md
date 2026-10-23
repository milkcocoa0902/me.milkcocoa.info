> 2026-10-22 方針変更: 状態/原本はD1、メールアドレスはWorker Secretの鍵で暗号化、LambdaはSES通知のみ。以下の旧DynamoDB・本文非保存・資格情報cache・通知成功を受付条件にする記述は撤回。[現在の実装/未完了](../README.md)と[運用手順](../../../infra/contact/README.md)を優先する。

# T1: API 契約・保持方針・表示文言

## Source Context / Goal

[親計画](../README.md)。T0 完了後に backend/frontend の共通仕様を固定する。

## Task Breakdown

- [x] `workplan/issue-83/api-contract.md` に JSON schema 相当の項目・文字数/バイト上限、正規化、status/error code とサンプルを定義する。本文は改行を維持、宛先/From/件名の制御文字は拒否。単一メールアドレスだけ許可。
- [ ] UUID と正規化内容 digest による 24 時間の冪等性を定義。トークンは digest から除外。すべての手動再試行は Worker で新しい token を検証後に Invoke する。送信済みの同一 ID/内容は検証済み結果を返し、再送信しない。別内容は 409。
- [ ] `pending / accepted / failed / unknown` の遷移を定義。SES 結果不明は自動再送せず、HTTP エラーでも「確実に未送信」と断定しない。
- [ ] 日/月の全体枠と IP 単位の制限（初期案 3 回/10 分）を確定。IP は既存 Worker の Route Handler で得る信頼できる接続情報を AWS 署名付き payload に含め、Lambda は authenticated ingress の envelope として扱う。クライアント JSON や X-Forwarded-For を無条件に信用しない。制限カウンターには短期 digest を使う。
- [ ] ブラウザーは同一 origin の `/api/contact` だけに送信。別 origin の許可は原則不要。preview は別環境とし、ブラウザーに Cookie・AWS 認証を要求しない。Origin は非ブラウザーから偽造可能と明記。
- [ ] 成功文言「受け付けました。自動返信メールは送信していません」、障害時の入力保持・既存メール案内を定義。利用目的、通知メールでの保存、本文 DB 保存なし、短期 metadata 保持を案内する。

- [ ] browser HTTP 契約と Lambda 内部 event を分離。Worker が入力を検証し Siteverify を通した後、token を除外して信頼できる接続情報を別 envelope に付与する。AWS 署名・host・target ARN は入力から指定させない。

## Expected Behavior / Validation

成功例: `{requestId:"<uuid>",name:"相談者",email:"user@example.net",message:"開発の相談です",turnstileToken:"<token>"}` → 200 accepted。invalid email → 400、期限切れ token → 400、過大 body → 413、制限 → 429、結果不明 → 503。fixture と UI 文言に矛盾がないことを確認。

## Data and Persistence Impact

DynamoDB に本文を保存しない。IP digest・内容 digest も保護対象。TTL は遅延削除なので論理期限と物理保持の違いを明示。メール箱側の保持方針を確認。新規データのみで既存データ移行なし。

## Implementation Order

1. API とエラー契約。
2. 冪等性・制限・障害状態の契約。
3. 個人情報案内と frontend fixtures を確定。
