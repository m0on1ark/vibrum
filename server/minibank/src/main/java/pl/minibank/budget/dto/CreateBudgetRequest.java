package pl.minibank.budget.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateBudgetRequest(
        @NotNull Long categoryId,
        @NotNull LocalDate monthYear,
        @NotNull @Positive BigDecimal limitAmount,
        @Size(min = 3, max = 3) String currency
) {
}
