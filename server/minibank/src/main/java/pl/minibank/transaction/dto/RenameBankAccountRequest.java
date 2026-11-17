package pl.minibank.transaction.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RenameBankAccountRequest {
    @NotBlank(message = "Account name cannot be empty")
    @Size(max = 100, message = "Account name must be at most 100 characters")
    private String accountName;
}
