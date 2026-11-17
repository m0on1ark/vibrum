package pl.minibank.budget;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pl.minibank.budget.dto.BudgetStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class BurnRateCalculatorTest {

    private BurnRateCalculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new BurnRateCalculator();
    }

    @Test
    void zeroOrNullSpent_returnsZeroProjectionAndOkStatus() {
        LocalDate date = LocalDate.of(2026, 11, 15);
        BigDecimal limit = new BigDecimal("1000.00");

        var resNull = calculator.calculate(null, limit, date);
        assertThat(resNull.spent()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(resNull.projected()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(resNull.status()).isEqualTo(BudgetStatus.OK);

        var resZero = calculator.calculate(BigDecimal.ZERO, limit, date);
        assertThat(resZero.spent()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(resZero.projected()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(resZero.status()).isEqualTo(BudgetStatus.OK);
    }

    @Test
    void halfwayThroughMonth_onTrack_returnsOk() {
        // November has 30 days. On day 15, spent 400 with limit 1000 -> projected 800 <= 1000 -> OK
        LocalDate date = LocalDate.of(2026, 11, 15);
        BigDecimal limit = new BigDecimal("1000.00");
        BigDecimal spent = new BigDecimal("400.00");

        var result = calculator.calculate(spent, limit, date);

        assertThat(result.spent()).isEqualByComparingTo("400.00");
        assertThat(result.projected()).isEqualByComparingTo("800.00");
        assertThat(result.status()).isEqualTo(BudgetStatus.OK);
    }

    @Test
    void halfwayThroughMonth_paceExceedsLimit_returnsWarning() {
        // November has 30 days. On day 15, spent 600 with limit 1000 -> projected 1200 > 1000 -> WARNING
        LocalDate date = LocalDate.of(2026, 11, 15);
        BigDecimal limit = new BigDecimal("1000.00");
        BigDecimal spent = new BigDecimal("600.00");

        var result = calculator.calculate(spent, limit, date);

        assertThat(result.spent()).isEqualByComparingTo("600.00");
        assertThat(result.projected()).isEqualByComparingTo("1200.00");
        assertThat(result.status()).isEqualTo(BudgetStatus.WARNING);
    }

    @Test
    void alreadyExceededLimit_returnsExceeded() {
        // Spent 1200 with limit 1000 -> EXCEEDED
        LocalDate date = LocalDate.of(2026, 11, 15);
        BigDecimal limit = new BigDecimal("1000.00");
        BigDecimal spent = new BigDecimal("1200.00");

        var result = calculator.calculate(spent, limit, date);

        assertThat(result.spent()).isEqualByComparingTo("1200.00");
        assertThat(result.status()).isEqualTo(BudgetStatus.EXCEEDED);
    }

    @Test
    void firstDayOfMonth_usesDayOneProperly() {
        // Day 1 of November. Spent 50 with limit 1000 -> projected 50 * 30 = 1500 -> WARNING
        LocalDate date = LocalDate.of(2026, 11, 1);
        BigDecimal limit = new BigDecimal("1000.00");
        BigDecimal spent = new BigDecimal("50.00");

        var result = calculator.calculate(spent, limit, date);

        assertThat(result.projected()).isEqualByComparingTo("1500.00");
        assertThat(result.status()).isEqualTo(BudgetStatus.WARNING);
    }
}
