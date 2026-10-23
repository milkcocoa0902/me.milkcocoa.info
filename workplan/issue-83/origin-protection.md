# Cloudflare を入口とするオリジン保護の比較

2026-10-20 改訂。AssumeRole 専用の起点キーを Worker に置く方式をユーザーが許容。ユーザー要件: Lambda Function URL の一般公開を避け、Cloudflare でオリジンを保護する。ただし必要以上に構成を複雑にしない。

既存 Next.js/Worker の `POST /api/contact` への統合を基本とする。別 Worker は必須ではなく、性能や独立運用の必要性が確認されたときだけ同一リポジトリ内で分離する。

## 判断基準

URL をブラウザーに表示しないことだけでは保護にならない。オリジンのアドレスが判明しても、認証を通らなければ Lambda handler を起動できない構成を目標とする。ネットワークを VPC 内に閉じることまでは初期要件とせず、AWS の公開 API による IAM 認証を許容するかを区別する。

## 比較

| 案 | オリジンへの直接アクセス | 追加構成・認証 | 判断 |
|---|---|---|---|
| **既存 Worker の Route Handler → SigV4 Lambda Invoke API** | IAM の呼び出し権限が必要。Function URL を作らない | 既存 Worker に POST Route Handler、AssumeRole 起点キーと呼出専用ロール | この方式で計画を進める（実環境は T0。Lambda 費用はブロッカー外） |
| Worker → `AWS_IAM` Function URL | IAM 認証で handler 起動前に拒否 | 同じ SigV4 認証情報が必要、Function URL も残る | URL 不要の Invoke API 案を優先 |
| Worker → CloudFront → OAC → `AWS_IAM` Function URL | Lambda は指定 distribution のみを許可。CloudFront の公開 URL への迂回は別途防ぐ必要がある | CloudFront distribution/OAC と viewer request の秘密ヘッダー検証等。Worker/AWS 間の共有 secret は残る | AWS 長期キーを避けたい場合の代案。初期の単純さでは劣る |
| Worker → `NONE` Function URL + Lambda 内 secret 検査 | Lambda は起動してから拒否する | 共有 secret 1 個 | 不正アクセスの Lambda 実行を防げず第一候補にしない |
| Cloudflare DNS proxy + Origin/CORS/IP 制限だけ | 匿名の AWS endpoint を塞ぐ根拠にならない | 見かけ上は軽い | 不採用 |

CloudFront を置くだけでは「Cloudflare のみが入口」にならない。CloudFront の既定ドメイン/別経路を拒否する検査を追加する必要がある。OAC は CloudFront→Lambda の認証であり、Cloudflare→CloudFront の認証を代替しない。

## Invoke API 案の権限境界

- Worker Secrets に置く起点キーの principal は、特定の呼出専用ロール ARN への `sts:AssumeRole` のみを許可。Lambda を直接 Invoke する権限は付けない。
- 引受先ロールの trust policy は起点 principal を限定する。ロールの権限は `lambda:InvokeFunction` を受付 Lambda の本番 alias ARN 1 個に限定。SES/他 Lambda/デプロイ/ポリシー変更/さらなる AssumeRole は許可しない。
- SES の権限は Lambda 実行ロールだけ。以前の「AWS の長期キーを新設しない」案からの変更点。2026-10-20 にユーザーがこの範囲の起点認証情報を許容。認証情報の実作成は計画段階では行わない。
- 起点キーは Worker Secrets へ保管し、frontend・Git・ログへ出さない。regional STS endpoint と固定 RoleArn/RoleSessionName を設定し、利用者入力で変更させない。
- AssumeRole では `DurationSeconds=900`（15分）を要求する。初期実装は件数が少ないため資格情報cache/single-flightを作らず、原本の新規保存時だけ取得して通知に使う。DB/ブラウザーには保存しない。SDKの自動retryを無効化し、有限timeoutにする。
- ロールの MaxSessionDuration は最小設定が 1 時間であり、900 秒要求と混同しない。起点キーを無効化しても発行済みセッションが即時失効するとは限らない。緊急時は Lambda の同時実行 0、セッション失効/権限拒否を含む停止手順を用意する。
- 起点キーのローテーション（新キー→Worker 更新→確認→旧キー削除）を運用手順に含める。STS があるだけで流出時に安全とは扱わず、継続的な AssumeRole に使われ得る起点キー自体を保護する。
- AWS の公開 Invoke API に到達できること自体は防がない。IAM 権限がない主体による handler 起動を防ぐ方式であり、VPC private endpoint と同じものではない。
- AWS アカウント管理者など、既に権限を持つ主体を除いて呼び出し元を限定する。キー流出時にはこの関数を呼べるリスクは残るため、Lambda 側の受付上限/固定宛先/入力検証を維持。Turnstile は Worker に置く。

