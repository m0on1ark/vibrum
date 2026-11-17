package pl.minibank.group.dto;

import java.math.BigDecimal;

public record TransferResponse(
        Long fromUserId,
        String fromDisplayName,
        Long toUserId,
        String toDisplayName,
        BigDecimal amount
) {
}
