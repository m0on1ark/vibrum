package pl.minibank.group;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class SettlementCalculatorTest {

    private SettlementCalculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new SettlementCalculator();
    }

    @Test
    void allBalancesZero_returnsEmptyList() {
        var balances = List.of(
                new SettlementCalculator.UserBalance(1L, BigDecimal.ZERO),
                new SettlementCalculator.UserBalance(2L, BigDecimal.ZERO)
        );

        List<SettlementCalculator.Transfer> result = calculator.minimize(balances);

        assertThat(result).isEmpty();
    }

    @Test
    void emptyInput_returnsEmptyList() {
        List<SettlementCalculator.Transfer> result = calculator.minimize(List.of());

        assertThat(result).isEmpty();
    }

    @Test
    void twoPersonSimpleDebt_producesOneTransfer() {
        // A paid 100, B owes 100 → B sends 100 to A
        var balances = List.of(
                new SettlementCalculator.UserBalance(1L, new BigDecimal("100.00")),  // creditor
                new SettlementCalculator.UserBalance(2L, new BigDecimal("-100.00")) // debtor
        );

        List<SettlementCalculator.Transfer> result = calculator.minimize(balances);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).fromUserId()).isEqualTo(2L);
        assertThat(result.get(0).toUserId()).isEqualTo(1L);
        assertThat(result.get(0).amount()).isEqualByComparingTo("100.00");
    }

    @Test
    void threePersonLinear_producesAtMostTwoTransfers() {
        // A: +50, B: 0, C: -50 → C sends 50 to A
        var balances = List.of(
                new SettlementCalculator.UserBalance(1L, new BigDecimal("50.00")),
                new SettlementCalculator.UserBalance(2L, BigDecimal.ZERO),
                new SettlementCalculator.UserBalance(3L, new BigDecimal("-50.00"))
        );

        List<SettlementCalculator.Transfer> result = calculator.minimize(balances);

        assertThat(result).hasSize(1);
        assertAllBalancesSettled(balances, result);
    }

    @Test
    void fivePersonComplexMesh_producesAtMostFourTransfers() {
        // 5 people → at most N-1 = 4 transfers
        var balances = List.of(
                new SettlementCalculator.UserBalance(1L, new BigDecimal("80.00")),
                new SettlementCalculator.UserBalance(2L, new BigDecimal("20.00")),
                new SettlementCalculator.UserBalance(3L, new BigDecimal("-30.00")),
                new SettlementCalculator.UserBalance(4L, new BigDecimal("-50.00")),
                new SettlementCalculator.UserBalance(5L, new BigDecimal("-20.00"))
        );

        List<SettlementCalculator.Transfer> result = calculator.minimize(balances);

        assertThat(result.size()).isLessThanOrEqualTo(4);
        assertAllBalancesSettled(balances, result);
    }

    @Test
    void oneCreditorMultipleDebtors_allSettled() {
        // A paid for everyone: B owes 30, C owes 20, D owes 10
        var balances = List.of(
                new SettlementCalculator.UserBalance(1L, new BigDecimal("60.00")),
                new SettlementCalculator.UserBalance(2L, new BigDecimal("-30.00")),
                new SettlementCalculator.UserBalance(3L, new BigDecimal("-20.00")),
                new SettlementCalculator.UserBalance(4L, new BigDecimal("-10.00"))
        );

        List<SettlementCalculator.Transfer> result = calculator.minimize(balances);

        assertThat(result).hasSize(3);
        assertAllBalancesSettled(balances, result);
    }

    @Test
    void circularDebts_reducedToMinimum() {
        // A owes B 10, B owes C 10, C owes A 10 → all cancel out, net zero
        var balances = List.of(
                new SettlementCalculator.UserBalance(1L, BigDecimal.ZERO),
                new SettlementCalculator.UserBalance(2L, BigDecimal.ZERO),
                new SettlementCalculator.UserBalance(3L, BigDecimal.ZERO)
        );

        List<SettlementCalculator.Transfer> result = calculator.minimize(balances);

        assertThat(result).isEmpty();
    }

    @Test
    void unevenSplit_amountsAreCorrect() {
        // A: +90, B: -60, C: -30
        var balances = List.of(
                new SettlementCalculator.UserBalance(1L, new BigDecimal("90.00")),
                new SettlementCalculator.UserBalance(2L, new BigDecimal("-60.00")),
                new SettlementCalculator.UserBalance(3L, new BigDecimal("-30.00"))
        );

        List<SettlementCalculator.Transfer> result = calculator.minimize(balances);

        assertThat(result).hasSize(2);
        assertAllBalancesSettled(balances, result);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Verifies that applying all transfers zeroes out all net balances.
     */
    private void assertAllBalancesSettled(
            List<SettlementCalculator.UserBalance> original,
            List<SettlementCalculator.Transfer> transfers) {

        java.util.Map<Long, BigDecimal> net = new java.util.HashMap<>();
        for (var ub : original) {
            net.put(ub.userId(), ub.balance());
        }
        for (var t : transfers) {
            net.merge(t.fromUserId(), t.amount().negate(), BigDecimal::add);
            net.merge(t.toUserId(), t.amount(), BigDecimal::add);
        }
        for (var entry : net.entrySet()) {
            assertThat(entry.getValue())
                    .as("Balance for user %d should be zero after settlement", entry.getKey())
                    .isEqualByComparingTo(BigDecimal.ZERO);
        }
    }
}
