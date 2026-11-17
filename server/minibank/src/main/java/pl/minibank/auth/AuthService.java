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
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String DUMMY_PASSWORD_HASH = "$2a$10$3./OyAX9QMyoFYTIGSwFr.2rZefLbu/6R9hopbOt3yoPWx0sMXR4a";

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
        Optional<User> user = userRepository.findByEmailIgnoreCase(normalizeEmail(request.email()));
        String hash = user.map(User::getPasswordHash).orElse(DUMMY_PASSWORD_HASH);
        boolean passwordMatches = passwordEncoder.matches(request.password(), hash);
        if (user.isEmpty() || !passwordMatches) {
            throw new BadCredentialsException("Invalid email or password");
        }
        return startSession(user.get(), userAgent);
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
