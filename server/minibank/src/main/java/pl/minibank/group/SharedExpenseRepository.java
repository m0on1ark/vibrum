package pl.minibank.group;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SharedExpenseRepository extends JpaRepository<SharedExpense, Long> {

    @Query("""
            SELECT e FROM SharedExpense e
            JOIN FETCH e.paidBy
            JOIN FETCH e.splits s
            JOIN FETCH s.user
            WHERE e.group.id = :groupId
            ORDER BY e.expenseDate DESC, e.createdAt DESC
            """)
    List<SharedExpense> findAllByGroupIdWithSplits(@Param("groupId") Long groupId);
}
