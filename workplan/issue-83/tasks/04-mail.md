> 2026-10-22 方針変更: 状態/原本はD1、メールアドレスはWorker Secretの鍵で暗号化、LambdaはSES通知のみ。以下の旧DynamoDB・本文非保存・資格情報cache・通知成功を受付条件にする記述は撤回。[現在の実装/未完了](../README.md)と[運用手順](../../../infra/contact/README.md)を優先する。

# T4: SES 通知と結果不明時の扱い

## Source Context / Goal

[親計画](../README.md)、T3。受け付けた相談を自分の既存受信箱で確認・返信できる。お問い合わせ者への送信は実装しない。

## Task Breakdown

- [ ] AWS SDK の実行ロールによる SES client を使用し、固定 From/To、検証済み Reply-To、本文と受付 ID を送信する。SDK の最大試行回数を 1 にし、送信 API の不確実な自動 retry を避ける。
- [ ] 日本語・改行を含む plain text を基本とし、入力をメールヘッダーへ直接連結しない。添付・CC/BCC・利用者指定宛先は受け付けない。
- [ ] SES の成功結果後に状態を accepted とし、requestId/messageId を照合可能にする。messageId はログの検索キーとして慎重に扱い、本文/アドレスをログに出さない。
- [ ] 明確な送信失敗と timeout/送信直後のクラッシュ/状態更新失敗を区別。後者は unknown、または期限切れ pending を unknown と解釈し、同一 ID の自動再送をしない。
- [ ] unknown の運用照合手順を作る。アプリに本文がないため自動復旧できない限界、メール箱/SES 既存ログと受付 ID で照合する方法を記載。必要なら後段で本文保持キューを別途設計。
- [ ] API が成功しても受信箱への到着保証ではない。既存 SES の bounce/complaint 運用を再利用し、通知先での実受信・Reply-To を確認する。

2026-10-22: SES adapter（固定From/To/件名・UTF-8 plain text・検証済みReply-To・受付ID）、SDK maxAttempts=1・有限timeout、accepted/failed/unknown保存と再送防止、unknownの照合手順を実装。明確な拒否だけfailedとして同じIDの手動再予約を許可し、受付枠を再消費。実SES/受信箱/Reply-ToとIAMの拒否確認は未実施。

## Validation

mock SES による timeout・拒否・重複・送信後状態更新失敗を検証。別宛先を IAM が拒否すること、unknown を再試行しても送信が増えないこと、宛先入力が存在しないことを確認。実送信は管理下の宛先に少数のみ。Postfix/SES の DNS 差分がないことを確認。

## Implementation Order

1. 固定宛先の SES adapter と mail format。
2. 状態遷移と障害テスト。
3. 自分宛て実受信・返信と運用照合。
