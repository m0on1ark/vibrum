package pl.minibank.subscription;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PaymentRecord(LocalDate date, BigDecimal amount, String currency, String title, String recipient) {
}
