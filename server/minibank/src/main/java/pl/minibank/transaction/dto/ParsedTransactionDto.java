package pl.minibank.transaction.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParsedTransactionDto {
    private LocalDate transactionDate;
    private BigDecimal amount;
    private String currency;
    private String title;
    private String recipient;
}
