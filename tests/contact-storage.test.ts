import {test} from "node:test";
import assert from "node:assert/strict";
import {DatabaseSync} from "node:sqlite";
import {readFileSync} from "node:fs";
import {emailEncryption} from "../src/lib/server/contact/encryption";
import {createStoredDelivery, type ContactDatabase, type NotificationResult} from "../src/lib/server/contact/storage";

const input = {requestId: "d66fc392-4c37-40e9-b435-22b7058f643f", name: "相談者", email: "user@example.net", message: "相談の本文", clientIp: "192.0.2.1"};
const key = Buffer.alloc(32, 7).toString("base64");

function setup(outcome: NotificationResult = {status: "sent", messageId: "ses-id"}) {
    const sqlite = new DatabaseSync(":memory:");
    sqlite.exec(readFileSync("migrations/contact/0001_contacts.sql", "utf8"));
    const db: ContactDatabase = {prepare(sql) {
        const statement = sqlite.prepare(sql);
        return {bind(...values) {
            return {async first<T>() {return (statement.get(...values) ?? null) as T | null;},
                async run() {return {meta: {changes: Number(statement.run(...values).changes)}};}};
        }};
    }};
    let sends = 0;
    let now = Date.parse("2026-10-22T12:00:00Z");
    const delivery = createStoredDelivery({db, emailKey: key, now: () => now, notify: async contact => {
        sends++;
        assert.equal(sqlite.prepare("SELECT COUNT(*) AS count FROM contacts WHERE request_id = ?").get(contact.requestId)?.count, 1);
        assert.ok(!("clientIp" in contact));
        return outcome;
    }});
    return {sqlite, db, delivery, get sends() {return sends;}, time(value: number) {now = value;}};
}

test("email encryption uses random IVs, authenticates receipt ID, and rejects bad keys/tampering", async () => {
    const cipher = await emailEncryption(key);
    const encrypted = await cipher.encrypt(input.email, input.requestId);
    assert.equal(await cipher.decrypt(encrypted, input.requestId), input.email);
    assert.notEqual(encrypted, await cipher.encrypt(input.email, input.requestId));
    assert.ok(!encrypted.includes(input.email));
    await assert.rejects(cipher.decrypt(encrypted, "different-id"));
    const parts = encrypted.split(".");
    const bytes = Buffer.from(parts[2], "base64");
    bytes[0] ^= 1;
    await assert.rejects(cipher.decrypt(`${parts[0]}.${parts[1]}.${bytes.toString("base64")}`, input.requestId));
    await assert.rejects(emailEncryption("invalid"));
});

test("D1 original is saved before notification, with encrypted email and IP; replay never sends again", async () => {
    const s = setup();
    try {
        assert.deepEqual(await s.delivery(input), {status: "accepted", requestId: input.requestId});
        const row = s.sqlite.prepare("SELECT * FROM contacts").get()!;
        assert.equal(row.name, input.name);
        assert.equal(row.message, input.message);
        assert.equal(row.client_ip, input.clientIp);
        assert.equal(row.mail_status, "sent");
        assert.equal(row.mail_message_id, "ses-id");
        assert.ok(!JSON.stringify(row).includes(input.email));
        const cipher = await emailEncryption(key);
        assert.equal(await cipher.decrypt(String(row.email_ciphertext), input.requestId), input.email);
        assert.equal((await s.delivery(input)).status, "accepted");
        assert.deepEqual(await s.delivery({...input, message: "different"}), {status: "error", code: "conflict"});
        assert.equal(s.sends, 1);
    } finally {s.sqlite.close();}
});

for (const status of ["failed", "unknown"] as const) {
    test(`notification ${status} leaves the original accepted and does not resend on replay`, async () => {
        const s = setup({status});
        try {
            assert.equal((await s.delivery(input)).status, "accepted");
            assert.equal((await s.delivery(input)).status, "accepted");
            const row = s.sqlite.prepare("SELECT * FROM contacts").get()!;
            assert.equal(row.message, input.message);
            assert.equal(row.mail_status, status);
            assert.equal(s.sends, 1);
        } finally {s.sqlite.close();}
    });
}

