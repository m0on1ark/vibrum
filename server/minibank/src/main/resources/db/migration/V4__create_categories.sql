CREATE TABLE categories
(
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT REFERENCES users (id) ON DELETE CASCADE,
    name       VARCHAR(100) NOT NULL,
    type       VARCHAR(20)  NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uk_categories_system_name ON categories (lower(name)) WHERE user_id IS NULL;
CREATE UNIQUE INDEX uk_categories_user_name ON categories (user_id, lower(name)) WHERE user_id IS NOT NULL;

INSERT INTO categories (name, type)
VALUES ('Spożywcze', 'EXPENSE'),
       ('Restauracje', 'EXPENSE'),
       ('Transport', 'EXPENSE'),
       ('Sport', 'EXPENSE'),
       ('Rozrywka', 'EXPENSE'),
       ('Subskrypcje', 'EXPENSE'),
       ('Zdrowie', 'EXPENSE'),
       ('Mieszkanie', 'EXPENSE'),
       ('Rachunki', 'EXPENSE'),
       ('Zakupy', 'EXPENSE'),
       ('Inne', 'EXPENSE'),
       ('Wynagrodzenie', 'INCOME'),
       ('Przelewy przychodzące', 'INCOME');
