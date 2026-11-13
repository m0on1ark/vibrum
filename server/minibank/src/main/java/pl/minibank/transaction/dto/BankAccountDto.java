package pl.minibank.transaction.dto;

import lombok.Builder;
import lombok.Data;
import pl.minibank.transaction.entity.BankType;

@Data
@Builder
public class BankAccountDto {
    private Long id;
    private String accountName;
    private BankType bankType;
    private String baseCurrency;
}