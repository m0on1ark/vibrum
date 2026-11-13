package pl.minibank.auth.password;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.minibank.auth.AuthProperties;
import pl.minibank.auth.session.RefreshTokenService;
import pl.minibank.common.exception.BadRequestException;
import pl.minibank.common.exception.NotFoundException;
import pl.minibank.common.security.TokenHasher;
import pl.minibank.user.User;
import pl.minibank.user.UserRepository;

import java.time.Instant;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class PasswordService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final RefreshTokenService refreshTokenService;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetMailer mailer;
    private final AuthProperties properties;

    @Transactional
    public void changePassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }
        updatePassword(user, newPassword);
    }

    @Transactional
    public void requestReset(String email) {
        userRepository.findByEmailIgnoreCase(email.trim().toLowerCase(Locale.ROOT)).ifPresent(user -> {
            String rawToken = TokenHasher.generate();
            Instant expiresAt = Instant.now().plus(properties.passwordResetExpiration());
            resetTokenRepository.save(new PasswordResetToken(user, TokenHasher.sha256(rawToken), expiresAt));
            mailer.send(user.getEmail(), rawToken);
        });
    }

    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        Instant now = Instant.now();
        PasswordResetToken token = resetTokenRepository.findByTokenHash(TokenHasher.sha256(rawToken))
                .filter(t -> t.isUsable(now))
                .orElseThrow(() -> new BadRequestException("Invalid or expired reset token"));
        token.markUsed(now);
        updatePassword(token.getUser(), newPassword);
    }

    private void updatePassword(User user, String newPassword) {
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        refreshTokenService.revokeAll(user.getId());
    }
}
