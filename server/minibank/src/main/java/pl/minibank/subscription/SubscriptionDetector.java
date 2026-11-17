package pl.minibank.subscription;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class SubscriptionDetector {

    private static final BigDecimal PRICE_CHANGE_TOLERANCE = new BigDecimal("0.15");
    private static final double MIN_RECURRING_SHARE = 0.5;

    public List<DetectedPattern> detect(List<PaymentRecord> payments, LocalDate today) {
        Map<String, List<PaymentRecord>> byMerchant = new LinkedHashMap<>();
        LocalDate latestPayment = null;
        for (PaymentRecord payment : payments) {
            if (payment.amount() == null || payment.amount().signum() >= 0) {
                continue;
            }
            String key = merchantKey(merchantName(payment)) + "|" + payment.currency();
            byMerchant.computeIfAbsent(key, k -> new ArrayList<>()).add(payment);
            if (latestPayment == null || payment.date().isAfter(latestPayment)) {
                latestPayment = payment.date();
            }
        }
        if (latestPayment == null) {
            return List.of();
        }
        LocalDate asOf = latestPayment.isBefore(today) ? latestPayment : today;

        List<DetectedPattern> result = new ArrayList<>();
        for (List<PaymentRecord> group : byMerchant.values()) {
            result.addAll(findPatterns(group, asOf));
        }
        result.sort(Comparator.comparing(DetectedPattern::nextPaymentDate));
        return result;
    }

    private List<DetectedPattern> findPatterns(List<PaymentRecord> group, LocalDate asOf) {
        List<PaymentRecord> remaining = new ArrayList<>(group);
        remaining.sort(Comparator.comparing(PaymentRecord::date));
        List<List<PaymentRecord>> recurring = new ArrayList<>();
        List<DetectedPattern> patterns = new ArrayList<>();

        for (BillingPeriod period : BillingPeriod.values()) {
            for (List<PaymentRecord> chain : chains(remaining, period)) {
                if (chain.size() < period.minOccurrences()) {
                    continue;
                }
                recurring.add(chain);
                remaining.removeIf(payment -> chain.stream().anyMatch(member -> member == payment));
                PaymentRecord last = chain.getLast();
                if (ChronoUnit.DAYS.between(last.date(), asOf) <= period.maxDays()) {
                    patterns.add(new DetectedPattern(
                            merchantName(last).trim(),
                            merchantKey(merchantName(last)),
                            last.title(),
                            last.amount().abs(),
                            last.currency(),
                            period,
                            chain.size(),
                            last.date(),
                            period.next(last.date())));
                }
            }
        }

        int recurringPayments = recurring.stream().mapToInt(List::size).sum();
        return recurringPayments >= group.size() * MIN_RECURRING_SHARE ? patterns : List.of();
    }

    private static List<List<PaymentRecord>> chains(List<PaymentRecord> payments, BillingPeriod period) {
        List<List<PaymentRecord>> chains = new ArrayList<>();
        for (PaymentRecord payment : payments) {
            List<PaymentRecord> best = null;
            BigDecimal bestDifference = null;
            for (List<PaymentRecord> chain : chains) {
                PaymentRecord last = chain.getLast();
                BigDecimal difference = payment.amount().abs().subtract(last.amount().abs()).abs();
                boolean fits = period.acceptsWithOneMissed(ChronoUnit.DAYS.between(last.date(), payment.date()))
                        && difference.compareTo(last.amount().abs().multiply(PRICE_CHANGE_TOLERANCE)) <= 0;
                if (fits && (bestDifference == null || difference.compareTo(bestDifference) < 0)) {
                    best = chain;
                    bestDifference = difference;
                }
            }
            if (best != null) {
                best.add(payment);
            } else {
                chains.add(new ArrayList<>(List.of(payment)));
            }
        }
        return chains;
    }

    private static String merchantName(PaymentRecord payment) {
        return payment.recipient() != null && !payment.recipient().isBlank() ? payment.recipient() : payment.title();
    }

    static String merchantKey(String merchant) {
        String withoutMarks = Normalizer.normalize(merchant, Normalizer.Form.NFD).replaceAll("\\p{M}+", "");
        return withoutMarks.toUpperCase(Locale.ROOT)
                .replace('Ł', 'L')
                .replaceAll("[^A-Z ]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    public record DetectedPattern(
            String merchant,
            String merchantKey,
            String title,
            BigDecimal amount,
            String currency,
            BillingPeriod period,
            int occurrences,
            LocalDate lastPaymentDate,
            LocalDate nextPaymentDate
    ) {
    }
}
