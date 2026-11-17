package pl.minibank.category.dto;

import pl.minibank.category.CategorizationRule;
import pl.minibank.category.RuleMatchType;
import pl.minibank.category.RuleTarget;

public record RuleResponse(
        Long id,
        Long categoryId,
        String categoryName,
        RuleMatchType matchType,
        RuleTarget target,
        String pattern,
        int priority,
        boolean system
) {

    public static RuleResponse from(CategorizationRule rule) {
        return new RuleResponse(
                rule.getId(),
                rule.getCategory().getId(),
                rule.getCategory().getName(),
                rule.getMatchType(),
                rule.getTarget(),
                rule.getPattern(),
                rule.getPriority(),
                rule.isSystem());
    }
}