test("concurrent repeated IDs create one original and one notification", async () => {
    const s = setup();
    try {
        const results = await Promise.all(Array.from({length: 8}, () => s.delivery(input)));
        assert.ok(results.every(result => result.status === "accepted"));
        assert.equal(s.sends, 1);
        assert.equal(s.sqlite.prepare("SELECT COUNT(*) AS count FROM contacts").get()?.count, 1);
    } finally {s.sqlite.close();}
});

test("atomic SQL enforces rolling IP limit and UTC day/month limits", async () => {
    const s = setup();
    try {
        const event = (i: number) => ({...input, requestId: `d66fc392-4c37-40e9-b435-${String(i).padStart(12, "0")}`});
        const results = await Promise.all(Array.from({length: 6}, (_, i) => s.delivery(event(i))));
        assert.equal(results.filter(result => result.status === "accepted").length, 3);
        assert.equal(s.sends, 3);
        s.time(Date.parse("2026-10-22T12:10:01Z"));
        assert.equal((await s.delivery(event(10))).status, "accepted");
        // Populate the other 46 originals without notification to reach the daily cap.
        for (let i = 0; i < 46; i++) s.sqlite.prepare("INSERT INTO contacts (request_id,name,email_ciphertext,message,client_ip,created_at) VALUES (?,?,?,?,?,?)")
            .run(`seed-${i}`, "name", "ciphertext", "message", "other-ip", Date.parse("2026-10-22T00:00:00Z") / 1000);
        assert.deepEqual(await s.delivery(event(11)), {status: "error", code: "rate_limited"});
        s.time(Date.parse("2026-10-23T00:00:00Z"));
        assert.equal((await s.delivery(event(12))).status, "accepted");
        for (let i = 0; i < 449; i++) s.sqlite.prepare("INSERT INTO contacts (request_id,name,email_ciphertext,message,client_ip,created_at) VALUES (?,?,?,?,?,?)")
            .run(`month-${i}`, "name", "ciphertext", "message", "other-ip", Date.parse("2026-10-01T00:00:00Z") / 1000);
        assert.deepEqual(await s.delivery(event(13)), {status: "error", code: "rate_limited"});
        s.time(Date.parse("2026-11-01T00:00:00Z"));
        assert.equal((await s.delivery(event(14))).status, "accepted");
    } finally {s.sqlite.close();}
});

test("bad encryption key or unavailable database cannot send; mail/status failures cannot lose original", async () => {
    const s = setup();
    try {
        let sends = 0;
        const notify = async (): Promise<NotificationResult> => {sends++; throw new Error("timeout");};
        const invalid = createStoredDelivery({db: s.db, emailKey: "", notify});
        assert.deepEqual(await invalid(input), {status: "error", code: "unavailable"});
        assert.equal(sends, 0);
        const brokenDb: ContactDatabase = {prepare() {throw new Error("D1 unavailable");}};
        assert.deepEqual(await createStoredDelivery({db: brokenDb, emailKey: key, notify})(input), {status: "error", code: "unavailable"});
        assert.equal(sends, 0);
        const updateFailure: ContactDatabase = {prepare(sql) {if (sql.startsWith("UPDATE")) throw new Error("status write failed"); return s.db.prepare(sql);}};
        const delivery = createStoredDelivery({db: updateFailure, emailKey: key, notify});
        assert.equal((await delivery(input)).status, "accepted");
        assert.equal((await delivery(input)).status, "accepted");
        assert.equal(sends, 1);
        assert.equal(s.sqlite.prepare("SELECT mail_status FROM contacts").get()?.mail_status, "pending");
    } finally {s.sqlite.close();}
});
