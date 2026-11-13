package pl.minibank.transaction.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "bank_accounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String accountName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BankType bankType;

    @Column(nullable = false, length = 3)
    private String baseCurrency;
}
