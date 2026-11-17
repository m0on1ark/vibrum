package pl.minibank.budget;

import pl.minibank.budget.dto.BudgetStatus;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;

/**
 * Pure calculation logic for budget spending projections (Burn Rate).
 */
public class BurnRateCalculator {

    private static final int SCALE = 4;

    public record ProjectionResult(
            BigDecimal spent,
            BigDecimal projected,
            BudgetStatus status
    ) {
    }

    /**
     * Calculates projected end-of-month spend and budget status.
     *
     * @param spent       total amount spent in category for the month so far
     * @param limit       budget limit for the category
     * @param currentDate date relative to which the projection is calculated
     */
    public ProjectionResult calculate(BigDecimal spent, BigDecimal limit, LocalDate currentDate) {
        if (spent == null || spent.compareTo(BigDecimal.ZERO) <= 0) {
            return new ProjectionResult(BigDecimal.ZERO.setScale(SCALE, RoundingMode.HALF_UP),
                    BigDecimal.ZERO.setScale(SCALE, RoundingMode.HALF_UP),
                    BudgetStatus.OK);
        }

        YearMonth ym = YearMonth.from(currentDate);
        int daysInMonth = ym.lengthOfMonth();
        int daysElapsed = Math.max(1, currentDate.getDayOfMonth());

        BigDecimal daysInMonthBd = BigDecimal.valueOf(daysInMonth);
        BigDecimal daysElapsedBd = BigDecimal.valueOf(daysElapsed);

        BigDecimal projected = spent
                .divide(daysElapsedBd, SCALE + 2, RoundingMode.HALF_UP)
                .multiply(daysInMonthBd)
                .setScale(SCALE, RoundingMode.HALF_UP);

        BudgetStatus status;
        if (spent.compareTo(limit) > 0) {
            status = BudgetStatus.EXCEEDED;
        } else if (projected.compareTo(limit) > 0) {
            status = BudgetStatus.WARNING;
        } else {
            status = BudgetStatus.OK;
        }

        return new ProjectionResult(spent.setScale(SCALE, RoundingMode.HALF_UP), projected, status);
    }
}
