package pl.minibank.group.dto;

import java.math.BigDecimal;

public record BalanceResponse(
        Long userId,
        String displayName,
        String email,
        BigDecimal netBalance
) {
}
