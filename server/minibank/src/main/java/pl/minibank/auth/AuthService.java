package pl.minibank.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.minibank.auth.dto.AuthResponse;
import pl.minibank.auth.dto.LoginRequest;
import pl.minibank.auth.dto.RegisterRequest;
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

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("Email is already registered");
        }

        User user = new User(email, passwordEncoder.encode(request.password()), request.displayName().trim());
        userRepository.save(user);
        return issueToken(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(normalizeEmail(request.email()))
                .filter(u -> passwordEncoder.matches(request.password(), u.getPasswordHash()))
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));
        return issueToken(user);
    }

    private AuthResponse issueToken(User user) {
        return AuthResponse.bearer(jwtService.generateToken(user), jwtService.getExpirationSeconds());
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
