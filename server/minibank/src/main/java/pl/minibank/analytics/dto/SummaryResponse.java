package pl.minibank.analytics.dto;

import java.math.BigDecimal;

public record SummaryResponse(
        String month,
        BigDecimal income,
        BigDecimal expenses,
        BigDecimal balance,
        BigDecimal previousMonthExpenses,
        BigDecimal expensesChangePercent
) {
}
