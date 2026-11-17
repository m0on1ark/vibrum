ALTER TABLE shared_expenses
    ADD COLUMN exchange_rate NUMERIC(19, 6) NOT NULL DEFAULT 1,
    ADD COLUMN amount_in_pln NUMERIC(19, 4);

UPDATE shared_expenses SET amount_in_pln = amount;

ALTER TABLE shared_expenses
    ALTER COLUMN amount_in_pln SET NOT NULL;

ALTER TABLE expense_splits
    ADD COLUMN share_amount_in_pln NUMERIC(19, 4);

UPDATE expense_splits SET share_amount_in_pln = share_amount;

ALTER TABLE expense_splits
    ALTER COLUMN share_amount_in_pln SET NOT NULL;
