-- Indexes for Group Settlements module
CREATE INDEX idx_group_members_user_id
    ON group_members (user_id);

CREATE INDEX idx_shared_expenses_group_date
    ON shared_expenses (group_id, expense_date DESC);

CREATE INDEX idx_expense_splits_expense_id
    ON expense_splits (expense_id);

CREATE INDEX idx_expense_splits_user_settled
    ON expense_splits (user_id, is_settled);

-- Indexes for Budgets module
CREATE INDEX idx_budgets_user_month
    ON budgets (user_id, month_year);
