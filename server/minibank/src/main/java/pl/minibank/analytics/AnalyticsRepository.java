package pl.minibank.analytics;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import pl.minibank.transaction.entity.Transaction;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface AnalyticsRepository extends Repository<Transaction, Long> {

    @Query("""
            select sum(t.amountInPln) from Transaction t
            where t.bankAccount.user.id = :userId
              and t.amountInPln > 0
              and t.transactionDate between :from and :to
            """)
    BigDecimal sumIncome(Long userId, LocalDate from, LocalDate to);

    @Query("""
            select sum(t.amountInPln) from Transaction t
            where t.bankAccount.user.id = :userId
              and t.amountInPln < 0
              and t.transactionDate between :from and :to
            """)
    BigDecimal sumExpenses(Long userId, LocalDate from, LocalDate to);

    @Query("""
            select new pl.minibank.analytics.CategoryAmount(c.id, c.name, sum(t.amountInPln))
            from Transaction t
            left join t.category c
            where t.bankAccount.user.id = :userId
              and t.amountInPln < 0
              and t.transactionDate between :from and :to
            group by c.id, c.name
            """)
    List<CategoryAmount> sumExpensesByCategory(Long userId, LocalDate from, LocalDate to);

    @Query("""
            select new pl.minibank.analytics.MonthAmount(
                year(t.transactionDate), month(t.transactionDate), sum(t.amountInPln))
            from Transaction t
            where t.bankAccount.user.id = :userId
              and t.amountInPln > 0
              and t.transactionDate between :from and :to
            group by year(t.transactionDate), month(t.transactionDate)
            """)
    List<MonthAmount> sumIncomeByMonth(Long userId, LocalDate from, LocalDate to);

    @Query("""
            select new pl.minibank.analytics.MonthAmount(
                year(t.transactionDate), month(t.transactionDate), sum(t.amountInPln))
            from Transaction t
            where t.bankAccount.user.id = :userId
              and t.amountInPln < 0
              and t.transactionDate between :from and :to
            group by year(t.transactionDate), month(t.transactionDate)
            """)
    List<MonthAmount> sumExpensesByMonth(Long userId, LocalDate from, LocalDate to);
}
