package pl.minibank.transaction.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import pl.minibank.transaction.entity.Transaction;
import org.springframework.data.jpa.repository.EntityGraph;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long>, JpaSpecificationExecutor<Transaction> {
    boolean existsByBankAccountIdAndTransactionHash(Long bankAccountId, String transactionHash);
    
    @EntityGraph(attributePaths = {"category", "bankAccount"})
    Page<Transaction> findAllByBankAccountUserId(Long userId, Pageable pageable);
}