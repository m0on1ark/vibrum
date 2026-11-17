package pl.minibank.subscription;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import pl.minibank.common.persistence.BaseEntity;
import pl.minibank.user.User;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "subscription_dismissals")
public class SubscriptionDismissal extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "merchant_key", nullable = false)
    private String merchantKey;

    @Column(nullable = false, length = 3)
    private String currency;

    public SubscriptionDismissal(User user, String merchantKey, String currency) {
        this.user = user;
        this.merchantKey = merchantKey;
        this.currency = currency;
    }

    public boolean matches(SubscriptionDetector.DetectedPattern pattern) {
        return merchantKey.equals(pattern.merchantKey()) && currency.equals(pattern.currency());
    }
}
