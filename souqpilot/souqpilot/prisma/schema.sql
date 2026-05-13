-- ============================================================
--  SouqPilot — PostgreSQL Schema v2.0
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ── USERS ─────────────────────────────────────────────────────
CREATE TABLE users (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email               CITEXT      NOT NULL UNIQUE,
    password_hash       TEXT        NOT NULL,
    full_name           TEXT        NOT NULL,
    avatar_url          TEXT,
    role                TEXT        NOT NULL DEFAULT 'buyer'
                                    CHECK (role IN ('buyer','seller','admin')),
    email_verified      BOOLEAN     NOT NULL DEFAULT FALSE,
    stripe_customer_id  TEXT        UNIQUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_email ON users(email);

-- ── PRODUCTS ──────────────────────────────────────────────────
CREATE TABLE products (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id       UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           TEXT          NOT NULL,
    slug            TEXT          NOT NULL UNIQUE,
    description     TEXT,
    category        TEXT          NOT NULL
                                  CHECK (category IN ('ebook','course','software','template','other')),
    price           NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    currency        CHAR(3)       NOT NULL DEFAULT 'USD',
    s3_key          TEXT          NOT NULL,
    s3_bucket       TEXT          NOT NULL,
    preview_url     TEXT,
    thumbnail_url   TEXT,
    is_published    BOOLEAN       NOT NULL DEFAULT FALSE,
    download_limit  INTEGER       NOT NULL DEFAULT 5,
    file_size_bytes BIGINT,
    version         TEXT          NOT NULL DEFAULT '1.0',
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_products_seller    ON products(seller_id);
CREATE INDEX idx_products_category  ON products(category);
CREATE INDEX idx_products_slug      ON products(slug);

-- ── ORDERS ────────────────────────────────────────────────────
CREATE TABLE orders (
    id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    product_id          UUID          NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    status              TEXT          NOT NULL DEFAULT 'pending'
                                      CHECK (status IN ('pending','completed','refunded','failed')),
    total_amount        NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
    currency            CHAR(3)       NOT NULL DEFAULT 'USD',
    payment_provider    TEXT          CHECK (payment_provider IN ('stripe','paypal')),
    payment_intent_id   TEXT          UNIQUE,
    stripe_session_id   TEXT          UNIQUE,
    paypal_capture_id   TEXT          UNIQUE,
    paid_at             TIMESTAMPTZ,
    refunded_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_orders_user    ON orders(user_id);
CREATE INDEX idx_orders_product ON orders(product_id);
CREATE INDEX idx_orders_status  ON orders(status);

-- ── DOWNLOAD_LINKS ────────────────────────────────────────────
CREATE TABLE download_links (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    token           TEXT        NOT NULL UNIQUE,
    expires_at      TIMESTAMPTZ NOT NULL,
    click_count     INTEGER     NOT NULL DEFAULT 0,
    max_clicks      INTEGER     NOT NULL DEFAULT 5,
    last_used_at    TIMESTAMPTZ,
    ip_address      INET,
    revoked         BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_dl_token   ON download_links(token);
CREATE INDEX idx_dl_order   ON download_links(order_id);
CREATE INDEX idx_dl_expires ON download_links(expires_at);

-- ── TRANSACTIONS ──────────────────────────────────────────────
CREATE TABLE transactions (
    id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id          UUID          NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    event_type        TEXT          NOT NULL,
    provider          TEXT          NOT NULL,
    provider_event_id TEXT          UNIQUE,
    amount            NUMERIC(10,2) NOT NULL,
    currency          CHAR(3)       NOT NULL,
    status            TEXT          NOT NULL,
    raw_payload       JSONB         NOT NULL,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── REFRESH_TOKENS ────────────────────────────────────────────
CREATE TABLE refresh_tokens (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT        NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked     BOOLEAN     NOT NULL DEFAULT FALSE,
    ip_address  INET,
    user_agent  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── UPDATED_AT TRIGGER ────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DO $$ DECLARE t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['users','products','orders'] LOOP
        EXECUTE format(
          'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %s
           FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
    END LOOP;
END; $$;
