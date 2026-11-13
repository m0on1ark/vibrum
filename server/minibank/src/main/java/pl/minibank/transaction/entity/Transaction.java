package pl.minibank.transaction.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_account_id", nullable = false)
    private BankAccount bankAccount;

    @Column(nullable = false)
    private LocalDate transactionDate;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal originalAmount; 

    @Column(nullable = false, length = 3)
    private String originalCurrency;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amountInPln;

    @Column(nullable = false, precision = 10, scale = 4)
    private BigDecimal exchangeRate; 

    @Column(nullable = false)
    private String title;

    private String recipient;

    @Column(nullable = false, unique = true, length = 64)
    private String transactionHash;

    private Long categoryId;
}