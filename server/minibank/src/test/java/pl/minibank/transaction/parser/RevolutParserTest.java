package pl.minibank.transaction.parser;

import org.junit.jupiter.api.Test;
import pl.minibank.common.exception.BadRequestException;
import pl.minibank.transaction.dto.ParsedTransactionDto;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RevolutParserTest {

    private final RevolutParser parser = new RevolutParser();

    @Test
    void shouldParseValidRevolutJson() {
        // Mocking Revolut JSON array structure
        String json = """
                [
                  {
                    "transactionDate": "2026-11-12",
                    "amount": -89.00,
                    "currency": "EUR",
                    "title": "UBER TRIP",
                    "recipient": "Uber BV"
                  }
                ]
                """;

        List<ParsedTransactionDto> result = parser.parse(new ByteArrayInputStream(json.getBytes(StandardCharsets.UTF_8)));

        // Assert mapping is correct
        assertThat(result).hasSize(1);
        
        ParsedTransactionDto dto = result.get(0);
        assertThat(dto.getTransactionDate()).isEqualTo(LocalDate.of(2026, 11, 12));
        assertThat(dto.getAmount()).isEqualByComparingTo(new BigDecimal("-89.00"));
        assertThat(dto.getCurrency()).isEqualTo("EUR");
        assertThat(dto.getTitle()).isEqualTo("UBER TRIP");
        assertThat(dto.getRecipient()).isEqualTo("Uber BV");
    }

    @Test
    void parsesCsvExportWithLocalizedHeadersAndFees() {
        String csv = """
                \uFEFFТип,Продукт,Дата начала,Дата выполнения,Описание,Сумма,Комиссия,Валюта,State,Остаток средств
                Переводы,Текущий,2026-10-10 18:33:22,2026-10-10 18:33:23,"Перевод, отправитель: JAN KOWALSKI",150.00,0.00,EUR,ВЫПОЛНЕНО,150.00
                Платеж по карте,Текущий,2026-10-11 12:01:00,2026-10-12 08:00:00,Biedronka,-2.74,0.03,EUR,ВЫПОЛНЕНО,147.23
                Платеж по карте,Текущий,2026-10-12 09:00:00,,Żabka,-4.39,0.00,EUR,ОТМЕНЕНО,
                Платеж по карте,Текущий,2026-11-17 19:10:00,,Carrefour,-37.40,0.00,PLN,В ОБРАБОТКЕ,
                """;

        List<ParsedTransactionDto> result = parser.parse(new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8)));

        assertThat(result).extracting(ParsedTransactionDto::getTitle)
                .containsExactly("Перевод, отправитель: JAN KOWALSKI", "Biedronka");
        ParsedTransactionDto purchase = result.get(1);
        assertThat(purchase.getTransactionDate()).isEqualTo(LocalDate.of(2026, 10, 11));
        assertThat(purchase.getAmount()).isEqualByComparingTo("-2.77");
        assertThat(purchase.getCurrency()).isEqualTo("EUR");
        assertThat(purchase.getRecipient()).isEqualTo("Biedronka");
        assertThat(purchase.getReference()).isEqualTo("147.23");
    }

    @Test
    void parsesEnglishCsvExport() {
        String csv = """
                Type,Product,Started Date,Completed Date,Description,Amount,Fee,Currency,State,Balance
                CARD_PAYMENT,Current,2026-11-01 10:00:00,2026-11-02 10:00:00,Spotify,-23.99,0.00,PLN,COMPLETED,500.00
                CARD_PAYMENT,Current,2026-11-03 10:00:00,2026-11-03 11:00:00,Uber,-15.00,0.00,PLN,REVERTED,500.00
                """;

        List<ParsedTransactionDto> result = parser.parse(new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8)));

        assertThat(result).singleElement().satisfies(spotify -> {
            assertThat(spotify.getTitle()).isEqualTo("Spotify");
            assertThat(spotify.getAmount()).isEqualByComparingTo("-23.99");
        });
    }

    @Test
    void unknownFileIsBadRequest() {
        assertThatThrownBy(() -> parser.parse(new ByteArrayInputStream("a,b\n1,2".getBytes(StandardCharsets.UTF_8))))
                .isInstanceOf(BadRequestException.class);
    }
}
