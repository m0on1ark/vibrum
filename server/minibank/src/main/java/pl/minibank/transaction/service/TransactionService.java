package pl.minibank.transaction.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import pl.minibank.category.CategorizationEngine;
import pl.minibank.category.CategorizationRule;
import pl.minibank.category.Category;
import pl.minibank.category.CategoryService;
import pl.minibank.common.exception.BadRequestException;
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

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

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
    private final CategoryService categoryService;

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

    @Transactional(readOnly = true)
    public List<BankAccountDto> getUserAccounts(Long userId) {
        return bankAccountRepository.findAllByUserId(userId).stream()
                .map(this::mapToAccountDto)
                .toList();
    }

    @Transactional
    public ImportResultDto importStatement(MultipartFile file, Long accountId, Long userId) throws IOException {
        BankAccount account = getOwnedAccount(userId, accountId);

        StatementParser parser = parsers.stream()
                .filter(p -> p.getSupportedBank() == account.getBankType())
                .findFirst()
                .orElseThrow(() -> new BadRequestException("Unsupported bank type: " + account.getBankType()));

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

    @Transactional(readOnly = true)
    public Page<TransactionDto> getUserTransactions(
            Long userId, LocalDate startDate, LocalDate endDate, 
            Long categoryId, Long accountId, Pageable pageable) {
        
        Specification<Transaction> spec = Specification.where(TransactionSpecification.belongsToUser(userId))
                .and(TransactionSpecification.dateBetween(startDate, endDate))
                .and(TransactionSpecification.hasCategory(categoryId))
                .and(TransactionSpecification.belongsToAccount(accountId));

        return transactionRepository.findAll(spec, pageable)
                .map(this::mapToTransactionDto);
    }

    @Transactional
    public BankAccountDto renameAccount(Long userId, Long accountId, RenameBankAccountRequest request) {
        BankAccount account = getOwnedAccount(userId, accountId);
        account.setAccountName(request.getAccountName().trim());
        return mapToAccountDto(account);
    }

    @Transactional
    public void deleteAccount(Long userId, Long accountId) {
        bankAccountRepository.delete(getOwnedAccount(userId, accountId));
    }

    @Transactional
    public TransactionDto updateCategory(Long userId, Long transactionId, UpdateTransactionCategoryRequest request) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .filter(t -> t.getBankAccount().getUser().getId().equals(userId))
                .orElseThrow(() -> new NotFoundException("Transaction not found"));

        if (request.getCategoryId() == null) {
            transaction.setCategory(null);
        } else {
            transaction.setCategory(categoryService.getVisible(userId, request.getCategoryId()));
        }
        transaction.setCategoryManual(true);
        return mapToTransactionDto(transaction);
    }

    @Transactional
    public RecategorizeResultDto recategorize(Long userId) {
        List<Transaction> transactions = transactionRepository.findAllAutoCategorizedByUserId(userId);
        int changed = 0;
        for (Transaction transaction : transactions) {
            Category category = categorizationEngine.categorize(userId, transaction.getTitle(), transaction.getRecipient())
                    .map(CategorizationRule::getCategory)
                    .orElse(null);
            if (!Objects.equals(categoryId(category), categoryId(transaction.getCategory()))) {
                transaction.setCategory(category);
                changed++;
            }
        }
        return new RecategorizeResultDto(transactions.size(), changed);
    }

    private BankAccount getOwnedAccount(Long userId, Long accountId) {
        return bankAccountRepository.findById(accountId)
                .filter(account -> account.getUser().getId().equals(userId))
                .orElseThrow(() -> new NotFoundException("Bank account not found"));
    }

    private static Long categoryId(Category category) {
        return category != null ? category.getId() : null;
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
                .accountName(tx.getBankAccount().getAccountName())
                .date(tx.getTransactionDate())
                .amount(tx.getOriginalAmount())
                .currency(tx.getOriginalCurrency())
                .amountInPln(tx.getAmountInPln())
                .exchangeRate(tx.getExchangeRate())
                .title(tx.getTitle())
                .recipient(tx.getRecipient())
                .categoryId(tx.getCategory() != null ? tx.getCategory().getId() : null)
                .categoryName(tx.getCategory() != null ? tx.getCategory().getName() : null)
                .categoryManual(tx.isCategoryManual())
                .build();
    }
}