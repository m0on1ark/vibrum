package pl.minibank.auth.session;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    Optional<RefreshToken> findByUserIdAndUserAgent(Long userId, String userAgent);

    List<RefreshToken> findAllByUserId(Long userId);

    @Modifying
    @Query("delete from RefreshToken t where t.tokenHash = :tokenHash")
    void deleteByTokenHash(String tokenHash);

    @Modifying
    @Query("delete from RefreshToken t where t.user.id = :userId")
    void deleteAllByUserId(Long userId);
}
