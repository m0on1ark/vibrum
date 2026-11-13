package pl.minibank.currency.entity;

import jakarta.persistence.*;
import lombok.*;
import pl.minibank.common.persistence.BaseEntity;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(
    name = "exchange_rates",
    uniqueConstraints = @UniqueConstraint(columnNames = {"currency_code", "rate_date"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExchangeRate extends BaseEntity {

    @Column(name = "currency_code", nullable = false, length = 3)
    private String currencyCode;

    @Column(name = "rate_date", nullable = false)
    private LocalDate rateDate;

    @Column(name = "rate", nullable = false, precision = 10, scale = 4)
    private BigDecimal rate;
}