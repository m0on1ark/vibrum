package pl.minibank.transaction.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import pl.minibank.transaction.dto.BankAccountDto;
import pl.minibank.transaction.dto.CreateBankAccountRequest;
import pl.minibank.transaction.service.TransactionService;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class BankAccountController {

    private final TransactionService transactionService;

    @PostMapping
    public ResponseEntity<BankAccountDto> createAccount(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody CreateBankAccountRequest request) {
        Long userId = Long.valueOf(jwt.getSubject());
        return ResponseEntity.ok(transactionService.createAccount(userId, request));
    }

    @GetMapping
    public ResponseEntity<List<BankAccountDto>> getMyAccounts(@AuthenticationPrincipal Jwt jwt) {
        Long userId = Long.valueOf(jwt.getSubject());
        return ResponseEntity.ok(transactionService.getUserAccounts(userId));
    }
}