CREATE TABLE budgets
(
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    category_id  BIGINT         NOT NULL REFERENCES categories (id) ON DELETE CASCADE,
    month_year   DATE           NOT NULL,
    limit_amount NUMERIC(19, 4) NOT NULL,
    currency     VARCHAR(3)     NOT NULL DEFAULT 'PLN',
    created_at   TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ    NOT NULL DEFAULT now(),
    UNIQUE (user_id, category_id, month_year)
);
