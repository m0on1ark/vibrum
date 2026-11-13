package pl.minibank.category.dto;

import pl.minibank.category.CategorizationRule;

public record CategorizationTestResponse(boolean matched, CategoryResponse category, RuleResponse rule) {

    public static CategorizationTestResponse of(CategorizationRule rule) {
        return new CategorizationTestResponse(true, CategoryResponse.from(rule.getCategory()), RuleResponse.from(rule));
    }

    public static CategorizationTestResponse noMatch() {
        return new CategorizationTestResponse(false, null, null);
    }
}
