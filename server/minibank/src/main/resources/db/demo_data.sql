-- =====================================================================
-- Demo Seed Data for Presentation (Role 3: Groups, Settlements, Budgets)
-- Users default password: password123
-- =====================================================================

-- 1. Demo Users
INSERT INTO users (id, email, password_hash, display_name, base_currency, role)
VALUES
    (101, 'alice@example.com', '$2a$10$nTBUty4PC8kNevPdqOqEUeff1lXzT8hEPThVjVMRHCta6ue//.xoC', 'Alice Kowalska', 'PLN', 'USER'),
    (102, 'bob@example.com', '$2a$10$nTBUty4PC8kNevPdqOqEUeff1lXzT8hEPThVjVMRHCta6ue//.xoC', 'Bob Nowak', 'PLN', 'USER'),
    (103, 'charlie@example.com', '$2a$10$nTBUty4PC8kNevPdqOqEUeff1lXzT8hEPThVjVMRHCta6ue//.xoC', 'Charlie Wisniewski', 'PLN', 'USER'),
    (104, 'david@example.com', '$2a$10$nTBUty4PC8kNevPdqOqEUeff1lXzT8hEPThVjVMRHCta6ue//.xoC', 'David Zielinski', 'PLN', 'USER')
ON CONFLICT (email) DO NOTHING;

-- 2. Expense Group
INSERT INTO expense_groups (id, name, description, created_by)
VALUES
    (201, 'Wyjazd w Tatry 2026', 'Wspolne wydatki na wyjazd w gory', 101)
ON CONFLICT (id) DO NOTHING;

-- Group Members
INSERT INTO group_members (group_id, user_id)
VALUES
    (201, 101),
    (201, 102),
    (201, 103),
    (201, 104)
ON CONFLICT DO NOTHING;

