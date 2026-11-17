package pl.minibank.category;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CategorizationEngine {

    static final Comparator<CategorizationRule> RULE_ORDER = Comparator
            .comparing(CategorizationRule::isSystem)
            .thenComparing(CategorizationRule::getPriority, Comparator.reverseOrder())
            .thenComparing(rule -> rule.getPattern().length(), Comparator.reverseOrder())
            .thenComparing(CategorizationRule::getId, Comparator.nullsLast(Comparator.naturalOrder()));

    private final CategorizationRuleRepository ruleRepository;

    @Transactional(readOnly = true)
    public Optional<CategorizationRule> categorize(Long userId, String title, String counterparty) {
        return findMatch(ruleRepository.findVisibleTo(userId), title, counterparty);
    }

    static Optional<CategorizationRule> findMatch(List<CategorizationRule> rules, String title, String counterparty) {
        return rules.stream()
                .sorted(RULE_ORDER)
                .filter(rule -> RuleMatcher.matches(
                        rule.getMatchType(), rule.getTarget(), rule.getPattern(), title, counterparty))
                .findFirst();
    }
}
