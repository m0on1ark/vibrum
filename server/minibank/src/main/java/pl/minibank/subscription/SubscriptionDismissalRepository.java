package pl.minibank.subscription;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubscriptionDismissalRepository extends JpaRepository<SubscriptionDismissal, Long> {

    List<SubscriptionDismissal> findAllByUserId(Long userId);

    boolean existsByUserIdAndMerchantKeyAndCurrency(Long userId, String merchantKey, String currency);
}
