package pl.minibank.analytics.dto;

import java.math.BigDecimal;

public record MonthlyTotalsResponse(String month, BigDecimal income, BigDecimal expenses) {
}
