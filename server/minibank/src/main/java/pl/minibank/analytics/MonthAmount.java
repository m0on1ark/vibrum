package pl.minibank.analytics;

import java.math.BigDecimal;

public record MonthAmount(Integer year, Integer month, BigDecimal amount) {
}
