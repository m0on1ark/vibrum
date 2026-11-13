package pl.minibank.group.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import pl.minibank.group.SplitMode;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record CreateExpenseRequest(
        @NotBlank @Size(max = 200) String title,
        @NotNull @Positive BigDecimal amount,
        @Size(min = 3, max = 3) String currency,
        @NotNull LocalDate expenseDate,
        @NotNull SplitMode splitMode,
        List<SplitEntryRequest> splits
) {
}
