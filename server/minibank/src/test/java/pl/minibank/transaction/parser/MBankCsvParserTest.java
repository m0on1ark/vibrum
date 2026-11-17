package pl.minibank.transaction.parser;

import org.junit.jupiter.api.Test;
import pl.minibank.transaction.dto.ParsedTransactionDto;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class MBankCsvParserTest {

    private final MBankCsvParser parser = new MBankCsvParser();

    @Test
    void shouldParseValidMBankCsvAndSkipHeaders() {
        // Mocking mBank CSV structure (semicolon separator, metadata headers)
        String csv = """
                #Data operacji;#Opis operacji;#Rachunek;#Kategoria;#Kwota;#Waluta
                2026-11-10;"ZABKA WARSZAWA";"Rachunek bieżący";"Zakupy";-15,50;PLN
                """;

        List<ParsedTransactionDto> result = parser.parse(new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8)));

        // Assert that exactly one transaction was parsed successfully
        assertThat(result).hasSize(1);
        
        ParsedTransactionDto dto = result.get(0);
        assertThat(dto.getTransactionDate()).isEqualTo(LocalDate.of(2026, 11, 10));
        // Ensure comma was correctly replaced by dot
        assertThat(dto.getAmount()).isEqualByComparingTo(new BigDecimal("-15.50"));
        assertThat(dto.getCurrency()).isEqualTo("PLN");
        assertThat(dto.getTitle()).isEqualTo("ZABKA WARSZAWA");
    }
}