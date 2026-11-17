package pl.minibank.transaction.parser;

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
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Component
public class PkoBpCsvParser implements StatementParser {

    private static final int MAX_TEXT_LENGTH = 255;
    private static final Pattern LOCATION = Pattern.compile("Adres: (.*?)(?: Miasto: .*)?$");
    private static final Pattern PHONE_TRANSFER_SUFFIX = Pattern.compile("\\s+OD: \\d+ DO: \\d+\\s*$");

    @Override
    public BankType getSupportedBank() {
        return BankType.PKO_BP;
    }

    @Override
    public List<ParsedTransactionDto> parse(InputStream inputStream) {
        List<String[]> rows;
        try (CSVReader reader = new CSVReader(new StringReader(StatementText.read(inputStream)))) {
            rows = reader.readAll();
        } catch (IOException | CsvException e) {
            throw new BadRequestException("Could not read the PKO BP statement file");
        }
        if (rows.isEmpty()) {
            return List.of();
        }

        boolean bankExport = Arrays.asList(rows.getFirst()).contains("Typ transakcji");
        if (!bankExport && rows.getFirst().length < 5) {
            throw new BadRequestException("Unrecognized PKO BP statement format");
        }
        List<ParsedTransactionDto> transactions = new ArrayList<>();
        for (int i = 1; i < rows.size(); i++) {
            try {
                ParsedTransactionDto transaction = bankExport ? parseExportRow(rows.get(i)) : parseSimpleRow(rows.get(i));
                if (transaction != null) {
                    transactions.add(transaction);
                }
            } catch (DateTimeParseException | NumberFormatException e) {
                throw new BadRequestException("Invalid PKO BP statement row " + (i + 1));
            }
        }
        return transactions;
    }

    private ParsedTransactionDto parseSimpleRow(String[] columns) {
        if (columns.length < 5) {
            return null;
        }
        return ParsedTransactionDto.builder()
                .transactionDate(LocalDate.parse(columns[0].trim()))
                .amount(amount(columns[1]))
                .currency(columns[2].trim().toUpperCase())
                .title(columns[3].trim())
                .recipient(columns[4].trim())
                .build();
    }

    private ParsedTransactionDto parseExportRow(String[] columns) {
        if (columns.length < 7 || columns[0].isBlank()) {
            return null;
        }

        String type = columns[2].trim();
        Map<String, String> details = details(columns);
        String merchant = merchant(details.get("Lokalizacja"));
        String counterparty = details.getOrDefault("Nazwa odbiorcy", details.get("Nazwa nadawcy"));
        String transferTitle = transferTitle(details.get("Tytuł"));

        String title;
        String recipient;
        if (merchant != null) {
            recipient = merchant;
            title = details.containsKey("Bankomat") ? type : merchant;
        } else if (counterparty != null) {
            recipient = counterparty;
            title = transferTitle != null ? transferTitle : type;
        } else {
            recipient = null;
            title = type.startsWith("CASH_IN") ? "Wpłata gotówki" : type;
        }

        return ParsedTransactionDto.builder()
                .transactionDate(LocalDate.parse(columns[0].trim()))
                .amount(amount(columns[3]))
                .currency(columns[4].trim().toUpperCase())
                .title(limit(title))
                .recipient(limit(recipient))
                .reference(columns[5].trim())
                .build();
    }

    private static Map<String, String> details(String[] columns) {
        Map<String, String> details = new HashMap<>();
        for (int i = 6; i < columns.length; i++) {
            int separator = columns[i].indexOf(": ");
            if (separator > 0) {
                details.putIfAbsent(columns[i].substring(0, separator).trim(), columns[i].substring(separator + 2).trim());
            }
        }
        return details;
    }

    private static String merchant(String location) {
        if (location == null) {
            return null;
        }
        Matcher matcher = LOCATION.matcher(location);
        if (!matcher.find() || matcher.group(1).isBlank()) {
            return null;
        }
        String name = matcher.group(1).trim();
        String withoutCodes = Arrays.stream(name.split("\\s+"))
                .filter(token -> !token.matches(".*\\d.*"))
                .collect(Collectors.joining(" "));
        return withoutCodes.isBlank() ? name : withoutCodes;
    }

    private static String transferTitle(String title) {
        if (title == null) {
            return null;
        }
        String cleaned = PHONE_TRANSFER_SUFFIX.matcher(title).replaceAll("").trim();
        return cleaned.isEmpty() ? null : cleaned;
    }

    private static BigDecimal amount(String value) {
        return new BigDecimal(value.trim().replace(",", ".").replace(" ", ""));
    }

    private static String limit(String value) {
        if (value == null) {
            return null;
        }
        return value.length() > MAX_TEXT_LENGTH ? value.substring(0, MAX_TEXT_LENGTH) : value;
    }
}
