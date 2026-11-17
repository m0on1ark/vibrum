package pl.minibank.transaction.parser;

import com.opencsv.CSVParser;
import com.opencsv.CSVParserBuilder;
import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import org.springframework.stereotype.Component;
import pl.minibank.common.exception.BadRequestException;
import pl.minibank.transaction.dto.ParsedTransactionDto;
import pl.minibank.transaction.entity.BankType;

import java.io.InputStream;
import java.io.StringReader;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Component
public class MBankCsvParser implements StatementParser {

    @Override
    public BankType getSupportedBank() {
        return BankType.MBANK;
    }

    @Override
    public List<ParsedTransactionDto> parse(InputStream inputStream) {
        List<ParsedTransactionDto> transactions = new ArrayList<>();

        // Configure CSV parser to use semicolon instead of a comma
        CSVParser parser = new CSVParserBuilder().withSeparator(';').build();

        try (CSVReader reader = new CSVReaderBuilder(new StringReader(StatementText.read(inputStream)))
                .withCSVParser(parser)
                .build()) {

            String[] columns;
            
            while ((columns = reader.readNext()) != null) {
                // Skip headers and metadata lines before the actual transaction data
                // We assume a valid transaction row starts with a date (YYYY-MM-DD)
                if (columns.length < 6 || !columns[0].matches("\\d{4}-\\d{2}-\\d{2}")) {
                    continue;
                }

                LocalDate date = LocalDate.parse(columns[0].trim());
                String title = columns[1].trim();
                
                // Replace comma with dot for BigDecimal parsing and remove spaces
                String cleanAmount = columns[4].trim().replace(",", ".").replace(" ", "");
                BigDecimal amount = new BigDecimal(cleanAmount);
                String currency = columns[5].trim().toUpperCase();

                transactions.add(ParsedTransactionDto.builder()
                        .transactionDate(date)
                        .amount(amount)
                        .currency(currency)
                        .title(title)
                        .recipient(title) // mBank often merges recipient into the title column
                        .build());
            }
        } catch (Exception e) {
            throw new BadRequestException("Could not read the mBank statement file");
        }

        return transactions;
    }
}