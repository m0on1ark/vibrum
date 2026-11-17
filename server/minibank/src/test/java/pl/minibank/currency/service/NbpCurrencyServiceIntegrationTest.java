package pl.minibank.currency.service;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import pl.minibank.common.exception.ServiceUnavailableException;
import pl.minibank.currency.entity.ExchangeRate;
import pl.minibank.currency.repository.ExchangeRateRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.startsWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withResourceNotFound;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class NbpCurrencyServiceIntegrationTest {

    @Test
    void shouldReturnCachedRateAndNotCallApi() {
        ExchangeRateRepository repository = mock(ExchangeRateRepository.class);
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        NbpCurrencyService service = new NbpCurrencyService(repository, builder);

        LocalDate requestDate = LocalDate.of(2026, 3, 10);
        LocalDate targetDate = requestDate.minusDays(1);

        ExchangeRate cachedRate = ExchangeRate.builder().rate(new BigDecimal("4.3210")).build();
        when(repository.findByCurrencyCodeAndRateDate("EUR", targetDate))
                .thenReturn(Optional.of(cachedRate));

        BigDecimal rate = service.getExchangeRateToPln("EUR", requestDate);

        assertThat(rate).isEqualByComparingTo("4.3210");
        verify(repository, times(1)).findByCurrencyCodeAndRateDate("EUR", targetDate);
        verify(repository, never()).save(any());
        server.verify();
    }

    @Test
    void shouldFallbackToFridayOnWeekend() {
        ExchangeRateRepository repository = mock(ExchangeRateRepository.class);
        when(repository.findByCurrencyCodeAndRateDate(any(), any())).thenReturn(Optional.empty());

        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        NbpCurrencyService service = new NbpCurrencyService(repository, builder);

        LocalDate monday = LocalDate.of(2026, 3, 16);
        LocalDate sunday = monday.minusDays(1);
        LocalDate saturday = monday.minusDays(2);
        LocalDate friday = monday.minusDays(3);

        server.expect(requestTo("https://api.nbp.pl/api/exchangerates/rates/a/eur/" + sunday + "/?format=json"))
                .andRespond(withResourceNotFound());
        server.expect(requestTo("https://api.nbp.pl/api/exchangerates/rates/a/eur/" + saturday + "/?format=json"))
                .andRespond(withResourceNotFound());

        String fridayResponse = """
                { "rates": [ { "mid": 4.3000 } ] }
                """;
        server.expect(requestTo("https://api.nbp.pl/api/exchangerates/rates/a/eur/" + friday + "/?format=json"))
                .andRespond(withSuccess(fridayResponse, MediaType.APPLICATION_JSON));

        BigDecimal rate = service.getExchangeRateToPln("EUR", monday);

        assertThat(rate).isEqualByComparingTo("4.3000");
        verify(repository, times(1)).save(any(ExchangeRate.class));
        server.verify();
    }

    @Test
    void shouldReportUnavailableWhenNbpIsDown() {
        ExchangeRateRepository repository = mock(ExchangeRateRepository.class);
        when(repository.findByCurrencyCodeAndRateDate(any(), any())).thenReturn(Optional.empty());

        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        NbpCurrencyService service = new NbpCurrencyService(repository, builder);

        server.expect(requestTo(startsWith("https://api.nbp.pl/"))).andRespond(withServerError());

        assertThatThrownBy(() -> service.getExchangeRateToPln("EUR", LocalDate.of(2026, 3, 16)))
                .isInstanceOf(ServiceUnavailableException.class);
    }
}
