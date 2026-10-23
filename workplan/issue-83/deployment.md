# デプロイ方針

2026-10-22 更新。状態と原本はD1、LambdaはSES通知のみ。旧DynamoDB案と本文を保存しない方針は撤回。

実装に対応する設定・コマンド・停止/復旧は [infra/contact/README.md](../../infra/contact/README.md) を参照。AWSは同じリポジトリのSAMを既存短期プロファイルで手動deployする。既存Cloudflare CIにAWS自動deployを混ぜない。CIでは秘密値/実AWSなしでテスト・型チェック・SAM validate/buildを行う。

本番公開前に既存SES/権限/quota、D1、暗号鍵/Turnstile/起点キー、ARN、公開サイトキーを設定し、実受信と原本保存を確認する。この作業では実環境へのdeployは行っていない。

Cloudflare側でビルド・デプロイを設定するため、公開サイトキーはそのビルド環境へ渡す。GitHub Actionsのdeployワークフロー変更は本作業の前提にしない。
