package pl.minibank.subscription;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

class SubscriptionDetectorTests {

    private static final LocalDate TODAY = LocalDate.of(2026, 11, 17);

    private final SubscriptionDetector detector = new SubscriptionDetector();

    @Test
    void detectsMonthlySubscriptionAndPredictsNextPayment() {
        List<PaymentRecord> payments = List.of(
                expense("2026-08-15", "43.00", "NETFLIX.COM", "Netflix International"),
                expense("2026-09-15", "43.00", "NETFLIX.COM", "Netflix International"),
                expense("2026-10-15", "43.00", "NETFLIX.COM", "Netflix International"),
                expense("2026-11-15", "43.00", "NETFLIX.COM", "Netflix International"));

        List<SubscriptionDetector.DetectedPattern> result = detector.detect(payments, TODAY);

        assertThat(result).hasSize(1);
        SubscriptionDetector.DetectedPattern netflix = result.getFirst();
        assertThat(netflix.merchant()).isEqualTo("Netflix International");
        assertThat(netflix.period()).isEqualTo(BillingPeriod.MONTHLY);
        assertThat(netflix.amount()).isEqualByComparingTo("43.00");
        assertThat(netflix.occurrences()).isEqualTo(4);
        assertThat(netflix.lastPaymentDate()).isEqualTo(LocalDate.of(2026, 11, 15));
        assertThat(netflix.nextPaymentDate()).isEqualTo(LocalDate.of(2026, 12, 15));
    }

    @Test
    void toleratesShiftedDatesAndSmallPriceChange() {
        List<PaymentRecord> payments = List.of(
                expense("2026-08-01", "23.99", "SPOTIFY P1234", null),
                expense("2026-09-03", "23.99", "SPOTIFY P5678", null),
                expense("2026-09-30", "23.99", "SPOTIFY P9012", null),
                expense("2026-11-02", "25.99", "SPOTIFY P3456", null));

        List<SubscriptionDetector.DetectedPattern> result = detector.detect(payments, TODAY);

        assertThat(result).singleElement().satisfies(spotify -> {
            assertThat(spotify.period()).isEqualTo(BillingPeriod.MONTHLY);
            assertThat(spotify.amount()).isEqualByComparingTo("25.99");
        });
    }

    @Test
    void detectsWeeklyAndYearlySubscriptions() {
        List<PaymentRecord> payments = List.of(
                expense("2026-10-27", "15.00", "Gazeta Wyborcza", null),
                expense("2026-11-03", "15.00", "Gazeta Wyborcza", null),
                expense("2026-11-10", "15.00", "Gazeta Wyborcza", null),
                expense("2026-11-17", "15.00", "Gazeta Wyborcza", null),
                expense("2025-03-10", "199.00", "Amazon Prime", null),
                expense("2026-03-10", "199.00", "Amazon Prime", null));

        List<SubscriptionDetector.DetectedPattern> result = detector.detect(payments, TODAY);

        assertThat(result)
                .extracting(SubscriptionDetector.DetectedPattern::merchant, SubscriptionDetector.DetectedPattern::period)
                .containsExactly(
                        tuple("Gazeta Wyborcza", BillingPeriod.WEEKLY),
                        tuple("Amazon Prime", BillingPeriod.YEARLY));
    }

    @Test
    void ignoresIrregularShopping() {
        List<PaymentRecord> payments = List.of(
                expense("2026-11-02", "45.20", "BIEDRONKA 1234 WARSZAWA", null),
                expense("2026-11-05", "128.90", "BIEDRONKA 1234 WARSZAWA", null),
                expense("2026-11-06", "12.50", "BIEDRONKA 1234 WARSZAWA", null),
                expense("2026-11-13", "67.00", "BIEDRONKA 1234 WARSZAWA", null));

        assertThat(detector.detect(payments, TODAY)).isEmpty();
    }

    @Test
    void requiresEnoughOccurrences() {
        List<PaymentRecord> payments = List.of(
                expense("2026-10-15", "43.00", "NETFLIX.COM", null),
                expense("2026-11-15", "43.00", "NETFLIX.COM", null));

        assertThat(detector.detect(payments, TODAY)).isEmpty();
    }

