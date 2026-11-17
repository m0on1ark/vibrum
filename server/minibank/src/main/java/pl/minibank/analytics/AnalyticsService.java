package pl.minibank.analytics;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.minibank.analytics.dto.CategorySpendingResponse;
import pl.minibank.analytics.dto.MonthlyTotalsResponse;
import pl.minibank.analytics.dto.SummaryResponse;
import pl.minibank.common.exception.BadRequestException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    static final int MAX_MONTHS = 24;
    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    private final AnalyticsRepository repository;

    @Transactional(readOnly = true)
    public SummaryResponse summary(Long userId, YearMonth month) {
        BigDecimal income = income(userId, month.atDay(1), month.atEndOfMonth());
        BigDecimal expenses = expenses(userId, month.atDay(1), month.atEndOfMonth());
        YearMonth previous = month.minusMonths(1);
        BigDecimal previousExpenses = expenses(userId, previous.atDay(1), previous.atEndOfMonth());

        BigDecimal change = previousExpenses.signum() == 0
                ? null
                : expenses.subtract(previousExpenses)
                        .multiply(HUNDRED)
                        .divide(previousExpenses, 2, RoundingMode.HALF_UP);

        return new SummaryResponse(
                month.toString(),
                income,
                expenses,
                income.subtract(expenses),
                previousExpenses,
                change);
    }

    @Transactional(readOnly = true)
    public List<CategorySpendingResponse> spendingByCategory(Long userId, LocalDate from, LocalDate to) {
        if (from.isAfter(to)) {
            throw new BadRequestException("'from' must not be after 'to'");
        }

        List<CategoryAmount> sums = repository.sumExpensesByCategory(userId, from, to);
        BigDecimal total = sums.stream()
                .map(sum -> sum.amount().negate())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return sums.stream()
                .map(sum -> {
                    BigDecimal amount = money(sum.amount().negate());
                    return new CategorySpendingResponse(
                            sum.categoryId(),
                            sum.categoryName(),
                            amount,
                            amount.multiply(HUNDRED).divide(total, 2, RoundingMode.HALF_UP));
                })
                .sorted(Comparator.comparing(CategorySpendingResponse::amount).reversed())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MonthlyTotalsResponse> monthlyTotals(Long userId, YearMonth lastMonth, int months) {
        if (months < 1 || months > MAX_MONTHS) {
            throw new BadRequestException("'months' must be between 1 and " + MAX_MONTHS);
        }

        YearMonth firstMonth = lastMonth.minusMonths(months - 1L);
        LocalDate from = firstMonth.atDay(1);
        LocalDate to = lastMonth.atEndOfMonth();
        Map<YearMonth, BigDecimal> income = byMonth(repository.sumIncomeByMonth(userId, from, to));
        Map<YearMonth, BigDecimal> expenses = byMonth(repository.sumExpensesByMonth(userId, from, to));

        List<MonthlyTotalsResponse> result = new ArrayList<>();
        for (YearMonth month = firstMonth; !month.isAfter(lastMonth); month = month.plusMonths(1)) {
            result.add(new MonthlyTotalsResponse(
                    month.toString(),
                    money(income.getOrDefault(month, BigDecimal.ZERO)),
                    money(expenses.getOrDefault(month, BigDecimal.ZERO).negate())));
        }
        return result;
    }

    private BigDecimal income(Long userId, LocalDate from, LocalDate to) {
        BigDecimal sum = repository.sumIncome(userId, from, to);
        return money(sum == null ? BigDecimal.ZERO : sum);
    }

    private BigDecimal expenses(Long userId, LocalDate from, LocalDate to) {
        BigDecimal sum = repository.sumExpenses(userId, from, to);
        return money(sum == null ? BigDecimal.ZERO : sum.negate());
    }

    private static Map<YearMonth, BigDecimal> byMonth(List<MonthAmount> sums) {
        return sums.stream().collect(Collectors.toMap(
                sum -> YearMonth.of(sum.year(), sum.month()),
                MonthAmount::amount));
    }

    private static BigDecimal money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
