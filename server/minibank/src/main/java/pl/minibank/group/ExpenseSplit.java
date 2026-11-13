package pl.minibank.group;

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

import java.math.BigDecimal;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "expense_splits")
public class ExpenseSplit extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "expense_id", nullable = false)
    private SharedExpense expense;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "share_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal shareAmount;

    @Column(name = "share_percent", precision = 6, scale = 3)
    private BigDecimal sharePercent;

    @Column(name = "is_settled", nullable = false)
    private boolean settled = false;

    public ExpenseSplit(SharedExpense expense, User user, BigDecimal shareAmount, BigDecimal sharePercent) {
        this.expense = expense;
        this.user = user;
        this.shareAmount = shareAmount;
        this.sharePercent = sharePercent;
    }

    public void markSettled() {
        this.settled = true;
    }
}
