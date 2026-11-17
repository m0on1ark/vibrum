package pl.minibank.subscription;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface DetectedSubscriptionRepository extends JpaRepository<DetectedSubscription, Long> {

    @Query("""
            select s from DetectedSubscription s
            left join fetch s.category
            where s.user.id = :userId
            order by s.nextPaymentDate
            """)
    List<DetectedSubscription> findAllByUserId(Long userId);

    @Modifying
    @Query("delete from DetectedSubscription s where s.user.id = :userId")
    void deleteAllByUserId(Long userId);
}
