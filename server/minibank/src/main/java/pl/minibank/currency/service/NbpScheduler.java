package pl.minibank.currency.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Slf4j
@Component
@RequiredArgsConstructor
public class NbpScheduler {

    private final NbpCurrencyService nbpCurrencyService;

    // Запускается каждый день в 12:00
    @Scheduled(cron = "0 0 12 * * *")
    public void prefetchRates() {
        log.info("Starting scheduled NBP exchange rates prefetch...");
        try {
            // Прогреваем кэш для основных валют на текущую дату
            nbpCurrencyService.getExchangeRateToPln("EUR", LocalDate.now());
            nbpCurrencyService.getExchangeRateToPln("USD", LocalDate.now());
            log.info("Successfully prefetched NBP exchange rates.");
        } catch (Exception e) {
            log.error("Failed to prefetch NBP exchange rates: {}", e.getMessage());
        }
    }
}