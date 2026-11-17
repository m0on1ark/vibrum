package pl.minibank.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import pl.minibank.common.validation.MaxBytes;

public record RegisterRequest(
        @NotBlank @Email @Size(max = 255) String email,
        @NotBlank @Size(min = 8) @MaxBytes(72) String password,
        @NotBlank @Size(max = 100) String displayName
) {
}
