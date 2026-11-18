package pl.minibank.currency.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CurrencyRateResponse(String currency, BigDecimal rateToPln, LocalDate asOfDate) {
}
