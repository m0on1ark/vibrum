package pl.minibank.transaction.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import pl.minibank.transaction.dto.ImportResultDto;
import pl.minibank.transaction.dto.TransactionDto;
import pl.minibank.transaction.service.TransactionService;

import java.io.IOException;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping(value = "/accounts/{id}/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImportResultDto> importStatement(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable("id") Long accountId,
            @RequestParam("file") MultipartFile file) throws IOException {
        Long userId = Long.valueOf(jwt.getSubject());
        return ResponseEntity.ok(transactionService.importStatement(file, accountId, userId));
    }

    @GetMapping("/transactions")
    public ResponseEntity<Page<TransactionDto>> getTransactions(
            @AuthenticationPrincipal Jwt jwt,
            @PageableDefault(size = 20, sort = "transactionDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Long userId = Long.valueOf(jwt.getSubject());
        return ResponseEntity.ok(transactionService.getUserTransactions(userId, pageable));
    }
}
