package pl.minibank.group.dto;

import java.math.BigDecimal;

public record PaymentDetailsResponse(
        Long toUserId,
        String recipientName,
        String iban,
        BigDecimal amount,
        String currency,
        String title,
        String qrPayload
) {
}
