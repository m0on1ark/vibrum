package pl.minibank.subscription.dto;

import java.math.BigDecimal;

public record SubscriptionTotalResponse(String currency, int count, BigDecimal monthlyCost, BigDecimal yearlyCost) {
}