## Cloudflare 側の境界

- `src/app/api/contact/route.ts` の POST に受付を統合し、既存 Wrangler/Cloudflare deploy を継続使用する。STS/Invoke は `src/lib/server/contact/` にまとめ、`server-only` で client import を防ぐ。
- GET/prefetch/描画/module 初期化では AWS を呼ばない。#65 の RSC retry から送信処理を分けるために、別 Worker が必須とはみなさない。GET/HEAD/OPTIONS/通常ページ遷移で STS/Invoke が 0 回であることを確認する。
- 公開受付は正規ホストの POST だけ。Worker が method/body size/origin を検査し、既存 Cloudflare プランで利用可能な WAF/rate 制限を適用してから AWS に送る。
- Turnstile は既存 Worker が検証し、success/hostname/action の一致後にだけ AssumeRole/Invoke を進める。有効な短期 credential がある場合は再利用する。
- invalid/expired token、Siteverify timeout/失敗の場合は新規 STS/Invoke をしない。Lambda は IAM で限定した呼出元を信頼し、入力・上限・冪等性を検証する。token は Lambda に渡さず、同じ token の二重 Siteverify も行わない。
- Worker はオープン proxy にしない。送信先/関数 alias/リージョンは固定し、利用者の AWS URL・ヘッダー・署名を転送しない。
- `workers.dev` / preview URL は本番受付の迂回路にしない。無効化設定・正規 Host 検査・適用する WAF の経路を検証する。
- 統合では deploy/Secrets/可用性を共有する。同一アカウントの Workers Free 日次枠は別 Worker に分けても共有され、#65 発生時の quota まで独立しない。枠超過は fail closed でメール送信を停止する。
- 既存 OpenNext の Route Handler 全体が Free の CPU 枠内で完了するかを T0 の実測条件にする。達成できないときに自動で Paid 化しない。
- Worker と Lambda の retry は有限、原則 1 回。Invoke API は HTTP 200 でも `FunctionError` を返し得るため、transport・Lambda error・アプリケーション応答を分けて UI 用 status へ変換。

## Implementation Order

1. 了承済みの AssumeRole 方式で起点 principal / trust / invoke ロールの権限を具体化。
2. 既存 Route Handler 統合・CPU/IAM の小さな検証。Lambda コストの追加審査では作業を止めない。
3. 採用案で T0–T6 の境界とテスト項目を統一する。
4. オリジンへの unsigned access、別関数/alias、Cloudflare 迂回路が拒否されることを実装時に確認。

## 公式資料

- [Lambda Invoke API](https://docs.aws.amazon.com/lambda/latest/api/API_Invoke.html)
- [Lambda の特定関数/alias に限定した IAM 権限](https://docs.aws.amazon.com/lambda/latest/dg/lambda-api-permissions-ref.html)
- [CloudFront OAC による Lambda URL 保護](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-lambda.html)
- [Cloudflare Routes](https://developers.cloudflare.com/workers/configuration/routing/routes/)
- [Worker Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)

- [STS AssumeRole とセッション期限](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html)

## 分割が必要と分かった場合の管理

本リポジトリ内の `services/contact-edge/` にコードと `wrangler.jsonc` を置き、各 Worker の name/config/secret/deploy 対象を明示する。root scripts から config を指定して開発・deploy できる。別リポジトリにはしない。統合より deploy と Secrets の管理が増えるため、測定や独立運用の要件がない段階では導入しない。

- [OpenNext bindings](https://opennext.js.org/cloudflare/bindings)
- [複数 Worker の開発](https://developers.cloudflare.com/workers/local-development/multi-workers/)
