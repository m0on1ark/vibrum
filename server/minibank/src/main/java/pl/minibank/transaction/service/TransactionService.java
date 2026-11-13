package pl.minibank.transaction.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import pl.minibank.category.CategorizationEngine;
import pl.minibank.currency.service.NbpCurrencyService;
import pl.minibank.transaction.dto.ImportResultDto;
import pl.minibank.transaction.dto.ParsedTransactionDto;
import pl.minibank.transaction.entity.BankAccount;
import pl.minibank.transaction.entity.BankType;
import pl.minibank.transaction.entity.Transaction;
import pl.minibank.transaction.parser.StatementParser;
import pl.minibank.transaction.repository.BankAccountRepository;
import pl.minibank.transaction.repository.TransactionRepository;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final List<StatementParser> parsers;
    private final BankAccountRepository bankAccountRepository;
    private final TransactionRepository transactionRepository;
    private final HashService hashService;
    private final NbpCurrencyService nbpCurrencyService;
    private final CategorizationEngine categorizationEngine;

    @Transactional
    public ImportResultDto importStatement(MultipartFile file, BankType bankType, Long accountId) throws IOException {
        BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Bank account not found: " + accountId));

        StatementParser parser = parsers.stream()
                .filter(p -> p.getSupportedBank() == bankType)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unsupported bank type: " + bankType));

        List<ParsedTransactionDto> parsedTransactions = parser.parse(file.getInputStream());

        int importedCount = 0;
        int skippedCount = 0;
        Long userId = account.getUser().getId();

        for (ParsedTransactionDto dto : parsedTransactions) {
            String hash = hashService.calculateHash(accountId, dto);
            if (transactionRepository.existsByBankAccountIdAndTransactionHash(accountId, hash)) {
                skippedCount++;
                continue;
            }

            BigDecimal rate = nbpCurrencyService.getExchangeRateToPln(dto.getCurrency(), dto.getTransactionDate());
            BigDecimal amountInPln = dto.getAmount().multiply(rate).setScale(2, RoundingMode.HALF_UP);

            Transaction transaction = Transaction.builder()
                    .bankAccount(account)
                    .transactionDate(dto.getTransactionDate())
                    .originalAmount(dto.getAmount())
                    .originalCurrency(dto.getCurrency().toUpperCase())
                    .amountInPln(amountInPln)
                    .exchangeRate(rate)
                    .title(dto.getTitle())
                    .recipient(dto.getRecipient())
                    .transactionHash(hash)
                    .build();

            categorizationEngine.categorize(userId, dto.getTitle(), dto.getRecipient())
                    .ifPresent(rule -> transaction.setCategory(rule.getCategory()));

            transactionRepository.save(transaction);
            importedCount++;
        }

        return new ImportResultDto(importedCount, skippedCount);
    }

    public Page<Transaction> getTransactions(Pageable pageable) {
        return transactionRepository.findAll(pageable);
    }
}