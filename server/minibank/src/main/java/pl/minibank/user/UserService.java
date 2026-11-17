package pl.minibank.user;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.minibank.auth.session.RefreshTokenService;
import pl.minibank.common.exception.BadRequestException;
import pl.minibank.common.exception.ConflictException;
import pl.minibank.common.exception.NotFoundException;
import pl.minibank.user.dto.UpdateProfileRequest;
import pl.minibank.user.dto.UserResponse;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(Long userId) {
        return userRepository.findById(userId)
                .map(UserResponse::from)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (request.displayName() != null) {
            user.setDisplayName(request.displayName().trim());
        }
        if (request.baseCurrency() != null) {
            user.setBaseCurrency(request.baseCurrency().toUpperCase(Locale.ROOT));
        }
        if (request.email() != null) {
            changeEmail(user, request.email().trim().toLowerCase(Locale.ROOT), request.currentPassword());
        }
        return UserResponse.from(user);
    }

    private void changeEmail(User user, String email, String currentPassword) {
        if (email.equals(user.getEmail())) {
            return;
        }
        if (currentPassword == null || currentPassword.isBlank()) {
            throw new BadRequestException("Current password is required to change email");
        }
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("Email is already registered");
        }
        user.setEmail(email);
        refreshTokenService.revokeAll(user.getId());
    }
}
