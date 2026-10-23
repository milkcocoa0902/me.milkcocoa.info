> 2026-10-22 方針変更: 状態/原本はD1、メールアドレスはWorker Secretの鍵で暗号化、LambdaはSES通知のみ。以下の旧DynamoDB・本文非保存・資格情報cache・通知成功を受付条件にする記述は撤回。[現在の実装/未完了](../README.md)と[運用手順](../../../infra/contact/README.md)を優先する。

# T5: お問い合わせフォーム・導線・取扱い案内

## Source Context / Boundary Decision

[親計画](../README.md)、T1。表示は Next.js、送信は利用者の明示操作で同一 origin の既存 Worker の Route Handler `/api/contact` に行う。Lambda URL/ARN や AWS 認証情報は渡さない。T1 後に mock で着手可能。本番結合は T4 後。

## Affected Files

新規 `src/app/contact/page.tsx`・`_components/ContactForm.tsx`、必要に応じて module CSS。既存 `src/app/_common/tui/`、`src/app/_common/header.tsx`、`src/app/page.tsx`、`src/app/sitemap.ts`。公開 sitekey と受付 path のみをビルド設定に渡す。

## Task Breakdown

- [x] 実装開始前に modern-web-guidance スキルでフォーム/入力/エラー通知の現行指針を確認する。`contact --business` の装飾と通常の label/input/textarea を組み合わせる。
- [x] 名前/組織名・返信先メール・本文の最小 3 項目を作る。事業相談を受け付ける説明、個人情報の利用目的・保持・通知先での取扱い、自動返信なしを表示。
- [ ] Turnstile を表示し、期限切れ/失敗/通信失敗後の token 再取得を実装。送信中だけ操作を抑止し、障害時は入力を維持。入力内容を localStorage・URL・analytics に送らない。
- [ ] 明示 submit だけで fetch。GET/prefetch/React effect からメールを送らない。クライアント/SDK の自動再送をしない。送信後 timeout は結果不明を案内して無制限な連打を促さない。
- [ ] 同一内容の手動再試行で requestId を維持、内容変更で再発行。送信を試みた後は必ず Turnstile を reset し、新しい token で再試行する。body に token を含める。`credentials: omit`、有限 timeout、非 JSON/429/5xx を処理。
- [ ] label、autocomplete、required、aria-invalid、エラーの関連付け、aria-live、エラー箇所への focus、キーボード/狭幅/拡大を確認。成功時だけクリアし自動返信なしと受付 ID を表示。
- [ ] ヘッダー/トップに導線を追加し、既存 SNS・`developer@milkcocoa.info` への導線を維持。送信不能時も連絡できるようにする。サイト全体の CSP を導入済みと仮定せず、必要な場合に Turnstile/同一 origin API 接続許可を追加。
- [ ] `/contact` metadata・sitemap を追加。secret や AWS 情報がクライアント bundle に入らないことを確認。

2026-10-21: フォーム・送信状態・Turnstileコンポーネント・手動再試行ID・エラー処理・導線・metadata/sitemapを実装。AWS未接続の間は準備中表示とメール案内を出し、送信を無効化する。375px相当の狭幅で横はみ出しなし、入力・Tab移動・送信無効状態をブラウザーで確認。成功/失敗の通信処理はモックで確認し、実サービスとの結合・スクリーンリーダー実機確認は未完了。AWS側を含む保持設定は公開前に案内と再照合する。

2026-10-22: Widget 表示を受付 API の有効状態から切り離し、`available` フラグを削除。`NEXT_PUBLIC_TURNSTILE_SITE_KEY` をページからフォームへ渡し、設定済みなら送信ボタン直前に Widget を表示する。未設定時はその旨を画面に明示する。開発時は `.env.local`、本番はビルド環境に公開サイトキーを設定する（`.env.example` 参照）。API 側の未接続状態は引き続き 503 で応答する。

2026-10-23: 狭幅対応としてTurnstileを全画面で`compact`（150×140px）へ統一し、コンテナに高さ140pxを確保。320px画面のフォーム内幅254pxにも仕様上収まる。対象ファイルのlintは成功。変更後の実Widgetを使ったブラウザー確認は未実施。

## Validation

mock の成功/不正入力/期限切れ/制限/結果不明/ネットワーク断で状態確認。実装後 `npm run lint` と `npm run cf:build`。モバイル・キーボード・スクリーンリーダー向け状態通知を確認。ブラウザーの Network で送信操作 1 回につき POST 1 回であり、通常遷移/prefetch では POST がないことを確認。

## Implementation Order

1. mock API に対するフォームと入力状態。
2. Turnstile・requestId・障害時処理。
3. 導線/取扱い案内/metadata と Cloudflare 入口への結合。
