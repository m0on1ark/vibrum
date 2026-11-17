package pl.minibank.transaction.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class TransactionDto {
    private Long id;
    private Long accountId;
    private LocalDate date;
    private BigDecimal amount;
    private String currency;
    private BigDecimal amountInPln;
    private String title;
    private String recipient;
    private String categoryName;
}