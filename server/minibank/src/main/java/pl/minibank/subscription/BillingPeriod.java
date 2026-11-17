package pl.minibank.subscription;

import java.math.BigDecimal;
import java.time.LocalDate;

public enum BillingPeriod {
    WEEKLY(6, 8, 3, 52),
    MONTHLY(27, 33, 3, 12),
    YEARLY(355, 375, 2, 1);

    private final int minDays;
    private final int maxDays;
    private final int minOccurrences;
    private final int paymentsPerYear;

    BillingPeriod(int minDays, int maxDays, int minOccurrences, int paymentsPerYear) {
        this.minDays = minDays;
        this.maxDays = maxDays;
        this.minOccurrences = minOccurrences;
        this.paymentsPerYear = paymentsPerYear;
    }

    public boolean accepts(long days) {
        return days >= minDays && days <= maxDays;
    }

    public boolean acceptsWithOneMissed(long days) {
        return accepts(days) || (days >= 2L * minDays && days <= 2L * maxDays);
    }

    public int minOccurrences() {
        return minOccurrences;
    }

    public int maxDays() {
        return maxDays;
    }

    public BigDecimal yearlyCost(BigDecimal amount) {
        return amount.multiply(BigDecimal.valueOf(paymentsPerYear));
    }

    public LocalDate next(LocalDate date) {
        return switch (this) {
            case WEEKLY -> date.plusWeeks(1);
            case MONTHLY -> date.plusMonths(1);
            case YEARLY -> date.plusYears(1);
        };
    }
}
