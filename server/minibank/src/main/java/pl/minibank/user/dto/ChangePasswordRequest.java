package pl.minibank.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import pl.minibank.common.validation.MaxBytes;

public record ChangePasswordRequest(
        @NotBlank String currentPassword,
        @NotBlank @Size(min = 8) @MaxBytes(72) String newPassword
) {
}
