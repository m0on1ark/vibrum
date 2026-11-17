UPDATE expense_splits s
SET is_settled = TRUE
FROM shared_expenses e
WHERE s.expense_id = e.id
  AND s.user_id = e.paid_by
  AND s.is_settled = FALSE;
