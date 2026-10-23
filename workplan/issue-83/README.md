# Issue #83: お問い合わせフォーム

2026-10-22 改訂。ユーザーの最新方針を正とする。オーバーエンジニアリングを避け、状態と原本は既存 Worker の D1、Lambda は SES 通知だけにする。旧 DynamoDB 案は撤回。実環境の変更はまだ行っていない。

## 構成

```text
ブラウザー → 既存 Worker の POST /api/contact
              → 入力・Host/Origin・Turnstile 検証
              → D1 に原本・IP・受付日時・通知状態を保存
              → STS AssumeRole → IAM Invoke → Lambda → 既存 SES
```

メールアドレスは Worker の環境変数（Secret）の32バイト鍵で AES-256-GCM 暗号化して D1 に保存する。氏名・本文・IP は原本として保存する。Lambda に IP・token・暗号鍵・DB 権限を渡さない。AWS側にDB・キュー・Function URL・API Gateway・KMS/SSMを追加しない。既存 SES identity/DNS/Postfix は変更しない。

**受付成功は D1 の原本保存成功。メール通知成功とは分ける。** 通知失敗でも原本は残り、同一 ID の再送信はメールを重複送信しない。自動再送・管理画面・独立したカウンターテーブル・資格情報キャッシュは作らない。

## 実装済み

- フォーム/導線、入力と Turnstile 検証、公開 API。
- D1 の1テーブルとマイグレーション。原本保存と日/月/IPの受付上限を1つの INSERT で判定。
- メールアドレスの暗号化/復号、ランダム IV、受付 ID への認証紐付け。
- D1 保存後だけ STS/Invoke。標準SDKで署名し、試行1回。Lambda は入力再検証と固定 From/To の SES 通知のみ。
- 最小 SAM/IAM、独立 Lambda パッケージ、テスト、手動運用手順、CI検証。

## 未完了

- 実 AWS account/region、既存 SES identity/通知先/sandbox、予約同時実行 quota、最小権限の実許可・拒否の確認。
- リモート D1 の作成/マイグレーション、Worker Secrets・ARN・公開サイトキーの実値設定。
- Cloudflare 上の CPU 実測、実 Turnstile → D1 → Lambda → SES、受信箱/Reply-To の確認。
- 原本・IP の運用上の保持期間と削除手順の確定。現状は自動削除しない。

## ローカル検証（2026-10-22）

Worker/SQL/暗号化/通知アダプターのテスト21件、Lambdaのテスト3件、lint、root/Lambdaの型チェックが成功。Wrangler local D1へのmigration、SAM validate --lint / build、Cloudflare向けOpenNext buildが成功。実AWS/リモートD1/実メール送信は未実施。

## 文書

- [API契約](api-contract.md)
- [設定・デプロイ・通知失敗時の確認](../../infra/contact/README.md)
- [Lambdaパッケージ](../../services/contact-api/README.md)
- [オリジン保護](origin-protection.md)

Issue更新・commit/push・PR作成は実装条件にしない。AWS/Cloudflareへの実deployはこの変更では行わない。
