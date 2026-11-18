package pl.minibank.currency;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pl.minibank.common.exception.BadRequestException;
import pl.minibank.currency.dto.CurrencyRateResponse;
import pl.minibank.currency.service.NbpCurrencyService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Locale;

@RestController
@RequestMapping("/api/currencies")
@RequiredArgsConstructor
public class CurrencyController {

    private final NbpCurrencyService nbpCurrencyService;

    @GetMapping("/rate")
    public CurrencyRateResponse getRate(@RequestParam(defaultValue = "PLN") String currency) {
        String code = currency.trim().toUpperCase(Locale.ROOT);
        if (!code.matches("[A-Z]{3}")) {
            throw new BadRequestException("Currency must be a 3-letter currency code");
        }
        LocalDate today = LocalDate.now();
        BigDecimal rate = nbpCurrencyService.getExchangeRateToPln(code, today);
        return new CurrencyRateResponse(code, rate, today);
    }
}
