package pl.minibank.budget.dto;

import pl.minibank.budget.Budget;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record BudgetResponse(
        Long id,
        Long categoryId,
        String categoryName,
        LocalDate monthYear,
        BigDecimal limitAmount,
        String currency,
        Instant createdAt,
        Instant updatedAt
) {
    public static BudgetResponse from(Budget budget) {
        return new BudgetResponse(
                budget.getId(),
                budget.getCategory().getId(),
                budget.getCategory().getName(),
                budget.getMonthYear(),
                budget.getLimitAmount(),
                budget.getCurrency(),
                budget.getCreatedAt(),
                budget.getUpdatedAt()
        );
    }
}
