package pl.minibank.transaction.parser;

import org.junit.jupiter.api.Test;
import pl.minibank.common.exception.BadRequestException;
import pl.minibank.transaction.dto.ParsedTransactionDto;
import pl.minibank.transaction.service.HashService;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PkoBpCsvParserTest {

    private static final String EXPORT_HEADER = "\"Data operacji\",\"Data waluty\",\"Typ transakcji\",\"Kwota\",\"Waluta\","
            + "\"Saldo po transakcji\",\"Opis transakcji\",\"\",\"\",\"\",\"\",\"\",\"\"\n";

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

    @Test
    void parsesBankExportInWindows1250() {
        String csv = EXPORT_HEADER + """
                "","2026-10-24","Blokada","-12.00","PLN","W rozliczeniu","Tytuł: P0000000000000000AAAA  ","Lokalizacja: Adres: SKLEP 12 Miasto: WARSZAWA Kraj: POLSKA","","","","",""
                "2026-10-23","2026-10-21","Płatność kartą","-23.99","PLN","+1000.00","Tytuł: 000000000 00000000000000000000000  ","Lokalizacja: Adres: Spotify P3FADA7268 Miasto: Stockholm Kraj: SZWECJA","Data wykonania operacji: 2026-10-21","Oryginalna kwota operacji: 23.99","Numer karty: 425125******0000","",""
                "2026-10-22","2026-10-22","Płatność kartą","-15.48","PLN","+1023.99","Tytuł: 000000000 00000000000000000000000  ","Lokalizacja: Adres: JMP S.A. BIEDRONKA 7561 Miasto: WARSZAWA Kraj: POLSKA","Data wykonania operacji: 2026-10-20","Oryginalna kwota operacji: 15.48","Numer karty: 425125******0000","",""
                "2026-10-21","2026-10-21","Przelew na telefon przychodz. wew.","-30.00","PLN","+1039.47","Rachunek odbiorcy: 00 0000 0000 0000 0000 0000 0000","Nazwa odbiorcy: Jan Kowalski","Tytuł: PIZZA  OD: 48000000000 DO: 48000000001","Referencje własne zleceniodawcy: 000000000000","","",""
                "2026-10-20","2026-10-20","Przelew do ZUS","-400.00","PLN","+1069.47","Rachunek odbiorcy: 00 0000 0000 0000 0000 0000 0000","Nazwa odbiorcy: ZUS","Tytuł: UBEZPIECZENIE ZDROWOTNE   ","Referencje własne zleceniodawcy: 000000000000","","",""
                "2026-10-19","2026-10-19","CASH_IN_ATM_TX_CODE","+200.00","PLN","+1469.47","T:00000000000 W:S1WA0000","","","","","",""
                "2026-10-18","2026-10-18","Wypłata w bankomacie - kod mobilny","-100.00","PLN","+1269.47","Tytuł: S1WA0000 0000 00000000000000000   ","Numer telefonu: 48000000000","Lokalizacja: Adres: UL. GROJECKA 17 Miasto: WARSZAWA Kraj: POLSKA","Bankomat: S1WA0000","'Operacja: 0000","Numer referencyjny: 0000",""
                """;

        List<ParsedTransactionDto> result = parser.parse(new ByteArrayInputStream(csv.getBytes(Charset.forName("windows-1250"))));

        assertThat(result).extracting(ParsedTransactionDto::getTitle).containsExactly(
                "Spotify", "JMP S.A. BIEDRONKA", "PIZZA", "UBEZPIECZENIE ZDROWOTNE", "Wpłata gotówki",
                "Wypłata w bankomacie - kod mobilny");
        assertThat(result).extracting(ParsedTransactionDto::getRecipient).containsExactly(
                "Spotify", "JMP S.A. BIEDRONKA", "Jan Kowalski", "ZUS", null, "UL. GROJECKA");

        ParsedTransactionDto spotify = result.getFirst();
        assertThat(spotify.getTransactionDate()).isEqualTo(LocalDate.of(2026, 10, 23));
        assertThat(spotify.getAmount()).isEqualByComparingTo("-23.99");
        assertThat(spotify.getCurrency()).isEqualTo("PLN");
        assertThat(result.get(4).getAmount()).isEqualByComparingTo("200.00");
    }

    @Test
    void identicalPurchasesOnTheSameDayAreNotDuplicates() {
        String csv = EXPORT_HEADER + """
                "2026-10-23","2026-10-23","Płatność kartą","-5.99","PLN","+100.00","Tytuł: 0","Lokalizacja: Adres: ZABKA Z6605 K.1 Miasto: WARSZAWA Kraj: POLSKA","","","","",""
                "2026-10-23","2026-10-23","Płatność kartą","-5.99","PLN","+105.99","Tytuł: 0","Lokalizacja: Adres: ZABKA Z6605 K.1 Miasto: WARSZAWA Kraj: POLSKA","","","","",""
                """;
        HashService hashService = new HashService();

        List<ParsedTransactionDto> result = parser.parse(new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8)));

        assertThat(result).extracting(ParsedTransactionDto::getTitle).containsOnly("ZABKA");
        assertThat(hashService.calculateHash(1L, result.get(0))).isNotEqualTo(hashService.calculateHash(1L, result.get(1)));
    }

    @Test
    void invalidRowIsBadRequest() {
        String csv = EXPORT_HEADER + """
                "2026-10-23","2026-10-23","Płatność kartą","abc","PLN","+100.00","","","","","","",""
                """;

        assertThatThrownBy(() -> parser.parse(new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8))))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("row 2");
    }

    @Test
    void unknownFileIsBadRequest() {
        assertThatThrownBy(() -> parser.parse(new ByteArrayInputStream("hello\nworld".getBytes(StandardCharsets.UTF_8))))
                .isInstanceOf(BadRequestException.class);
    }
}
