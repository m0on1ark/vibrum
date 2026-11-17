package pl.minibank.transaction.parser;

import pl.minibank.transaction.dto.ParsedTransactionDto;
import pl.minibank.transaction.entity.BankType;

import java.io.InputStream;
import java.util.List;

public interface StatementParser {
    
    
    BankType getSupportedBank();

    
    List<ParsedTransactionDto> parse(InputStream inputStream);
}
