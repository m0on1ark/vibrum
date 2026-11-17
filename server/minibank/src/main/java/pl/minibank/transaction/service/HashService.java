package pl.minibank.transaction.service;

import org.springframework.stereotype.Service;
import pl.minibank.transaction.dto.ParsedTransactionDto;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

@Service
public class HashService {

    public String calculateHash(Long accountId, ParsedTransactionDto dto) {
        String rawData = String.format("%d|%s|%s|%s|%s",
                accountId,
                dto.getTransactionDate(),
                dto.getAmount().stripTrailingZeros().toPlainString(),
                dto.getCurrency().toUpperCase(),
                dto.getTitle().trim().toLowerCase()
        );
        if (dto.getReference() != null && !dto.getReference().isBlank()) {
            rawData += "|" + dto.getReference().trim();
        }

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedHash = digest.digest(rawData.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(encodedHash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }
}