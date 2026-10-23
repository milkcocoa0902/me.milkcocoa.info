> 2026-10-22 方針変更: 状態/原本はD1、メールアドレスはWorker Secretの鍵で暗号化、LambdaはSES通知のみ。以下の旧DynamoDB・本文非保存・資格情報cache・通知成功を受付条件にする記述は撤回。[現在の実装/未完了](../README.md)と[運用手順](../../../infra/contact/README.md)を優先する。

# T0: 実環境・実装準備の確認

## Source Context

[親計画](../README.md)、Issue #83 / #65、ユーザー回答「同居可能だが基盤なし、Lambda も検討」。

## Goal / Boundary Decision

採用方針の既存 Worker → Turnstile → AssumeRole → Lambda → SES を実装するための、アカウント・権限・quota を確認する。2026-10-21 のユーザー判断により、Lambda の費用評価・総額 cap は実装のブロッカーとしない。この確認タスク自体では AWS リソースを作成しない。

## Task Breakdown

- [ ] 現在の SES アカウント・リージョン・検証済み identity・sandbox・既存送信量を確認。既存の通知用 From/To、bounce/complaint 運用を選ぶ。宛先が sandbox 条件を満たすことを確認。
- [ ] Lambda Node.js ランタイム・同期 Invoke API の制限、予約同時実行 1 を設定できるアカウント quota を確認。未予約枠の制約があるため、新規アカウントでも設定可能と決めつけない。
- [ ] AWS CLI の既存 SSO/プロファイルでデプロイできるか確認。デプロイ用 IAM user/アクセスキーを作らない。実行時の起点キーは AssumeRole 専用として了承済み。具体的な権限を確認し、計画段階では作らない。CI 自動デプロイは初期段階に不要。
- [ ] DynamoDB の初期 capacity、ログ保持など、必要なリソース設定を確定する。不要な追加サービスを作らない。
- [ ] 日月受付件数・ログ保持の実値を運用に合わせて確定する。受付上限で攻撃者が枠を使い切る可用性上の制約も記録。

- [ ] 公開 Function URL 案を撤回。AssumeRole 起点 principal・trust policy・invoke 専用ロールを既存 AWS アカウントに作れるか確認する。CloudFront/OAC は初期構成に追加しない。
- [ ] 既存 Worker の `src/app/api/contact/route.ts` 統合、OpenNext overhead を含む Free CPU 枠での Siteverify・STS cold/warm・短期セッション更新・SigV4 署名、WAF の適用範囲、workers.dev/preview 無効化、Free 共有枠の影響を確認する。

## Affected Files / Validation

`workplan/issue-83/README.md` に対象リージョン・利用する identity・権限と quota の確認結果を追記。アカウント実測と公式資料の裏付けを残す。秘密情報は文書に記載しない。本番デプロイに必要なアカウント・権限・quota を確認する。Lambda 費用の再試算や上限保証を理由に作業を保留しない。

## Implementation Order

1. SES・Lambda の既存環境を確認。
2. Worker 統合の実行条件と受付制限の設定を確認。
3. 実装に必要な設定値を親計画へ反映。
