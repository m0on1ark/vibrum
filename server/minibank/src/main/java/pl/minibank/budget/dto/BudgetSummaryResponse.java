package pl.minibank.budget.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record BudgetSummaryResponse(
        Long budgetId,
        Long categoryId,
        String categoryName,
        LocalDate monthYear,
        BigDecimal limitAmount,
        String currency,
        BigDecimal spentAmount,
        BigDecimal projectedAmount,
        BudgetStatus status
) {
}
