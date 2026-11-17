package pl.minibank.subscription;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import pl.minibank.category.Category;
import pl.minibank.common.persistence.BaseEntity;
import pl.minibank.user.User;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "detected_subscriptions")
public class DetectedSubscription extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(nullable = false)
    private String merchant;

    @Column(name = "merchant_key", nullable = false)
    private String merchantKey;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_period", nullable = false, length = 20)
    private BillingPeriod billingPeriod;

    @Column(nullable = false)
    private int occurrences;

    @Column(name = "last_payment_date", nullable = false)
    private LocalDate lastPaymentDate;

    @Column(name = "next_payment_date", nullable = false)
    private LocalDate nextPaymentDate;

    public DetectedSubscription(User user, Category category, SubscriptionDetector.DetectedPattern pattern) {
        this.user = user;
        this.category = category;
        this.merchant = pattern.merchant();
        this.merchantKey = pattern.merchantKey();
        this.amount = pattern.amount();
        this.currency = pattern.currency();
        this.billingPeriod = pattern.period();
        this.occurrences = pattern.occurrences();
        this.lastPaymentDate = pattern.lastPaymentDate();
        this.nextPaymentDate = pattern.nextPaymentDate();
    }
}
