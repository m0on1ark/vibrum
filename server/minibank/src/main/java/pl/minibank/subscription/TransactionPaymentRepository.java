package pl.minibank.subscription;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import pl.minibank.transaction.entity.Transaction;

import java.time.LocalDate;
import java.util.List;

public interface TransactionPaymentRepository extends Repository<Transaction, Long> {

    @Query("""
            select new pl.minibank.subscription.PaymentRecord(
                t.transactionDate, t.originalAmount, t.originalCurrency, t.title, t.recipient)
            from Transaction t
            where t.bankAccount.user.id = :userId
              and t.originalAmount < 0
              and t.transactionDate >= :since
            """)
    List<PaymentRecord> findExpenses(Long userId, LocalDate since);
}
