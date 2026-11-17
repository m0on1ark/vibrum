package pl.minibank.group;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

/**
 * Calculates per-member share amounts for a shared expense.
 * All amounts are rounded to 4 decimal places; for EQUAL mode,
 * any rounding remainder (in units of 0.0001) is added to the first member.
 */
public class SplitCalculator {

    private static final int SCALE = 4;
    private static final BigDecimal HUNDRED = new BigDecimal("100");
    private static final BigDecimal PERCENT_TOLERANCE = new BigDecimal("0.01");
    private static final BigDecimal AMOUNT_TOLERANCE = new BigDecimal("0.01");

    public record SplitResult(Long userId, BigDecimal shareAmount, BigDecimal sharePercent) {
    }

    /**
     * EQUAL: divides total evenly among all memberIds.
     * Remainder distributed 1 unit (0.0001) at a time starting from the first member.
     */
    public List<SplitResult> equal(BigDecimal total, List<Long> memberIds) {
        if (memberIds == null || memberIds.isEmpty()) {
            throw new InvalidSplitException("At least one member is required for a split");
        }

        int n = memberIds.size();
        BigDecimal base = total.divide(BigDecimal.valueOf(n), SCALE, RoundingMode.FLOOR);
        BigDecimal distributed = base.multiply(BigDecimal.valueOf(n));
        BigDecimal remainder = total.subtract(distributed);
        BigDecimal unit = BigDecimal.ONE.movePointLeft(SCALE); // 0.0001

        List<SplitResult> results = new ArrayList<>(n);
        int remainderUnits = remainder.divide(unit, 0, RoundingMode.FLOOR).intValue();

        for (int i = 0; i < n; i++) {
            BigDecimal share = (i < remainderUnits) ? base.add(unit) : base;
            results.add(new SplitResult(memberIds.get(i), share, null));
        }
        return results;
    }

    /**
     * PERCENT: each entry carries a percent; they must sum to exactly 100 (±0.01).
     */
    public List<SplitResult> percent(BigDecimal total, List<SplitEntry> entries) {
        validateEntries(entries, true);
        BigDecimal sum = entries.stream()
                .map(SplitEntry::percent)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (HUNDRED.subtract(sum).abs().compareTo(PERCENT_TOLERANCE) > 0) {
            throw new InvalidSplitException(
                    "Percentages must sum to 100, but got " + sum.toPlainString());
        }

        List<SplitResult> results = new ArrayList<>(entries.size());
        for (SplitEntry e : entries) {
            BigDecimal share = total.multiply(e.percent())
                    .divide(HUNDRED, SCALE, RoundingMode.HALF_UP);
            results.add(new SplitResult(e.userId(), share, e.percent()));
        }
        return results;
    }

    /**
     * FIXED: each entry carries an explicit amount; they must sum to total (±0.01).
     */
    public List<SplitResult> fixed(BigDecimal total, List<SplitEntry> entries) {
        validateEntries(entries, false);
        BigDecimal sum = entries.stream()
                .map(SplitEntry::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (total.subtract(sum).abs().compareTo(AMOUNT_TOLERANCE) > 0) {
            throw new InvalidSplitException(
                    "Fixed amounts must sum to " + total.toPlainString()
                            + ", but got " + sum.toPlainString());
        }

        List<SplitResult> results = new ArrayList<>(entries.size());
        for (SplitEntry e : entries) {
            results.add(new SplitResult(e.userId(), e.amount().setScale(SCALE, RoundingMode.HALF_UP), null));
        }
        return results;
    }

    private void validateNotEmpty(List<?> entries) {
        if (entries == null || entries.isEmpty()) {
            throw new InvalidSplitException("Split entries must not be empty");
        }
    }

    private void validateEntries(List<SplitEntry> entries, boolean usePercent) {
        validateNotEmpty(entries);
        java.util.Set<Long> seen = new java.util.HashSet<>();
        for (SplitEntry e : entries) {
            if (e.userId() == null || !seen.add(e.userId())) {
                throw new InvalidSplitException("Each member must appear exactly once in the split");
            }
            BigDecimal value = usePercent ? e.percent() : e.amount();
            if (value == null) {
                throw new InvalidSplitException(
                        (usePercent ? "percent" : "amount") + " is required for user " + e.userId());
            }
            if (value.signum() < 0) {
                throw new InvalidSplitException(
                        (usePercent ? "percent" : "amount") + " must not be negative for user " + e.userId());
            }
        }
    }

    public record SplitEntry(Long userId, BigDecimal percent, BigDecimal amount) {
    }
}
