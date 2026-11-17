package pl.minibank.transaction.entity;

import jakarta.persistence.*;
import lombok.*;
import pl.minibank.category.Category;
import pl.minibank.common.persistence.BaseEntity;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(
    name = "transactions",
    uniqueConstraints = @UniqueConstraint(columnNames = {"bank_account_id", "transaction_hash"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_account_id", nullable = false)
    private BankAccount bankAccount;

    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    @Column(name = "original_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal originalAmount;

    @Column(name = "original_currency", nullable = false, length = 3)
    private String originalCurrency;

    @Column(name = "amount_in_pln", nullable = false, precision = 15, scale = 2)
    private BigDecimal amountInPln;

    @Column(name = "exchange_rate", nullable = false, precision = 10, scale = 4)
    private BigDecimal exchangeRate;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "recipient", length = 255)
    private String recipient;

    @Column(name = "transaction_hash", nullable = false, length = 64)
    private String transactionHash;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(name = "category_manual", nullable = false)
    private boolean categoryManual;
}