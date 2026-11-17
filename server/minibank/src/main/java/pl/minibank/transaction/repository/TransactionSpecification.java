package pl.minibank.transaction.repository;

import org.springframework.data.jpa.domain.Specification;
import pl.minibank.transaction.entity.Transaction;

import java.time.LocalDate;

public class TransactionSpecification {

    // Filter to ensure users only see their own transactions
    public static Specification<Transaction> belongsToUser(Long userId) {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.get("bankAccount").get("user").get("id"), userId);
    }

    // Filter by date range (start date, end date, or both)
    public static Specification<Transaction> dateBetween(LocalDate startDate, LocalDate endDate) {
        return (root, query, criteriaBuilder) -> {
            if (startDate != null && endDate != null) {
                return criteriaBuilder.between(root.get("transactionDate"), startDate, endDate);
            } else if (startDate != null) {
                return criteriaBuilder.greaterThanOrEqualTo(root.get("transactionDate"), startDate);
            } else if (endDate != null) {
                return criteriaBuilder.lessThanOrEqualTo(root.get("transactionDate"), endDate);
            }
            return null; // Return null if no dates are provided
        };
    }

    // Filter by a specific category ID
    public static Specification<Transaction> hasCategory(Long categoryId) {
        return (root, query, criteriaBuilder) -> {
            if (categoryId == null) return null;
            return criteriaBuilder.equal(root.get("category").get("id"), categoryId);
        };
    }

    // Filter by a specific bank account ID
    public static Specification<Transaction> belongsToAccount(Long accountId) {
        return (root, query, criteriaBuilder) -> {
            if (accountId == null) return null;
            return criteriaBuilder.equal(root.get("bankAccount").get("id"), accountId);
        };
    }
}