package pl.minibank.transaction.parser;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvException;
import org.springframework.stereotype.Component;
import pl.minibank.common.exception.BadRequestException;
import pl.minibank.transaction.dto.ParsedTransactionDto;
import pl.minibank.transaction.entity.BankType;

import java.io.IOException;
import java.io.InputStream;
import java.io.StringReader;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Component
public class RevolutParser implements StatementParser {

    private static final int CSV_COLUMNS = 10;
    private static final int MAX_TEXT_LENGTH = 255;
    private static final Set<String> CANCELLED_STATES = Set.of(
            "REVERTED", "DECLINED", "FAILED", "CANCELLED",
            "ОТМЕНЕНО", "ОТКЛОНЕНО",
            "COFNIĘTO", "ODRZUCONO", "ANULOWANO");

    private final ObjectMapper objectMapper;

    public RevolutParser() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    @Override
    public BankType getSupportedBank() {
        return BankType.REVOLUT;
    }

    @Override
    public List<ParsedTransactionDto> parse(InputStream inputStream) {
        String text;
        try {
            text = StatementText.read(inputStream);
        } catch (IOException e) {
            throw new BadRequestException("Could not read the Revolut statement file");
        }
        return text.stripLeading().startsWith("[") ? parseJson(text) : parseCsv(text);
    }

    private List<ParsedTransactionDto> parseJson(String text) {
        try {
            return objectMapper.readValue(text, new TypeReference<List<ParsedTransactionDto>>() {});
        } catch (Exception e) {
            throw new BadRequestException("Could not read the Revolut statement file");
        }
    }

    private List<ParsedTransactionDto> parseCsv(String text) {
        List<String[]> rows;
        try (CSVReader reader = new CSVReader(new StringReader(text))) {
            rows = reader.readAll();
        } catch (IOException | CsvException e) {
            throw new BadRequestException("Could not read the Revolut statement file");
        }
        if (rows.isEmpty() || rows.getFirst().length < CSV_COLUMNS) {
            throw new BadRequestException("Unrecognized Revolut statement format");
        }

        List<ParsedTransactionDto> transactions = new ArrayList<>();
        for (int i = 1; i < rows.size(); i++) {
            String[] columns = rows.get(i);
            if (columns.length < CSV_COLUMNS || columns[3].isBlank()
                    || CANCELLED_STATES.contains(columns[8].trim().toUpperCase(Locale.ROOT))) {
                continue;
            }
            try {
                BigDecimal fee = columns[6].isBlank() ? BigDecimal.ZERO : new BigDecimal(columns[6].trim());
                String description = limit(columns[4].trim());
                transactions.add(ParsedTransactionDto.builder()
                        .transactionDate(LocalDate.parse(columns[2].trim().substring(0, 10)))
                        .amount(new BigDecimal(columns[5].trim()).subtract(fee))
                        .currency(columns[7].trim().toUpperCase(Locale.ROOT))
                        .title(description)
                        .recipient(description)
                        .reference(columns[9].trim())
                        .build());
            } catch (DateTimeParseException | NumberFormatException | StringIndexOutOfBoundsException e) {
                throw new BadRequestException("Invalid Revolut statement row " + (i + 1));
            }
        }
        return transactions;
    }

    private static String limit(String value) {
        return value.length() > MAX_TEXT_LENGTH ? value.substring(0, MAX_TEXT_LENGTH) : value;
    }
}
