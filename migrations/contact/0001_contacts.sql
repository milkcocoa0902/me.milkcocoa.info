CREATE TABLE contacts (
    request_id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    email_ciphertext TEXT NOT NULL,
    message TEXT NOT NULL,
    client_ip TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    mail_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (mail_status IN ('pending', 'sent', 'failed', 'unknown')),
    mail_message_id TEXT
);
CREATE INDEX contacts_created_at ON contacts(created_at);
CREATE INDEX contacts_ip_created_at ON contacts(client_ip, created_at);
