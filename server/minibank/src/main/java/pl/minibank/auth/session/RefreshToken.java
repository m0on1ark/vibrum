package pl.minibank.auth.session;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import pl.minibank.common.persistence.BaseEntity;
import pl.minibank.user.User;

import java.time.Instant;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "refresh_tokens")
public class RefreshToken extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(name = "user_agent", nullable = false, length = 512)
    private String userAgent;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    public RefreshToken(User user, String userAgent, String tokenHash, Instant expiresAt) {
        this.user = user;
        this.userAgent = userAgent;
        this.tokenHash = tokenHash;
        this.expiresAt = expiresAt;
    }

    public void replace(String tokenHash, Instant expiresAt) {
        this.tokenHash = tokenHash;
        this.expiresAt = expiresAt;
    }

    public boolean isExpired(Instant now) {
        return !expiresAt.isAfter(now);
    }
}
