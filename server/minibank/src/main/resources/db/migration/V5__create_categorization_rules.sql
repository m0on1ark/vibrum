CREATE TABLE categorization_rules
(
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT REFERENCES users (id) ON DELETE CASCADE,
    category_id BIGINT       NOT NULL REFERENCES categories (id) ON DELETE CASCADE,
    match_type  VARCHAR(20)  NOT NULL,
    target      VARCHAR(20)  NOT NULL DEFAULT 'ANY',
    pattern     VARCHAR(255) NOT NULL,
    priority    INT          NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_categorization_rules_user_id ON categorization_rules (user_id);
CREATE INDEX idx_categorization_rules_category_id ON categorization_rules (category_id);

INSERT INTO categorization_rules (category_id, match_type, pattern)
SELECT c.id, 'KEYWORD', r.pattern
FROM (VALUES ('Spożywcze', 'BIEDRONKA'),
             ('Spożywcze', 'LIDL'),
             ('Spożywcze', 'ZABKA'),
             ('Spożywcze', 'KAUFLAND'),
             ('Spożywcze', 'CARREFOUR'),
             ('Spożywcze', 'AUCHAN'),
             ('Spożywcze', 'DINO'),
             ('Restauracje', 'MCDONALDS'),
             ('Restauracje', 'KFC'),
             ('Restauracje', 'PYSZNE.PL'),
             ('Restauracje', 'GLOVO'),
             ('Restauracje', 'WOLT'),
             ('Transport', 'UBER'),
             ('Transport', 'BOLT'),
             ('Transport', 'JAKDOJADE'),
             ('Transport', 'PKP'),
             ('Transport', 'ORLEN'),
             ('Transport', 'SHELL'),
             ('Sport', 'ZDROFIT'),
             ('Sport', 'MULTISPORT'),
             ('Sport', 'DECATHLON'),
             ('Subskrypcje', 'NETFLIX'),
             ('Subskrypcje', 'SPOTIFY'),
             ('Subskrypcje', 'YOUTUBE PREMIUM'),
             ('Subskrypcje', 'DISNEY PLUS'),
             ('Subskrypcje', 'HBO MAX'),
             ('Zdrowie', 'APTEKA'),
             ('Zdrowie', 'LUX MED'),
             ('Zdrowie', 'MEDICOVER'),
             ('Zakupy', 'ALLEGRO'),
             ('Zakupy', 'ZALANDO'),
             ('Zakupy', 'ROSSMANN'),
             ('Rachunki', 'PGE'),
             ('Rachunki', 'TAURON'),
             ('Rachunki', 'ORANGE'),
             ('Rachunki', 'PLAY'),
             ('Wynagrodzenie', 'WYNAGRODZENIE')) AS r(category, pattern)
         JOIN categories c ON c.name = r.category AND c.user_id IS NULL;
