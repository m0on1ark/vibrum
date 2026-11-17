package pl.minibank.transaction.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pl.minibank.transaction.entity.Transaction;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long>, JpaSpecificationExecutor<Transaction> {
    boolean existsByBankAccountIdAndTransactionHash(Long bankAccountId, String transactionHash);
    
    @Override
    @EntityGraph(attributePaths = {"category", "bankAccount"})
    Page<Transaction> findAll(Specification<Transaction> spec, Pageable pageable);

    @Query("select t from Transaction t where t.bankAccount.user.id = :userId and t.categoryManual = false")
    List<Transaction> findAllAutoCategorizedByUserId(@Param("userId") Long userId);

    @Query("SELECT COALESCE(SUM(-t.amountInPln), 0) " +
           "FROM Transaction t " +
           "WHERE t.bankAccount.user.id = :userId " +
           "AND t.category.id = :categoryId " +
           "AND t.amountInPln < 0 " +
           "AND t.transactionDate >= :startDate " +
           "AND t.transactionDate <= :endDate")
    BigDecimal sumSpentByUserIdAndCategoryIdAndDateBetween(
            @Param("userId") Long userId,
            @Param("categoryId") Long categoryId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}