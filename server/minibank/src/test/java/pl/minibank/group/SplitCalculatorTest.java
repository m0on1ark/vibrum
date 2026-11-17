package pl.minibank.group;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SplitCalculatorTest {

    private SplitCalculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new SplitCalculator();
    }

    // ── EQUAL ────────────────────────────────────────────────────────────────

    @Test
    void equal_divisibleAmount_eachMemberGetsEqualShare() {
        List<SplitCalculator.SplitResult> result =
                calculator.equal(new BigDecimal("30.00"), List.of(1L, 2L, 3L));

        assertThat(result).hasSize(3);
        assertThat(result).allSatisfy(r ->
                assertThat(r.shareAmount()).isEqualByComparingTo("10.00"));
        assertTotalEquals("30.00", result);
    }

    @Test
    void equal_indivisibleAmount_remainderGoesToFirstMember() {
        // 10.00 / 3 = 3.3333...; base = 3.3333, remainder = 0.0001 → first gets 3.3334
        List<SplitCalculator.SplitResult> result =
                calculator.equal(new BigDecimal("10.00"), List.of(1L, 2L, 3L));

        assertThat(result).hasSize(3);
        BigDecimal total = result.stream()
                .map(SplitCalculator.SplitResult::shareAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(total).isEqualByComparingTo("10.00");
        // first member gets ≥ second member
        assertThat(result.get(0).shareAmount())
                .isGreaterThanOrEqualTo(result.get(1).shareAmount());
    }

    @Test
    void equal_singleMember_getsEverything() {
        List<SplitCalculator.SplitResult> result =
                calculator.equal(new BigDecimal("99.99"), List.of(42L));

        assertThat(result).hasSize(1);
        assertThat(result.get(0).shareAmount()).isEqualByComparingTo("99.99");
        assertThat(result.get(0).userId()).isEqualTo(42L);
    }

    @Test
    void equal_emptyMembers_throwsInvalidSplitException() {
        assertThatThrownBy(() -> calculator.equal(new BigDecimal("100.00"), List.of()))
                .isInstanceOf(InvalidSplitException.class);
    }

    // ── PERCENT ──────────────────────────────────────────────────────────────

    @Test
    void percent_validPercentages_calculatesCorrectShares() {
        var entries = List.of(
                new SplitCalculator.SplitEntry(1L, new BigDecimal("50"), null),
                new SplitCalculator.SplitEntry(2L, new BigDecimal("30"), null),
                new SplitCalculator.SplitEntry(3L, new BigDecimal("20"), null)
        );

        List<SplitCalculator.SplitResult> result =
                calculator.percent(new BigDecimal("100.00"), entries);

        assertThat(result).hasSize(3);
        assertThat(result.get(0).shareAmount()).isEqualByComparingTo("50.00");
        assertThat(result.get(1).shareAmount()).isEqualByComparingTo("30.00");
        assertThat(result.get(2).shareAmount()).isEqualByComparingTo("20.00");
    }

    @Test
    void percent_percentagesNotSumTo100_throwsInvalidSplitException() {
        var entries = List.of(
                new SplitCalculator.SplitEntry(1L, new BigDecimal("60"), null),
                new SplitCalculator.SplitEntry(2L, new BigDecimal("20"), null)
                // sum = 80, not 100
        );

        assertThatThrownBy(() -> calculator.percent(new BigDecimal("100.00"), entries))
                .isInstanceOf(InvalidSplitException.class)
                .hasMessageContaining("100");
    }

    @Test
    void percent_emptyEntries_throwsInvalidSplitException() {
        assertThatThrownBy(() -> calculator.percent(new BigDecimal("100.00"), List.of()))
                .isInstanceOf(InvalidSplitException.class);
    }

    // ── FIXED ────────────────────────────────────────────────────────────────

    @Test
    void fixed_validAmounts_passesThrough() {
        var entries = List.of(
                new SplitCalculator.SplitEntry(1L, null, new BigDecimal("70.00")),
                new SplitCalculator.SplitEntry(2L, null, new BigDecimal("30.00"))
        );

        List<SplitCalculator.SplitResult> result =
                calculator.fixed(new BigDecimal("100.00"), entries);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).shareAmount()).isEqualByComparingTo("70.00");
        assertThat(result.get(1).shareAmount()).isEqualByComparingTo("30.00");
    }

    @Test
    void fixed_amountsDoNotSumToTotal_throwsInvalidSplitException() {
        var entries = List.of(
                new SplitCalculator.SplitEntry(1L, null, new BigDecimal("60.00")),
                new SplitCalculator.SplitEntry(2L, null, new BigDecimal("30.00"))
                // sum = 90, total = 100
        );

        assertThatThrownBy(() -> calculator.fixed(new BigDecimal("100.00"), entries))
                .isInstanceOf(InvalidSplitException.class)
                .hasMessageContaining("100");
    }

    @Test
    void fixed_emptyEntries_throwsInvalidSplitException() {
        assertThatThrownBy(() -> calculator.fixed(new BigDecimal("100.00"), List.of()))
                .isInstanceOf(InvalidSplitException.class);
    }

    @Test
    void percent_missingPercent_throwsInvalidSplitException() {
        var entries = List.of(
                new SplitCalculator.SplitEntry(1L, null, null),
                new SplitCalculator.SplitEntry(2L, new BigDecimal("100"), null)
        );

        assertThatThrownBy(() -> calculator.percent(new BigDecimal("100.00"), entries))
                .isInstanceOf(InvalidSplitException.class);
    }

    @Test
    void fixed_duplicateUser_throwsInvalidSplitException() {
        var entries = List.of(
                new SplitCalculator.SplitEntry(1L, null, new BigDecimal("50.00")),
                new SplitCalculator.SplitEntry(1L, null, new BigDecimal("50.00"))
        );

        assertThatThrownBy(() -> calculator.fixed(new BigDecimal("100.00"), entries))
                .isInstanceOf(InvalidSplitException.class);
    }

    @Test
    void fixed_negativeAmount_throwsInvalidSplitException() {
        var entries = List.of(
                new SplitCalculator.SplitEntry(1L, null, new BigDecimal("120.00")),
                new SplitCalculator.SplitEntry(2L, null, new BigDecimal("-20.00"))
        );

        assertThatThrownBy(() -> calculator.fixed(new BigDecimal("100.00"), entries))
                .isInstanceOf(InvalidSplitException.class);
    }

    // ── Helper ───────────────────────────────────────────────────────────────

    private void assertTotalEquals(String expected, List<SplitCalculator.SplitResult> results) {
        BigDecimal total = results.stream()
                .map(SplitCalculator.SplitResult::shareAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(total).isEqualByComparingTo(expected);
    }
}
