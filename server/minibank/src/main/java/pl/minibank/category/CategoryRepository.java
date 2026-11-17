package pl.minibank.category;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    @Query("""
            select c from Category c
            where c.user is null or c.user.id = :userId
            order by c.type, lower(c.name)
            """)
    List<Category> findVisibleTo(Long userId);

    @Query("""
            select count(c) > 0 from Category c
            where (c.user is null or c.user.id = :userId)
              and lower(c.name) = lower(:name)
              and (:excludeId is null or c.id <> :excludeId)
            """)
    boolean existsVisibleByName(Long userId, String name, Long excludeId);
}
