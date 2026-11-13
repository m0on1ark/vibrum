package pl.minibank.auth.session;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.minibank.auth.AuthProperties;
import pl.minibank.common.security.TokenHasher;
import pl.minibank.user.User;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    static final int USER_AGENT_MAX_LENGTH = 512;
    static final String UNKNOWN_USER_AGENT = "Unknown";

    private final RefreshTokenRepository refreshTokenRepository;
    private final AuthProperties properties;

    @Transactional
    public String createOrReplace(User user, String userAgent) {
        String agent = normalizeUserAgent(userAgent);
        String rawToken = TokenHasher.generate();
        String hash = TokenHasher.sha256(rawToken);
        Instant expiresAt = Instant.now().plus(properties.refreshExpiration());

        refreshTokenRepository.findByUserIdAndUserAgent(user.getId(), agent)
                .ifPresentOrElse(
                        token -> token.replace(hash, expiresAt),
                        () -> refreshTokenRepository.save(new RefreshToken(user, agent, hash, expiresAt)));
        return rawToken;
    }

    @Transactional(noRollbackFor = BadCredentialsException.class)
    public Rotation rotate(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw invalidToken();
        }

        RefreshToken token = refreshTokenRepository.findByTokenHash(TokenHasher.sha256(rawToken))
                .orElseThrow(RefreshTokenService::invalidToken);
        Instant now = Instant.now();
        if (token.isExpired(now)) {
            refreshTokenRepository.delete(token);
            throw invalidToken();
        }

        String newRawToken = TokenHasher.generate();
        token.replace(TokenHasher.sha256(newRawToken), now.plus(properties.refreshExpiration()));
        return new Rotation(token.getUser(), newRawToken);
    }

    @Transactional
    public void revoke(String rawToken) {
        if (rawToken != null && !rawToken.isBlank()) {
            refreshTokenRepository.deleteByTokenHash(TokenHasher.sha256(rawToken));
        }
    }

    @Transactional
    public void revokeAll(Long userId) {
        refreshTokenRepository.deleteAllByUserId(userId);
    }

    public long getExpirationSeconds() {
        return properties.refreshExpiration().toSeconds();
    }

    static String normalizeUserAgent(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) {
            return UNKNOWN_USER_AGENT;
        }
        String trimmed = userAgent.trim();
        return trimmed.length() > USER_AGENT_MAX_LENGTH ? trimmed.substring(0, USER_AGENT_MAX_LENGTH) : trimmed;
    }

    private static BadCredentialsException invalidToken() {
        return new BadCredentialsException("Invalid refresh token");
    }

    public record Rotation(User user, String refreshToken) {
    }
}