    @Test
    void ignoresCancelledSubscription() {
        List<PaymentRecord> payments = List.of(
                expense("2026-03-15", "43.00", "NETFLIX.COM", null),
                expense("2026-04-15", "43.00", "NETFLIX.COM", null),
                expense("2026-05-15", "43.00", "NETFLIX.COM", null),
                expense("2026-11-10", "45.20", "BIEDRONKA 1234 WARSZAWA", null));

        assertThat(detector.detect(payments, TODAY)).isEmpty();
    }

    @Test
    void judgesCancellationFromTheLatestImportedPayment() {
        List<PaymentRecord> payments = List.of(
                expense("2026-08-03", "125.99", "ZDROFIT WOLA RECURRING", null),
                expense("2026-09-03", "125.99", "ZDROFIT WOLA RECURRING", null),
                expense("2026-10-03", "125.99", "ZDROFIT WOLA RECURRING", null),
                expense("2026-10-26", "5.99", "ZABKA", null));

        assertThat(detector.detect(payments, TODAY))
                .extracting(SubscriptionDetector.DetectedPattern::merchant)
                .containsExactly("ZDROFIT WOLA RECURRING");
    }

    @Test
    void findsSeveralSubscriptionsOfOneMerchantDespitePriceChangesAndMissedPayment() {
        List<PaymentRecord> payments = new ArrayList<>();
        for (int month = 4; month <= 10; month++) {
            String price = month < 7 ? "23.99" : "26.99";
            payments.add(expense("2026-%02d-16".formatted(month), price, "Spotify", null));
            payments.add(expense("2026-%02d-23".formatted(month), "14.49", "Spotify", null));
        }
        payments.removeIf(payment -> payment.date().equals(LocalDate.of(2026, 8, 23)));

        List<SubscriptionDetector.DetectedPattern> result = detector.detect(payments, TODAY);

        assertThat(result)
                .extracting(SubscriptionDetector.DetectedPattern::amount, SubscriptionDetector.DetectedPattern::occurrences)
                .containsExactlyInAnyOrder(tuple(new BigDecimal("26.99"), 7), tuple(new BigDecimal("14.49"), 6));
    }

    @Test
    void frequentShoppingIsNotASubscription() {
        Random random = new Random(42);
        List<PaymentRecord> payments = new ArrayList<>();
        LocalDate day = LocalDate.of(2026, 5, 1);
        for (int i = 0; i < 80; i++) {
            day = day.plusDays(1 + random.nextInt(3));
            String amount = BigDecimal.valueOf(300 + random.nextInt(9000), 2).toPlainString();
            payments.add(expense(day.toString(), amount, "JMP S.A. BIEDRONKA", null));
        }

        assertThat(detector.detect(payments, TODAY)).isEmpty();
    }

    @Test
    void ignoresIncome() {
        List<PaymentRecord> payments = List.of(
                income("2026-08-10", "5200.00", "Wynagrodzenie", "Firma XYZ"),
                income("2026-09-10", "5200.00", "Wynagrodzenie", "Firma XYZ"),
                income("2026-10-10", "5200.00", "Wynagrodzenie", "Firma XYZ"),
                income("2026-11-10", "5200.00", "Wynagrodzenie", "Firma XYZ"));

        assertThat(detector.detect(payments, TODAY)).isEmpty();
    }

    @Test
    void separatesCurrencies() {
        List<PaymentRecord> payments = List.of(
                expense("2026-09-15", "43.00", "NETFLIX.COM", null),
                payment("2026-10-15", "-9.99", "EUR", "NETFLIX.COM", null),
                expense("2026-11-15", "43.00", "NETFLIX.COM", null));

        assertThat(detector.detect(payments, TODAY)).isEmpty();
    }

    @Test
    void merchantKeyIgnoresDigitsCaseAndDiacritics() {
        assertThat(SubscriptionDetector.merchantKey("Żabka Z1234 Łódź"))
                .isEqualTo(SubscriptionDetector.merchantKey("ZABKA Z9876 LODZ"));
    }

    private static PaymentRecord expense(String date, String amount, String title, String recipient) {
        return payment(date, "-" + amount, "PLN", title, recipient);
    }

    private static PaymentRecord income(String date, String amount, String title, String recipient) {
        return payment(date, amount, "PLN", title, recipient);
    }

    private static PaymentRecord payment(String date, String amount, String currency, String title, String recipient) {
        return new PaymentRecord(LocalDate.parse(date), new BigDecimal(amount), currency, title, recipient);
    }
}
