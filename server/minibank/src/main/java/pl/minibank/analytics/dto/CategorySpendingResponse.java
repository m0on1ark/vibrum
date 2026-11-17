package pl.minibank.analytics.dto;

import java.math.BigDecimal;

public record CategorySpendingResponse(Long categoryId, String categoryName, BigDecimal amount, BigDecimal percent) {
}
