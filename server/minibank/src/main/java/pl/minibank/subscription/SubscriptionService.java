package pl.minibank.subscription;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.minibank.category.CategorizationEngine;
import pl.minibank.category.CategorizationRule;
import pl.minibank.common.exception.NotFoundException;
import pl.minibank.subscription.dto.SubscriptionResponse;
import pl.minibank.subscription.dto.SubscriptionTotalResponse;
import pl.minibank.user.User;
import pl.minibank.user.UserRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private final DetectedSubscriptionRepository subscriptionRepository;
    private final SubscriptionDismissalRepository dismissalRepository;
    private final UserRepository userRepository;
    private final CategorizationEngine categorizationEngine;
    private final SubscriptionPaymentSource paymentSource;
    private final SubscriptionDetector detector = new SubscriptionDetector();

    @Transactional(readOnly = true)
    public List<SubscriptionResponse> list(Long userId) {
        return subscriptionRepository.findAllByUserId(userId).stream()
                .map(SubscriptionResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SubscriptionTotalResponse> totals(Long userId) {
        Map<String, List<DetectedSubscription>> byCurrency = new TreeMap<>();
        for (DetectedSubscription subscription : subscriptionRepository.findAllByUserId(userId)) {
            byCurrency.computeIfAbsent(subscription.getCurrency(), c -> new ArrayList<>()).add(subscription);
        }

        return byCurrency.entrySet().stream()
                .map(entry -> {
                    BigDecimal yearly = entry.getValue().stream()
                            .map(s -> s.getBillingPeriod().yearlyCost(s.getAmount()))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return new SubscriptionTotalResponse(
                            entry.getKey(),
                            entry.getValue().size(),
                            yearly.divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP),
                            yearly.setScale(2, RoundingMode.HALF_UP));
                })
                .toList();
    }

    @Transactional
    public List<SubscriptionResponse> detect(Long userId) {
        List<PaymentRecord> payments = paymentSource.findPayments(userId);
        List<SubscriptionDismissal> dismissals = dismissalRepository.findAllByUserId(userId);
        List<SubscriptionDetector.DetectedPattern> patterns = detector.detect(payments, LocalDate.now()).stream()
                .filter(pattern -> dismissals.stream().noneMatch(dismissal -> dismissal.matches(pattern)))
                .toList();

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

    @Transactional
    public void dismiss(Long userId, Long subscriptionId) {
        DetectedSubscription subscription = subscriptionRepository.findById(subscriptionId)
                .filter(s -> s.getUser().getId().equals(userId))
                .orElseThrow(() -> new NotFoundException("Subscription not found"));

        if (!dismissalRepository.existsByUserIdAndMerchantKeyAndCurrency(
                userId, subscription.getMerchantKey(), subscription.getCurrency())) {
            dismissalRepository.save(new SubscriptionDismissal(
                    subscription.getUser(), subscription.getMerchantKey(), subscription.getCurrency()));
        }
        subscriptionRepository.delete(subscription);
    }
}
