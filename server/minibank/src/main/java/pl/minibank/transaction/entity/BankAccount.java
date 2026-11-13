package pl.minibank.transaction.entity;

import jakarta.persistence.*;
import lombok.*;
import pl.minibank.common.persistence.BaseEntity;
import pl.minibank.user.User;

@Entity
@Table(name = "bank_accounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankAccount extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "account_name", nullable = false, length = 100)
    private String accountName;

    @Enumerated(EnumType.STRING)
    @Column(name = "bank_type", nullable = false, length = 20)
    private BankType bankType;

    @Column(name = "base_currency", nullable = false, length = 3)
    private String baseCurrency;
}