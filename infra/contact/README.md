# お問い合わせの設定・運用

既存 Worker が Turnstile を検証し、D1に原本を保存してから IAM Invoke で Lambda を呼ぶ。Lambdaは既存SESで通知するだけ。DynamoDB・キュー・Function URL・API Gateway・新Worker・KMS/SSMは作らない。

## D1 と暗号鍵

`wrangler.jsonc` に CONTACT_DB / business-contact を定義した。database_id はまだ未設定。Wranglerの自動provisioningで次回deploy時に作成され得るため、実公開前に明示的に作成・UUIDを設定してからmigrationを適用する。今回リモートDBは作成していない。

```sh
npx wrangler d1 create business-contact
# 返された database_id を wrangler.jsonc の CONTACT_DB に設定
npx wrangler d1 migrations apply CONTACT_DB --remote
```

ローカルのschema確認は `npx wrangler d1 migrations apply CONTACT_DB --local`。新しい外部DBやORMは不要。日/月/IPの枠と原本の予約を1つのINSERTで行い、D1障害なら通知しない。原本は自動削除せず、公開前に保持期間・削除手順を決める。

メールアドレスは AES-256-GCM。**32ランダムバイトをbase64にした値**を環境変数 `CONTACT_EMAIL_ENCRYPTION_KEY` に置く。本番は `wrangler secret put`、ローカルはGit管理外の`.dev.vars`を使う（`.dev.vars.example`参照）。NEXT_PUBLICには置かない。受付ごとに96bitランダムIVを生成し、受付IDをAADにする。

暗号鍵はDBに保存しない。鍵の紛失は復号不能となる。既存行を再暗号化するまでは旧鍵を保持し、単純に鍵だけ差し替えない。今回KMS・鍵管理サービス・自動ローテーション基盤は追加しない。メールアドレス欄だけを暗号化し、氏名/本文/IPは原本として保存する。

## Worker の設定

| 名前 | 場所/用途 |
|---|---|
| NEXT_PUBLIC_TURNSTILE_SITE_KEY | ビルド環境。Widgetの公開キー |
| TURNSTILE_SECRET_KEY | Worker Secret。Siteverify |
| CONTACT_EMAIL_ENCRYPTION_KEY | Worker Secret。メールアドレス暗号化 |
| CONTACT_AWS_ACCESS_KEY_ID / CONTACT_AWS_SECRET_ACCESS_KEY | Worker Secrets。AssumeRole専用起点 |
| CONTACT_AWS_ROLE_ARN | Worker vars。呼出専用ロール |
| CONTACT_LAMBDA_ALIAS_ARN | Worker vars。固定live alias。regionもここから取得 |

サイトキーの有無を画面で確認可能。Widget表示をAWS受付状態に連動させない。AWS設定が未完了でもD1保存成功なら受付済みとし、通知状態をfailedとして残す。

本番のビルド・デプロイはCloudflare側で設定する。`NEXT_PUBLIC_TURNSTILE_SITE_KEY` はCloudflareのビルド環境に設定してからビルドする。Worker実行時の環境変数に追加するだけでは静的ページへ反映されない。

WorkerはSiteverify成功・原本の新規保存後にのみ標準AWS SDKでAssumeRole（900秒）→同期Invokeを行う。キャッシュや自作署名を作らず、どちらも試行1回。STSは3秒、Invokeは6秒まで。限定権限の短期credentialをブラウザー/DBに保存しない。正規Host/Origin以外のpreviewから本番受付は許可しない。

## Lambda の検証・deploy

Node.js 24とSAM CLIを使う。実装時はSAM 1.169.0 / cfn-lint 1.53.3で検証。AWS認証はローカル検証には不要。

```sh
npm --prefix services/contact-api ci
npm --prefix services/contact-api test
npm --prefix services/contact-api run typecheck
export PATH="$PWD/services/contact-api/node_modules/.bin:$PATH"
sam validate --lint --region ap-northeast-1 --template-file infra/contact/template.yaml
sam build --template-file infra/contact/template.yaml --build-dir infra/contact/.aws-sam/build
```

実deploy前に既存SESと同じaccount/region、SES identity・通知先/sandbox、予約同時実行quota、短期deployプロファイルの権限を確認する。regionの検証例は実SESリージョンの確定値ではない。`infra/contact/`へ移動し、exampleをGit管理外のsamconfig.tomlへコピーする。

```sh
sam deploy --guided --config-env prod \
  --config-file "$PWD/samconfig.toml" \
  --template-file .aws-sam/build/template.yaml \
  --profile <短期認証プロファイル> --region <既存SESリージョン> \
  --resolve-s3 --capabilities CAPABILITY_IAM
```

SesIdentityは既存domain/email identity名、FromAddress/ToAddressは固定アドレス。128MiB・5秒・予約同時実行1、ログ7日。AWS実環境の変更はchange setと費用を確認してから行う。今回実deployはしていない。

SAMはLambda/live alias/version、ログ、実行ロール、起点IAM userとAssumeRole先を作る。起点キー自体はCloudFormationで作らず、管理者が安全な操作で作成してWorker Secretsに登録する。Outputsに秘密値を出さない。実行ロールは既存identityの固定From/ToへのSendEmailと対象ログのみ。呼出ロールはlive aliasのInvokeのみ。SES/DNS/Postfixを更新しない。

## 通知失敗・停止

受付成功はD1への保存成功。メール通知失敗でも入力を受け付けたことに変わりはない。D1の `mail_status` はpending/sent/failed/unknown。sentだけMessageIdを保存する。SDKのSES試行は1回・1800ms。メール本文やアドレスをログへ出さない。

failed/unknown/pendingの原本を受付IDで確認し、既存受信箱/SES記録と照合する。pendingは処理途中または通知状態の保存失敗を含む。メール再送キュー・自動再送・管理画面は追加していない。ブラウザーで同じIDを再試行しても重複通知しない。必要な再通知は配送の有無を確認してから運用で対応する。DB照会結果・復号した原本を公開ログへ貼らない。

通知の緊急停止は予約同時実行を0にする。D1での受付は継続する。実値を使う。

```sh
aws lambda put-function-concurrency --function-name <FunctionName> \
  --reserved-concurrent-executions 0 --profile <短期プロファイル> --region <SESリージョン>
```

停止後はIaCのReservedConcurrencyも整合させる。再開は原因確認後に1へ戻す。受付全体を停止する場合はWorkerの受付を停止するコード/設定をdeployする。鍵失効だけでは発行済みSTS sessionを即時停止できない。旧version/SAM成果物S3/ログの保持は管理者が定期整理する。

## 確認範囲

単体テストは実SQLiteでD1用SQL・暗号化/復号・原本保持・重複/上限、モックでSTS/Invoke/SESを確認する。Wrangler localでmigrationを確認。実IAMの許可/拒否、Turnstile→D1→SESの実結合、CPU/実受信/Reply-Toは公開前に別途確認する。