-- 3. Shared Expenses & Splits
-- Expense 1: Hotel (1200 PLN, paid by Alice, EQUAL split: 300 each)
INSERT INTO shared_expenses (id, group_id, paid_by, title, amount, currency, expense_date, split_mode, exchange_rate, amount_in_pln)
VALUES
    (301, 201, 101, 'Hotel Gorski', 1200.0000, 'PLN', CURRENT_DATE - INTERVAL '3 days', 'EQUAL', 1.000000, 1200.0000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO expense_splits (id, expense_id, user_id, share_amount, share_percent, is_settled, share_amount_in_pln)
VALUES
    (401, 301, 101, 300.0000, NULL, FALSE, 300.0000),
    (402, 301, 102, 300.0000, NULL, FALSE, 300.0000),
    (403, 301, 103, 300.0000, NULL, FALSE, 300.0000),
    (404, 301, 104, 300.0000, NULL, TRUE, 300.0000) -- David already settled with Alice
ON CONFLICT (id) DO NOTHING;

-- Expense 2: Kolacja regionalna (400 PLN, paid by Bob, PERCENT split: Alice 30%, Bob 40%, Charlie 30%)
INSERT INTO shared_expenses (id, group_id, paid_by, title, amount, currency, expense_date, split_mode, exchange_rate, amount_in_pln)
VALUES
    (302, 201, 102, 'Karczma Pod Tatrami', 400.0000, 'PLN', CURRENT_DATE - INTERVAL '2 days', 'PERCENT', 1.000000, 400.0000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO expense_splits (id, expense_id, user_id, share_amount, share_percent, is_settled, share_amount_in_pln)
VALUES
    (405, 302, 101, 120.0000, 30.000, FALSE, 120.0000),
    (406, 302, 102, 160.0000, 40.000, FALSE, 160.0000),
    (407, 302, 103, 120.0000, 30.000, FALSE, 120.0000)
ON CONFLICT (id) DO NOTHING;

-- Expense 3: Paliwo (200 PLN, paid by Charlie, FIXED split)
INSERT INTO shared_expenses (id, group_id, paid_by, title, amount, currency, expense_date, split_mode, exchange_rate, amount_in_pln)
VALUES
    (303, 201, 103, 'Paliwo i autostrada', 200.0000, 'PLN', CURRENT_DATE - INTERVAL '1 day', 'FIXED', 1.000000, 200.0000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO expense_splits (id, expense_id, user_id, share_amount, share_percent, is_settled, share_amount_in_pln)
VALUES
    (408, 303, 101, 80.0000, NULL, FALSE, 80.0000),
    (409, 303, 102, 60.0000, NULL, FALSE, 60.0000),
    (410, 303, 103, 60.0000, NULL, FALSE, 60.0000)
ON CONFLICT (id) DO NOTHING;

-- 4. Budgets for Alice (Current Month) - assigned to system categories
INSERT INTO budgets (user_id, category_id, month_year, limit_amount, currency)
VALUES
    (101, (SELECT id FROM categories WHERE lower(name) = 'spożywcze' AND user_id IS NULL), DATE_TRUNC('month', CURRENT_DATE)::DATE, 1200.0000, 'PLN'),
    (101, (SELECT id FROM categories WHERE lower(name) = 'restauracje' AND user_id IS NULL), DATE_TRUNC('month', CURRENT_DATE)::DATE, 600.0000, 'PLN'),
    (101, (SELECT id FROM categories WHERE lower(name) = 'transport' AND user_id IS NULL), DATE_TRUNC('month', CURRENT_DATE)::DATE, 400.0000, 'PLN')
ON CONFLICT (user_id, category_id, month_year) DO UPDATE
SET limit_amount = EXCLUDED.limit_amount;

-- 5. Bank account and transactions for Alice (last three months)
INSERT INTO bank_accounts (user_id, account_name, bank_type, base_currency)
SELECT 101, 'PKO Konto Osobiste', 'PKO_BP', 'PLN'
WHERE NOT EXISTS (SELECT 1 FROM bank_accounts WHERE user_id = 101 AND account_name = 'PKO Konto Osobiste');

INSERT INTO transactions (bank_account_id, transaction_date, original_amount, original_currency, amount_in_pln,
                          exchange_rate, title, recipient, transaction_hash, category_id)
SELECT a.id, v.tx_date, v.amount, 'PLN', v.amount, 1.0000, v.title, v.recipient,
       md5('demo-tx-' || v.n) || md5('demo-tx-' || v.n || '-hash'), c.id
FROM (VALUES
    (1,  DATE_TRUNC('month', CURRENT_DATE)::DATE,                                6500.00, 'Wynagrodzenie',            'Firma XYZ Sp. z o.o.', 'Wynagrodzenie'),
    (2,  (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month')::DATE,         6500.00, 'Wynagrodzenie',            'Firma XYZ Sp. z o.o.', 'Wynagrodzenie'),
    (3,  (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '2 months')::DATE,        6500.00, 'Wynagrodzenie',            'Firma XYZ Sp. z o.o.', 'Wynagrodzenie'),
    (4,  DATE_TRUNC('month', CURRENT_DATE)::DATE,                                -184.30, 'BIEDRONKA 1234 WARSZAWA',  'Jeronimo Martins',     'Spożywcze'),
    (5,  (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month')::DATE,         -212.75, 'BIEDRONKA 1234 WARSZAWA',  'Jeronimo Martins',     'Spożywcze'),
    (6,  (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '2 months')::DATE,        -160.40, 'BIEDRONKA 1234 WARSZAWA',  'Jeronimo Martins',     'Spożywcze'),
    (7,  DATE_TRUNC('month', CURRENT_DATE)::DATE,                                 -96.15, 'LIDL SP. Z O.O. 512',      'Lidl',                 'Spożywcze'),
    (8,  DATE_TRUNC('month', CURRENT_DATE)::DATE,                                 -23.90, 'ZABKA Z4417',              'Zabka Polska',         'Spożywcze'),
    (9,  DATE_TRUNC('month', CURRENT_DATE)::DATE,                                -250.00, 'ORLEN STACJA 177',         'PKN Orlen',            'Transport'),
    (10, (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month')::DATE,          -38.50, 'UBER TRIP',                'Uber',                 'Transport'),
    (11, DATE_TRUNC('month', CURRENT_DATE)::DATE,                                 -54.00, 'MCDONALDS 0071',           'McDonalds',            'Restauracje'),
    (12, (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month')::DATE,          -72.30, 'GLOVO ZAMOWIENIE',         'Glovo',                'Restauracje'),
    (13, (CURRENT_DATE - INTERVAL '5 days')::DATE,                                -43.00, 'NETFLIX.COM',              'Netflix International', 'Subskrypcje'),
    (14, (CURRENT_DATE - INTERVAL '5 days' - INTERVAL '1 month')::DATE,           -43.00, 'NETFLIX.COM',              'Netflix International', 'Subskrypcje'),
    (15, (CURRENT_DATE - INTERVAL '5 days' - INTERVAL '2 months')::DATE,          -43.00, 'NETFLIX.COM',              'Netflix International', 'Subskrypcje'),
    (16, (CURRENT_DATE - INTERVAL '8 days')::DATE,                                -23.99, 'SPOTIFY P1A2B3',           'Spotify AB',           'Subskrypcje'),
    (17, (CURRENT_DATE - INTERVAL '8 days' - INTERVAL '1 month')::DATE,           -23.99, 'SPOTIFY P4C5D6',           'Spotify AB',           'Subskrypcje'),
    (18, (CURRENT_DATE - INTERVAL '8 days' - INTERVAL '2 months')::DATE,          -23.99, 'SPOTIFY P7E8F9',           'Spotify AB',           'Subskrypcje'),
    (19, DATE_TRUNC('month', CURRENT_DATE)::DATE,                                -149.00, 'ZDROFIT KARNET',           'Zdrofit Sp. z o.o.',   'Sport'),
    (20, DATE_TRUNC('month', CURRENT_DATE)::DATE,                                 -60.00, 'Przelew za bilety',        'Bob Nowak',            NULL)
) AS v(n, tx_date, amount, title, recipient, category)
JOIN bank_accounts a ON a.user_id = 101 AND a.account_name = 'PKO Konto Osobiste'
LEFT JOIN categories c ON c.name = v.category AND c.user_id IS NULL
ON CONFLICT (bank_account_id, transaction_hash) DO NOTHING;

-- 6. Payer's own share is already paid
UPDATE expense_splits s
SET is_settled = TRUE
FROM shared_expenses e
WHERE s.expense_id = e.id
  AND s.user_id = e.paid_by;

-- 7. Synchronize Sequences with manually inserted IDs
SELECT setval('users_id_seq',           COALESCE((SELECT max(id) FROM users), 1));
SELECT setval('expense_groups_id_seq',  COALESCE((SELECT max(id) FROM expense_groups), 1));
SELECT setval('shared_expenses_id_seq', COALESCE((SELECT max(id) FROM shared_expenses), 1));
SELECT setval('expense_splits_id_seq',  COALESCE((SELECT max(id) FROM expense_splits), 1));
SELECT setval('categories_id_seq',      COALESCE((SELECT max(id) FROM categories), 1));
SELECT setval('budgets_id_seq',         COALESCE((SELECT max(id) FROM budgets), 1));
