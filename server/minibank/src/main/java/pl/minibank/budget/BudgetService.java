package pl.minibank.budget;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.minibank.budget.dto.BudgetResponse;
import pl.minibank.budget.dto.BudgetSummaryResponse;
import pl.minibank.budget.dto.CreateBudgetRequest;
import pl.minibank.budget.dto.UpdateBudgetRequest;
import pl.minibank.category.Category;
import pl.minibank.category.CategoryRepository;
import pl.minibank.common.exception.BadRequestException;
import pl.minibank.common.exception.ConflictException;
import pl.minibank.common.exception.NotFoundException;
import pl.minibank.transaction.repository.TransactionRepository;
import pl.minibank.user.User;
import pl.minibank.user.UserRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final BurnRateCalculator burnRateCalculator = new BurnRateCalculator();

    @Transactional
    public BudgetResponse createBudget(CreateBudgetRequest request, Long currentUserId) {
        User user = getUserOrThrow(currentUserId);

        Category category = categoryRepository.findById(request.categoryId())
                .filter(c -> c.getUser() == null || c.getUser().getId().equals(currentUserId))
                .orElseThrow(() -> new NotFoundException("Category not found with id: " + request.categoryId()));

        LocalDate normalizedMonth = request.monthYear().withDayOfMonth(1);

        String currency = (request.currency() != null && !request.currency().isBlank())
                ? request.currency().trim().toUpperCase(Locale.ROOT)
                : "PLN";

        if (!"PLN".equals(currency)) {
            throw new BadRequestException("Only PLN currency is currently supported");
        }

        if (budgetRepository.existsByUserIdAndCategoryIdAndMonthYear(currentUserId, category.getId(), normalizedMonth)) {
            throw new ConflictException("Budget already exists for this category and month");
        }

        Budget budget = new Budget(user, category, normalizedMonth, request.limitAmount(), currency);
        budget = budgetRepository.save(budget);

        return BudgetResponse.from(budget);
    }

    @Transactional(readOnly = true)
    public List<BudgetResponse> getBudgets(Long currentUserId, LocalDate monthYear) {
        LocalDate normalizedMonth = (monthYear != null ? monthYear : LocalDate.now()).withDayOfMonth(1);
        List<Budget> budgets = budgetRepository.findAllByUserIdAndMonthYearWithCategory(currentUserId, normalizedMonth);
        return budgets.stream()
                .map(BudgetResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public BudgetResponse getBudgetDetails(Long budgetId, Long currentUserId) {
        Budget budget = budgetRepository.findByIdWithCategory(budgetId)
                .filter(b -> b.getUser().getId().equals(currentUserId))
                .orElseThrow(() -> new NotFoundException("Budget not found with id: " + budgetId));
        return BudgetResponse.from(budget);
    }

    @Transactional
    public BudgetResponse updateBudget(Long budgetId, UpdateBudgetRequest request, Long currentUserId) {
        Budget budget = budgetRepository.findByIdWithCategory(budgetId)
                .filter(b -> b.getUser().getId().equals(currentUserId))
                .orElseThrow(() -> new NotFoundException("Budget not found with id: " + budgetId));

        budget.setLimitAmount(request.limitAmount());
        return BudgetResponse.from(budget);
    }

    @Transactional
    public void deleteBudget(Long budgetId, Long currentUserId) {
        Budget budget = budgetRepository.findById(budgetId)
                .filter(b -> b.getUser().getId().equals(currentUserId))
                .orElseThrow(() -> new NotFoundException("Budget not found with id: " + budgetId));

        budgetRepository.delete(budget);
    }

    @Transactional(readOnly = true)
    public List<BudgetSummaryResponse> getBudgetSummaries(Long currentUserId, LocalDate monthYear) {
        LocalDate normalizedMonth = (monthYear != null ? monthYear : LocalDate.now()).withDayOfMonth(1);
        List<Budget> budgets = budgetRepository.findAllByUserIdAndMonthYearWithCategory(currentUserId, normalizedMonth);

        LocalDate calcDate = normalizedMonth.equals(LocalDate.now().withDayOfMonth(1))
                ? LocalDate.now()
                : normalizedMonth.withDayOfMonth(normalizedMonth.lengthOfMonth());

        return budgets.stream()
                .map(budget -> {
                    BigDecimal spent = getSpentAmountForCategory(currentUserId, budget.getCategory().getId(), normalizedMonth);
                    var projection = burnRateCalculator.calculate(spent, budget.getLimitAmount(), calcDate);

                    return new BudgetSummaryResponse(
                            budget.getId(),
                            budget.getCategory().getId(),
                            budget.getCategory().getName(),
                            budget.getMonthYear(),
                            budget.getLimitAmount(),
                            budget.getCurrency(),
                            projection.spent(),
                            projection.projected(),
                            projection.status()
                    );
                })
                .toList();
    }

    private BigDecimal getSpentAmountForCategory(Long userId, Long categoryId, LocalDate month) {
        LocalDate startOfMonth = month.withDayOfMonth(1);
        LocalDate endOfMonth = month.withDayOfMonth(month.lengthOfMonth());
        return transactionRepository.sumSpentByUserIdAndCategoryIdAndDateBetween(
                userId, categoryId, startOfMonth, endOfMonth
        );
    }

    private User getUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found with id: " + userId));
    }
}
