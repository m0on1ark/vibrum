package pl.minibank.subscription;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.minibank.subscription.dto.SubscriptionResponse;

import java.util.List;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @GetMapping
    public List<SubscriptionResponse> list(@AuthenticationPrincipal Jwt jwt) {
        return subscriptionService.list(userId(jwt));
    }

    @PostMapping("/detect")
    public List<SubscriptionResponse> detect(@AuthenticationPrincipal Jwt jwt) {
        return subscriptionService.detect(userId(jwt));
    }

    private static Long userId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}
