CREATE TABLE expense_groups
(
    id          BIGSERIAL    PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    created_by  BIGINT       NOT NULL REFERENCES users (id),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE group_members
(
    group_id  BIGINT      NOT NULL REFERENCES expense_groups (id) ON DELETE CASCADE,
    user_id   BIGINT      NOT NULL REFERENCES users (id),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (group_id, user_id)
);

CREATE TABLE shared_expenses
(
    id           BIGSERIAL      PRIMARY KEY,
    group_id     BIGINT         NOT NULL REFERENCES expense_groups (id) ON DELETE CASCADE,
    paid_by      BIGINT         NOT NULL REFERENCES users (id),
    title        VARCHAR(200)   NOT NULL,
    amount       NUMERIC(19, 4) NOT NULL,
    currency     VARCHAR(3)     NOT NULL DEFAULT 'PLN',
    expense_date DATE           NOT NULL,
    split_mode   VARCHAR(10)    NOT NULL,
    created_at   TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE TABLE expense_splits
(
    id            BIGSERIAL      PRIMARY KEY,
    expense_id    BIGINT         NOT NULL REFERENCES shared_expenses (id) ON DELETE CASCADE,
    user_id       BIGINT         NOT NULL REFERENCES users (id),
    share_amount  NUMERIC(19, 4) NOT NULL,
    share_percent NUMERIC(6, 3),
    is_settled    BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ    NOT NULL DEFAULT now()
);
