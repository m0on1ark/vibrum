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
INSERT INTO shared_expenses (id, group_id, paid_by, title, amount, currency, expense_date, split_mode)
VALUES
    (301, 201, 101, 'Hotel Gorski', 1200.0000, 'PLN', CURRENT_DATE - INTERVAL '3 days', 'EQUAL')
ON CONFLICT (id) DO NOTHING;

INSERT INTO expense_splits (id, expense_id, user_id, share_amount, share_percent, is_settled)
VALUES
    (401, 301, 101, 300.0000, NULL, FALSE),
    (402, 301, 102, 300.0000, NULL, FALSE),
    (403, 301, 103, 300.0000, NULL, FALSE),
    (404, 301, 104, 300.0000, NULL, TRUE) -- David already settled with Alice
ON CONFLICT (id) DO NOTHING;

-- Expense 2: Kolacja regionalna (400 PLN, paid by Bob, PERCENT split: Alice 30%, Bob 40%, Charlie 30%)
INSERT INTO shared_expenses (id, group_id, paid_by, title, amount, currency, expense_date, split_mode)
VALUES
    (302, 201, 102, 'Karczma Pod Tatrami', 400.0000, 'PLN', CURRENT_DATE - INTERVAL '2 days', 'PERCENT')
ON CONFLICT (id) DO NOTHING;

INSERT INTO expense_splits (id, expense_id, user_id, share_amount, share_percent, is_settled)
VALUES
    (405, 302, 101, 120.0000, 30.000, FALSE),
    (406, 302, 102, 160.0000, 40.000, FALSE),
    (407, 302, 103, 120.0000, 30.000, FALSE)
ON CONFLICT (id) DO NOTHING;

-- Expense 3: Paliwo (200 PLN, paid by Charlie, FIXED split)
INSERT INTO shared_expenses (id, group_id, paid_by, title, amount, currency, expense_date, split_mode)
VALUES
    (303, 201, 103, 'Paliwo i autostrada', 200.0000, 'PLN', CURRENT_DATE - INTERVAL '1 day', 'FIXED')
ON CONFLICT (id) DO NOTHING;

INSERT INTO expense_splits (id, expense_id, user_id, share_amount, share_percent, is_settled)
VALUES
    (408, 303, 101, 80.0000, NULL, FALSE),
    (409, 303, 102, 60.0000, NULL, FALSE),
    (410, 303, 103, 60.0000, NULL, FALSE)
ON CONFLICT (id) DO NOTHING;

-- 4. Budgets for Alice (Current Month)
-- Ensure system/demo categories exist
INSERT INTO categories (id, user_id, name, type)
VALUES
    (501, 101, 'Jedzenie i Gastronomia', 'EXPENSE'),
    (502, 101, 'Rozrywka i Wyjazdy', 'EXPENSE'),
    (503, 101, 'Transport i Paliwo', 'EXPENSE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO budgets (user_id, category_id, month_year, limit_amount, currency)
VALUES
    (101, 501, DATE_TRUNC('month', CURRENT_DATE)::DATE, 1200.0000, 'PLN'),
    (101, 502, DATE_TRUNC('month', CURRENT_DATE)::DATE, 600.0000, 'PLN'),
    (101, 503, DATE_TRUNC('month', CURRENT_DATE)::DATE, 400.0000, 'PLN')
ON CONFLICT (user_id, category_id, month_year) DO UPDATE
SET limit_amount = EXCLUDED.limit_amount;

-- 5. Synchronize Sequences with manually inserted IDs
SELECT setval('users_id_seq',           COALESCE((SELECT max(id) FROM users), 1));
SELECT setval('expense_groups_id_seq',  COALESCE((SELECT max(id) FROM expense_groups), 1));
SELECT setval('shared_expenses_id_seq', COALESCE((SELECT max(id) FROM shared_expenses), 1));
SELECT setval('expense_splits_id_seq',  COALESCE((SELECT max(id) FROM expense_splits), 1));
SELECT setval('categories_id_seq',      COALESCE((SELECT max(id) FROM categories), 1));
SELECT setval('budgets_id_seq',         COALESCE((SELECT max(id) FROM budgets), 1));
