package pl.minibank.group;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import pl.minibank.common.persistence.BaseEntity;
import pl.minibank.user.User;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "shared_expenses")
public class SharedExpense extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "group_id", nullable = false)
    private ExpenseGroup group;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "paid_by", nullable = false)
    private User paidBy;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(name = "expense_date", nullable = false)
    private LocalDate expenseDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "split_mode", nullable = false, length = 10)
    private SplitMode splitMode;

    @Column(name = "exchange_rate", nullable = false, precision = 19, scale = 6)
    private BigDecimal exchangeRate;

    @Column(name = "amount_in_pln", nullable = false, precision = 19, scale = 4)
    private BigDecimal amountInPln;

    @OneToMany(mappedBy = "expense", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExpenseSplit> splits = new ArrayList<>();

    public SharedExpense(ExpenseGroup group, User paidBy, String title,
                         BigDecimal amount, String currency,
                         LocalDate expenseDate, SplitMode splitMode,
                         BigDecimal exchangeRate, BigDecimal amountInPln) {
        this.group = group;
        this.paidBy = paidBy;
        this.title = title;
        this.amount = amount;
        this.currency = currency;
        this.expenseDate = expenseDate;
        this.splitMode = splitMode;
        this.exchangeRate = exchangeRate;
        this.amountInPln = amountInPln;
    }

    public SharedExpense(ExpenseGroup group, User paidBy, String title,
                         BigDecimal amount, String currency,
                         LocalDate expenseDate, SplitMode splitMode) {
        this(group, paidBy, title, amount, currency, expenseDate, splitMode, BigDecimal.ONE, amount);
    }

    public void addSplit(ExpenseSplit split) {
        splits.add(split);
    }
}
