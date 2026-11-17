package pl.minibank.group;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ExpenseGroupRepository extends JpaRepository<ExpenseGroup, Long> {

    @Query("""
            SELECT g FROM ExpenseGroup g
            WHERE EXISTS (
                SELECT 1 FROM GroupMember m
                WHERE m.group = g AND m.user.id = :userId
            )
            ORDER BY g.createdAt DESC
            """)
    List<ExpenseGroup> findAllByMemberUserId(@Param("userId") Long userId);

    @Query("""
            SELECT g FROM ExpenseGroup g
            LEFT JOIN FETCH g.createdBy
            WHERE g.id = :id
            """)
    Optional<ExpenseGroup> findByIdWithCreator(@Param("id") Long id);
}
