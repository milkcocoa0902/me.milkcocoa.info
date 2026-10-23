> 2026-10-22 方針変更: 状態/原本はD1、メールアドレスはWorker Secretの鍵で暗号化、LambdaはSES通知のみ。以下の旧DynamoDB・本文非保存・資格情報cache・通知成功を受付条件にする記述は撤回。[現在の実装/未完了](../README.md)と[運用手順](../../../infra/contact/README.md)を優先する。

# T6: 結合確認・運用文書・段階公開

## Source Context / Goal

[親計画](../README.md)、T2–T5。正常時だけでなく #65 型の再試行・通知障害・受付制限でも想定の境界を保つことを確認して公開する。

[デプロイ手順設計](../deployment.md)に従い、初回・更新・rollback を検証する。

## Task Breakdown

- [ ] Lambda Function URL が作成されていないこと、無署名の Invoke と別 alias が拒否され handler が実行されないことを確認。既存 Worker の正規 host の POST のみ成功し workers.dev/preview/偽 Host からの迂回を防ぐ。
- [ ] 起点キーの失効で新規 AssumeRole が拒否されること、新旧キー切替で復旧できることを確認。既発行の短期セッションは別に扱い、同時実行 0 で直ちに受付を停止できること、セッション失効の手順も確認。ログ/ブラウザー/ビルド成果物に URL・ARN・秘密値を出さない。

- [ ] backend の focused tests、`sam validate --lint` / `sam build`、frontend の `npm run lint` / `npm run cf:build` を実行。独立 backend のテストを path 条件付き CI に追加。CI から実メール送信しない。
- [ ] staging で same ID の同時送信、複数 ID の連続送信、Worker による無効 token の拒否（STS/Invoke 0 回）、悪意ある Origin、過大 body、global cap、DynamoDB throttling、SES timeout、429/非 JSON を確認。
- [ ] ページ遷移/prefetch/refresh を繰り返しても送信しないことを確認。#65 の無限ループを本番で再現せず、モック/制御された回数で検証する。
- [ ] notification は自分だけで、自動返信が送られないことを実受信確認。From/Reply-To、日本語本文、受付 ID、既存 SNS/mailto の利用を確認。
- [ ] `infra/contact/README.md` に deploy/update/rollback、secret 更新、日月上限変更、unknown 照合、メール到着確認、ログ/metadata 保持を記載。ログイベントは PII なし・低カーディナリティを基本とする。
- [ ] 検証失敗/送信失敗/全体枠超過を集約監視し、全リクエストの本文/トークンを出力しない。CloudWatch 費用も評価し、アラートを hard cap と説明しない。
- [ ] 予約同時実行数 0 で endpoint が 429 となり送信が止まること、復旧できることを演習。AWS 障害中もサイトと既存メール連絡手段は利用可能なことを確認。
- [ ] backend の既知 commit を SAM で先にデプロイし、stack の CREATE_COMPLETE/UPDATE_COMPLETE、live alias/version、IAM と少数実送信を確認してから Worker とフォームを公開。AWS の作成・公開は具体的な差分/費用を確認して実行。問題時はフォームを非公開にし、API を停止する。
- [ ] Issue #83 の完了条件を証跡と照合して更新。必要な運用設定と確認結果を反映。Lambda 費用の再評価は公開の追加ゲートにしない。

- [ ] backend と Worker の前後 1 version の契約互換、同一 alias を使った更新、既知 commit の再 deploy による復旧を確認。CloudFormation の更新失敗 rollback と、更新成功後のアプリ不具合の復旧は分けて演習する。

## Data and Compatibility Impact

公開時に既存データ移行なし。rollback で重複防止 metadata を即削除しない。期限内のメール受付・unknown は照合後に扱い、DynamoDB TTL 物理削除の遅延を含めて運用文書を確認する。

## Implementation Order

1. 自動検証と制御された異常系の結合試験。
2. 運用・停止/復旧演習。
3. AWS → API を含むサイト → 実送信 → 導線公開 の順で公開し Issue を更新。
