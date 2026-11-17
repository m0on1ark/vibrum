package pl.minibank.transaction.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import pl.minibank.transaction.dto.BankAccountDto;
import pl.minibank.transaction.dto.CreateBankAccountRequest;
import pl.minibank.transaction.dto.RenameBankAccountRequest;
import pl.minibank.transaction.service.TransactionService;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class BankAccountController {
    private final TransactionService transactionService;

    @GetMapping
    public ResponseEntity<List<BankAccountDto>> getMyAccounts(@AuthenticationPrincipal Jwt jwt) {
        Long userId = Long.valueOf(jwt.getSubject());
        return ResponseEntity.ok(transactionService.getUserAccounts(userId));
    }

    @PostMapping
    public ResponseEntity<BankAccountDto> createAccount(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateBankAccountRequest request) {
        Long userId = Long.valueOf(jwt.getSubject());
        return ResponseEntity.status(HttpStatus.CREATED).body(transactionService.createAccount(userId, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BankAccountDto> renameAccount(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable("id") Long accountId,
            @Valid @RequestBody RenameBankAccountRequest request) {
        Long userId = Long.valueOf(jwt.getSubject());
        return ResponseEntity.ok(transactionService.renameAccount(userId, accountId, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAccount(@AuthenticationPrincipal Jwt jwt, @PathVariable("id") Long accountId) {
        Long userId = Long.valueOf(jwt.getSubject());
        transactionService.deleteAccount(userId, accountId);
        return ResponseEntity.noContent().build();
    }
}