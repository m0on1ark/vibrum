package pl.minibank.transaction.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import pl.minibank.category.CategorizationEngine;
import pl.minibank.common.exception.NotFoundException;
import pl.minibank.currency.service.NbpCurrencyService;
import pl.minibank.transaction.dto.*;
import pl.minibank.transaction.entity.BankAccount;
import pl.minibank.transaction.entity.Transaction;
import pl.minibank.transaction.parser.StatementParser;
import pl.minibank.transaction.repository.BankAccountRepository;
import pl.minibank.transaction.repository.TransactionRepository;
import pl.minibank.transaction.repository.TransactionSpecification;
import pl.minibank.user.User;
import pl.minibank.user.UserRepository;
import org.springframework.data.jpa.domain.Specification;
import pl.minibank.transaction.repository.TransactionSpecification;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final List<StatementParser> parsers;
    private final BankAccountRepository bankAccountRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final HashService hashService;
    private final NbpCurrencyService nbpCurrencyService;
    private final CategorizationEngine categorizationEngine;

    @Transactional
    public BankAccountDto createAccount(Long userId, CreateBankAccountRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        BankAccount account = bankAccountRepository.save(BankAccount.builder()
                .user(user)
                .accountName(request.getAccountName())
                .bankType(request.getBankType())
                .baseCurrency(request.getBaseCurrency().toUpperCase())
                .build());

        return mapToAccountDto(account);
    }

    public List<BankAccountDto> getUserAccounts(Long userId) {
        return bankAccountRepository.findAllByUserId(userId).stream()
                .map(this::mapToAccountDto)
                .toList();
    }

    @Transactional
    public ImportResultDto importStatement(MultipartFile file, Long accountId, Long userId) throws IOException {
        BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new NotFoundException("Bank account not found"));

        if (!account.getUser().getId().equals(userId)) {
            throw new NotFoundException("Bank account not found");
        }

        StatementParser parser = parsers.stream()
                .filter(p -> p.getSupportedBank() == account.getBankType())
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Unsupported bank type: " + account.getBankType()));

        List<ParsedTransactionDto> parsedTransactions = parser.parse(file.getInputStream());
        int importedCount = 0;
        int skippedCount = 0;

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

    public Page<TransactionDto> getUserTransactions(Long userId, Pageable pageable) {
        return transactionRepository.findAllByBankAccountUserId(userId, pageable)
                .map(this::mapToTransactionDto);
    }

    private BankAccountDto mapToAccountDto(BankAccount account) {
        return BankAccountDto.builder()
                .id(account.getId())
                .accountName(account.getAccountName())
                .bankType(account.getBankType())
                .baseCurrency(account.getBaseCurrency())
                .build();
    }

    private TransactionDto mapToTransactionDto(Transaction tx) {
        return TransactionDto.builder()
                .id(tx.getId())
                .accountId(tx.getBankAccount().getId())
                .date(tx.getTransactionDate())
                .amount(tx.getOriginalAmount())
                .currency(tx.getOriginalCurrency())
                .amountInPln(tx.getAmountInPln())
                .title(tx.getTitle())
                .recipient(tx.getRecipient())
                .categoryName(tx.getCategory() != null ? tx.getCategory().getName() : null)
                .build();
    }



    public Page<TransactionDto> getUserTransactions(
            Long userId, 
            LocalDate startDate, 
            LocalDate endDate, 
            Long categoryId, 
            Long accountId, 
            Pageable pageable) {
        
        Specification<Transaction> spec = Specification.where(TransactionSpecification.belongsToUser(userId))
                .and(TransactionSpecification.dateBetween(startDate, endDate))
                .and(TransactionSpecification.hasCategory(categoryId))
                .and(TransactionSpecification.belongsToAccount(accountId));

        return transactionRepository.findAll(spec, pageable)
                .map(this::mapToTransactionDto);
    }

}

