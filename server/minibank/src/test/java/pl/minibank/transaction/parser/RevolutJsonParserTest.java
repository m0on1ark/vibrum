package pl.minibank.transaction.parser;

import org.junit.jupiter.api.Test;
import pl.minibank.transaction.dto.ParsedTransactionDto;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class RevolutJsonParserTest {

    private final RevolutJsonParser parser = new RevolutJsonParser();

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
}