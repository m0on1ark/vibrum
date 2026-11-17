CREATE TABLE bank_accounts
(
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    account_name  VARCHAR(100) NOT NULL,
    bank_type     VARCHAR(20)  NOT NULL,
    base_currency VARCHAR(3)   NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE exchange_rates
(
    id            BIGSERIAL PRIMARY KEY,
    currency_code VARCHAR(3)     NOT NULL,
    rate_date     DATE           NOT NULL,
    rate          NUMERIC(10, 4) NOT NULL,
    created_at    TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ    NOT NULL DEFAULT now(),
    UNIQUE (currency_code, rate_date)
);

CREATE TABLE transactions
(
    id                BIGSERIAL PRIMARY KEY,
    bank_account_id   BIGINT         NOT NULL REFERENCES bank_accounts (id) ON DELETE CASCADE,
    transaction_date  DATE           NOT NULL,
    original_amount   NUMERIC(15, 2) NOT NULL,
    original_currency VARCHAR(3)     NOT NULL,
    amount_in_pln     NUMERIC(15, 2) NOT NULL,
    exchange_rate     NUMERIC(10, 4) NOT NULL,
    title             VARCHAR(255)   NOT NULL,
    recipient         VARCHAR(255),
    transaction_hash  VARCHAR(64)    NOT NULL,
    category_id       BIGINT REFERENCES categories (id) ON DELETE SET NULL,
    created_at        TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ    NOT NULL DEFAULT now(),
    UNIQUE (bank_account_id, transaction_hash)
);