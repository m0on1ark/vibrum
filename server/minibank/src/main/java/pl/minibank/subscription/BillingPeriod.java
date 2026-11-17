package pl.minibank.subscription;

import java.time.LocalDate;

public enum BillingPeriod {
    WEEKLY(6, 8, 3),
    MONTHLY(27, 33, 3),
    YEARLY(355, 375, 2);

    private final int minDays;
    private final int maxDays;
    private final int minOccurrences;

    BillingPeriod(int minDays, int maxDays, int minOccurrences) {
        this.minDays = minDays;
        this.maxDays = maxDays;
        this.minOccurrences = minOccurrences;
    }

    public boolean accepts(long days) {
        return days >= minDays && days <= maxDays;
    }

    public int minOccurrences() {
        return minOccurrences;
    }

    public int maxDays() {
        return maxDays;
    }

    public LocalDate next(LocalDate date) {
        return switch (this) {
            case WEEKLY -> date.plusWeeks(1);
            case MONTHLY -> date.plusMonths(1);
            case YEARLY -> date.plusYears(1);
        };
    }
}
