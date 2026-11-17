CREATE TABLE detected_subscriptions
(
    id                BIGSERIAL PRIMARY KEY,
    user_id           BIGINT         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    category_id       BIGINT REFERENCES categories (id) ON DELETE SET NULL,
    merchant          VARCHAR(255)   NOT NULL,
    merchant_key      VARCHAR(255)   NOT NULL,
    amount            NUMERIC(15, 2) NOT NULL,
    currency          VARCHAR(3)     NOT NULL,
    billing_period    VARCHAR(20)    NOT NULL,
    occurrences       INT            NOT NULL,
    last_payment_date DATE           NOT NULL,
    next_payment_date DATE           NOT NULL,
    created_at        TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX idx_detected_subscriptions_user_id ON detected_subscriptions (user_id);

CREATE TABLE subscription_dismissals
(
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    merchant_key VARCHAR(255) NOT NULL,
    currency     VARCHAR(3)   NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uk_subscription_dismissals UNIQUE (user_id, merchant_key, currency)
);
