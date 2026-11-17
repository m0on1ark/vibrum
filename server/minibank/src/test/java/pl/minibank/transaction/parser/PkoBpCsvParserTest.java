package pl.minibank.transaction.parser;

import org.junit.jupiter.api.Test;
import pl.minibank.transaction.dto.ParsedTransactionDto;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class PkoBpCsvParserTest {

    private final PkoBpCsvParser parser = new PkoBpCsvParser();

    @Test
    void shouldParseValidPkoBpCsvAndSkipHeaders() {
        // Mocking PKO BP CSV structure (comma separator)
        String csv = """
                Data operacji,Kwota,Waluta,Tytuł,Nadawca/Odbiorca
                2026-11-10,-45.99,PLN,Zakupy,BIEDRONKA
                2026-11-11,120.00,EUR,Wypłata,KOWALSKI
                """;

        List<ParsedTransactionDto> result = parser.parse(new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8)));

        // Assert that two transactions were parsed successfully
        assertThat(result).hasSize(2);

        // Check first transaction
        ParsedTransactionDto tx1 = result.get(0);
        assertThat(tx1.getTransactionDate()).isEqualTo(LocalDate.of(2026, 11, 10));
        // Ensure comma was correctly replaced by dot
        assertThat(tx1.getAmount()).isEqualByComparingTo(new BigDecimal("-45.99"));
        assertThat(tx1.getCurrency()).isEqualTo("PLN");
        assertThat(tx1.getTitle()).isEqualTo("Zakupy");

        // Check second transaction
        ParsedTransactionDto tx2 = result.get(1);
        assertThat(tx2.getTransactionDate()).isEqualTo(LocalDate.of(2026, 11, 11));
        assertThat(tx2.getAmount()).isEqualByComparingTo(new BigDecimal("120.00"));
        assertThat(tx2.getCurrency()).isEqualTo("EUR");
    }
}