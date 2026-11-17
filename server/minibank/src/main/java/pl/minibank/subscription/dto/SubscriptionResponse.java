package pl.minibank.subscription.dto;

import pl.minibank.subscription.BillingPeriod;
import pl.minibank.subscription.DetectedSubscription;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SubscriptionResponse(
        Long id,
        String merchant,
        BigDecimal amount,
        String currency,
        BillingPeriod billingPeriod,
        int occurrences,
        LocalDate lastPaymentDate,
        LocalDate nextPaymentDate,
        Long categoryId,
        String categoryName
) {

    public static SubscriptionResponse from(DetectedSubscription subscription) {
        return new SubscriptionResponse(
                subscription.getId(),
                subscription.getMerchant(),
                subscription.getAmount(),
                subscription.getCurrency(),
                subscription.getBillingPeriod(),
                subscription.getOccurrences(),
                subscription.getLastPaymentDate(),
                subscription.getNextPaymentDate(),
                subscription.getCategory() != null ? subscription.getCategory().getId() : null,
                subscription.getCategory() != null ? subscription.getCategory().getName() : null);
    }
}
