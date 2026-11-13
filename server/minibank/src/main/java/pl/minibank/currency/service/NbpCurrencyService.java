package pl.minibank.currency.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import pl.minibank.common.exception.BadRequestException;
import pl.minibank.currency.dto.NbpRateResponseDto;
import pl.minibank.currency.entity.ExchangeRate;
import pl.minibank.currency.repository.ExchangeRateRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class NbpCurrencyService {

    private final ExchangeRateRepository exchangeRateRepository;
    private final RestClient restClient = RestClient.create();

    public BigDecimal getExchangeRateToPln(String currency, LocalDate date) {
        if ("PLN".equalsIgnoreCase(currency)) {
            return BigDecimal.ONE;
        }

        String cleanCurrency = currency.trim().toUpperCase();

        // По требованиям NBP: курс берется за предыдущий рабочий день
        for (int i = 1; i <= 7; i++) {
            LocalDate targetDate = date.minusDays(i);

            Optional<ExchangeRate> cachedRate = exchangeRateRepository
                    .findByCurrencyCodeAndRateDate(cleanCurrency, targetDate);
            if (cachedRate.isPresent()) {
                return cachedRate.get().getRate();
            }

            try {
                String url = String.format("https://api.nbp.pl/api/exchangerates/rates/a/%s/%s/?format=json",
                        cleanCurrency.toLowerCase(), targetDate);

                NbpRateResponseDto response = restClient.get()
                        .uri(url)
                        .retrieve()
                        .body(NbpRateResponseDto.class);

                if (response != null && response.getRates() != null && !response.getRates().isEmpty()) {
                    BigDecimal rate = response.getRates().get(0).getMid();

                    exchangeRateRepository.save(ExchangeRate.builder()
                            .currencyCode(cleanCurrency)
                            .rateDate(targetDate)
                            .rate(rate)
                            .build());

                    return rate;
                }
            } catch (HttpClientErrorException.NotFound e) {
            }
        }

        throw new BadRequestException("Failed to fetch NBP exchange rate for " + cleanCurrency + " around " + date);
    }
}