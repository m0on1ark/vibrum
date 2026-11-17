package pl.minibank.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import pl.minibank.common.validation.MaxBytes;

public record ResetPasswordRequest(
        @NotBlank String token,
        @NotBlank @Size(min = 8) @MaxBytes(72) String newPassword
) {
}
