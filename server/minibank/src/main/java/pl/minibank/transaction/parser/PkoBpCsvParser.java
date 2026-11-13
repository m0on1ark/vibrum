package pl.minibank.transaction.parser;

import com.opencsv.CSVReader;
import org.springframework.stereotype.Component;
import pl.minibank.transaction.dto.ParsedTransactionDto;
import pl.minibank.transaction.entity.BankType;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Component
public class PkoBpCsvParser implements StatementParser {

    @Override
    public BankType getSupportedBank() {
        return BankType.PKO_BP;
    }

    @Override
    public List<ParsedTransactionDto> parse(InputStream inputStream) {
        List<ParsedTransactionDto> transactions = new ArrayList<>();

        try (CSVReader reader = new CSVReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            String[] columns;
            reader.readNext(); // Skip header row

            while ((columns = reader.readNext()) != null) {
                if (columns.length < 5) {
                    continue;
                }

                LocalDate date = LocalDate.parse(columns[0].trim());
                String cleanAmount = columns[1].trim().replace(",", ".").replace(" ", "");
                BigDecimal amount = new BigDecimal(cleanAmount);
                String currency = columns[2].trim().toUpperCase();
                String title = columns[3].trim();
                String recipient = columns[4].trim();

                transactions.add(ParsedTransactionDto.builder()
                        .transactionDate(date)
                        .amount(amount)
                        .currency(currency)
                        .title(title)
                        .recipient(recipient)
                        .build());
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to parse PKO BP CSV statement: " + e.getMessage(), e);
        }

        return transactions;
    }
}