package pl.minibank.category;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CategorizationRuleRepository extends JpaRepository<CategorizationRule, Long> {

    @Query("""
            select r from CategorizationRule r
            join fetch r.category
            where r.user is null or r.user.id = :userId
            """)
    List<CategorizationRule> findVisibleTo(Long userId);
}
