package pl.minibank.category.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import pl.minibank.category.RuleMatchType;
import pl.minibank.category.RuleTarget;

public record RuleRequest(
        @NotNull Long categoryId,
        @NotNull RuleMatchType matchType,
        RuleTarget target,
        @NotBlank @Size(max = 255) String pattern,
        Integer priority
) {

    public RuleTarget targetOrDefault() {
        return target == null ? RuleTarget.ANY : target;
    }

    public int priorityOrDefault() {
        return priority == null ? 0 : priority;
    }
}
