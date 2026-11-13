package pl.minibank.category;

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
import lombok.Setter;
import pl.minibank.common.persistence.BaseEntity;
import pl.minibank.user.User;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "categorization_rules")
public class CategorizationRule extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(name = "match_type", nullable = false, length = 20)
    private RuleMatchType matchType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RuleTarget target = RuleTarget.ANY;

    @Column(nullable = false)
    private String pattern;

    @Column(nullable = false)
    private int priority;

    public CategorizationRule(User user, Category category, RuleMatchType matchType, RuleTarget target,
                              String pattern, int priority) {
        this.user = user;
        this.category = category;
        this.matchType = matchType;
        this.target = target;
        this.pattern = pattern;
        this.priority = priority;
    }

    public boolean isSystem() {
        return user == null;
    }

    public boolean isOwnedBy(Long userId) {
        return user != null && user.getId().equals(userId);
    }
}
