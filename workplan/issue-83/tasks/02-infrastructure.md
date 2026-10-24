> 2026-10-22 方針変更: 状態/原本はD1、メールアドレスはWorker Secretの鍵で暗号化、LambdaはSES通知のみ。以下の旧DynamoDB・本文非保存・資格情報cache・通知成功を受付条件にする記述は撤回。[現在の実装/未完了](../README.md)と[運用手順](../../../infra/contact/README.md)を優先する。

# T2: 独立した AWS スタック・最小権限・停止手順

## Source Context / Goal

[親計画](../README.md)、T0/T1。Cloudflare の受付は既存 Worker に統合し、AWS の処理だけ独立した制限を設定する。T0 のアカウント・権限確認に沿って IaC を作成する。Lambda 費用評価を前提にしない。

[デプロイ手順設計](../deployment.md)を実行可能な `infra/contact/README.md` に具体化する。初期は SAM の手動 deploy と既存短期認証を使用し、新 AWS CI は作らない。

## Affected Modules

新規 `infra/contact/template.yaml`、`infra/contact/README.md`、`services/contact-api/package.json`・lockfile・独立 `tsconfig.json`、`infra/contact/samconfig.example.toml`。ルート `tsconfig.json` / lint の対象から backend を分離する設定も必要なら変更。Cloudflare 側は既存 `wrangler.jsonc` / `cloudflare-env.d.ts` と既存 deploy workflow を使用し、AWS だけ別 stack/deploy とする。

## Task Breakdown

- [ ] SAM/CloudFormation に Node.js Lambda、alias、最小実行ロール、DynamoDB、期間指定 log group を定義。初期は VPC・NAT・API Gateway・provisioned concurrency を作らない。
- [ ] Invoke API 案では Function URL を作らない。起点 principal には特定ロールへの `sts:AssumeRole` のみ許可し、trust はその principal に限定。引受先ロールに `lambda:InvokeFunction` を本番 alias ARN 1 個だけ許可。起点キーでの直接 Invoke・無署名・別関数/別 alias・別ロールへの AssumeRole は拒否。
- [ ] 既存 `wrangler.jsonc` に必要な vars/Secrets の参照を追加し、型生成で `cloudflare-env.d.ts` を更新。追加 Worker/追加 route/追加 CF pipeline は作らない。Next.js Route Handler から `getCloudflareContext().env` で取得し、正確な host/path と本番受付フラグで preview/迂回を拒否。
- [ ] AssumeRole 専用の起点キーは Worker Secrets に保存し、ローテーション/失効を手順化する。短期 credential は 900 秒要求、isolate メモリ内で期限前まで cache し、発行済みセッションの失効も別に扱う。SES/DynamoDB/他関数/設定変更の権限は一切持たせない。デプロイ用 AWS キーと混用しない。
- [ ] 予約同時実行 1・128 MiB・timeout 5 秒、DynamoDB provisioned capacity と auto scaling 無効、ログ保持 7 日を明示。SES/HTTP SDK retry 数・timeout もアプリ設定と合わせる。
- [ ] `ses:SendEmail` を既存 identity と固定 From/宛先条件に絞る。CC/BCC や別 identity への送信を許可しない。DynamoDB は対象表の必要操作のみ。Turnstile を Worker で検証するため、この目的の SSM/KMS 読み取り権限は付けない。
- [ ] Turnstile secret は既存 Worker Secrets に格納し、値を Git・IaC outputs・frontend・CI log に出さない。公開 sitekey、Cloudflare 受付 path は公開設定として区別。
- [ ] `CONTACT_ENABLED=false` と reserved concurrency 0 の停止手順を用意。前者はメール停止、後者は関数実行停止であることを区別。
- [ ] 既存 SSO/プロファイルで `sam build` / `sam validate --lint` / `sam deploy --guided` の手順を記録。AWS 環境を変更する前に具体的な change set と見積もりを確認できる状態にする。

- [ ] esbuild ZIP build と依存の固定、live alias/version、非公開 `samconfig.toml`、SAM の成果物 S3、必要な IAM capability、初回/更新/rollback を手順化。起点キー/Turnstile secret の作成登録と stack deploy を区別する。
- [ ] `infra/contact/.aws-sam/` と実環境 `samconfig.toml` を ignore し、設定例のみ追跡する。DynamoDB の削除/置換・rollback で状態を失わない方針と、旧 version/成果物の保持・掃除を定義する。

2026-10-22: 独立パッケージ/固定lockfile、SAM（Node.js 24・live alias・version保持・表/ログ保持・同時実行/容量）、CallerUser→InvokeRole→live alias、固定SES identity/From/To制限を実装。ローカルのSAM validate/buildを確認。実環境/Worker Secrets/権限許可・拒否/停止復旧は未検証のため、それらを含むチェックボックスは未完了のまま。具体手順は `infra/contact/README.md`。

## Validation

既存 Worker の secret/vars 設定と Route Handler 統合、署名と各応答変換、IaC validate、IAM の許可/拒否、同一 origin の HTTP 応答・未署名 AWS 呼び出し拒否と 429、concurrency=0 の停止と復旧、secret の非露出を確認。preview は本番宛て送信を禁止。README に region/stack/alias/log/secret/table の場所を記載。DynamoDB の更新/削除で送信履歴・カウンターを不用意に消さない方針を定義。

## Implementation Order

1. 独立パッケージと IaC skeleton。
2. 権限・secret 参照・各リソース制限。
3. validate/change set と停止・復旧手順。
