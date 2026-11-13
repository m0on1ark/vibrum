package pl.minibank.auth.session;

import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
@RequiredArgsConstructor
public class RefreshTokenCookies {

    public static final String COOKIE_NAME = "refreshToken";

    private final Environment environment;
    private final RefreshTokenService refreshTokenService;

    public ResponseCookie create(String rawToken) {
        return base(rawToken).maxAge(Duration.ofSeconds(refreshTokenService.getExpirationSeconds())).build();
    }

    public ResponseCookie clear() {
        return base("").maxAge(Duration.ZERO).build();
    }

    private ResponseCookie.ResponseCookieBuilder base(String value) {
        return ResponseCookie.from(COOKIE_NAME, value)
                .httpOnly(true)
                .secure(!environment.acceptsProfiles(Profiles.of("local")))
                .path("/")
                .sameSite("Lax");
    }
}
