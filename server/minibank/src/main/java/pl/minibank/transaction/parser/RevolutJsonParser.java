package pl.minibank.transaction.parser;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.stereotype.Component;
import pl.minibank.common.exception.BadRequestException;
import pl.minibank.transaction.dto.ParsedTransactionDto;
import pl.minibank.transaction.entity.BankType;

import java.io.InputStream;
import java.util.List;

@Component
public class RevolutJsonParser implements StatementParser {

    private final ObjectMapper objectMapper;

    public RevolutJsonParser() {
        this.objectMapper = new ObjectMapper();
        // Register module to correctly parse Java 8 LocalDate fields
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    @Override
    public BankType getSupportedBank() {
        return BankType.REVOLUT;
    }

    @Override
    public List<ParsedTransactionDto> parse(InputStream inputStream) {
        try {
            // Map the JSON array directly to a List of ParsedTransactionDto objects
            return objectMapper.readValue(inputStream, new TypeReference<List<ParsedTransactionDto>>() {});
        } catch (Exception e) {
            throw new BadRequestException("Could not read the Revolut statement file");
        }
    }
}