> 2026-10-22 方針変更: 状態/原本はD1、メールアドレスはWorker Secretの鍵で暗号化、LambdaはSES通知のみ。以下の旧DynamoDB・本文非保存・資格情報cache・通知成功を受付条件にする記述は撤回。[現在の実装/未完了](../README.md)と[運用手順](../../../infra/contact/README.md)を優先する。

# T3: Worker の Turnstile 検証・Lambda の受付制御

## Source Context / Boundary Decision

[親計画](../README.md)、T1/T2。2026-10-21 改訂。**入力検証 → Worker で Siteverify → AssumeRole/短期 credential 再利用 → Invoke** の順。Lambda は限定された IAM の呼出元を信頼し、入力・受付上限・冪等性を検証する。同じ token を両方で検証しない。

## Task Breakdown

- [x] 既存 `src/app/api/contact/route.ts` の POST と `src/lib/server/contact/` に host/path/method/origin/Content-Type/body size/各フィールドの早期検証を実装。GET/描画/import の副作用として外部呼び出しを行わない。
- [ ] 利用可能な Cloudflare WAF/rate 制限を Siteverify 前の防御として使う。Lambda/DynamoDB の IP・全体制限は Invoke 後に行う。AWS へ送る前に必須の永続 IP 制限が必要と判明したら、既存 Cloudflare プランの機能を確認し、追加基盤を黙って作らない。
- [ ] Worker Secrets の Turnstile secret で Siteverify を呼び、success・期待 hostname・action=`business_contact` を確認。token の 5 分有効/単回使用、有限 timeout を扱う。通信エラーや不正/不一致は fail closed。安全な API retry が必要なら同一 idempotency_key を用いた有限回に限定し、初期案は 1 回とする。
- [ ] 上の検証がすべて成功してから STS AssumeRole/短期 credential 再利用と固定 alias の署名付き同期 Invoke。利用者の Authorization/AWS header/target URL は使用せず、RoleArn/リージョン/alias は設定値に固定。
- [ ] 起点キーでは直接 Invoke せず、短期 credential の SessionToken を含め SigV4 署名。送信 body と署名対象を一致させ、transport error・FunctionError・アプリ応答を区別する。
- [ ] STS 取得/更新を single-flight 化し、900 秒要求・Expiration に基づく期限前更新・cold start・更新失敗を扱う。invalid Siteverify の要求が STS の cache warming を引き起こさないようにする。
- [ ] Lambda event は Worker が構築し、元 token を含めない。Lambda で内部 schema・各フィールド上限/メール形式を再検証。ブラウザーの自己申告した verified フラグでセキュリティを成立させない。Lambda の署名認証は AWS 側、呼出権限は特定 role/alias に限定する。
- [ ] Lambda に DynamoDB の IP 制限・日月の全体受付枠・同一 ID の条件付き受付予約を実装。状態保存/throttling 障害時は送信しない。SDK retry を無制限にしない。
- [ ] Worker を通過した同一 ID/内容が accepted なら Lambda は前回結果を返して再送しない。別内容は 409。同一内容の手動再試行でも Worker は毎回新しい token を要求する。
- [ ] 並行送信・日月境界・TTL 未削除・再起動でも重複防止/受付上限を維持。global cap は受付数の制御であり、Lambda/Worker の金額 hard cap と同等に扱わない。

2026-10-21: Siteverifyアダプターとモック試験を追加。secretの登録・取得と本番Route Handlerへの接続はAWS受付実装に合わせて行うため、実環境を含むTurnstileの項目は未完了のまま。本番Route Handlerは受付停止。

2026-10-22: Lambdaの内部schema再検証、DynamoDB原子的なID/日/月/IP受付予約、accepted再利用・別内容conflict・期限切れpendingのunknown解釈・論理TTL・条件付き状態更新を実装。IP制限はUTC epochの固定10分窓。WorkerのSTS/SigV4/Invokeは未実装。AWS/IAM実環境の結合検証は未完了。

## Validation

Worker tests では invalid/expired/reused token、hostname/action 不一致、Siteverify timeout のすべてで STS/Invoke が 0 回であることを確認。有効な要求では Siteverify → 必要時 STS → Invoke の順序を確認し、cache が有効なら STS が増えないことも検証する。

Lambda tests は token のない内部 event を使い、入力不正/上限超過/同一 ID 並行送信/期限切れ metadata/状態障害で送信が増えないことを確認。ブラウザーの直接アクセスや署名なし Invoke を AWS が拒否することは結合試験で確認する。

GET/HEAD/OPTIONS/RSC prefetch/描画/import は Siteverify/STS/Invoke すべて 0 回。秘密値/本文/token をログに出さない。mock で試験し本番 SES/Siteverify を大量に呼ばない。既存 Worker 全体の Free CPU 枠の実測も行う。

## Implementation Order

1. Worker の入力検証・Siteverify adapter・失敗時 AWS 非呼び出しテスト。
2. STS/署名/Invoke と内部 envelope、cold/warm/session 更新テスト。
3. Lambda の入力再検証・永続状態・受付制限・並行送信テスト。
