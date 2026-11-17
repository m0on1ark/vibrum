package pl.minibank.subscription;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

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
                expense("2026-05-15", "43.00", "NETFLIX.COM", null));

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
