package pl.minibank.transaction.dto;

import lombok.Data;
import pl.minibank.transaction.entity.BankType;

@Data
public class CreateBankAccountRequest {
    private String accountName;
    private BankType bankType;
    private String baseCurrency;
}