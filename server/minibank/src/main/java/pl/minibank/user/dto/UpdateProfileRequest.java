package pl.minibank.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(max = 100) @Pattern(regexp = ".*\\S.*", message = "must not be blank") String displayName,
        @Pattern(regexp = "[A-Za-z]{3}", message = "must be a 3-letter currency code") String baseCurrency,
        @Email @Size(max = 255) String email,
        String currentPassword
) {
}
