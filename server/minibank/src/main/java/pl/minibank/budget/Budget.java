package pl.minibank.budget;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pl.minibank.category.Category;
import pl.minibank.common.persistence.BaseEntity;
import pl.minibank.user.User;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "budgets", uniqueConstraints = {
        @UniqueConstraint(name = "uk_budgets_user_category_month", columnNames = {"user_id", "category_id", "month_year"})
})
public class Budget extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(name = "month_year", nullable = false)
    private LocalDate monthYear;

    @Column(name = "limit_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal limitAmount;

    @Column(nullable = false, length = 3)
    private String currency = "PLN";

    public Budget(User user, Category category, LocalDate monthYear, BigDecimal limitAmount, String currency) {
        this.user = user;
        this.category = category;
        this.monthYear = monthYear;
        this.limitAmount = limitAmount;
        this.currency = (currency != null && !currency.isBlank()) ? currency : "PLN";
    }
}
