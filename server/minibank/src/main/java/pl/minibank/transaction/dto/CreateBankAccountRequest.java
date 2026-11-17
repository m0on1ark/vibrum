package pl.minibank.transaction.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import pl.minibank.transaction.entity.BankType;

@Data
public class CreateBankAccountRequest {
    @NotBlank(message = "Account name cannot be empty")
    private String accountName;

    @NotNull(message = "Bank type must be specified")
    private BankType bankType;

    @NotBlank(message = "Base currency cannot be empty")
    @Size(min = 3, max = 3, message = "Base currency must be exactly 3 characters")
    private String baseCurrency;
}