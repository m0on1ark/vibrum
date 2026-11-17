package pl.minibank.budget;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BudgetRepository extends JpaRepository<Budget, Long> {

    @Query("""
            SELECT b FROM Budget b
            JOIN FETCH b.category
            WHERE b.user.id = :userId AND b.monthYear = :monthYear
            ORDER BY b.category.name ASC
            """)
    List<Budget> findAllByUserIdAndMonthYearWithCategory(
            @Param("userId") Long userId,
            @Param("monthYear") LocalDate monthYear
    );

    @Query("""
            SELECT b FROM Budget b
            JOIN FETCH b.category
            WHERE b.id = :id
            """)
    Optional<Budget> findByIdWithCategory(@Param("id") Long id);

    boolean existsByUserIdAndCategoryIdAndMonthYear(Long userId, Long categoryId, LocalDate monthYear);
}
