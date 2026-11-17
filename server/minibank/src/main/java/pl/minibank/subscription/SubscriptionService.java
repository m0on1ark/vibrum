package pl.minibank.subscription;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.minibank.category.CategorizationEngine;
import pl.minibank.category.CategorizationRule;
import pl.minibank.subscription.dto.SubscriptionResponse;
import pl.minibank.user.User;
import pl.minibank.user.UserRepository;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private final DetectedSubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final CategorizationEngine categorizationEngine;
    private final ObjectProvider<SubscriptionPaymentSource> paymentSource;
    private final SubscriptionDetector detector = new SubscriptionDetector();

    @Transactional(readOnly = true)
    public List<SubscriptionResponse> list(Long userId) {
        return subscriptionRepository.findAllByUserId(userId).stream()
                .map(SubscriptionResponse::from)
                .toList();
    }

    @Transactional
    public List<SubscriptionResponse> detect(Long userId) {
        List<PaymentRecord> payments = paymentSource.getIfAvailable(() -> id -> List.of()).findPayments(userId);
        List<SubscriptionDetector.DetectedPattern> patterns = detector.detect(payments, LocalDate.now());

        User user = userRepository.getReferenceById(userId);
        subscriptionRepository.deleteAllByUserId(userId);
        for (SubscriptionDetector.DetectedPattern pattern : patterns) {
            var category = categorizationEngine.categorize(userId, pattern.merchant(), null)
                    .map(CategorizationRule::getCategory)
                    .orElse(null);
            subscriptionRepository.save(new DetectedSubscription(user, category, pattern));
        }
        return list(userId);
    }
}
