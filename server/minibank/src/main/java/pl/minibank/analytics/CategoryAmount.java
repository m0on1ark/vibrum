package pl.minibank.analytics;

import java.math.BigDecimal;

public record CategoryAmount(Long categoryId, String categoryName, BigDecimal amount) {
}
