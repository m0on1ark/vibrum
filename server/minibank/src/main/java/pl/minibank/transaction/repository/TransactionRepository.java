package pl.minibank.transaction.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pl.minibank.transaction.entity.Transaction;

import java.math.BigDecimal;
import java.time.LocalDate;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long>, JpaSpecificationExecutor<Transaction> {
    boolean existsByBankAccountIdAndTransactionHash(Long bankAccountId, String transactionHash);
    
    Page<Transaction> findAllByBankAccountUserId(Long userId, Pageable pageable);

    @Query("SELECT COALESCE(SUM(CASE WHEN t.amountInPln < 0 THEN -t.amountInPln ELSE t.amountInPln END), 0) " +
           "FROM Transaction t " +
           "WHERE t.bankAccount.user.id = :userId " +
           "AND t.category.id = :categoryId " +
           "AND t.transactionDate >= :startDate " +
           "AND t.transactionDate <= :endDate")
    BigDecimal sumSpentByUserIdAndCategoryIdAndDateBetween(
            @Param("userId") Long userId,
            @Param("categoryId") Long categoryId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}