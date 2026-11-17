package pl.minibank.subscription;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

public class SubscriptionDetector {

    private static final BigDecimal AMOUNT_TOLERANCE = new BigDecimal("0.10");

    public List<DetectedPattern> detect(List<PaymentRecord> payments, LocalDate today) {
        Map<String, List<PaymentRecord>> byMerchant = new LinkedHashMap<>();
        for (PaymentRecord payment : payments) {
            if (payment.amount() == null || payment.amount().signum() >= 0) {
                continue;
            }
            String key = merchantKey(merchantName(payment)) + "|" + payment.currency();
            byMerchant.computeIfAbsent(key, k -> new ArrayList<>()).add(payment);
        }

        List<DetectedPattern> result = new ArrayList<>();
        for (List<PaymentRecord> group : byMerchant.values()) {
            findPattern(group, today).ifPresent(result::add);
        }
        result.sort(Comparator.comparing(DetectedPattern::nextPaymentDate));
        return result;
    }

    private Optional<DetectedPattern> findPattern(List<PaymentRecord> group, LocalDate today) {
        BigDecimal median = median(group.stream().map(p -> p.amount().abs()).toList());
        BigDecimal tolerance = median.multiply(AMOUNT_TOLERANCE);
        List<PaymentRecord> similar = group.stream()
                .filter(p -> p.amount().abs().subtract(median).abs().compareTo(tolerance) <= 0)
                .sorted(Comparator.comparing(PaymentRecord::date))
                .toList();
        if (similar.size() < 2) {
            return Optional.empty();
        }

        List<Long> intervals = new ArrayList<>();
        for (int i = 1; i < similar.size(); i++) {
            intervals.add(ChronoUnit.DAYS.between(similar.get(i - 1).date(), similar.get(i).date()));
        }

        for (BillingPeriod period : BillingPeriod.values()) {
            boolean regular = intervals.stream().allMatch(period::accepts);
            if (!regular || similar.size() < period.minOccurrences()) {
                continue;
            }

            PaymentRecord last = similar.getLast();
            if (ChronoUnit.DAYS.between(last.date(), today) > period.maxDays()) {
                return Optional.empty();
            }

            return Optional.of(new DetectedPattern(
                    merchantName(last).trim(),
                    merchantKey(merchantName(last)),
                    last.title(),
                    last.amount().abs(),
                    last.currency(),
                    period,
                    similar.size(),
                    last.date(),
                    period.next(last.date())));
        }
        return Optional.empty();
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

    private static BigDecimal median(List<BigDecimal> values) {
        List<BigDecimal> sorted = values.stream().sorted().toList();
        int middle = sorted.size() / 2;
        if (sorted.size() % 2 == 1) {
            return sorted.get(middle);
        }
        return sorted.get(middle - 1).add(sorted.get(middle)).divide(BigDecimal.TWO, 2, RoundingMode.HALF_UP);
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
