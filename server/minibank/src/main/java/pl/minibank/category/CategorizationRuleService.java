package pl.minibank.category;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.minibank.category.dto.CategorizationTestRequest;
import pl.minibank.category.dto.CategorizationTestResponse;
import pl.minibank.category.dto.RuleRequest;
import pl.minibank.category.dto.RuleResponse;
import pl.minibank.common.exception.BadRequestException;
import pl.minibank.common.exception.ForbiddenException;
import pl.minibank.common.exception.NotFoundException;
import pl.minibank.user.UserRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategorizationRuleService {

    private final CategorizationRuleRepository ruleRepository;
    private final CategoryService categoryService;
    private final CategorizationEngine engine;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<RuleResponse> list(Long userId) {
        return ruleRepository.findVisibleTo(userId).stream()
                .sorted(CategorizationEngine.RULE_ORDER)
                .map(RuleResponse::from)
                .toList();
    }

    @Transactional
    public RuleResponse create(Long userId, RuleRequest request) {
        validatePattern(request);
        Category category = categoryService.getVisible(userId, request.categoryId());
        CategorizationRule rule = new CategorizationRule(
                userRepository.getReferenceById(userId),
                category,
                request.matchType(),
                request.targetOrDefault(),
                request.pattern().trim(),
                request.priorityOrDefault());
        return RuleResponse.from(ruleRepository.save(rule));
    }

    @Transactional
    public RuleResponse update(Long userId, Long ruleId, RuleRequest request) {
        CategorizationRule rule = getOwned(userId, ruleId);
        validatePattern(request);
        rule.setCategory(categoryService.getVisible(userId, request.categoryId()));
        rule.setMatchType(request.matchType());
        rule.setTarget(request.targetOrDefault());
        rule.setPattern(request.pattern().trim());
        rule.setPriority(request.priorityOrDefault());
        return RuleResponse.from(rule);
    }

    @Transactional
    public void delete(Long userId, Long ruleId) {
        ruleRepository.delete(getOwned(userId, ruleId));
    }

    @Transactional(readOnly = true)
    public CategorizationTestResponse test(Long userId, CategorizationTestRequest request) {
        return engine.categorize(userId, request.title(), request.counterparty())
                .map(CategorizationTestResponse::of)
                .orElseGet(CategorizationTestResponse::noMatch);
    }

    private CategorizationRule getOwned(Long userId, Long ruleId) {
        CategorizationRule rule = ruleRepository.findById(ruleId)
                .filter(r -> r.isSystem() || r.isOwnedBy(userId))
                .orElseThrow(() -> new NotFoundException("Rule not found"));
        if (rule.isSystem()) {
            throw new ForbiddenException("System rules cannot be modified");
        }
        return rule;
    }

    private static void validatePattern(RuleRequest request) {
        if (request.matchType() == RuleMatchType.REGEX && !RuleMatcher.isValidRegex(request.pattern())) {
            throw new BadRequestException("Invalid regular expression");
        }
    }
}
