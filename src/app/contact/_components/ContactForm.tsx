"use client";

import {useCallback, useEffect, useRef, useState, type FormEvent} from "react";
import {CONTACT_EMAIL, CONTACT_LIMITS, CONTACT_PATH, validateFields, type ContactFields, type FieldErrors} from "@/lib/contact/contract";
import {contactErrorMessages, prepareAttempt, submitContact, type ContactAttempt} from "@/lib/contact/client";
import {TurnstileWidget} from "./TurnstileWidget";

const empty: ContactFields = {name: "", email: "", message: ""};
const inputClass = "mt-2 min-h-12 w-full rounded-xs border border-slate-500 bg-slate-950 px-3 py-2 text-base text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 aria-invalid:border-rose-400 disabled:opacity-60";

function CharacterCounter({id, value, limit}: {id: string; value: string; limit: number}) {
    const count = Array.from(value).length;
    const overLimit = count > limit;
    return <p id={id} className={`mt-2 text-right text-sm tabular-nums ${overLimit ? "text-rose-300" : "text-slate-400"}`}>
        {count.toLocaleString("ja-JP")} / {limit.toLocaleString("ja-JP")} 文字{overLimit && "（上限超過）"}
    </p>;
}

export function ContactForm({siteKey = ""}: {siteKey?: string}) {
    const [fields, setFields] = useState<ContactFields>(empty);
    const [errors, setErrors] = useState<FieldErrors>({});
    const [notice, setNotice] = useState("");
    const [accepted, setAccepted] = useState("");
    const [receipt, setReceipt] = useState("");
    const [sending, setSending] = useState(false);
    const [token, setToken] = useState("");
    const [resetCounter, setResetCounter] = useState(0);
    const attempt = useRef<ContactAttempt | null>(null);
    const inFlight = useRef(false);
    const controller = useRef<AbortController | null>(null);
    const form = useRef<HTMLFormElement>(null);
    const canSend = Boolean(siteKey);
    const onToken = useCallback((value: string) => setToken(value), []);
    const onTurnstileError = useCallback(() => {setToken(""); setNotice("送信前の確認を読み込めませんでした。通信状況を確認するか、メールでご連絡ください。");}, []);
    useEffect(() => () => controller.current?.abort(), []);

    function update(key: keyof ContactFields, value: string) {
        setFields(previous => ({...previous, [key]: value}));
        setErrors(previous => ({...previous, [key]: undefined}));
        attempt.current = null;
        setReceipt("");
        setAccepted("");
        setNotice("");
    }

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (inFlight.current) return;
        setAccepted("");
        const validation = validateFields(fields);
        setErrors(validation);
        const firstError = (Object.keys(validation) as (keyof ContactFields)[])[0];
        if (firstError) {
            setNotice("入力内容を確認してください。");
            form.current?.querySelector<HTMLElement>(`[name="${firstError}"]`)?.focus();
            return;
        }
        if (!canSend) {setNotice("Turnstile のサイトキーが未設定です。メールでご連絡ください。"); return;}
        if (!token) {setNotice("送信前の確認が完了するまでお待ちください。期限切れの場合は再度確認してください。"); return;}
        attempt.current = prepareAttempt(fields, attempt.current);
        const requestId = attempt.current.requestId;
        setReceipt(requestId);
        inFlight.current = true;
        setSending(true);
        setNotice("送信しています。しばらくお待ちください。");
        const abort = new AbortController();
        controller.current = abort;
        const timer = setTimeout(() => abort.abort(), 15000);
        try {
            const result = await submitContact({...fields, requestId, turnstileToken: token}, abort.signal);
            if (result.status === "accepted") {
                setAccepted(result.requestId);
                setFields(empty);
                attempt.current = null;
                setReceipt("");
                setNotice("受け付けました。自動返信メールは送信していません。");
            } else setNotice(contactErrorMessages[result.code]);
        } finally {
            clearTimeout(timer);
            controller.current = null;
            inFlight.current = false;
            setSending(false);
            setToken("");
            setResetCounter(value => value + 1);
        }
    }

    return <form ref={form} action={CONTACT_PATH} method="post" onSubmit={submit} noValidate aria-busy={sending} className="space-y-6">
        {!canSend && <p className="rounded-xs border border-amber-400/50 bg-amber-950/20 p-4 text-sm leading-7 text-amber-100">
            Turnstile のサイトキーが未設定のため、送信前の確認を表示できません。現在は <a className="break-all underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> へご連絡ください。
        </p>}
        <noscript><p>フォームの送信にはJavaScriptが必要です。メールでもお問い合わせいただけます。</p></noscript>
        <fieldset disabled={sending} className="min-w-0 space-y-6">
            <legend className="mb-4 font-mono text-sm text-slate-300">お問い合わせ内容（すべて必須）</legend>
            <div>
                <label htmlFor="contact-name" className="block font-semibold">お名前／組織名</label>
                <input id="contact-name" name="name" autoComplete="name" required maxLength={CONTACT_LIMITS.name * 2}
                    value={fields.name} onChange={e => update("name", e.target.value)}
                    aria-invalid={Boolean(errors.name)} aria-describedby="contact-name-hint contact-name-error" className={inputClass} />
                <CharacterCounter id="contact-name-hint" value={fields.name} limit={CONTACT_LIMITS.name} />
                <p id="contact-name-error" className="mt-1 text-sm text-rose-300">{errors.name}</p>
            </div>
            <div>
                <label htmlFor="contact-email" className="block font-semibold">返信先メールアドレス</label>
                <input id="contact-email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false}
                    required maxLength={CONTACT_LIMITS.email} value={fields.email} onChange={e => update("email", e.target.value)}
                    aria-invalid={Boolean(errors.email)} aria-describedby="contact-email-hint contact-email-error" className={inputClass} />
                <CharacterCounter id="contact-email-hint" value={fields.email} limit={CONTACT_LIMITS.email} />
                <p id="contact-email-error" className="mt-1 text-sm text-rose-300">{errors.email}</p>
            </div>
            <div>
                <label htmlFor="contact-message" className="block font-semibold">お問い合わせ内容</label>
                <textarea id="contact-message" name="message" required rows={9} maxLength={CONTACT_LIMITS.message * 2}
                    value={fields.message} onChange={e => update("message", e.target.value)}
                    aria-invalid={Boolean(errors.message)} aria-describedby="contact-message-count contact-message-hint contact-message-error"
                    className={`${inputClass} resize-y`} />
                <CharacterCounter id="contact-message-count" value={fields.message} limit={CONTACT_LIMITS.message} />
                <p id="contact-message-error" className="mt-1 text-sm text-rose-300">{errors.message}</p>
            </div>
        </fieldset>
        <section aria-labelledby="contact-privacy" className="space-y-2 text-sm leading-7 text-slate-300">
            <h2 id="contact-privacy" className="font-semibold text-slate-100">入力情報の取り扱い</h2>
            <p>入力いただいた情報は、ご相談の確認と返信のために利用し、運営者のデータベースに保存します。データベース上の返信先メールアドレスは暗号化します。</p>
            <p>迷惑送信や重複送信を防ぐため、IPアドレス・受付日時・通知メールの送信状態を記録します。</p>
            <p>自動返信メールは送信しません。</p>
        </section>
        {canSend && <TurnstileWidget siteKey={siteKey} resetCounter={resetCounter} onToken={onToken} onError={onTurnstileError} />}
        <button type="submit" disabled={!canSend || sending}
            className="min-h-12 rounded-xs border border-teal-400 bg-teal-950 px-5 py-3 font-semibold text-teal-100 hover:bg-teal-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-300 disabled:cursor-not-allowed disabled:opacity-50">
            {sending ? "送信中…" : "相談を送信する"}
        </button>
        <div role="status" aria-live="polite" aria-atomic="true" className="space-y-2 break-words text-sm leading-7">
            <p>{notice}</p>
            {(accepted || receipt) && <p>受付ID: <span className="break-all font-mono">{accepted || receipt}</span></p>}
        </div>
        <p className="text-sm leading-7 text-slate-300">メールでのご相談: <a className="break-all text-teal-300 underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
    </form>;
}
