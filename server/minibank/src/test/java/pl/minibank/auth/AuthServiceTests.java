package pl.minibank.auth;

import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import pl.minibank.auth.dto.LoginRequest;
import pl.minibank.auth.session.RefreshTokenService;
import pl.minibank.user.UserRepository;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthServiceTests {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
    private final AuthService authService = new AuthService(
            userRepository, passwordEncoder, mock(JwtService.class), mock(RefreshTokenService.class));

    @Test
    void unknownEmailStillRunsPasswordCheck() {
        when(userRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest("nobody@example.com", "secret123"), "Firefox"))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid email or password");

        verify(passwordEncoder).matches(eq("secret123"), anyString());
    }
}
