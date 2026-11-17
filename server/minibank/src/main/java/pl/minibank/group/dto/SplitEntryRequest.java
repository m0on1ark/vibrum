package pl.minibank.group.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record SplitEntryRequest(
        @NotNull Long userId,
        BigDecimal percent,
        BigDecimal amount
) {
}
