package pl.minibank.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.minibank.auth.dto.AuthResponse;
import pl.minibank.auth.dto.LoginRequest;
import pl.minibank.auth.dto.RegisterRequest;
import pl.minibank.auth.session.RefreshTokenService;
import pl.minibank.common.exception.ConflictException;
import pl.minibank.user.User;
import pl.minibank.user.UserRepository;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    @Transactional
    public AuthSession register(RegisterRequest request, String userAgent) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("Email is already registered");
        }

        User user = new User(email, passwordEncoder.encode(request.password()), request.displayName().trim());
        userRepository.save(user);
        return startSession(user, userAgent);
    }

    @Transactional
    public AuthSession login(LoginRequest request, String userAgent) {
        User user = userRepository.findByEmailIgnoreCase(normalizeEmail(request.email()))
                .filter(u -> passwordEncoder.matches(request.password(), u.getPasswordHash()))
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));
        return startSession(user, userAgent);
    }

    @Transactional(noRollbackFor = BadCredentialsException.class)
    public AuthSession refresh(String refreshToken) {
        RefreshTokenService.Rotation rotation = refreshTokenService.rotate(refreshToken);
        return new AuthSession(accessToken(rotation.user()), rotation.refreshToken());
    }

    @Transactional
    public void logout(String refreshToken) {
        refreshTokenService.revoke(refreshToken);
    }

    private AuthSession startSession(User user, String userAgent) {
        return new AuthSession(accessToken(user), refreshTokenService.createOrReplace(user, userAgent));
    }

    private AuthResponse accessToken(User user) {
        return AuthResponse.bearer(jwtService.generateToken(user), jwtService.getExpirationSeconds());
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    public record AuthSession(AuthResponse response, String refreshToken) {
    }
}
