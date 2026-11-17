package pl.minibank.category;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pl.minibank.category.dto.CategorizationTestRequest;
import pl.minibank.category.dto.CategorizationTestResponse;
import pl.minibank.category.dto.RuleRequest;
import pl.minibank.category.dto.RuleResponse;

import java.util.List;

@RestController
@RequestMapping("/api/categorization-rules")
@RequiredArgsConstructor
public class CategorizationRuleController {

    private final CategorizationRuleService ruleService;

    @GetMapping
    public List<RuleResponse> list(@AuthenticationPrincipal Jwt jwt) {
        return ruleService.list(userId(jwt));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RuleResponse create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody RuleRequest request) {
        return ruleService.create(userId(jwt), request);
    }

    @PutMapping("/{id}")
    public RuleResponse update(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                               @Valid @RequestBody RuleRequest request) {
        return ruleService.update(userId(jwt), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        ruleService.delete(userId(jwt), id);
    }

    @PostMapping("/test")
    public CategorizationTestResponse test(@AuthenticationPrincipal Jwt jwt,
                                           @Valid @RequestBody CategorizationTestRequest request) {
        return ruleService.test(userId(jwt), request);
    }

    private static Long userId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}
