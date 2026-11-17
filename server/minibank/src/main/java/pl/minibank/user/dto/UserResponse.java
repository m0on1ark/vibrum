package pl.minibank.user.dto;

import pl.minibank.user.User;

public record UserResponse(Long id, String email, String displayName, String baseCurrency, String iban, String role) {

    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getBaseCurrency(),
                user.getIban(),
                user.getRole().name());
    }
}
